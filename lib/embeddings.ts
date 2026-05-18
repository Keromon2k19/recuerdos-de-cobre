// lib/embeddings.ts — Embeddings con Gemini text-embedding-004 (free tier).
// Usado para búsqueda semántica sobre el vault. Costo: $0.

import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBED_MODEL = "gemini-embedding-001"; // estable, free tier

/**
 * Embebe un texto y devuelve el vector (768 floats).
 * taskType ajusta el embedding según uso: documento vs query.
 */
export async function embedText(
  apiKey: string,
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: EMBED_MODEL });
  // El SDK acepta taskType en embedContent vía el request object.
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text: text.slice(0, 8000) }] },
    taskType: taskType as never,
  });
  return result.embedding.values;
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
