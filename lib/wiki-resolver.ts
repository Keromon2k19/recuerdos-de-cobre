// lib/wiki-resolver.ts — Resolutor de wikilinks para la antología pública.
// Mapea [[Nombre]] / [[slug|Display]] a la ficha pública correcta entre
// todos los tipos con ruta, y los wikilinks a episodios (slug NNN-... o
// número) a /cronicas/N. Si no hay destino público, devuelve null y el
// link se renderiza como texto resaltado (sin links muertos).
import { cachedListByType } from "./public-cache";
import { slugify } from "./slugify";
import { BY_SEGMENT, PUBLIC_ENTITIES } from "./entity-public";
import type { WikiResolver } from "./markdown-render";
import type { EntityType } from "./types";

const RESOLVER_TTL_MS = Number(process.env.PUBLIC_CACHE_TTL_MS ?? 300_000);
const resolverCache = new Map<string, { at: number; resolve: WikiResolver }>();

const V2_SEGMENT_BY_TYPE: Partial<Record<EntityType, string>> = {
  personaje: "personajes",
  lugar: "lugares",
  faccion: "facciones",
  objeto: "objetos",
  misterio: "misterios",
  worldbuilding: "mundo",
};

async function buildWikiResolverForRoutes(
  vaultPath: string,
  routeSegment: (type: EntityType, legacySegment: string) => string,
  episodeSegment: string,
): Promise<WikiResolver> {
  const bySlug = new Map<string, string>(); // slug -> href
  const byName = new Map<string, string>(); // nombre.toLowerCase() -> href
  const byPath = new Map<string, string>(); // carpeta/slug -> href

  await Promise.all(
    PUBLIC_ENTITIES.map(async (cfg) => {
      const items = await cachedListByType(vaultPath, cfg.tipo);
      for (const it of items) {
        const publicSegment = routeSegment(cfg.tipo, cfg.segment);
        const href = `/${publicSegment}/${it.slug}`;
        if (!bySlug.has(it.slug)) bySlug.set(it.slug, href);
        byPath.set(`${cfg.segment}/${it.slug}`.toLowerCase(), href);
        byPath.set(`${publicSegment}/${it.slug}`.toLowerCase(), href);
        const key = it.nombre.toLowerCase();
        if (!byName.has(key)) byName.set(key, href);
      }
    })
  );

  return (target: string): string | null => {
    const raw = target.replace(/^([^|]+)\|.+$/, "$1").trim();
    const rawPath = raw
      .replace(/\\/g, "/")
      .replace(/\.md$/i, "")
      .replace(/^\/+|\/+$/g, "");

    const directPath = byPath.get(rawPath.toLowerCase());
    if (directPath) return directPath;

    const parts = rawPath.split("/");
    if (parts.length > 1) {
      const folder = parts[0].toLowerCase();
      const cfg = BY_SEGMENT[folder];
      if (cfg) {
        const href = byPath.get(
          `${cfg.segment}/${slugify(parts.slice(1).join("/"))}`.toLowerCase()
        );
        if (href) return href;
      }
    }

    // Wikilink a episodio: "007-...-slug" o número suelto
    const epSlug = raw.match(/^(\d{1,3})\b/);
    if (epSlug && /^\d{1,3}(-|$)/.test(raw)) {
      return `/${episodeSegment}/${parseInt(epSlug[1], 10)}`;
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

export function buildWikiResolver(vaultPath: string): Promise<WikiResolver> {
  return buildWikiResolverForRoutes(
    vaultPath,
    (_type, legacySegment) => legacySegment,
    "cronicas",
  );
}

export function buildAtlasWikiResolver(
  vaultPath: string,
): Promise<WikiResolver> {
  return buildWikiResolverForRoutes(
    vaultPath,
    (type, legacySegment) => `v2/${V2_SEGMENT_BY_TYPE[type] ?? legacySegment}`,
    "v2/capitulos",
  );
}

export async function cachedBuildWikiResolver(
  vaultPath: string
): Promise<WikiResolver> {
  const cacheKey = `legacy:${vaultPath}`;
  const hit = resolverCache.get(cacheKey);
  if (hit && Date.now() - hit.at < RESOLVER_TTL_MS) return hit.resolve;

  const resolve = await buildWikiResolver(vaultPath);
  resolverCache.set(cacheKey, { at: Date.now(), resolve });
  return resolve;
}

export async function cachedBuildAtlasWikiResolver(
  vaultPath: string,
): Promise<WikiResolver> {
  const cacheKey = `v2:${vaultPath}`;
  const hit = resolverCache.get(cacheKey);
  if (hit && Date.now() - hit.at < RESOLVER_TTL_MS) return hit.resolve;

  const resolve = await buildAtlasWikiResolver(vaultPath);
  resolverCache.set(cacheKey, { at: Date.now(), resolve });
  return resolve;
}
