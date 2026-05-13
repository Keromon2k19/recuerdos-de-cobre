import { describe, it, expect } from "vitest";
import { ExtractionResultSchema } from "@/lib/schema";

describe("ExtractionResultSchema", () => {
  it("acepta un payload válido completo", () => {
    const valid = {
      personajes: [
        { nombre: "Mysha", descripcion: "Protagonista, bruja roja", alias: ["la bruja roja"] },
      ],
      lugares: [{ nombre: "Bosque de Espinas", descripcion: "Bosque oscuro al sur" }],
      eventos: [{ nombre: "Ritual del Té", descripcion: "Primer ritual completo" }],
      objetos: [{ nombre: "Daga de Obsidiana", descripcion: "Arma ritual" }],
      facciones: [{ nombre: "Coven Rosa", descripcion: "Aquelarre de brujas" }],
      worldbuilding: [{ tema: "Magia de sangre", descripcion: "Sistema mágico basado en sangre" }],
      relaciones: [
        { de: "Mysha", a: "Selenne", tipo: "personalidad-compartida", episodio: 3 },
      ],
      misterios: ["¿Quién dejó la nota en el altar?"],
      quotes: [{ texto: "Que el humo recuerde lo que la sangre olvidó", autor: "Mysha" }],
      decisiones: [
        { descripcion: "Mysha decide completar el ritual", protagonistas: ["Mysha"] },
      ],
    };

    const result = ExtractionResultSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("acepta un payload con arrays vacíos", () => {
    const minimal = {
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
    };

    const result = ExtractionResultSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rechaza un personaje sin nombre", () => {
    const invalid = {
      personajes: [{ nombre: "", descripcion: "test" }],
      lugares: [],
      eventos: [],
      objetos: [],
      facciones: [],
      worldbuilding: [],
      relaciones: [],
      misterios: [],
      quotes: [],
      decisiones: [],
    };

    const result = ExtractionResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rechaza una relación sin episodio", () => {
    const invalid = {
      personajes: [],
      lugares: [],
      eventos: [],
      objetos: [],
      facciones: [],
      worldbuilding: [],
      relaciones: [{ de: "A", a: "B", tipo: "amigos" }],
      misterios: [],
      quotes: [],
      decisiones: [],
    };

    const result = ExtractionResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("agrega alias vacío por default si no viene", () => {
    const payload = {
      personajes: [{ nombre: "Io", descripcion: "Familiar" }],
      lugares: [],
      eventos: [],
      objetos: [],
      facciones: [],
      worldbuilding: [],
      relaciones: [],
      misterios: [],
      quotes: [],
      decisiones: [],
    };

    const result = ExtractionResultSchema.parse(payload);
    expect(result.personajes[0].alias).toEqual([]);
  });
});
