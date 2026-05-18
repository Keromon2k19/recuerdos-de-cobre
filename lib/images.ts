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
  | { kind: "img"; src: string; alt: string }
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
