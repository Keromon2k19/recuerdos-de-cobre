import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  initVault,
  writeEpisode,
  readEpisode,
  readEntity,
  writeEntity,
  listByType,
  listEpisodes,
  getVaultStats,
} from "@/lib/vault";
import { buildEpisodeMarkdown, updateEntityMarkdown } from "@/lib/markdown";
import type { Episodio } from "@/lib/types";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mysha-vault-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("initVault", () => {
  it("crea todas las carpetas del vault", async () => {
    await initVault(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, "episodios"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "personajes"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "lugares"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "eventos"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "objetos"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "facciones"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "worldbuilding"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "misterios"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "quotes"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "decisiones"))).toBe(true);
  });
});

describe("writeEpisode + readEpisode", () => {
  it("escribe y lee un episodio", async () => {
    await initVault(tmpDir);

    const ep: Episodio = {
      numero: 1,
      titulo: "Prólogo",
      procesado: "2026-05-13T00:00:00Z",
      resumen_original: "El inicio de la aventura.",
      extraido: {
        personajes: [{ nombre: "Mysha", descripcion: "Protagonista", alias: [] }],
        lugares: [],
        eventos: [],
        objetos: [],
        facciones: [],
        worldbuilding: [],
        relaciones: [],
        misterios: [],
        quotes: [],
        decisiones: [],
      },
    };

    const md = buildEpisodeMarkdown(ep);
    await writeEpisode(tmpDir, 1, "Prólogo", md);

    const content = await readEpisode(tmpDir, 1);
    expect(content).not.toBeNull();
    expect(content).toContain("Mysha");
    expect(content).toContain("El inicio de la aventura");
  });
});

describe("entity CRUD", () => {
  it("escribe y lee una entidad", async () => {
    await initVault(tmpDir);

    const entityMd = updateEntityMarkdown(
      null,
      { tipo: "personaje", nombre: "Mysha", alias: ["bruja roja"] },
      1,
      "Prólogo",
      "Mysha aparece por primera vez"
    );

    await writeEntity(tmpDir, "personaje", "Mysha", entityMd);

    const content = await readEntity(tmpDir, "personaje", "Mysha");
    expect(content).not.toBeNull();
    expect(content).toContain("Mysha");
    expect(content).toContain("bruja roja");
  });

  it("listByType retorna entidades ordenadas", async () => {
    await initVault(tmpDir);

    const md1 = updateEntityMarkdown(null, { tipo: "personaje", nombre: "Io" }, 1, "P", "familiar");
    const md2 = updateEntityMarkdown(null, { tipo: "personaje", nombre: "Mysha" }, 1, "P", "bruja");

    await writeEntity(tmpDir, "personaje", "Io", md1);
    await writeEntity(tmpDir, "personaje", "Mysha", md2);

    const list = await listByType(tmpDir, "personaje");
    expect(list).toHaveLength(2);
    expect(list[0].nombre).toBe("Io");
    expect(list[1].nombre).toBe("Mysha");
  });
});

describe("getVaultStats", () => {
  it("retorna conteos correctos", async () => {
    await initVault(tmpDir);

    // Escribir un episodio y una entidad
    const ep: Episodio = {
      numero: 1,
      titulo: "Test",
      procesado: new Date().toISOString(),
      resumen_original: "test",
      extraido: {
        personajes: [],
        lugares: [],
        eventos: [],
        objetos: [],
        facciones: [],
        worldbuilding: [],
        relaciones: [],
        misterios: [],
        quotes: [],
        decisiones: [],
      },
    };
    await writeEpisode(tmpDir, 1, "Test", buildEpisodeMarkdown(ep));

    const md = updateEntityMarkdown(null, { tipo: "personaje", nombre: "X" }, 1, "T", "d");
    await writeEntity(tmpDir, "personaje", "X", md);

    const stats = await getVaultStats(tmpDir);
    expect(stats.episodios).toBe(1);
    expect(stats.personaje).toBe(1);
  });
});
