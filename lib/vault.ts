// lib/vault.ts — CRUD filesystem para el vault Markdown
import fs from "node:fs/promises";
import path from "node:path";
import { ENTITY_FOLDERS, type EntityType, type PlaylistCache, type Job, type JobEstado } from "./types";
import { slugify, episodeFilename } from "./slugify";
import { parseMarkdown } from "./markdown";
import { parseEpisodioRef } from "./episode-number";

const PLAYLIST_FILE = "_playlist.json";
const JOBS_DIR = "_jobs";
const ACTIVE_STATES: JobEstado[] = ["queued", "downloading", "transcribing", "summarizing"];

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
 * En Windows, fs.rename puede tirar EPERM/EXDEV cuando el destino existe o
 * cuando se cruzan volúmenes; en ese caso caemos a copy + unlink.
 */
async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, content, "utf-8");
  try {
    await fs.rename(tmpPath, filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EPERM" || code === "EXDEV" || code === "EBUSY") {
      try {
        await fs.copyFile(tmpPath, filePath);
      } finally {
        await fs.unlink(tmpPath).catch(() => undefined);
      }
      return;
    }
    await fs.unlink(tmpPath).catch(() => undefined);
    throw err;
  }
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

export type EntityListItem = {
  nombre: string;
  slug: string;
  apariciones: number[];
  origen?: string;
  rol?: string;
  jugador?: string;
  facciones?: string[];
  region?: string;
  categoria?: string;
  acto?: number;
  image?: string;
  imageAlt?: string;
  /** Primer fragmento de la sección Perfil, o fallback a la primera mención. */
  descripcion?: string;
};

/**
 * Extrae un fragmento descriptivo del body de una entidad.
 * Prioridad: sección Perfil → primera mención por episodio → undefined.
 */
function extractDescription(body: string): string | undefined {
  const cleanAndTruncate = (raw: string, maxLen = 180): string => {
    const plain = raw
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
      .replace(/\[\[([^\]]+)\]\]/g, "$1")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (plain.length <= maxLen) return plain;
    const truncated = plain.slice(0, maxLen);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "…";
  };

  // Sección de perfil (antes "Canon"); se acepta el rótulo viejo por si
  // queda algún archivo sin migrar o lo reañade un re-import.
  const perfilMatch = body.match(
    /^## (?:Perfil|Canon[^\n]*)\s*\n+([\s\S]+?)(?=\n## |\n*$)/m
  );
  if (perfilMatch) {
    const cleaned = cleanAndTruncate(perfilMatch[1]);
    if (cleaned) return cleaned;
  }

  const mentionMatch = body.match(/^### [^\n]+\n+- (.+)/m);
  if (mentionMatch) return cleanAndTruncate(mentionMatch[1]);

  return undefined;
}

/**
 * Imagen de tarjeta de una entidad. Prioriza el campo `image` (string);
 * si no, cae a la primera entrada de `images` (galería: string o {src,alt}).
 * Así una entidad con varias apariencias igual tiene retrato en el listado.
 */
function cardImage(fm: Record<string, unknown>): {
  image?: string;
  imageAlt?: string;
} {
  if (typeof fm.image === "string" && fm.image.trim()) {
    return {
      image: fm.image.trim(),
      imageAlt: typeof fm.imageAlt === "string" ? fm.imageAlt : undefined,
    };
  }
  const arr = Array.isArray(fm.images) ? fm.images : [];
  for (const it of arr) {
    if (typeof it === "string" && it.trim()) return { image: it.trim() };
    if (it && typeof it === "object") {
      const o = it as Record<string, unknown>;
      if (typeof o.src === "string" && o.src.trim()) {
        return {
          image: o.src.trim(),
          imageAlt: typeof o.alt === "string" ? o.alt : undefined,
        };
      }
    }
  }
  return {};
}

/**
 * Lista todas las entidades de un tipo. Retorna array con frontmatter
 * relevante (nombre, slug, apariciones, y todos los campos de taxonomía).
 */
export async function listByType(
  vaultPath: string,
  tipo: EntityType
): Promise<EntityListItem[]> {
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
        const { frontmatter, body } = parseMarkdown(content);
        const { image, imageAlt } = cardImage(
          frontmatter as Record<string, unknown>
        );
        const item: EntityListItem = {
          nombre: (frontmatter.nombre as string) ?? filename.replace(".md", ""),
          slug: filename.replace(".md", ""),
          apariciones: (frontmatter.apariciones as number[]) ?? [],
          origen: frontmatter.origen as string | undefined,
          rol: frontmatter.rol as string | undefined,
          jugador: frontmatter.jugador as string | undefined,
          facciones: frontmatter.facciones as string[] | undefined,
          region: frontmatter.region as string | undefined,
          categoria: frontmatter.categoria as string | undefined,
          acto: frontmatter.acto as number | undefined,
          image,
          imageAlt,
          descripcion: extractDescription(body),
        };
        return item;
      })
    );

    return results.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  } catch {
    return [];
  }
}

export type EpisodeMenciones = {
  personajes?: string[];
  lugares?: string[];
  facciones?: string[];
};

