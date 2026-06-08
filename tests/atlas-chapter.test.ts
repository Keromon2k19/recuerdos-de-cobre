import { describe, expect, it } from "vitest";
import { parseAtlasChapterDetail } from "@/lib/atlas-chapter";

const SAMPLE = `---
tipo: episodio
numero: 12
titulo: "Recuerdos de Cobre 12: La puerta"
procesado: "2026-05-20T10:00:00.000Z"
image: /images/episodios/ep12.jpg
menciones:
  personajes:
    - "[[mysha|Mysha]]"
    - "[[layra|Layra]]"
  lugares:
    - "[[lugares/khelgrim|Khelgrim]]"
  eventos:
    - "[[apertura-de-la-puerta|Apertura de la puerta]]"
  misterios: 2
  quotes: 1
  decisiones: 3
---

## Resumen

El grupo encuentra una puerta que no debería existir.

## Eventos

- La puerta se abre.

## Citas destacadas

> "No estaba aquí ayer." — Mysha

## Decisiones clave

- Entrar sin esperar refuerzos.
`;

describe("parseAtlasChapterDetail", () => {
  it("conserva la narrativa y expone eventos, citas y decisiones", () => {
    const chapter = parseAtlasChapterDetail(SAMPLE, 12);

    expect(chapter.title).toBe("Recuerdos de Cobre 12: La puerta");
    expect(chapter.description).toContain("puerta que no debería existir");
    expect(chapter.imageSrc).toBe("/images/episodios/ep12.jpg");
    expect(chapter.sections.map((section) => section.title)).toEqual([
      "Resumen",
      "Eventos",
      "Citas destacadas",
      "Decisiones clave",
    ]);
    expect(chapter.stats).toContainEqual({ label: "Personajes", value: 2 });
    expect(chapter.stats).toContainEqual({ label: "Misterios", value: 2 });
    expect(chapter.stats).toContainEqual({ label: "Citas", value: 1 });
    expect(chapter.stats).toContainEqual({ label: "Decisiones", value: 3 });
  });
});
