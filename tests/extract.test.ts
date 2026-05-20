// tests/extract.test.ts — extractLoreAction lee output/epNN.extraccion.json
// (extracción hecha a mano por Codex/Claude, sin API). node:fs mockeado.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const existsSync = vi.fn();
const readFileSync = vi.fn();

vi.mock("node:fs", () => {
  const api = {
    existsSync: (...a: unknown[]) => existsSync(...a),
    readFileSync: (...a: unknown[]) => readFileSync(...a),
  };
  return { ...api, default: api };
});

import { extractLoreAction } from "@/app/actions/extract";

const VALID = {
  personajes: [{ nombre: "Mysha", descripcion: "hace algo", alias: [] }],
  lugares: [], eventos: [], objetos: [], facciones: [],
  worldbuilding: [], misterios: [], quotes: [], decisiones: [],
  relaciones: [{ de: "Mysha", a: "Borok", tipo: "viaje", episodio: 99 }],
};

const ENV0 = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MOCK_EXTRACTION = "false";
});
afterEach(() => {
  process.env = { ...ENV0 };
});

describe("extractLoreAction · lee la extracción de Codex desde archivo", () => {
  it("MOCK_EXTRACTION=true devuelve datos simulados sin tocar el archivo", async () => {
    process.env.MOCK_EXTRACTION = "true";
    const r = await extractLoreAction("resumen", 1);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.personajes.length).toBeGreaterThan(0);
    expect(existsSync).not.toHaveBeenCalled();
  });

  it("lee y valida output/epNN.extraccion.json; normaliza el episodio", async () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(JSON.stringify(VALID));
    const r = await extractLoreAction("resumen", 7, "Título");
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.personajes[0].nombre).toBe("Mysha");
      // normalizeExtraction fuerza el episodio de las relaciones
      expect(r.data.relaciones[0].episodio).toBe(7);
    }
  });

  it("falla con error claro si el archivo no existe", async () => {
    existsSync.mockReturnValue(false);
    const r = await extractLoreAction("resumen", 8);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toMatch(/Falta output\/ep08\.extraccion\.json/);
  });

  it("falla si el archivo no es JSON válido", async () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue("{ esto no es json");
    const r = await extractLoreAction("resumen", 9);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toMatch(/no es JSON válido/);
  });

  it("falla si el JSON no pasa el schema Zod", async () => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(JSON.stringify({ personajes: "x" }));
    const r = await extractLoreAction("resumen", 10);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).toMatch(/no pasó validación Zod/);
      expect(r.rawJson).toBeDefined();
    }
  });
});
