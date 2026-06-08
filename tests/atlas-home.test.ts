import { describe, expect, it } from "vitest";
import {
  buildHomeChapterSlides,
  extractCastHighlights,
  extractEpisodeQuotes,
  extractImportantMoment,
} from "@/lib/atlas-home";

const body = [
  "## Resumen",
  "",
  "El grupo entra al Underdark con una urgencia imposible.",
  "",
  "## Cast del episodio",
  "",
  "- **Mysha / Selenne** rechaza negociar con la mente colmena y prepara el golpe decisivo.",
  "- **Layra** sostiene la conexion mas profunda y salva a Uthuk.",
  "- **Talisa Talashon / Tali** protege al grupo con auras y disipaciones.",
  "",
  "## Lore extraido",
  "",
  "### Quotes",
  '> "No estoy aqui para negociar. Te exijo el cristal." — Mysha',
  '> "La humanidad depende de esto." — Anora',
  "",
  "### Decisiones clave",
  "- Mysha rechaza la ultima negociacion de madre y exige el cristal de inmediato. ([[mysha|Mysha]], [[madre|Madre]])",
].join("\n");

describe("atlas home helpers", () => {
  it("extrae quotes, momento importante y cast desde el markdown del episodio", () => {
    expect(extractEpisodeQuotes(body)).toEqual([
      {
        text: "No estoy aqui para negociar. Te exijo el cristal.",
        author: "Mysha",
      },
      {
        text: "La humanidad depende de esto.",
        author: "Anora",
      },
    ]);

    expect(extractImportantMoment(body)).toBe(
      "Mysha rechaza la ultima negociacion de madre y exige el cristal de inmediato."
    );

    expect(extractCastHighlights(body)).toEqual([
      {
        key: "mysha",
        name: "Mysha",
        aliases: ["Selenne"],
        detail:
          "rechaza negociar con la mente colmena y prepara el golpe decisivo.",
      },
      {
        key: "layra",
        name: "Layra",
        aliases: [],
        detail: "sostiene la conexion mas profunda y salva a Uthuk.",
      },
      {
        key: "talisa-talashon",
        name: "Talisa Talashon",
        aliases: ["Tali"],
        detail: "protege al grupo con auras y disipaciones.",
      },
    ]);
  });

  it("arma slides newest-first con los ultimos cinco capitulos y quote asociada al cast", () => {
    const episodes = Array.from({ length: 6 }, (_, index) => {
      const numero = index + 1;
      return {
        numero,
        titulo:
          numero === 6
            ? "Recuerdos de Cobre 69: Mente Colmena"
            : `Recuerdos de Cobre ${numero}: Capitulo ${numero}`,
        filename: `${String(numero).padStart(3, "0")}.md`,
        procesado: "2026-05-23T00:00:00.000Z",
        image: `/images/episodios/ep${String(numero).padStart(2, "0")}.jpg`,
        menciones: {
          personajes: ["[[mysha|Mysha]]", "[[layra|Layra]]"],
        },
        descripcion: `Resumen ${numero}`,
      };
    });

    const slides = buildHomeChapterSlides({
      episodes,
      episodeBodies: new Map([[6, body]]),
      characters: [
        {
          nombre: "Mysha",
          slug: "mysha",
          apariciones: [1, 6],
          rol: "PJ",
          image: "/assets/atlas/portraits/mysha.png",
        },
        {
          nombre: "Layra",
          slug: "layra",
          apariciones: [6],
          rol: "PJ",
        },
      ],
    });

    expect(slides.map((slide) => slide.numero)).toEqual([6, 5, 4, 3, 2]);
    expect(slides[0]).toMatchObject({
      numero: 6,
      episodioLabel: "Episodio 69",
      titulo: "Mente Colmena",
      href: "/v2/capitulos/6",
      imageSrc: "/images/episodios/ep06.jpg",
      featured: {
        kind: "quote",
        text: "No estoy aqui para negociar. Te exijo el cristal.",
        author: "Mysha",
      },
    });
    expect(slides[0].cast[0]).toMatchObject({
      name: "Mysha",
      href: "/v2/personajes/mysha",
      role: "PJ",
      imageSrc: "/assets/atlas/portraits/mysha.png",
      quote: "No estoy aqui para negociar. Te exijo el cristal.",
    });
    expect(slides[1].featured.kind).toBe("moment");
  });
});
