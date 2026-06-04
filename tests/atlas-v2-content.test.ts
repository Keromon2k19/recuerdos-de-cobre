import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseAtlasV2EntityDetail,
  readAtlasV2EntityDetail,
} from "@/lib/atlas-v2-content";

const SAMPLE = `---
tipo: objeto
nombre: Carta de Nabish
alias:
  - Carta de la Fortuna
apariciones:
  - 50
  - 47
categoria: Reliquia planar
origen: Khelgrim
image: /images/objetos/carta-de-nabish.webp
relaciones:
  - con: "[[nabish|Nabish]]"
    tipo: contiene su prision
    episodio: 47
---

## Perfil

Carta legendaria que abre un espacio fuera del tiempo.

## Menciones por episodio

### Ep. 47
- El grupo entra al dominio de Nabish.

## Lectura del archivo

Su origen sigue siendo discutido.
`;

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanup.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("atlas-v2-content", () => {
  it("normaliza una entidad del vault para una ficha V2", () => {
    const detail = parseAtlasV2EntityDetail(SAMPLE, "objeto", "carta-de-nabish");

    expect(detail.slug).toBe("carta-de-nabish");
    expect(detail.kind).toBe("objeto");
    expect(detail.name).toBe("Carta de Nabish");
    expect(detail.description).toContain("Carta legendaria");
    expect(detail.imageSrc).toBe("/images/objetos/carta-de-nabish.webp");
    expect(detail.appearances).toEqual([47, 50]);
    expect(detail.meta).toContainEqual({
      label: "Categoria",
      value: "Reliquia planar",
    });
    expect(detail.relations).toEqual([
      {
        name: "Nabish",
        detail: "contiene su prision",
        episode: 47,
      },
    ]);
    expect(detail.sections.map((section) => section.kind)).toEqual([
      "profile",
      "mentions",
      "narrative",
    ]);
  });

  it("lee una entidad por tipo y slug desde el vault", async () => {
    const vault = await mkdtemp(join(tmpdir(), "atlas-v2-content-"));
    cleanup.push(vault);
    await mkdir(join(vault, "objetos"), { recursive: true });
    await writeFile(join(vault, "objetos", "carta-de-nabish.md"), SAMPLE, "utf8");

    const detail = await readAtlasV2EntityDetail(
      vault,
      "objeto",
      "carta-de-nabish",
    );

    expect(detail?.name).toBe("Carta de Nabish");
    expect(detail?.sections).toHaveLength(3);
  });

  it("retorna null cuando la entidad no existe", async () => {
    const vault = await mkdtemp(join(tmpdir(), "atlas-v2-content-"));
    cleanup.push(vault);

    await expect(
      readAtlasV2EntityDetail(vault, "misterio", "sin-rastro"),
    ).resolves.toBeNull();
  });

  it("acepta lugares para la ficha V2 generica", () => {
    const detail = parseAtlasV2EntityDetail(
      SAMPLE.replace("tipo: objeto", "tipo: lugar"),
      "lugar",
      "carta-de-nabish",
    );

    expect(detail.kind).toBe("lugar");
  });
});
