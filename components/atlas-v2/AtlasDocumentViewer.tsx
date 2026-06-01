"use client";

// components/atlas-v2/AtlasDocumentViewer.tsx
// Visor central de documentos con busqueda local y paginacion.

import { useEffect, useState } from "react";
import type { V2Document } from "@/data/atlas-v2/archives";

const FALLBACK = "/assets/atlas-v2/documents/_placeholder-codex.svg";

type Props = {
  document: V2Document;
  search: string;
  onSearchChange: (value: string) => void;
  currentIndex: number;
  totalDocs: number;
  onPrev: () => void;
  onNext: () => void;
};

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L13.5 13.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2.5h8v11l-4-2.5-4 2.5z" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="4" cy="8" r="2" />
      <circle cx="12" cy="3.5" r="2" />
      <circle cx="12" cy="12.5" r="2" />
      <path d="M5.7 6.8L10.3 4.5M5.7 9.2L10.3 11.5" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v8M5 7.5L8 10.5l3-3" />
      <path d="M3 13.5h10" />
    </svg>
  );
}

export default function AtlasDocumentViewer({
  document: doc,
  search,
  onSearchChange,
  currentIndex,
  totalDocs,
  onPrev,
  onNext,
}: Props) {
  const [src, setSrc] = useState(doc.imageSrc);

  useEffect(() => {
    setSrc(doc.imageSrc);
  }, [doc.imageSrc]);

  function handleError() {
    if (src !== FALLBACK) setSrc(FALLBACK);
  }

  const atFirst = currentIndex <= 1;
  const atLast = currentIndex >= totalDocs;

  return (
    <section className="av2-document-viewer" aria-label="Visor de documento">
      <div className="av2-document-toolbar">
        <label className="av2-document-search">
          <span className="av2-document-search-icon" aria-hidden="true">
            <IconSearch />
          </span>
          <span className="av2-sr-only">Buscar en archivos</span>
          <input
            type="search"
            placeholder="Buscar en archivos..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        <div className="av2-document-toolbar-stat">
          <span>Vista</span>
          <strong>{currentIndex} de {totalDocs}</strong>
        </div>
        <div className="av2-document-toolbar-stat">
          <span>Estado</span>
          <strong>{doc.meta.clasificacion}</strong>
        </div>
      </div>

      <div className="av2-document-stage">
        <div className="av2-document-actions" aria-label="Acciones del documento">
          <button type="button" className="av2-document-action" aria-label="Marcar documento">
            <IconBookmark />
          </button>
          <button type="button" className="av2-document-action" aria-label="Descargar documento">
            <IconDownload />
          </button>
          <button type="button" className="av2-document-action" aria-label="Compartir documento">
            <IconShare />
          </button>
        </div>

        <figure className="av2-document-artwork">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" onError={handleError} />
        </figure>

        <div className="av2-document-stage-caption" aria-hidden="true">
          <span>{doc.eyebrow}</span>
          <strong>{doc.numero}</strong>
        </div>
      </div>

      <div className="av2-document-tags" aria-label="Etiquetas">
        {doc.tags.map((tag) => (
          <span key={tag} className="av2-document-tag">{tag}</span>
        ))}
      </div>

      <div className="av2-document-pagination">
        <button
          type="button"
          className="av2-document-pag-arrow"
          aria-label="Anterior"
          onClick={onPrev}
          disabled={atFirst}
        >
          &lt;
        </button>
        <span className="av2-document-pag-current">
          {currentIndex} / {totalDocs}
        </span>
        <button
          type="button"
          className="av2-document-pag-arrow"
          aria-label="Siguiente"
          onClick={onNext}
          disabled={atLast}
        >
          &gt;
        </button>
      </div>
    </section>
  );
}
