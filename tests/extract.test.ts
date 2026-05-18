// tests/extract.test.ts — Selector de proveedor de extracción
// (auto / ollama / gemini) con fallback. Gemini y Ollama mockeados.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const geminiExtract = vi.fn();
const geminiRetry = vi.fn();
const ollamaExtract = vi.fn();
const ollamaRetry = vi.fn();
const ollamaReachable = vi.fn();

vi.mock("@/lib/gemini", () => ({
  extractLoreWithGemini: (...a: unknown[]) => geminiExtract(...a),
  retryExtractLoreWithGemini: (...a: unknown[]) => geminiRetry(...a),
}));
vi.mock("@/lib/ollama", () => ({
  extractLoreWithOllama: (...a: unknown[]) => ollamaExtract(...a),
  retryExtractLoreWithOllama: (...a: unknown[]) => ollamaRetry(...a),
  ollamaReachable: () => ollamaReachable(),
}));
vi.mock("@/lib/config", () => ({ loadConfig: () => ({}) }));

import { extractLoreAction } from "@/app/actions/extract";

const EMPTY = {
  personajes: [], lugares: [], eventos: [], objetos: [], facciones: [],
  worldbuilding: [], relaciones: [], misterios: [], quotes: [], decisiones: [],
};

const ENV0 = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MOCK_EXTRACTION = "false";
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.EXTRACTION_PROVIDER;
  geminiExtract.mockResolvedValue({ ...EMPTY, misterios: ["g"] });
  ollamaExtract.mockResolvedValue({ ...EMPTY, misterios: ["o"] });
  ollamaReachable.mockResolvedValue(false);
});
afterEach(() => {
  process.env = { ...ENV0 };
});

describe("extractLoreAction · selector de proveedor", () => {
  it("MOCK_EXTRACTION=true devuelve datos simulados sin llamar modelos", async () => {
    process.env.MOCK_EXTRACTION = "true";
    const r = await extractLoreAction("resumen", 1);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.personajes.length).toBeGreaterThan(0);
    expect(geminiExtract).not.toHaveBeenCalled();
    expect(ollamaExtract).not.toHaveBeenCalled();
  });

  it("provider=gemini fuerza Gemini", async () => {
    process.env.EXTRACTION_PROVIDER = "gemini";
    const r = await extractLoreAction("resumen", 2);
    expect(r.success && r.data.misterios).toEqual(["g"]);
    expect(ollamaExtract).not.toHaveBeenCalled();
  });

  it("provider=ollama fuerza Ollama (sin fallback)", async () => {
    process.env.EXTRACTION_PROVIDER = "ollama";
    const r = await extractLoreAction("resumen", 3);
    expect(r.success && r.data.misterios).toEqual(["o"]);
    expect(geminiExtract).not.toHaveBeenCalled();
  });

  it("auto: usa Ollama cuando está disponible", async () => {
    ollamaReachable.mockResolvedValue(true);
    const r = await extractLoreAction("resumen", 4);
    expect(r.success && r.data.misterios).toEqual(["o"]);
    expect(geminiExtract).not.toHaveBeenCalled();
  });

  it("auto: cae a Gemini si Ollama está pero falla", async () => {
    ollamaReachable.mockResolvedValue(true);
    ollamaExtract.mockRejectedValue(new Error("No se pudo contactar a Ollama"));
    const r = await extractLoreAction("resumen", 5);
    expect(r.success && r.data.misterios).toEqual(["g"]);
    expect(geminiExtract).toHaveBeenCalledOnce();
  });

  it("auto: usa Gemini si Ollama no está disponible", async () => {
    ollamaReachable.mockResolvedValue(false);
    const r = await extractLoreAction("resumen", 6);
    expect(r.success && r.data.misterios).toEqual(["g"]);
    expect(ollamaExtract).not.toHaveBeenCalled();
  });

  it("reintenta Gemini ante error de validación", async () => {
    process.env.EXTRACTION_PROVIDER = "gemini";
    geminiExtract.mockRejectedValue(new Error("Output de Gemini no pasó validación: x"));
    geminiRetry.mockResolvedValue({ ...EMPTY, misterios: ["retry"] });
    const r = await extractLoreAction("resumen", 7);
    expect(r.success && r.data.misterios).toEqual(["retry"]);
    expect(geminiRetry).toHaveBeenCalledOnce();
  });
});
