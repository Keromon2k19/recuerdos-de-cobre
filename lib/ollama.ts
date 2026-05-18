// lib/ollama.ts — Extracción de lore con Ollama LOCAL (gratis, sin nube).
// Proveedor primario deseado por GOAL.md para la extracción estructurada.
// Mismo contrato que lib/gemini.ts: resumen curado -> ExtractionResult
// validado con Zod. El resumen NO pasa por acá (lo hace Codex/Claude a
// mano); Ollama solo estructura el lore.
//
// Config por env (todo opcional, con defaults sanos):
//   OLLAMA_HOST   default http://localhost:11434
//   OLLAMA_MODEL  default llama3.1
//
// Usa la API nativa de Ollama (/api/chat) con "structured outputs":
// `format` = JSON Schema, así el modelo devuelve JSON conforme al schema.

import { SYSTEM_PROMPT, buildUserMessage } from "./prompts";
import {
  ExtractionResultSchema,
  extractionJsonSchema,
  normalizeExtraction,
} from "./schema";
import type { ExtractionResult } from "./types";

const HOST = (process.env.OLLAMA_HOST?.trim() || "http://localhost:11434").replace(/\/$/, "");
const MODEL = process.env.OLLAMA_MODEL?.trim() || "llama3.1";

// Los modelos locales pueden tardar; damos margen amplio.
const GEN_TIMEOUT_MS = 180_000;
const PING_TIMEOUT_MS = 1_500;

/**
 * Resuelve el $ref raíz que emite zod-to-json-schema a un JSON Schema
 * plano, conservando `definitions` para que los $ref internos sigan
 * resolviendo. Ollama acepta JSON Schema estándar (no hay que filtrar
 * keywords como con Gemini).
 */
function ollamaSchema(): unknown {
  const js = extractionJsonSchema as Record<string, unknown>;
  const ref = typeof js.$ref === "string" ? js.$ref : null;
  const defs = js.definitions as Record<string, unknown> | undefined;
  if (ref && defs) {
    const name = ref.replace("#/definitions/", "");
    const root = defs[name] as Record<string, unknown> | undefined;
    if (root) return { ...root, definitions: defs };
  }
  return js;
}

/**
 * @returns true si hay un servidor Ollama respondiendo en OLLAMA_HOST.
 * Se usa para el modo "auto": preferir local y, si no está, caer a Gemini.
 */
export async function ollamaReachable(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
    const res = await fetch(`${HOST}/api/tags`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

async function chatJSON(
  userMessage: string,
  temperature: number
): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEN_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: ollamaSchema(),
        options: { temperature },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `${userMessage}\n\nDevolvé ÚNICAMENTE un objeto JSON válido conforme al schema. Sin texto adicional, sin markdown.`,
          },
        ],
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `No se pudo contactar a Ollama en ${HOST} (modelo ${MODEL}): ${msg}`
    );
  }
  clearTimeout(timer);

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Ollama respondió ${res.status} (modelo ${MODEL}). ${detail.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const content = data.message?.content?.trim();
  if (!content) throw new Error("Ollama no devolvió contenido");

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(
      `Ollama devolvió JSON inválido (primeros 500 chars):\n${content.slice(0, 500)}`
    );
  }
}

/**
 * Extrae lore estructurado de un resumen usando Ollama local.
 * Equivalente funcional a extractLoreWithGemini, gratis y sin nube.
 */
export async function extractLoreWithOllama(
  resumen: string,
  numeroEpisodio: number,
  titulo?: string
): Promise<ExtractionResult> {
  const parsed = await chatJSON(
    buildUserMessage(resumen, numeroEpisodio, titulo),
    0.2
  );
  const validation = ExtractionResultSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(
      `Output de Ollama no pasó validación: ${validation.error.message}`
    );
  }
  return normalizeExtraction(validation.data, numeroEpisodio);
}

/**
 * Reintento determinista (temperatura 0) informando el error de validación.
 */
export async function retryExtractLoreWithOllama(
  resumen: string,
  numeroEpisodio: number,
  errorMessage: string,
  titulo?: string
): Promise<ExtractionResult> {
  const base = buildUserMessage(resumen, numeroEpisodio, titulo);
  const parsed = await chatJSON(
    `${base}\n\nIMPORTANTE: El intento anterior falló con este error de validación:\n${errorMessage}\n\nCorregí el output para que pase la validación.`,
    0
  );
  const validation = ExtractionResultSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(
      `Reintento de Ollama también falló: ${validation.error.message}`
    );
  }
  return normalizeExtraction(validation.data, numeroEpisodio);
}
