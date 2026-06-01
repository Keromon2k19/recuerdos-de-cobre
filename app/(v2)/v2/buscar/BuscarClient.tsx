"use client";

// app/(v2)/v2/buscar/BuscarClient.tsx
// Búsqueda global cross-entity. Input grande + filter chips + lista de resultados.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  getAllSearchable,
  search,
  KIND_LABELS,
  KIND_GLYPHS,
  type EntityKind,
  type SearchResult,
} from "@/lib/atlas-v2-search";

const KIND_FILTERS: Array<EntityKind | null> = [
  null,
  "personaje",
  "capitulo",
  "archivo",
  "region",
];

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="5" />
      <path d="M11.8 11.8L15.5 15.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BuscarClient() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<EntityKind | null>(null);

  const all = useMemo(() => getAllSearchable(), []);
  const results = useMemo(() => search(query, kind, all), [query, kind, all]);

  const showEmpty = query.trim() === "" && kind === null;

  return (
    <div className="av2-buscar-wrap">
      {/* Buscador principal */}
      <div className="av2-buscar-input">
        <span className="av2-buscar-input-icon" aria-hidden="true">
          <IconSearch />
        </span>
        <input
          type="search"
          autoFocus
          placeholder="Buscar personajes, capítulos, lugares, archivos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar en el archivo"
        />
        {query && (
          <button
            type="button"
            className="av2-buscar-clear"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtros por tipo */}
      <div className="av2-buscar-filters" role="group" aria-label="Filtrar por tipo">
        {KIND_FILTERS.map((k) => (
          <button
            key={k ?? "all"}
            type="button"
            className="av2-buscar-filter"
            data-active={kind === k ? "true" : undefined}
            onClick={() => setKind(k)}
          >
            {k ? `${KIND_GLYPHS[k]} ${KIND_LABELS[k]}` : "Todos"}
          </button>
        ))}
      </div>

      {/* Contador / estado */}
      <div className="av2-buscar-meta">
        {showEmpty
          ? `Buscá entre ${all.length} entradas del archivo.`
          : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`}
      </div>

      {/* Lista de resultados */}
      {!showEmpty && (
        results.length === 0 ? (
          <div className="av2-empty">
            <span className="av2-empty-glyph" aria-hidden="true">◈</span>
            <p>Sin coincidencias para "{query}".</p>
          </div>
        ) : (
          <ul className="av2-buscar-results" role="list">
            {results.map((r) => (
              <SearchResultRow key={r.id} result={r} />
            ))}
          </ul>
        )
      )}
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
