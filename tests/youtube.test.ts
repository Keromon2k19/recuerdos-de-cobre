import { describe, it, expect } from "vitest";
import { fetchPlaylistItems, type FetchLike } from "@/lib/youtube";

type MockResponse = {
  ok: boolean;
  status?: number;
  statusText?: string;
  body: unknown;
};

function mockFetch(responses: MockResponse[]): FetchLike {
  let i = 0;
  return async () => {
    const r = responses[i++];
    if (!r) throw new Error("mockFetch: sin respuestas restantes");
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 500),
      statusText: r.statusText ?? "",
      json: async () => r.body,
    };
  };
}

function makeItem(position: number, videoId: string, title: string) {
  return {
    snippet: {
      title,
      position,
      resourceId: { videoId },
      publishedAt: "2024-01-01T00:00:00Z",
    },
  };
}

describe("fetchPlaylistItems", () => {
  it("parsea una página simple", async () => {
    const fetch = mockFetch([
      {
        ok: true,
        body: {
          items: [
            makeItem(0, "abc123", "Ep 01: Inicio"),
            makeItem(1, "def456", "Ep 02: Segundo"),
          ],
        },
      },
    ]);

    const items = await fetchPlaylistItems("PL-test", "key", fetch);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      numero: 1,
      titulo: "Ep 01: Inicio",
      videoId: "abc123",
      url: "https://www.youtube.com/watch?v=abc123",
      publicado_en: "2024-01-01T00:00:00Z",
    });
    expect(items[1].numero).toBe(2);
  });

  it("sigue la paginación con nextPageToken", async () => {
    const fetch = mockFetch([
      {
        ok: true,
        body: {
          nextPageToken: "TOKEN2",
          items: [makeItem(0, "a", "Ep 1"), makeItem(1, "b", "Ep 2")],
        },
      },
      {
        ok: true,
        body: {
          items: [makeItem(2, "c", "Ep 3")],
        },
      },
    ]);

    const items = await fetchPlaylistItems("PL-test", "key", fetch);
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.videoId)).toEqual(["a", "b", "c"]);
  });

  it("filtra videos sin videoId (privados/eliminados)", async () => {
    const fetch = mockFetch([
      {
        ok: true,
        body: {
          items: [
            makeItem(0, "ok1", "Ep 1"),
            makeItem(1, "", "[Privado]"),
            makeItem(2, "ok2", "Ep 3"),
          ],
        },
      },
    ]);

    const items = await fetchPlaylistItems("PL-test", "key", fetch);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.videoId)).toEqual(["ok1", "ok2"]);
  });

  it("ordena los items por número aunque vengan desordenados", async () => {
    const fetch = mockFetch([
      {
        ok: true,
        body: {
          items: [
            makeItem(2, "c", "Ep 3"),
            makeItem(0, "a", "Ep 1"),
            makeItem(1, "b", "Ep 2"),
          ],
        },
      },
    ]);

    const items = await fetchPlaylistItems("PL-test", "key", fetch);
    expect(items.map((i) => i.numero)).toEqual([1, 2, 3]);
  });

  it("tira error con mensaje claro si la API devuelve error", async () => {
    const fetch = mockFetch([
      {
        ok: false,
        status: 403,
        statusText: "Forbidden",
        body: { error: { message: "API key inválida" } },
      },
    ]);

    await expect(fetchPlaylistItems("PL-test", "bad-key", fetch)).rejects.toThrow(
      /API key inválida/
    );
  });

  it("tira error con status si el body no tiene mensaje", async () => {
    const fetch = mockFetch([
      {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        body: {},
      },
    ]);

    await expect(fetchPlaylistItems("PL-test", "key", fetch)).rejects.toThrow(
      /500/
    );
  });
});
