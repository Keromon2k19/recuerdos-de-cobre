// lib/vault.ts — CRUD filesystem para el vault Markdown
import fs from "node:fs/promises";
import path from "node:path";
import { ENTITY_FOLDERS, type EntityType } from "./types";
import { slugify, episodeFilename } from "./slugify";
import { parseMarkdown } from "./markdown";

const VAULT_SUBFOLDERS = [
  "episodios",
  ...Object.values(ENTITY_FOLDERS),
];

/**
 * Inicializa las carpetas del vault si no existen.
 */
export async function initVault(vaultPath: string): Promise<void> {
  for (const folder of VAULT_SUBFOLDERS) {
    const dir = path.join(vaultPath, folder);
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Escribe un archivo de forma pseudo-atómica: escribe a .tmp y renombra.
 */
async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmpPath = filePath + ".tmp";
  await fs.writeFile(tmpPath, content, "utf-8");
  await fs.rename(tmpPath, filePath);
}

// ─── Episodios ───

/**
 * Escribe un episodio al vault. Sobreescribe si ya existe (re-procesamiento).
 */
export async function writeEpisode(
  vaultPath: string,
  numero: number,
  titulo: string,
  content: string
): Promise<string> {
  const filename = episodeFilename(numero, titulo);
  const dir = path.join(vaultPath, "episodios");
  await fs.mkdir(dir, { recursive: true });

  // Si existe un episodio con el mismo número pero distinto título, eliminarlo
  const existing = await findEpisodeFile(vaultPath, numero);
  if (existing && existing !== filename) {
    await fs.unlink(path.join(dir, existing));
  }

  const filePath = path.join(dir, filename);
  await atomicWrite(filePath, content);
  return filePath;
}

/**
 * Busca el archivo de episodio por número (puede tener distinto título/slug).
 */
export async function findEpisodeFile(
  vaultPath: string,
  numero: number
): Promise<string | null> {
  const dir = path.join(vaultPath, "episodios");
  try {
    const files = await fs.readdir(dir);
    const prefix = String(numero).padStart(3, "0");
    return files.find((f) => f.startsWith(prefix) && f.endsWith(".md")) ?? null;
  } catch {
    return null;
  }
}

/**
 * Lee el contenido de un episodio por número.
 */
export async function readEpisode(
  vaultPath: string,
  numero: number
): Promise<string | null> {
  const filename = await findEpisodeFile(vaultPath, numero);
  if (!filename) return null;
  return fs.readFile(
    path.join(vaultPath, "episodios", filename),
    "utf-8"
  );
}

// ─── Entidades ───

/**
 * Retorna la ruta al archivo de una entidad dado su tipo y nombre.
 */
export function entityPath(
  vaultPath: string,
  tipo: EntityType,
  nombre: string
): string {
  const folder = ENTITY_FOLDERS[tipo];
  return path.join(vaultPath, folder, slugify(nombre) + ".md");
}

/**
 * Lee una entidad del vault. Retorna null si no existe.
 */
export async function readEntity(
  vaultPath: string,
  tipo: EntityType,
  nombre: string
): Promise<string | null> {
  const filePath = entityPath(vaultPath, tipo, nombre);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Escribe una entidad al vault (crea o sobreescribe).
 */
export async function writeEntity(
  vaultPath: string,
  tipo: EntityType,
  nombre: string,
  content: string
): Promise<string> {
  const filePath = entityPath(vaultPath, tipo, nombre);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await atomicWrite(filePath, content);
  return filePath;
}

/**
 * Lista todas las entidades de un tipo. Retorna array de objetos con
 * nombre (del frontmatter), slug (del filename), y apariciones.
 */
export async function listByType(
  vaultPath: string,
  tipo: EntityType
): Promise<
  Array<{
    nombre: string;
    slug: string;
    apariciones: number[];
  }>
> {
  const folder = ENTITY_FOLDERS[tipo];
  const dir = path.join(vaultPath, folder);

  try {
    const files = await fs.readdir(dir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const results = await Promise.all(
      mdFiles.map(async (filename) => {
        const content = await fs.readFile(
          path.join(dir, filename),
          "utf-8"
        );
        const { frontmatter } = parseMarkdown(content);
        return {
          nombre: (frontmatter.nombre as string) ?? filename.replace(".md", ""),
          slug: filename.replace(".md", ""),
          apariciones: (frontmatter.apariciones as number[]) ?? [],
        };
      })
    );

    return results.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  } catch {
    return [];
  }
}

/**
 * Lista todos los episodios procesados. Retorna array ordenado por número.
 */
export async function listEpisodes(
  vaultPath: string
): Promise<
  Array<{
    numero: number;
    titulo: string;
    filename: string;
    procesado: string;
  }>
> {
  const dir = path.join(vaultPath, "episodios");

  try {
    const files = await fs.readdir(dir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const results = await Promise.all(
      mdFiles.map(async (filename) => {
        const content = await fs.readFile(
          path.join(dir, filename),
          "utf-8"
        );
        const { frontmatter } = parseMarkdown(content);
        return {
          numero: (frontmatter.numero as number) ?? 0,
          titulo: (frontmatter.titulo as string) ?? "",
          filename,
          procesado: (frontmatter.procesado as string) ?? "",
        };
      })
    );

    return results.sort((a, b) => a.numero - b.numero);
  } catch {
    return [];
  }
}

/**
 * Verifica si una entidad existe en el vault (por nombre o alias).
 */
export async function findEntity(
  vaultPath: string,
  tipo: EntityType,
  nombre: string
): Promise<{ exists: boolean; nombre: string; slug: string } | null> {
  const entities = await listByType(vaultPath, tipo);

  // Buscar por nombre exacto
  const exact = entities.find(
    (e) => e.nombre.toLowerCase() === nombre.toLowerCase()
  );
  if (exact) return { exists: true, ...exact };

  // Buscar por alias (hay que leer cada archivo)
  const folder = ENTITY_FOLDERS[tipo];
  const dir = path.join(vaultPath, folder);

  for (const entity of entities) {
    try {
      const content = await fs.readFile(
        path.join(dir, entity.slug + ".md"),
        "utf-8"
      );
      const { frontmatter } = parseMarkdown(content);
      const aliases = (frontmatter.alias as string[]) ?? [];
      if (aliases.some((a) => a.toLowerCase() === nombre.toLowerCase())) {
        return { exists: true, ...entity };
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Retorna estadísticas del vault para mostrar en el sidebar.
 */
export async function getVaultStats(
  vaultPath: string
): Promise<Record<string, number>> {
  const stats: Record<string, number> = { episodios: 0 };

  try {
    const epDir = path.join(vaultPath, "episodios");
    const epFiles = await fs.readdir(epDir);
    stats.episodios = epFiles.filter((f) => f.endsWith(".md")).length;
  } catch {
    // folder doesn't exist yet
  }

  for (const [tipo, folder] of Object.entries(ENTITY_FOLDERS)) {
    try {
      const dir = path.join(vaultPath, folder);
      const files = await fs.readdir(dir);
      stats[tipo] = files.filter((f) => f.endsWith(".md")).length;
    } catch {
      stats[tipo] = 0;
    }
  }

  return stats;
}
