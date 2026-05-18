// lib/gemini.ts — Extracción de lore con Gemini (free tier).
// Reemplaza a Claude cuando el usuario no tiene créditos de Anthropic.
// Usa Gemini structured output via responseSchema (más simple que function calling).

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type Schema,
} from "@google/generative-ai";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompts";
import { ExtractionResultSchema, extractionJsonSchema } from "./schema";
import type { ExtractionResult } from "./types";

const MODEL = "gemini-2.5-flash";

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Convierte el schema generado por zod-to-json-schema a un formato aceptable
 * por Gemini. Las diferencias clave:
 *  - Remueve `$schema`, `$ref`, `definitions`, `additionalProperties`
 *  - Convierte type: "integer" → "integer" (igual)
 *  - Resuelve referencias inline si existen
 *  - Remueve `default` (Gemini a veces lo rechaza en deep schemas)
 */
function toGeminiSchema(jsonSchema: Record<string, unknown>): Schema {
  // Si tiene definitions + $ref a nivel root, resolver
  let working = jsonSchema;
  const refMatch = working.$ref && typeof working.$ref === "string" ? working.$ref : null;
  if (refMatch && working.definitions) {
    const defs = working.definitions as Record<string, unknown>;
    const refName = refMatch.replace("#/definitions/", "");
    working = (defs[refName] as Record<string, unknown>) ?? working;
  }

  // Gemini responseSchema solo acepta un subconjunto de OpenAPI/JSON-Schema.
  // Whitelist: cualquier otro keyword (exclusiveMinimum, minimum, maximum,
  // minLength, maxLength, minItems, pattern, const, default, $ref, etc.)
  // hace que Gemini rechace con 400 Bad Request. Por eso filtramos por
  // lista blanca en vez de lista negra — robusto ante lo que emita zod.
  const ALLOWED = new Set([
    "type",
    "description",
    "nullable",
    "enum",
    "items",
    "properties",
    "required",
    "format",
    "anyOf",
  ]);

  function clean(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(clean);
    if (node === null || typeof node !== "object") return node;
    const obj = node as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!ALLOWED.has(k)) continue;
      if (k === "properties") {
        // Los keys de `properties` son nombres de campo definidos por el usuario
        // (no keywords de JSON Schema), así que hay que preservarlos todos
        // y solo limpiar recursivamente sus valores.
        const props = v as Record<string, unknown>;
        const cleaned: Record<string, unknown> = {};
        for (const [propName, propSchema] of Object.entries(props)) {
          cleaned[propName] = clean(propSchema);
        }
        out[k] = cleaned;
      } else {
        out[k] = clean(v);
      }
    }
    return out;
  }

  return clean(working) as Schema;
}

/**
 * Extrae lore estructurado de un resumen usando Gemini con responseSchema.
 * Equivalente funcional a `extractLore` de lib/claude.ts pero gratis.
 */
export async function extractLoreWithGemini(
  apiKey: string,
  resumen: string,
  numeroEpisodio: number,
  titulo?: string
): Promise<ExtractionResult> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const rawSchema = extractionJsonSchema as Record<string, unknown>;
  const responseSchema = toGeminiSchema(rawSchema);

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const userMessage = buildUserMessage(resumen, numeroEpisodio, titulo);
  const result = await model.generateContent(userMessage);
  const jsonText = result.response.text();

  if (!jsonText?.trim()) {
    throw new Error("Gemini no devolvió texto");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      `Gemini devolvió JSON inválido (primeros 500 chars):\n${jsonText.slice(0, 500)}`
    );
  }

  const validation = ExtractionResultSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(
      `Output de Gemini no pasó validación: ${validation.error.message}`
    );
  }
  return validation.data;
}

/**
 * Reintento con temperatura 0 si el primer intento falló por validación.
 */
export async function retryExtractLoreWithGemini(
  apiKey: string,
  resumen: string,
  numeroEpisodio: number,
  errorMessage: string,
  titulo?: string
): Promise<ExtractionResult> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const rawSchema = extractionJsonSchema as Record<string, unknown>;
  const responseSchema = toGeminiSchema(rawSchema);

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const userMessage = `${buildUserMessage(resumen, numeroEpisodio, titulo)}\n\nIMPORTANTE: El intento anterior falló con este error de validación:\n${errorMessage}\n\nCorregí el output para que pase la validación.`;

  const result = await model.generateContent(userMessage);
  const jsonText = result.response.text();
  if (!jsonText?.trim()) throw new Error("Gemini no devolvió texto en reintento");

  const parsed = JSON.parse(jsonText);
  const validation = ExtractionResultSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(
      `Reintento también falló: ${validation.error.message}\n\nJSON crudo:\n${JSON.stringify(parsed, null, 2)}`
    );
  }
  return validation.data;
}
