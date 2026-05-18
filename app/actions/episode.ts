"use server";

// app/actions/episode.ts — Server action: eliminar episodio + limpiar todas
// las menciones correspondientes en las entidades del vault.

import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "@/lib/config";
import { ENTITY_FOLDERS, ENTITY_TYPES } from "@/lib/types";
import { parseMarkdown, serializeMarkdown } from "@/lib/markdown";
import { episodeFilename } from "@/lib/slugify";
import { findEpisodeFile, readEpisode } from "@/lib/vault";

export type DeleteEpisodeResult =
  | { success: true; cleanedEntities: number; deletedEntities: number }
  | { success: false; error: string };

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = filePath + ".tmp";
  await fs.writeFile(tmp, content, "utf-8");
  await fs.rename(tmp, filePath);
}

/**
 * Borra un episodio completo y limpia su rastro de las entidades:
 *  - elimina vault/episodios/NNN-slug.md
 *  - elimina vault/_jobs/NNN.json (si existe)
 *  - para cada entidad que tuviera el ep. en apariciones:
 *     - quita el número de apariciones
 *     - filtra las relaciones de ese ep.
 *     - elimina la sección de menciones de ese ep. del cuerpo
 *     - si la entidad queda sin apariciones → se elimina entera
 */
export async function deleteEpisodeAction(
  numero: number
): Promise<DeleteEpisodeResult> {
  try {
    if (!Number.isFinite(numero) || numero <= 0) {
      return { success: false, error: `Número de episodio inválido: ${numero}` };
    }

    const config = loadConfig();

    // 1. Leer el episodio para conocer su título y construir el slug exacto.
    const epContent = await readEpisode(config.vaultPath, numero);
    if (!epContent) {
      return { success: false, error: `Episodio ${numero} no existe en el vault` };
    }
    const { frontmatter: epFm } = parseMarkdown(epContent);
    const titulo = (epFm.titulo as string) ?? "";
    const epSlug = episodeFilename(numero, titulo).replace(".md", "");

    // Regex para matchear la sección de menciones del episodio en el body
    // de las entidades: "### [[001-slug|Ep. 1 — Título]]\n- desc\n"
    const sectionRegex = new RegExp(
      `### \\[\\[${escapeRegExp(epSlug)}\\|[^\\]]*\\]\\]\\n(?:- [^\\n]*\\n?)*\\n?`,
      "g"
    );

    let cleanedEntities = 0;
    let deletedEntities = 0;

    // 2. Recorrer todas las entidades de todos los tipos
    for (const tipo of ENTITY_TYPES) {
      const folder = ENTITY_FOLDERS[tipo];
      const dir = path.join(config.vaultPath, folder);

      let files: string[];
      try {
        files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
      } catch {
        continue;
      }

      for (const filename of files) {
        const filePath = path.join(dir, filename);
        const content = await fs.readFile(filePath, "utf-8");
        const parsed = parseMarkdown(content);
        const apariciones = (parsed.frontmatter.apariciones as number[]) ?? [];

        if (!apariciones.includes(numero)) continue;

        const newApariciones = apariciones.filter((n) => n !== numero);

        // Si la entidad solo aparecía en este ep → borrarla entera
        if (newApariciones.length === 0) {
          await fs.unlink(filePath);
          deletedEntities++;
          continue;
        }

        // Actualizar frontmatter
        const newFm: Record<string, unknown> = {
          ...parsed.frontmatter,
          apariciones: newApariciones,
          ultima_actualizacion: new Date().toISOString(),
        };

        // Filtrar relaciones de este ep.
        const relaciones =
          (parsed.frontmatter.relaciones as Array<{
            con: string;
            tipo: string;
            episodio: number;
          }>) ?? [];
        const filteredRel = relaciones.filter((r) => r.episodio !== numero);
        if (filteredRel.length > 0) {
          newFm.relaciones = filteredRel;
        } else {
          delete newFm.relaciones;
        }

        // Quitar sección del body, normalizar saltos de línea
        const newBody = parsed.body
          .replace(sectionRegex, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        await atomicWrite(filePath, serializeMarkdown(newFm, newBody));
        cleanedEntities++;
      }
    }

    // 3. Borrar el .md del episodio
    const epFilename = await findEpisodeFile(config.vaultPath, numero);
    if (epFilename) {
      await fs.unlink(
        path.join(config.vaultPath, "episodios", epFilename)
      );
    }

    // 4. Borrar el job (si existe)
    try {
      const jobFile = path.join(
        config.vaultPath,
        "_jobs",
        `${String(numero).padStart(3, "0")}.json`
      );
      await fs.unlink(jobFile);
    } catch {
      // no había job, ignorar
    }

    // 5. Refrescar páginas afectadas
    revalidatePath("/episodios");
    revalidatePath("/entidades");
    for (const tipo of ENTITY_TYPES) {
      revalidatePath(`/entidades/${tipo}`);
    }

    return { success: true, cleanedEntities, deletedEntities };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
