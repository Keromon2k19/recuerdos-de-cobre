import path from "node:path";
import fs from "node:fs";

export type AppConfig = {
  anthropicApiKey?: string;
  vaultPath: string; // absoluto
  youtubeApiKey?: string;
  youtubePlaylistId?: string;
};

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const vaultRaw = env.VAULT_PATH?.trim();

  if (!vaultRaw) {
    throw new Error("VAULT_PATH no está definida en .env.local");
  }

  const vaultPath = path.resolve(vaultRaw);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`VAULT_PATH no existe en disco: ${vaultPath}`);
  }

  const anthropicApiKey = env.ANTHROPIC_API_KEY?.trim() || undefined;
  const youtubeApiKey = env.YOUTUBE_API_KEY?.trim() || undefined;
  const youtubePlaylistId = env.YOUTUBE_PLAYLIST_ID?.trim() || undefined;

  return { anthropicApiKey, vaultPath, youtubeApiKey, youtubePlaylistId };
}

/**
 * Variante estricta: exige ANTHROPIC_API_KEY (legacy, solo para lib/claude.ts).
 */
export function loadAnthropicKey(env: Record<string, string | undefined> = process.env): string {
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY no está definida en .env.local");
  }
  return key;
}

/**
 * Variante estricta: exige que las vars de YouTube estén definidas.
 * Usar en flujos que necesitan sí o sí la integración (e.g. sync de playlist).
 */
export function loadYoutubeConfig(
  env: Record<string, string | undefined> = process.env
): { apiKey: string; playlistId: string } {
  const apiKey = env.YOUTUBE_API_KEY?.trim();
  const playlistId = env.YOUTUBE_PLAYLIST_ID?.trim();
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY no está definida en .env.local");
  }
  if (!playlistId) {
    throw new Error("YOUTUBE_PLAYLIST_ID no está definida en .env.local");
  }
  return { apiKey, playlistId };
}
