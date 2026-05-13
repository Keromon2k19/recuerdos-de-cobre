// lib/slugify.ts — Convierte nombres a slugs para filenames
// Ej: "Té de Medianoche" → "te-de-medianoche"

/**
 * Convierte un nombre con acentos/espacios a un slug seguro para filenames.
 * Preserva Unicode → normaliza con NFD → elimina diacríticos → lowercase → kebab-case.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // eliminar diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // solo alfanuméricos, espacios y guiones
    .replace(/\s+/g, "-") // espacios → guiones
    .replace(/-+/g, "-") // colapsar guiones múltiples
    .replace(/^-|-$/g, ""); // trim guiones extremos
}

/**
 * Genera el filename para un episodio: "001-titulo-slugificado.md"
 */
export function episodeFilename(numero: number, titulo: string): string {
  const num = String(numero).padStart(3, "0");
  const slug = slugify(titulo);
  return slug ? `${num}-${slug}.md` : `${num}.md`;
}
