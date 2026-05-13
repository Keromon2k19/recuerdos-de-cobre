"use server";

// app/actions/commit.ts — Server action: objeto revisado → escribe .md al vault

import { loadConfig } from "@/lib/config";
import { initVault, writeEpisode, readEntity, writeEntity } from "@/lib/vault";
import { buildEpisodeMarkdown, updateEntityMarkdown } from "@/lib/markdown";
import type { Episodio, EntityType, ExtractionResult, Relacion } from "@/lib/types";

export type CommitResult =
  | { success: true; filesWritten: number }
  | { success: false; error: string };

/**
 * Server action: recibe el episodio con lore revisado → escribe al vault.
 * Idempotente: re-procesar el mismo episodio reemplaza las secciones correspondientes.
 */
export async function commitEpisodeAction(
  numero: number,
  titulo: string,
  resumen: string,
  extraido: ExtractionResult,
  fechaGrabacion?: string
): Promise<CommitResult> {
  try {
    const config = loadConfig();
    await initVault(config.vaultPath);

    const episodio: Episodio = {
      numero,
      titulo,
      fecha_grabacion: fechaGrabacion,
      procesado: new Date().toISOString(),
      resumen_original: resumen,
      extraido,
    };

    let filesWritten = 0;

    // 1. Escribir archivo de episodio
    const epMarkdown = buildEpisodeMarkdown(episodio);
    await writeEpisode(config.vaultPath, numero, titulo, epMarkdown);
    filesWritten++;

    // 2. Procesar cada tipo de entidad
    // Personajes
    for (const p of extraido.personajes) {
      const relaciones = extraido.relaciones.filter(
        (r) => r.de === p.nombre || r.a === p.nombre
      );
      await upsertEntity(
        config.vaultPath,
        "personaje",
        p.nombre,
        p.descripcion,
        p.alias ?? [],
        relaciones,
        numero,
        titulo
      );
      filesWritten++;
    }

    // Lugares
    for (const l of extraido.lugares) {
      await upsertEntity(config.vaultPath, "lugar", l.nombre, l.descripcion, [], [], numero, titulo);
      filesWritten++;
    }

    // Eventos
    for (const e of extraido.eventos) {
      await upsertEntity(config.vaultPath, "evento", e.nombre, e.descripcion, [], [], numero, titulo);
      filesWritten++;
    }

    // Objetos
    for (const o of extraido.objetos) {
      await upsertEntity(config.vaultPath, "objeto", o.nombre, o.descripcion, [], [], numero, titulo);
      filesWritten++;
    }

    // Facciones
    for (const f of extraido.facciones) {
      await upsertEntity(config.vaultPath, "faccion", f.nombre, f.descripcion, [], [], numero, titulo);
      filesWritten++;
    }

    // Worldbuilding
    for (const w of extraido.worldbuilding) {
      await upsertEntity(config.vaultPath, "worldbuilding", w.tema, w.descripcion, [], [], numero, titulo);
      filesWritten++;
    }

    // Misterios
    for (const m of extraido.misterios) {
      // Los misterios son strings, usamos un nombre derivado
      const nombre = m.length > 60 ? m.substring(0, 60) + "..." : m;
      await upsertEntity(config.vaultPath, "misterio", nombre, m, [], [], numero, titulo);
      filesWritten++;
    }

    // Quotes
    for (const q of extraido.quotes) {
      const nombre = q.autor
        ? `${q.autor} — "${q.texto.substring(0, 40)}..."`
        : `"${q.texto.substring(0, 50)}..."`;
      await upsertEntity(config.vaultPath, "quote", nombre, q.texto, [], [], numero, titulo);
      filesWritten++;
    }

    // Decisiones
    for (const d of extraido.decisiones) {
      const nombre = d.descripcion.length > 60
        ? d.descripcion.substring(0, 60) + "..."
        : d.descripcion;
      await upsertEntity(config.vaultPath, "decision", nombre, d.descripcion, [], [], numero, titulo);
      filesWritten++;
    }

    return { success: true, filesWritten };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Crea o actualiza una entidad en el vault.
 */
async function upsertEntity(
  vaultPath: string,
  tipo: EntityType,
  nombre: string,
  descripcion: string,
  alias: string[],
  relaciones: Relacion[],
  episodio: number,
  tituloEpisodio: string
): Promise<void> {
  const existing = await readEntity(vaultPath, tipo, nombre);
  const content = updateEntityMarkdown(
    existing,
    { tipo, nombre, alias, relaciones },
    episodio,
    tituloEpisodio,
    descripcion
  );
  await writeEntity(vaultPath, tipo, nombre, content);
}
