// lib/public-cache.ts — Cache TTL en proceso para lecturas del vault desde
// la antología pública. Navegar entre fichas reconstruía el resolutor de
// wikilinks (~900 .md parseados con gray-matter) en cada request. Con un
// TTL corto la exploración es fluida y, cuando el pipeline commitea, el
// sitio refleja los cambios dentro de la ventana. Solo lo usa la parte
// pública; el panel local sigue leyendo en vivo.
import { listByType, listEpisodes, type EntityListItem } from "./vault";
import {
  readAtlasEntityDetail,
  type AtlasEntityKind,
} from "./atlas-content";
import type { EntityType } from "./types";

const TTL_MS = Number(process.env.PUBLIC_CACHE_TTL_MS ?? 300_000);

type Entry = { at: number; data: unknown };
const store = new Map<string, Entry>();

async function memo<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T;
  const data = await fn();
  store.set(key, { at: Date.now(), data });
  return data;
}

export function cachedListByType(
  vaultPath: string,
  tipo: EntityType
): Promise<EntityListItem[]> {
  return memo(`lbt:${vaultPath}:${tipo}`, () => listByType(vaultPath, tipo));
}

export function cachedListEpisodes(vaultPath: string) {
  return memo(`episodes:${vaultPath}`, () => listEpisodes(vaultPath));
}

export function cachedAtlasEntityDetail(
  vaultPath: string,
  kind: AtlasEntityKind,
  slug: string,
) {
  return memo(`atlas-detail:${vaultPath}:${kind}:${slug}`, () =>
    readAtlasEntityDetail(vaultPath, kind, slug),
  );
}
