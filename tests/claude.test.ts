// tests/claude.test.ts — Unit tests para lib/claude.ts con SDK mockeado
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock del SDK ANTES de importar el módulo bajo prueba
const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: createMock };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_opts: unknown) {}
  },
}));

// Importar después del mock
import { extractLore, retryExtractLore } from "@/lib/claude";

/** Helper: payload válido vacío que pasa el zod schema. */
function emptyExtraction() {
  return {
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
}

/** Helper: construye una respuesta del SDK con un único tool_use block. */
function toolUseResponse(input: unknown) {
  return {
    content: [
      {
        type: "tool_use",
        id: "toolu_1",
        name: "registrar_lore",
        input,
      },
    ],
  };
}

describe("extractLore", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("llama al SDK con la shape esperada (modelo, temperature, tool_choice, system con cache_control, tool registrar_lore)", async () => {
    createMock.mockResolvedValueOnce(toolUseResponse(emptyExtraction()));

    await extractLore("sk-test", "Resumen del episodio.", 1, "Piloto");

    expect(createMock).toHaveBeenCalledTimes(1);
    const args = createMock.mock.calls[0][0];

    // Modelo y parámetros básicos
    expect(args.model).toBe("claude-sonnet-4-6");
    expect(args.temperature).toBe(0.2);
    expect(args.max_tokens).toBeGreaterThanOrEqual(4096);

    // tool_choice forzando la tool
    expect(args.tool_choice).toEqual({ type: "tool", name: "registrar_lore" });

    // system es un array con cache_control ephemeral en el bloque
    expect(Array.isArray(args.system)).toBe(true);
    expect(args.system[0]).toMatchObject({
      type: "text",
      cache_control: { type: "ephemeral" },
    });
    expect(typeof args.system[0].text).toBe("string");
    expect(args.system[0].text.length).toBeGreaterThan(0);

    // Tool registrar_lore con input_schema object
    expect(Array.isArray(args.tools)).toBe(true);
    expect(args.tools).toHaveLength(1);
    expect(args.tools[0].name).toBe("registrar_lore");
    expect(args.tools[0].input_schema).toBeDefined();
    expect(args.tools[0].input_schema.type).toBe("object");
  });

  it("devuelve el input parseado del tool_use cuando el output es válido", async () => {
    const payload = {
      ...emptyExtraction(),
      personajes: [
        { nombre: "Mysha", descripcion: "Protagonista" },
      ],
    };
    createMock.mockResolvedValueOnce(toolUseResponse(payload));

    const result = await extractLore("sk-test", "resumen", 2);

    expect(result.personajes).toHaveLength(1);
    expect(result.personajes[0].nombre).toBe("Mysha");
    // El schema agrega alias=[] por default
    expect(result.personajes[0].alias).toEqual([]);
  });

  it("lanza error si la respuesta no contiene tool_use", async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: "text", text: "No quiero usar la tool" }],
    });

    await expect(extractLore("sk-test", "resumen", 3)).rejects.toThrow(
      /registrar_lore|tool|inesperada/i
    );
  });

  it("lanza error de validación si el input del tool_use no pasa el zod schema", async () => {
    // Falta la categoría 'decisiones' (entre otras) → validación falla
    const invalid = {
      personajes: [],
      lugares: [],
      eventos: [],
      objetos: [],
      facciones: [],
      worldbuilding: [],
      relaciones: [],
      misterios: [],
      quotes: [],
      // decisiones omitido a propósito
    };
    createMock.mockResolvedValueOnce(toolUseResponse(invalid));

    await expect(extractLore("sk-test", "resumen", 4)).rejects.toThrow(
      /validaci[oó]n/i
    );
  });
});

describe("retryExtractLore", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("usa temperature=0 y el mensaje de usuario incluye el error original", async () => {
    createMock.mockResolvedValueOnce(toolUseResponse(emptyExtraction()));

    const errorMsg = "personajes[0].nombre: String must contain at least 1 character(s)";
    await retryExtractLore("sk-test", "resumen", 5, errorMsg, "Reintento");

    expect(createMock).toHaveBeenCalledTimes(1);
    const args = createMock.mock.calls[0][0];

    expect(args.temperature).toBe(0);
    expect(args.tool_choice).toEqual({ type: "tool", name: "registrar_lore" });

    // El mensaje de usuario debe contener el errorMessage
    expect(Array.isArray(args.messages)).toBe(true);
    const userContent = args.messages[0].content as string;
    expect(typeof userContent).toBe("string");
    expect(userContent).toContain(errorMsg);
  });

  it("devuelve el input parseado en el reintento exitoso", async () => {
    const payload = {
      ...emptyExtraction(),
      lugares: [{ nombre: "Bosque de Espinas", descripcion: "Bosque oscuro" }],
    };
    createMock.mockResolvedValueOnce(toolUseResponse(payload));

    const result = await retryExtractLore("sk-test", "resumen", 6, "error previo");
    expect(result.lugares).toHaveLength(1);
    expect(result.lugares[0].nombre).toBe("Bosque de Espinas");
  });

  it("lanza error con marca 'JSON crudo' cuando el reintento también falla validación", async () => {
    const invalid = { personajes: [{ nombre: "X" }] }; // claramente incompleto
    createMock.mockResolvedValueOnce(toolUseResponse(invalid));

    await expect(
      retryExtractLore("sk-test", "resumen", 7, "error previo")
    ).rejects.toThrow(/JSON crudo/);
  });
});
