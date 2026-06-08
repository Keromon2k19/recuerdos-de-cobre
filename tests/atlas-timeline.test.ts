import { describe, expect, it } from "vitest";
import { buildTimelineItems } from "@/lib/atlas-timeline";

const episodes = [
  {
    numero: 3,
    titulo: "Recuerdos de Cobre 2, Parte 2: Bajo la Sombra del Tsunami",
    filename: "003.md",
    procesado: "",
    menciones: {
      personajes: ["[[mysha|Mysha]]", "[[borok|Borok]]"],
      lugares: ["[[lugares/metropolis-de-cobre|Metropolis de Cobre]]"],
    },
    descripcion: "De vuelta en el gremio.",
  },
  {
    numero: 1,
    titulo: "Recuerdos de Cobre 1: Un Voto de Confianza",
    filename: "001.md",
    procesado: "",
    menciones: {
      personajes: ["[[narcissa|Narcissa]]", "[[mysha|Mysha]]"],
      lugares: ["[[lugares/metropolis-de-cobre|Metropolis de Cobre]]"],
    },
    descripcion: "Seis desconocidos bajan del tren.",
  },
  {
    numero: 2,
    titulo: "Recuerdos de Cobre 2, Parte 1: Bajo la Sombra del Tsunami",
    filename: "002.md",
    procesado: "",
    menciones: {
      personajes: ["[[mysha|Mysha]]"],
      lugares: ["[[alcantarillas-antiguas|Alcantarillas antiguas]]"],
    },
    descripcion: "Tras los trogloditas.",
  },
];

const characters = [
  { nombre: "Mysha", slug: "mysha", rol: "PJ", apariciones: [] },
  { nombre: "Borok", slug: "borok", rol: "PJ", apariciones: [] },
  { nombre: "Narcissa", slug: "narcissa", rol: "PJ", apariciones: [] },
];

describe("buildTimelineItems", () => {
  it("ordena ascendente por episodio y parte", () => {
    const items = buildTimelineItems(episodes, characters);
    expect(items.map((item) => item.id)).toEqual(["1-0", "2-1", "2-2"]);
  });

  it("formatea el eyebrow con parte", () => {
    const items = buildTimelineItems(episodes, characters);
    expect(items[0].eyebrow).toBe("EPISODIO 1");
    expect(items[1].eyebrow).toBe("EPISODIO 2 - PARTE 1");
  });

  it("alterna los lados empezando por la izquierda", () => {
    const items = buildTimelineItems(episodes, characters);
    expect(items.map((item) => item.side)).toEqual(["left", "right", "left"]);
  });

  it("limpia el titulo y toma el primer lugar como ubicacion", () => {
    const items = buildTimelineItems(episodes, characters);
    expect(items[0].titulo).toBe("Un Voto de Confianza");
    expect(items[0].lugar).toBe("Metropolis de Cobre");
  });

  it("ordena personajes con iniciales y marca PJs", () => {
    const items = buildTimelineItems(episodes, characters);
    expect(items[0].personajes.map((personaje) => personaje.initial)).toEqual([
      "N",
      "M",
    ]);
    expect(items[0].personajes.every((personaje) => personaje.isPlayer)).toBe(
      true
    );
  });

  it("descarta descripciones que son solo headings markdown", () => {
    const items = buildTimelineItems(
      [{ ...episodes[1], descripcion: "## Cast del episodio" }],
      characters
    );

    expect(items[0].descripcion).toBe("");
  });

  it("separa numero visual de campana del numero interno de capitulo", () => {
    const items = buildTimelineItems(
      [
        {
          numero: 66,
          titulo: "Recuerdos de Cobre 53.5: Lore con tesito",
          filename: "066.md",
          menciones: {},
          descripcion: "Interludio de campana.",
        },
      ],
      characters
    );

    expect(items[0].numero).toBe(66);
    expect(items[0].displayNumero).toBe("53.5");
    expect(items[0].eyebrow).toBe("EPISODIO 53.5");
    expect(items[0].href).toBe("/capitulos/66");
  });

  it("asocia una imagen de lugar cuando la mencion coincide con el atlas", () => {
    const items = buildTimelineItems(episodes, characters, [
      {
        slug: "la-metropolis-cobre",
        name: "La Metropolis de Cobre",
        imageSrc: "/Lugares%20-%20planos/metropolis.webp",
      },
    ]);

    expect(items[0].placeSlug).toBe("la-metropolis-cobre");
    expect(items[0].placeImageSrc).toBe(
      "/Lugares%20-%20planos/metropolis.webp"
    );
    expect(items[0].placeImageAlt).toBe("La Metropolis de Cobre");
  });

  it("busca imagen en lugares secundarios si el primer lugar no tiene asset", () => {
    const items = buildTimelineItems(
      [
        {
          numero: 10,
          titulo: "Recuerdos de Cobre 10: Noche de prueba",
          filename: "010.md",
          menciones: {
            lugares: [
              "[[lugares/jardin-de-narcissa|Jardin de Narcissa]]",
              "[[lugares/la-metropolis-cobre|Metropolis de Cobre]]",
            ],
          },
          descripcion: "Un episodio con sublugar sin imagen propia.",
        },
      ],
      characters,
      [
        {
          slug: "la-metropolis-cobre",
          name: "La Metropolis de Cobre",
          imageSrc: "/metropolis.webp",
        },
      ]
    );

    expect(items[0].lugar).toBe("Jardin de Narcissa");
    expect(items[0].placeImageSrc).toBe("/metropolis.webp");
  });

  it("usa la ultima imagen conocida como fallback para no dejar cards vacias", () => {
    const items = buildTimelineItems(
      [
        {
          numero: 1,
          titulo: "Recuerdos de Cobre 1: Inicio",
          filename: "001.md",
          menciones: { lugares: ["[[la-metropolis-cobre|Metropolis de Cobre]]"] },
          descripcion: "Inicio.",
        },
        {
          numero: 2,
          titulo: "Recuerdos de Cobre 2: Interior sin foto",
          filename: "002.md",
          menciones: { lugares: ["[[casa-sin-imagen|Casa sin imagen]]"] },
          descripcion: "Continuacion.",
        },
      ],
      characters,
      [
        {
          slug: "la-metropolis-cobre",
          name: "La Metropolis de Cobre",
          imageSrc: "/metropolis.webp",
        },
      ]
    );

    expect(items[1].lugar).toBe("Casa sin imagen");
    expect(items[1].placeImageSrc).toBe("/metropolis.webp");
    expect(items[1].placeImageAlt).toBe("La Metropolis de Cobre");
  });
});
