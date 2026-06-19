"use server";

// app/actions/search.ts — Búsqueda semántica sobre el vault.
// Embebe la query con OpenAI y rankea por similitud coseno contra el índice.
// Fallback: si no hay índice o falla el embed, hace match por substring.

import fs from "node:fs/promises";
import path from "node:path";
import { embedText, cosineSimilarity, type SearchIndex } from "@/lib/embeddings";
import { publicVaultPath } from "@/lib/public-vault-path";

export type SearchHit = {
  tipo: string;
  slug: string;
  nombre: string;
  snippet: string;
  score: number;
};

export type SearchResult =
  | { success: true; hits: SearchHit[]; mode: "semantic" | "substring" }
  | { success: false; error: string };

let cachedIndex: SearchIndex | null = null;
let cachedAt = 0;

async function loadIndex(): Promise<SearchIndex | null> {
  const vaultPath = publicVaultPath();
  if (!vaultPath) return null;
  const indexPath = path.join(vaultPath, "_search-index.json");
  // Cache 30s para no leer el JSON (~1MB) en cada tecleo
  if (cachedIndex && Date.now() - cachedAt < 30_000) return cachedIndex;
  try {
    const raw = await fs.readFile(indexPath, "utf-8");
    cachedIndex = JSON.parse(raw) as SearchIndex;
    cachedAt = Date.now();
    return cachedIndex;
  } catch {
    return null;
  }
}

function substringSearch(index: SearchIndex, query: string): SearchHit[] {
  const q = query.toLowerCase().trim();
  return index.entries
    .map((e) => {
      const inName = e.nombre.toLowerCase().includes(q);
      const inAlias = e.alias.some((a) => a.toLowerCase().includes(q));
      const inSnippet = e.snippet.toLowerCase().includes(q);
      let score = 0;
      if (inName) score = 1;
      else if (inAlias) score = 0.85;
      else if (inSnippet) score = 0.5;
      return { tipo: e.tipo, slug: e.slug, nombre: e.nombre, snippet: e.snippet, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export async function searchAction(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (q.length < 2) return { success: true, hits: [], mode: "substring" };

  const index = await loadIndex();
  if (!index || index.entries.length === 0) {
    return {
      success: false,
      error:
        "No hay índice de búsqueda. Corré `npx tsx scripts/build-search-index.ts` para construirlo.",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { success: true, hits: substringSearch(index, q), mode: "substring" };
  }

  try {
    const qVec = await embedText(apiKey, q);
    const hits: SearchHit[] = index.entries
      .map((e) => ({
        tipo: e.tipo,
        slug: e.slug,
        nombre: e.nombre,
        snippet: e.snippet,
        score: cosineSimilarity(qVec, e.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    return { success: true, hits, mode: "semantic" };
  } catch {
    // Si OpenAI falla (rate limit, etc.) caemos a substring sin romper
    return { success: true, hits: substringSearch(index, q), mode: "substring" };
  }
}