function cleanMarkdownText(raw: string): string {
  return raw
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(raw: string, maxLen: number): string {
  if (raw.length <= maxLen) return raw;
  const truncated = raw.slice(0, maxLen);
  const lastSentence = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("? "),
    truncated.lastIndexOf("! "),
  );
  if (lastSentence > 60) return truncated.slice(0, lastSentence + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${lastSpace > 90 ? truncated.slice(0, lastSpace) : truncated}...`;
}

export function extractEpisodeExcerpt(body: string, maxLen = 190): string {
  const resumenMatch = body.match(
    /^##\s+Resumen\s*\n+([\s\S]+?)(?=\n##\s+|\n###\s+|\n*$)/im
  );
  const source = resumenMatch?.[1] ?? body;
  const paragraph =
    source
      .split(/\n{2,}/)
      .map(cleanMarkdownText)
      .find(Boolean) ?? "";
  return truncateText(paragraph, maxLen);
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
    image?: string;
    imageAlt?: string;
    menciones?: EpisodeMenciones;
    descripcion?: string;
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
        const { frontmatter, body } = parseMarkdown(content);
        return {
          numero: (frontmatter.numero as number) ?? 0,
          titulo: (frontmatter.titulo as string) ?? "",
          filename,
          procesado: (frontmatter.procesado as string) ?? "",
          image:
            typeof frontmatter.image === "string"
              ? frontmatter.image
              : undefined,
          imageAlt:
            typeof frontmatter.imageAlt === "string"
              ? frontmatter.imageAlt
              : undefined,
          menciones: frontmatter.menciones as EpisodeMenciones | undefined,
          descripcion: extractEpisodeExcerpt(body),
        };
      })
    );

    // Ordena por número de episodio de campaña (extraído del título),
    // luego por parte, con el índice de playlist como último desempate.
    // Necesario porque YouTube a veces sube videos fuera del orden narrativo.
    return results.sort((a, b) => {
      const ra = parseEpisodioRef(a.titulo);
      const rb = parseEpisodioRef(b.titulo);
      if (ra && rb) {
        if (ra.ep !== rb.ep) return ra.ep - rb.ep;
        return (ra.parte ?? 0) - (rb.parte ?? 0);
      }
      return a.numero - b.numero;
    });
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

// ─── Playlist cache ───

/**
 * Lee la cache local de la playlist de YouTube. Retorna null si nunca se sincronizó.
 */
export async function readPlaylist(
  vaultPath: string
): Promise<PlaylistCache | null> {
  const filePath = path.join(vaultPath, PLAYLIST_FILE);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as PlaylistCache;
  } catch {
    return null;
  }
}

/**
 * Escribe la cache de la playlist de forma atómica.
 */
export async function writePlaylist(
  vaultPath: string,
  cache: PlaylistCache
): Promise<string> {
  await fs.mkdir(vaultPath, { recursive: true });
  const filePath = path.join(vaultPath, PLAYLIST_FILE);
  await atomicWrite(filePath, JSON.stringify(cache, null, 2));
  return filePath;
}

// ─── Jobs (procesamiento de episodios) ───

function jobPath(vaultPath: string, numero: number): string {
  const padded = String(numero).padStart(3, "0");
  return path.join(vaultPath, JOBS_DIR, `${padded}.json`);
}

/**
 * Lee el job de un episodio. null si no existe.
 */
export async function readJob(
  vaultPath: string,
  numero: number
): Promise<Job | null> {
  try {
    const content = await fs.readFile(jobPath(vaultPath, numero), "utf-8");
    return JSON.parse(content) as Job;
  } catch {
    return null;
  }
}

/**
 * Escribe un job al disco de forma atómica. Setea actualizado_en automaticamente.
 */
export async function writeJob(vaultPath: string, job: Job): Promise<string> {
  const dir = path.join(vaultPath, JOBS_DIR);
  await fs.mkdir(dir, { recursive: true });
  const filePath = jobPath(vaultPath, job.numero);
  const updated: Job = { ...job, actualizado_en: new Date().toISOString() };
  await atomicWrite(filePath, JSON.stringify(updated, null, 2));
  return filePath;
}

/**
 * Lista todos los jobs (cualquier estado), ordenados por número.
 */
export async function listJobs(vaultPath: string): Promise<Job[]> {
  const dir = path.join(vaultPath, JOBS_DIR);
  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const jobs = await Promise.all(
      jsonFiles.map(async (f) => {
        try {
          const content = await fs.readFile(path.join(dir, f), "utf-8");
          return JSON.parse(content) as Job;
        } catch {
          return null;
        }
      })
    );
    return jobs
      .filter((j): j is Job => j !== null)
      .sort((a, b) => a.numero - b.numero);
  } catch {
    return [];
  }
}

/**
 * Borra el archivo de job (para cancelar o limpiar).
 */
export async function deleteJob(
  vaultPath: string,
  numero: number
): Promise<void> {
  try {
    await fs.unlink(jobPath(vaultPath, numero));
  } catch {
    // ya no existe, ignorar
  }
}

/**
 * Retorna true si hay algún job en estado activo (descargando/transcribiendo/etc).
 * Útil para forzar cola serial: 1 job a la vez.
 */
export async function hasActiveJob(vaultPath: string): Promise<boolean> {
  const jobs = await listJobs(vaultPath);
  return jobs.some((j) => ACTIVE_STATES.includes(j.estado));
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
