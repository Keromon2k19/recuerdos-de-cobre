// lib/wiki-resolver.ts — Resolutor de wikilinks para la antología pública.
// Mapea [[Nombre]] / [[slug|Display]] a la ficha pública correcta entre
// todos los tipos con ruta, y los wikilinks a episodios (slug NNN-... o
// número) a /cronicas/N. Si no hay destino público, devuelve null y el
// link se renderiza como texto resaltado (sin links muertos).
import { cachedListByType } from "./public-cache";
import { slugify } from "./slugify";
import { PUBLIC_ENTITIES } from "./entity-public";
import type { WikiResolver } from "./markdown-render";

export async function buildWikiResolver(
  vaultPath: string
): Promise<WikiResolver> {
  const bySlug = new Map<string, string>(); // slug -> href
  const byName = new Map<string, string>(); // nombre.toLowerCase() -> href

  await Promise.all(
    PUBLIC_ENTITIES.map(async (cfg) => {
      const items = await cachedListByType(vaultPath, cfg.tipo);
      for (const it of items) {
        const href = `/${cfg.segment}/${it.slug}`;
        if (!bySlug.has(it.slug)) bySlug.set(it.slug, href);
        const key = it.nombre.toLowerCase();
        if (!byName.has(key)) byName.set(key, href);
      }
    })
  );

  return (target: string): string | null => {
    const raw = target.replace(/^([^|]+)\|.+$/, "$1").trim();

    // Wikilink a episodio: "007-...-slug" o número suelto
    const epSlug = raw.match(/^(\d{1,3})\b/);
    if (epSlug && /^\d{1,3}(-|$)/.test(raw)) {
      return `/cronicas/${parseInt(epSlug[1], 10)}`;
    }

    const s = slugify(raw);
    return (
      bySlug.get(raw) ??
      bySlug.get(s) ??
      byName.get(raw.toLowerCase()) ??
      null
    );
  };
}
