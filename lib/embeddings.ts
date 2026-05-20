// lib/embeddings.ts — Embeddings con OpenAI para búsqueda semántica del vault.
//
// Config por env:
//   OPENAI_API_KEY     (requerida; la pasa el caller)
//   OPENAI_EMBED_MODEL default "text-embedding-3-small" (1536 dims, barato)
//
// El modelo queda registrado en el índice (_search-index.json → `model`);
// si cambia, build-search-index.ts re-embebe todo (las dims no son
// compatibles entre modelos).

import OpenAI from "openai";

export const EMBED_MODEL =
  process.env.OPENAI_EMBED_MODEL?.trim() || "text-embedding-3-small";

/**
 * Embebe un texto y devuelve el vector (1536 floats con el modelo default).
 * OpenAI usa el mismo modelo para query y documento (no hay taskType).
 */
export async function embedText(
  apiKey: string,
  text: string
): Promise<number[]> {
  const client = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 3 });
  const res = await client.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000),
  });
  const vec = res.data[0]?.embedding;
  if (!vec || vec.length === 0) {
    throw new Error("OpenAI no devolvió embedding");
  }
  return vec;
}

/** Similitud coseno entre dos vectores de igual dimensión. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Tipos del índice de búsqueda ──────────────────────────────────────────

export type SearchIndexEntry = {
  tipo: string;
  slug: string;
  nombre: string;
  alias: string[];
  /** Fragmento textual indexado (para mostrar en resultados) */
  snippet: string;
  /** Vector embedding del contenido */
  embedding: number[];
};

export type SearchIndex = {
  model: string;
  built_at: string;
  entries: SearchIndexEntry[];
};
