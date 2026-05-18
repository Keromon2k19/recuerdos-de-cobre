"use server";

// app/actions/entity.ts — Server actions para editar y eliminar entidades del vault

import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "@/lib/config";
import { ENTITY_FOLDERS, ENTITY_TYPES, type EntityType } from "@/lib/types";
import { parseMarkdown, serializeMarkdown } from "@/lib/markdown";
import { slugify } from "@/lib/slugify";

export type EntityUpdate = {
  nombre: string;
  alias: string[];
  body: string;
};

export type ActionResult =
  | { success: true; newSlug?: string }
  | { success: false; error: string };

function entityFilePath(vaultPath: string, tipo: EntityType, slug: string): string {
  const folder = ENTITY_FOLDERS[tipo];
  return path.join(vaultPath, folder, slug + ".md");
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = filePath + ".tmp";
  await fs.writeFile(tmp, content, "utf-8");
  await fs.rename(tmp, filePath);
}

/**
 * Actualiza una entidad existente. Si el nombre cambia y produce un slug distinto,
 * renombra el archivo (el .md viejo se elimina). Devuelve newSlug si hubo rename.
 */
export async function updateEntityAction(
  tipo: EntityType,
  oldSlug: string,
  update: EntityUpdate
): Promise<ActionResult> {
  try {
    if (!ENTITY_TYPES.includes(tipo)) {
      return { success: false, error: `Tipo de entidad inválido: ${tipo}` };
    }
    const nuevoNombre = update.nombre.trim();
    if (!nuevoNombre) {
      return { success: false, error: "El nombre no puede quedar vacío" };
    }

    const config = loadConfig();
    const folder = ENTITY_FOLDERS[tipo];
    const dir = path.join(config.vaultPath, folder);
    const oldPath = path.join(dir, oldSlug + ".md");

    // Leer el archivo existente para preservar frontmatter no editable (apariciones, relaciones, tipo, etc.)
    let existing: string;
    try {
      existing = await fs.readFile(oldPath, "utf-8");
    } catch {
      return { success: false, error: `No se encontró la entidad en disco: ${oldPath}` };
    }
    const { frontmatter } = parseMarkdown(existing);

    const newFm: Record<string, unknown> = {
      ...frontmatter,
      nombre: nuevoNombre,
      alias: update.alias.map((a) => a.trim()).filter(Boolean),
      ultima_actualizacion: new Date().toISOString(),
    };

    const newContent = serializeMarkdown(newFm, update.body.trim());

    const newSlug = slugify(nuevoNombre);
    if (!newSlug) {
      return { success: false, error: "El nombre no produce un slug válido (sólo caracteres especiales)" };
    }

    const newPath = path.join(dir, newSlug + ".md");

    if (newSlug !== oldSlug) {
      // Rename: verificar que no colisione con otra entidad existente
      try {
        await fs.access(newPath);
        return {
          success: false,
          error: `Ya existe una entidad con el nombre "${nuevoNombre}" (slug ${newSlug}). Elegí otro nombre o eliminala primero.`,
        };
      } catch {
        // OK, no colisiona
      }
      await atomicWrite(newPath, newContent);
      await fs.unlink(oldPath);
    } else {
      await atomicWrite(oldPath, newContent);
    }

    revalidatePath(`/entidades/${tipo}/${newSlug}`);
    revalidatePath(`/entidades/${tipo}`);

    return {
      success: true,
      newSlug: newSlug !== oldSlug ? newSlug : undefined,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Elimina una entidad del vault. No limpia referencias en otros archivos.
 */
export async function deleteEntityAction(
  tipo: EntityType,
  slug: string
): Promise<ActionResult> {
  try {
    if (!ENTITY_TYPES.includes(tipo)) {
      return { success: false, error: `Tipo de entidad inválido: ${tipo}` };
    }
    const config = loadConfig();
    const filePath = entityFilePath(config.vaultPath, tipo, slug);
    await fs.unlink(filePath);
    revalidatePath(`/entidades/${tipo}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
