// lib/youtube.ts — Cliente de YouTube Data API v3 para extraer items de playlist
import type { PlaylistItem } from "./types";

const API_BASE = "https://www.googleapis.com/youtube/v3/playlistItems";
const PAGE_SIZE = 50; // máximo permitido por la API

type YoutubeApiResponse = {
  nextPageToken?: string;
  items: Array<{
    snippet: {
      title: string;
      position: number;
      resourceId: { videoId: string };
      publishedAt: string;
    };
  }>;
};

/**
 * Inyectable para tests. En runtime usa fetch global.
 */
export type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
}>;

/**
 * Trae todos los items de una playlist de YouTube, manejando paginación.
 *
 * El "numero" de cada episodio se deriva de la posición en la playlist (1-indexed).
 * Esto asume que la playlist está ordenada cronológicamente.
 *
 * Filtra videos privados/eliminados (que llegan con videoId vacío).
 */
export async function fetchPlaylistItems(
  playlistId: string,
  apiKey: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike
): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      key: apiKey,
      maxResults: String(PAGE_SIZE),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const url = `${API_BASE}?${params.toString()}`;
    const res = await fetchImpl(url);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const msg =
        body && typeof body === "object" && "error" in body
          ? (body as { error: { message?: string } }).error.message
          : `${res.status} ${res.statusText}`;
      throw new Error(`YouTube API error: ${msg}`);
    }

    const data = (await res.json()) as YoutubeApiResponse;
    for (const item of data.items) {
      const videoId = item.snippet.resourceId.videoId;
      if (!videoId) continue; // privados/eliminados
      items.push({
        numero: item.snippet.position + 1,
        titulo: item.snippet.title,
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        publicado_en: item.snippet.publishedAt,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return items.sort((a, b) => a.numero - b.numero);
}
