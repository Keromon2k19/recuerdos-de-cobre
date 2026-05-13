// lib/claude.ts — Cliente Anthropic con prompt caching y tool use
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompts";
import { ExtractionResultSchema, extractionJsonSchema } from "./schema";
import type { ExtractionResult } from "./types";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8000;

/**
 * Extrae lore estructurado de un resumen usando Claude.
 * Usa tool use para forzar output estructurado.
 */
export async function extractLore(
  apiKey: string,
  resumen: string,
  numeroEpisodio: number,
  titulo?: string
): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey });

  // El JSON Schema generado incluye un wrapper "definitions",
  // necesitamos extraer el schema real para la tool
  const rawSchema = extractionJsonSchema as Record<string, unknown>;
  const toolInputSchema =
    (rawSchema.definitions as Record<string, unknown>)?.ExtractionResult ??
    rawSchema;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0.2,
    system: [
      {
        type: "text" as const,
        text: SYSTEM_PROMPT,
        // cache_control enables prompt caching for repeated extractions
        cache_control: { type: "ephemeral" },
      } as Anthropic.TextBlockParam,
    ],
    tools: [
      {
        name: "registrar_lore",
        description:
          "Registra todo el lore extraído del resumen del episodio. Debés llamar esta tool con todos los datos encontrados.",
        input_schema: {
          type: "object" as const,
          ...(toolInputSchema as object),
        },
      },
    ],
    tool_choice: { type: "tool", name: "registrar_lore" },
    messages: [
      {
        role: "user",
        content: buildUserMessage(resumen, numeroEpisodio, titulo),
      },
    ],
  });

  // Extraer el tool_use del response
  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(
      "Claude no llamó a la tool registrar_lore. Respuesta inesperada."
    );
  }

  // Validar con zod
  const parsed = ExtractionResultSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(
      `Output de Claude no pasó validación: ${parsed.error.message}`
    );
  }

  return parsed.data;
}

/**
 * Reintenta extracción con temperature=0 y feedback del error.
 */
export async function retryExtractLore(
  apiKey: string,
  resumen: string,
  numeroEpisodio: number,
  errorMessage: string,
  titulo?: string
): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey });

  const rawSchema = extractionJsonSchema as Record<string, unknown>;
  const toolInputSchema =
    (rawSchema.definitions as Record<string, unknown>)?.ExtractionResult ??
    rawSchema;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    system: [
      {
        type: "text" as const,
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      } as Anthropic.TextBlockParam,
    ],
    tools: [
      {
        name: "registrar_lore",
        description:
          "Registra todo el lore extraído del resumen del episodio.",
        input_schema: {
          type: "object" as const,
          ...(toolInputSchema as object),
        },
      },
    ],
    tool_choice: { type: "tool", name: "registrar_lore" },
    messages: [
      {
        role: "user",
        content: `${buildUserMessage(resumen, numeroEpisodio, titulo)}\n\nIMPORTANTE: El intento anterior falló con este error de validación:\n${errorMessage}\n\nCorregí el output para que pase la validación.`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude no llamó a la tool en el reintento.");
  }

  const parsed = ExtractionResultSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(
      `Reintento también falló: ${parsed.error.message}\n\nJSON crudo:\n${JSON.stringify(toolUse.input, null, 2)}`
    );
  }

  return parsed.data;
}
