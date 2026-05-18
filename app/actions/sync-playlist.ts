"use server";

// app/actions/sync-playlist.ts — Server action: sincroniza la playlist de YouTube

import { loadConfig, loadYoutubeConfig } from "@/lib/config";
import { fetchPlaylistItems } from "@/lib/youtube";
import { readPlaylist, writePlaylist } from "@/lib/vault";
import type { PlaylistCache } from "@/lib/types";

export type SyncResult =
  | { success: true; cache: PlaylistCache }
  | { success: false; error: string };

export async function syncPlaylistAction(): Promise<SyncResult> {
  try {
    const config = loadConfig();
    const { apiKey, playlistId } = loadYoutubeConfig();

    const items = await fetchPlaylistItems(playlistId, apiKey);

    const cache: PlaylistCache = {
      playlist_id: playlistId,
      sincronizado_en: new Date().toISOString(),
      items,
    };

    await writePlaylist(config.vaultPath, cache);

    return { success: true, cache };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Lee la cache existente sin sincronizar. Usado por la página /importar y el formulario.
 */
export async function getPlaylistAction(): Promise<PlaylistCache | null> {
  try {
    const config = loadConfig();
    return await readPlaylist(config.vaultPath);
  } catch {
    return null;
  }
}
