// lib/commit.ts — Lógica pura de escritura de un episodio extraído al vault.
// Usada por el server action `commitEpisodeAction` y por el script de cola.

import { initVault, writeEpisode, readEntity, writeEntity } from "./vault";
import { buildEpisodeMarkdown, updateEntityMarkdown } from "./markdown";
import type {
  Episodio,
  EntityType,
  ExtractionResult,
  Relacion,
} from "./types";

export type CommitInput = {
  vaultPath: string;
  numero: number;
  titulo: string;
  resumen: string;
  extraido: ExtractionResult;
  fechaGrabacion?: string;
};

export type CommitOutput = {
  filesWritten: number;
};

/**
 * Persiste un episodio + sus entidades extraídas al vault.
 * Idempotente: re-procesar el mismo episodio actualiza las menciones existentes.
 */
export async function commitEpisode(input: CommitInput): Promise<CommitOutput> {
  const { vaultPath, numero, titulo, resumen, extraido, fechaGrabacion } =
    input;

  await initVault(vaultPath);

  const episodio: Episodio = {
    numero,
    titulo,
    fecha_grabacion: fechaGrabacion,
    procesado: new Date().toISOString(),
    resumen_original: resumen,
    extraido,
  };

  let filesWritten = 0;

  // 1. Episodio
  const epMarkdown = buildEpisodeMarkdown(episodio);
  await writeEpisode(vaultPath, numero, titulo, epMarkdown);
  filesWritten++;

  // 2. Personajes
  for (const p of extraido.personajes) {
    const relaciones = extraido.relaciones.filter(
      (r) => r.de === p.nombre || r.a === p.nombre
    );
    await upsertEntity(
      vaultPath,
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

  // 3. Lugares
  for (const l of extraido.lugares) {
    await upsertEntity(
      vaultPath,
      "lugar",
      l.nombre,
      l.descripcion,
      [],
      [],
      numero,
      titulo
    );
    filesWritten++;
  }

  // 4. Eventos
  for (const e of extraido.eventos) {
    await upsertEntity(
      vaultPath,
      "evento",
      e.nombre,
      e.descripcion,
      [],
      [],
      numero,
      titulo
    );
    filesWritten++;
  }

  // 5. Objetos
  for (const o of extraido.objetos) {
    await upsertEntity(
      vaultPath,
      "objeto",
      o.nombre,
      o.descripcion,
      [],
      [],
      numero,
      titulo
    );
    filesWritten++;
  }

  // 6. Facciones
  for (const f of extraido.facciones) {
    await upsertEntity(
      vaultPath,
      "faccion",
      f.nombre,
      f.descripcion,
      [],
      [],
      numero,
      titulo
    );
    filesWritten++;
  }

  // 7. Worldbuilding
  for (const w of extraido.worldbuilding) {
    await upsertEntity(
      vaultPath,
      "worldbuilding",
      w.tema,
      w.descripcion,
      [],
      [],
      numero,
      titulo
    );
    filesWritten++;
  }

  // 8. Misterios
  for (const m of extraido.misterios) {
    const nombre = m.length > 60 ? m.substring(0, 60) + "..." : m;
    await upsertEntity(
      vaultPath,
      "misterio",
      nombre,
      m,
      [],
      [],
      numero,
      titulo
    );
    filesWritten++;
  }

  // 9. Quotes
  for (const q of extraido.quotes) {
    const nombre = q.autor
      ? `${q.autor} — "${q.texto.substring(0, 40)}..."`
      : `"${q.texto.substring(0, 50)}..."`;
    await upsertEntity(
      vaultPath,
      "quote",
      nombre,
      q.texto,
      [],
      [],
      numero,
      titulo
    );
    filesWritten++;
  }

  // 10. Decisiones
  for (const d of extraido.decisiones) {
    const nombre =
      d.descripcion.length > 60
        ? d.descripcion.substring(0, 60) + "..."
        : d.descripcion;
    await upsertEntity(
      vaultPath,
      "decision",
      nombre,
      d.descripcion,
      [],
      [],
      numero,
      titulo
    );
    filesWritten++;
  }

  return { filesWritten };
}

// PJs canónicos (los 6 jugadores + alias de personalidades de Mysha) y familiares.
// Campaña coral: estos nombres SIEMPRE son PJ; el resto NPC (salvo override manual).
const PJ_NOMBRES = new Set([
  "mysha",
  "borok",
  "layra",
  "narcissa",
  "david ilcard",
  "io campbell",
  "selenne",
  "veltra",
  "milla",
  "misha",
  "milla selen beltra",
]);
const FAMILIAR_NOMBRES = new Set(["champi"]);

/** Rol canónico de un personaje por su nombre. */
export function rolDePersonaje(nombre: string): "PJ" | "familiar" | "NPC" {
  const n = nombre.trim().toLowerCase();
  if (PJ_NOMBRES.has(n)) return "PJ";
  if (FAMILIAR_NOMBRES.has(n)) return "familiar";
  return "NPC";
}

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
  const personajeRol =
    tipo === "personaje" ? rolDePersonaje(nombre) : undefined;
  const content = updateEntityMarkdown(
    existing,
    { tipo, nombre, alias, relaciones },
    episodio,
    tituloEpisodio,
    descripcion,
    personajeRol
  );
  await writeEntity(vaultPath, tipo, nombre, content);
}
