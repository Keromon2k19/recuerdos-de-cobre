// lib/episode-number.ts — Deriva el número de episodio de la CAMPAÑA desde el
// título del video, no de la posición en la playlist.
//
// El `numero` interno (jobs, archivos del vault, rutas /cronicas/[num]) sigue
// siendo el índice de la lista. Pero para ubicar episodios es más natural el
// número que viene en el título de YouTube:
//
//   "Recuerdos de Cobre 8 parte 1: La Estatua de Hielo" → episodio 8, parte 1
//   "Recuerdos de Cobre 9 sangre y fuego en la granja"   → episodio 9
//   "Recuerdos de Cobre 1: Un voto de confianza"          → episodio 1
//
// Si el título no trae número (videos sin formato canónico), se cae al
// `numero` interno como respaldo.

export type EpisodioRef = { ep: number; parte?: number };

/**
 * Extrae { ep, parte? } del título. Devuelve null si no encuentra número.
 */
export function parseEpisodioRef(titulo: string | undefined | null): EpisodioRef | null {
  if (!titulo) return null;
  // Número principal: el que sigue a "Recuerdos de Cobre"; si no, el primer
  // entero suelto del título.
  const mMain =
    titulo.match(/recuerdos\s+de\s+cobre\s+(\d+)/i) || titulo.match(/\b(\d+)\b/);
  if (!mMain) return null;
  const ep = parseInt(mMain[1], 10);
  if (!Number.isFinite(ep)) return null;

  const mPart =
    titulo.match(/\bparte\s*(\d+)\b/i) || titulo.match(/\bpt\.?\s*(\d+)\b/i);
  const parte = mPart ? parseInt(mPart[1], 10) : undefined;

  return parte ? { ep, parte } : { ep };
}

/**
 * Etiqueta legible larga: "Ep. 8 · parte 1" / "Ep. 8".
 * Respaldo si no hay número en el título: "Registro NN".
 */
export function episodioLabel(
  titulo: string | undefined | null,
  fallbackNumero: number
): string {
  const ref = parseEpisodioRef(titulo);
  if (!ref) return `Registro ${String(fallbackNumero).padStart(3, "0")}`;
  return ref.parte ? `Ep. ${ref.ep} · parte ${ref.parte}` : `Ep. ${ref.ep}`;
}

/**
 * Forma compacta para chips y navegación prev/next: "Ep. 8·1" / "Ep. 8".
 * Respaldo: el número interno con padding ("014").
 */
export function episodioLabelCorto(
  titulo: string | undefined | null,
  fallbackNumero: number
): string {
  const ref = parseEpisodioRef(titulo);
  if (!ref) return String(fallbackNumero).padStart(3, "0");
  return ref.parte ? `Ep. ${ref.ep}·${ref.parte}` : `Ep. ${ref.ep}`;
}

/**
 * Partes para la celda compacta de dos líneas del ledger (columna fija de
 * 92px): un token corto arriba y un sublabel chico abajo, conservando la
 * geometría que ya tenía `.reg` (no romper el grid).
 */
export function episodioLedger(
  titulo: string | undefined | null,
  fallbackNumero: number
): { main: string; sub: string } {
  const ref = parseEpisodioRef(titulo);
  if (!ref) {
    return { main: String(fallbackNumero).padStart(3, "0"), sub: "REGISTRO" };
  }
  return {
    main: `Ep. ${ref.ep}`,
    sub: ref.parte ? `PARTE ${ref.parte}` : "EPISODIO",
  };
}
