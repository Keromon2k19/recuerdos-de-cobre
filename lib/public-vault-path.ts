import type { AtlasV2EntityKind } from "./atlas-v2-content";
import { cachedListByType, cachedListEpisodes } from "./public-cache";
import path from "path"; // <-- Agregas esto

// Reemplazas el string viejo por esta línea con path.join:
const DEFAULT_PUBLIC_VAULT_PATH = path.join(process.cwd(), "vault-recuerdos-de-cobre");

export function publicVaultPath(): string {
  return process.env.VAULT_PATH?.trim() || DEFAULT_PUBLIC_VAULT_PATH;
}

export async function publicEntityStaticParams(kind: AtlasV2EntityKind) {
  const entities = await cachedListByType(publicVaultPath(), kind);
  return entities.map((entity) => ({ slug: entity.slug }));
}


export async function publicEpisodeStaticParams() {
  const episodes = await cachedListEpisodes(publicVaultPath());
  return episodes.map((episode) => ({ num: String(episode.numero) }));
}

