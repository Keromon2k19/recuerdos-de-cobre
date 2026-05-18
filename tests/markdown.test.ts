import { describe, it, expect } from "vitest";
import {
  parseMarkdown,
  serializeMarkdown,
  buildEpisodeMarkdown,
  updateEntityMarkdown,
} from "@/lib/markdown";
import type { Episodio } from "@/lib/types";

describe("parseMarkdown + serializeMarkdown roundtrip", () => {
  it("preserva frontmatter y body", () => {
    const original = `---
tipo: personaje
nombre: "Mysha"
alias:
  - "la bruja roja"
apariciones:
  - 3
  - 7
---

## Menciones por episodio

### Ep. 3
- Mysha aparece por primera vez.
`;

    const parsed = parseMarkdown(original);
    expect(parsed.frontmatter.tipo).toBe("personaje");
    expect(parsed.frontmatter.nombre).toBe("Mysha");
    expect(parsed.frontmatter.alias).toEqual(["la bruja roja"]);
    expect(parsed.body).toContain("## Menciones por episodio");
    expect(parsed.body).toContain("Mysha aparece por primera vez");
  });

  it("genera un roundtrip funcional", () => {
    const fm = { tipo: "personaje", nombre: "Io", apariciones: [5] };
    const body = "## Menciones\n- Es un familiar.";
    const serialized = serializeMarkdown(fm, body);
    const reparsed = parseMarkdown(serialized);

    expect(reparsed.frontmatter.tipo).toBe("personaje");
    expect(reparsed.frontmatter.nombre).toBe("Io");
    expect(reparsed.body).toContain("## Menciones");
    expect(reparsed.body).toContain("Es un familiar.");
  });
});

describe("buildEpisodeMarkdown", () => {
  it("genera markdown válido con frontmatter y secciones", () => {
    const ep: Episodio = {
      numero: 67,
      titulo: "La hoguera",
      procesado: "2026-05-13T14:22:00Z",
      resumen_original: "Un resumen de prueba",
      extraido: {
        personajes: [{ nombre: "Mysha", descripcion: "Recita el conjuro", alias: [] }],
        lugares: [{ nombre: "Bosque de Espinas", descripcion: "Escenario" }],
        eventos: [],
        objetos: [],
        facciones: [],
        worldbuilding: [],
        relaciones: [],
        misterios: ["¿Quién dejó la nota?"],
        quotes: [{ texto: "Que el humo recuerde", autor: "Mysha" }],
        decisiones: [],
      },
    };

    const md = buildEpisodeMarkdown(ep);
    const parsed = parseMarkdown(md);

    expect(parsed.frontmatter.tipo).toBe("episodio");
    expect(parsed.frontmatter.numero).toBe(67);
    expect(parsed.body).toContain("## Resumen");
    expect(parsed.body).toContain("Un resumen de prueba");
    expect(parsed.body).toContain("**[[Mysha]]**");
    expect(parsed.body).toContain("**[[Bosque de Espinas]]**");
    expect(parsed.body).toContain("¿Quién dejó la nota?");
    expect(parsed.body).toContain("Que el humo recuerde");
  });
});

describe("updateEntityMarkdown", () => {
  it("crea una entidad nueva si no existe", () => {
    const result = updateEntityMarkdown(
      null,
      { tipo: "personaje", nombre: "Io", alias: ["familiar"], relaciones: [] },
      5,
      "El despertar",
      "Io aparece como familiar"
    );

    const parsed = parseMarkdown(result);
    expect(parsed.frontmatter.tipo).toBe("personaje");
    expect(parsed.frontmatter.nombre).toBe("Io");
    expect(parsed.frontmatter.alias).toEqual(["familiar"]);
    expect((parsed.frontmatter.apariciones as number[])).toContain(5);
    expect(parsed.body).toContain("Io aparece como familiar");
  });

  it("appendea una nueva mención a entidad existente", () => {
    const existing = `---
tipo: personaje
nombre: "Mysha"
alias: []
apariciones:
  - 3
ultima_actualizacion: "2026-01-01T00:00:00Z"
---

## Menciones por episodio

### [[003-inicio|Ep. 3 — Inicio]]
- Mysha aparece por primera vez.
`;

    const result = updateEntityMarkdown(
      existing,
      { tipo: "personaje", nombre: "Mysha" },
      7,
      "La travesía",
      "Mysha cruza el bosque"
    );

    const parsed = parseMarkdown(result);
    expect((parsed.frontmatter.apariciones as number[])).toEqual([3, 7]);
    expect(parsed.body).toContain("Mysha aparece por primera vez");
    expect(parsed.body).toContain("Mysha cruza el bosque");
  });
});
