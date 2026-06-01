// lib/client-search.ts - Substring search del lado del cliente.
// Consume public/search-index.json (sin embeddings, ~50KB) y matchea
// contra nombre / alias / snippet. Misma logica de scoring que el
// fallback substring del server action; movida al cliente para evitar
// roundtrip en cada keystroke.

export type LiteEntry = {
  tipo: string;
  slug: string;
  nombre: string;
  alias: string[];
  snippet: string;
};

export type LiteIndex = {
  built_at: string;
  entries: LiteEntry[];
};

export type LiteHit = {
  tipo: string;
  slug: string;
  nombre: string;
  snippet: string;
  score: number;
};

export function substringSearchClient(
  index: LiteIndex,
  query: string,
  limit = 12
): LiteHit[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  const hits: LiteHit[] = [];
  for (const e of index.entries) {
    let score = 0;
    if (e.nombre.toLowerCase().includes(q)) score = 1;
    else if (e.alias.some((a) => a.toLowerCase().includes(q))) score = 0.85;
    else if (e.snippet.toLowerCase().includes(q)) score = 0.5;
    if (score > 0) {
      hits.push({
        tipo: e.tipo,
        slug: e.slug,
        nombre: e.nombre,
        snippet: e.snippet,
        score,
      });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
