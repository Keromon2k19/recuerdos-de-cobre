"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  search,
  KIND_LABELS,
  KIND_GLYPHS,
  SEARCH_KINDS,
  type EntityKind,
  type SearchResult,
} from "@/lib/atlas-v2-search";

const KIND_FILTERS: Array<EntityKind | null> = [null, ...SEARCH_KINDS];

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="5" />
      <path d="M11.8 11.8L15.5 15.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BuscarClient({ items }: { items: SearchResult[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<EntityKind | null>(null);

  const results = useMemo(() => search(query, kind, items), [query, kind, items]);
  const suggestions = useMemo(
    () =>
      SEARCH_KINDS.flatMap((searchKind) => {
        const match = items.find((item) => item.kind === searchKind);
        return match ? [match] : [];
      }),
    [items],
  );
  const showDiscovery = query.trim() === "" && kind === null;

  return (
    <div className="av2-buscar-wrap">
      <div className="av2-buscar-input">
        <span className="av2-buscar-input-icon" aria-hidden="true">
          <IconSearch />
        </span>
        <input
          type="search"
          autoFocus
          placeholder="Buscar personajes, capitulos, lugares, objetos, misterios..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar en el atlas"
        />
        {query && (
          <button
            type="button"
            className="av2-buscar-clear"
            onClick={() => setQuery("")}
            aria-label="Limpiar busqueda"
          >
            x
          </button>
        )}
      </div>

      <div className="av2-buscar-filters" role="group" aria-label="Filtrar por tipo">
        {KIND_FILTERS.map((filterKind) => (
          <button
            key={filterKind ?? "all"}
            type="button"
            className="av2-buscar-filter"
            data-active={kind === filterKind ? "true" : undefined}
            onClick={() => setKind(filterKind)}
          >
            {filterKind
              ? `${KIND_GLYPHS[filterKind]} ${KIND_LABELS[filterKind]}`
              : "Todos"}
          </button>
        ))}
      </div>

      <div className="av2-buscar-meta">
        {showDiscovery
          ? `Explora ${items.length} entradas del atlas.`
          : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`}
      </div>

      {showDiscovery && suggestions.length > 0 && (
        <section className="av2-buscar-discovery" aria-label="Rutas sugeridas">
          <div className="av2-buscar-discovery-head">
            <span>Rutas sugeridas</span>
            <strong>{suggestions.length} puertas de entrada</strong>
          </div>
          <ul className="av2-buscar-results" role="list">
            {suggestions.map((result) => (
              <SearchResultRow key={result.id} result={result} />
            ))}
          </ul>
        </section>
      )}

      {!showDiscovery &&
        (results.length === 0 ? (
          <div className="av2-empty">
            <span className="av2-empty-glyph" aria-hidden="true">◇</span>
            <p>Sin coincidencias para "{query}".</p>
          </div>
        ) : (
          <ul className="av2-buscar-results" role="list">
            {results.map((result) => (
              <SearchResultRow key={result.id} result={result} />
            ))}
          </ul>
        ))}
    </div>
  );
}

function SearchResultRow({ result }: { result: SearchResult }) {
  return (
    <li className="av2-buscar-result">
      <Link href={result.href} className="av2-buscar-result-link">
        <span className="av2-buscar-result-glyph" aria-hidden="true">
          {KIND_GLYPHS[result.kind]}
        </span>
        <div className="av2-buscar-result-body">
          <div className="av2-buscar-result-head">
            <span className="av2-buscar-result-kind">{KIND_LABELS[result.kind]}</span>
            <h3 className="av2-buscar-result-title">{result.titulo}</h3>
          </div>
          <p className="av2-buscar-result-sub">{result.subtitulo}</p>
          <p className="av2-buscar-result-snippet">{result.snippet}</p>
        </div>
        <span className="av2-buscar-result-arrow" aria-hidden="true">→</span>
      </Link>
    </li>
  );
}
