import { describe, expect, it } from "vitest";
import {
  SEARCH_KINDS,
  buildAtlasV2SearchIndex,
  search,
} from "@/lib/atlas-v2-search";

describe("atlas-v2-search", () => {
  const items = buildAtlasV2SearchIndex({
    episodes: [
      {
        numero: 12,
        titulo: "Recuerdos de Cobre 7: El Velo",
        descripcion: "El grupo cruza un umbral antiguo.",
        menciones: {
          lugares: [
            "[[lugares/metropolis-de-cobre|Metropolis de Cobre]]",
          ],
        },
      },
    ],
    entities: {
      personaje: [
        {
          nombre: "Mysha",
          slug: "mysha",
          apariciones: [1, 12],
          rol: "PJ",
          descripcion: "Bruja de sangre.",
        },
      ],
      objeto: [
        {
          nombre: "Carta de Nabish",
          slug: "carta-de-nabish",
          apariciones: [47, 50],
          categoria: "Reliquia",
          descripcion: "Abre un dominio fuera del tiempo.",
        },
      ],
      misterio: [
        {
          nombre: "Que oculta el Velo",
          slug: "que-oculta-el-velo",
          apariciones: [12],
          descripcion: "Una pregunta todavia abierta.",
        },
      ],
      mundo: [
        {
          nombre: "Plano etereo",
          slug: "plano-etereo",
          apariciones: [12],
          categoria: "Cosmologia",
          descripcion: "Reglas del plano espiritual.",
        },
      ],
    },
    gods: [
      {
        slug: "mystra",
        nombre: "Mystra",
        titulo: "Diosa de la magia",
        profile: "Custodia la trama arcana.",
        domains: ["Magia"],
      },
    ],
    regions: [
      {
        slug: "santuario-libres",
        nombre: "Santuario de los Libres",
        tagline: "Refugio central",
        descripcion: "Punto de encuentro.",
        category: "Refugio",
      },
    ],
  });

  it("no incluye Archivos entre los tipos buscables", () => {
    expect(SEARCH_KINDS).not.toContain("archivo");
    expect(items.some((item) => item.kind === ("archivo" as never))).toBe(false);
  });

  it("genera destinos V2 para todos los resultados", () => {
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.href.startsWith("/v2")).toBe(true);
    }
    expect(items.find((item) => item.titulo === "Carta de Nabish")?.href).toBe(
      "/v2/objetos/carta-de-nabish",
    );
    expect(items.find((item) => item.titulo === "Plano etereo")?.href).toBe(
      "/v2/mundo/plano-etereo",
    );
  });

  it("busca por texto y tipo sobre el indice construido", () => {
    expect(search("velo", null, items).map((item) => item.titulo)).toContain(
      "Que oculta el Velo",
    );
    expect(search("", "dios", items).map((item) => item.titulo)).toEqual([
      "Mystra",
    ]);
  });

  it("muestra etiquetas limpias para wikilinks de episodios", () => {
    const episode = items.find((item) => item.kind === "capitulo");

    expect(episode?.subtitulo).toBe("Registro 012 · Metropolis de Cobre");
    expect(episode?.subtitulo).not.toContain("[[");
  });
});
