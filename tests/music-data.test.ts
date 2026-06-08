// tests/music-data.test.ts
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { MUSIC_TRACKS } from "../data/atlas/music";

describe("MUSIC_TRACKS", () => {
  it("tiene 9 pistas con slugs únicos", () => {
    expect(MUSIC_TRACKS).toHaveLength(9);
    const slugs = new Set(MUSIC_TRACKS.map((t) => t.slug));
    expect(slugs.size).toBe(9);
  });

  it("cada pista tiene title, context, src bajo /assets/atlas/music/ y sourceUrl de youtube", () => {
    for (const t of MUSIC_TRACKS) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.context.length).toBeGreaterThan(0);
      expect(t.src).toBe(`/assets/atlas/music/${t.slug}.mp3`);
      expect(t.sourceUrl).toMatch(/youtube\.com\/watch\?v=/);
    }
  });

  it("el mp3 de cada pista existe en public/", () => {
    for (const t of MUSIC_TRACKS) {
      const file = join(process.cwd(), "public", t.src.replace(/^\//, ""));
      expect(existsSync(file), `falta ${t.src}`).toBe(true);
    }
  });
});
