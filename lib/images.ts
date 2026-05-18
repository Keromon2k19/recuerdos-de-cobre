// lib/images.ts — Resolución de imágenes con arquitectura reemplazable.
// FASE 1/2: si el frontmatter trae `image`, se usa; si no, se cae a un
// placeholder visual (clase .ph + glifo). Joaquín reemplaza las imágenes
// finales dejando archivos en public/images/<kind>/ y apuntando el
// frontmatter, sin tocar componentes.

export type ImgKind =
  | "personajes"
  | "lugares"
  | "facciones"
  | "objetos"
  | "misterios"
  | "worldbuilding"
  | "episodios";

const GLYPH: Record<ImgKind, string> = {
  personajes: "☉",
  lugares: "△",
  facciones: "❖",
  objetos: "◇",
  misterios: "?",
  worldbuilding: "✦",
  episodios: "§",
};

/** Glifo del placeholder para un tipo (para grillas que no resuelven img). */
export function glyphFor(kind: ImgKind): string {
  return GLYPH[kind];
}

export type ResolvedImage =
  | { kind: "img"; src: string; alt: string; caption?: string }
  | { kind: "placeholder"; glyph: string; alt: string };

/**
 * @param frontmatter  frontmatter de la entidad/episodio
 * @param kind         carpeta lógica (define el glifo del placeholder)
 * @param fallbackAlt  alt si el frontmatter no define imageAlt
 */
export function resolveImage(
  frontmatter: Record<string, unknown>,
  kind: ImgKind,
  fallbackAlt: string
): ResolvedImage {
  const src = typeof frontmatter.image === "string" ? frontmatter.image.trim() : "";
  const alt =
    (typeof frontmatter.imageAlt === "string" && frontmatter.imageAlt.trim()) ||
    fallbackAlt;
  if (src) return { kind: "img", src, alt };
  return { kind: "placeholder", glyph: GLYPH[kind], alt };
}

/**
 * Resuelve una galería: lee `images` (lista de { src, alt?, caption? } o
 * strings) y, si no existe, cae a la `image` única. Devuelve siempre ≥1
 * elemento: las fotos reales, o un único placeholder si no hay ninguna.
 * Pensado para lugares/facciones (hero + galería); personajes siguen
 * usando resolveImage (retrato único).
 */
export function resolveImages(
  frontmatter: Record<string, unknown>,
  kind: ImgKind,
  fallbackAlt: string
): ResolvedImage[] {
  const out: ResolvedImage[] = [];
  const raw = Array.isArray(frontmatter.images) ? frontmatter.images : [];
  for (const it of raw) {
    if (typeof it === "string" && it.trim()) {
      out.push({ kind: "img", src: it.trim(), alt: fallbackAlt });
    } else if (it && typeof it === "object") {
      const o = it as Record<string, unknown>;
      const src = typeof o.src === "string" ? o.src.trim() : "";
      if (!src) continue;
      const alt =
        (typeof o.alt === "string" && o.alt.trim()) || fallbackAlt;
      const caption =
        typeof o.caption === "string" && o.caption.trim()
          ? o.caption.trim()
          : undefined;
      out.push({ kind: "img", src, alt, caption });
    }
  }
  if (out.length === 0) return [resolveImage(frontmatter, kind, fallbackAlt)];
  return out;
}
