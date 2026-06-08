import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { initVault, writeEntity } from "@/lib/vault";
import { updateEntityMarkdown } from "@/lib/markdown";
import { renderMarkdown } from "@/lib/markdown-render";
import { buildAtlasWikiResolver, buildWikiResolver } from "@/lib/wiki-resolver";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "recuerdos-wiki-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("buildWikiResolver", () => {
  it("resuelve wikilinks con carpeta cuando el slug existe en varias secciones", async () => {
    await initVault(tmpDir);

    await writeEntity(
      tmpDir,
      "lugar",
      "Hermandad de Cobre",
      updateEntityMarkdown(
        null,
        { tipo: "lugar", nombre: "Hermandad de Cobre" },
        1,
        "Inicio",
        "Sede del grupo."
      )
    );
    await writeEntity(
      tmpDir,
      "faccion",
      "Hermandad de Cobre",
      updateEntityMarkdown(
        null,
        { tipo: "faccion", nombre: "Hermandad de Cobre" },
        1,
        "Inicio",
        "Gremio del grupo."
      )
    );

    const resolve = await buildWikiResolver(tmpDir);

    expect(resolve("facciones/hermandad-de-cobre")).toBe(
      "/facciones/hermandad-de-cobre"
    );
    expect(resolve("lugares/hermandad-de-cobre")).toBe(
      "/lugares/hermandad-de-cobre"
    );

    const html = renderMarkdown(
      "[[facciones/hermandad-de-cobre|Hermandad de Cobre]]",
      resolve
    );

    expect(html).toContain('href="/facciones/hermandad-de-cobre"');
    expect(html).toContain(">Hermandad de Cobre</a>");
  });

  it("resuelve todos los destinos con rutas V2", async () => {
    await initVault(tmpDir);

    await writeEntity(
      tmpDir,
      "worldbuilding",
      "Velo etereo",
      updateEntityMarkdown(
        null,
        { tipo: "worldbuilding", nombre: "Velo etereo" },
        12,
        "Inicio",
        "Regla del mundo."
      )
    );
    await writeEntity(
      tmpDir,
      "lugar",
      "Khelgrim",
      updateEntityMarkdown(
        null,
        { tipo: "lugar", nombre: "Khelgrim" },
        12,
        "Inicio",
        "Ciudad enana."
      )
    );

    const resolve = await buildAtlasWikiResolver(tmpDir);

    expect(resolve("worldbuilding/velo-etereo")).toBe("/mundo/velo-etereo");
    expect(resolve("lugares/khelgrim")).toBe("/lugares/khelgrim");
    expect(resolve("012-recuerdos-de-cobre")).toBe("/capitulos/12");
  });
});
