"use client";

// components/atlas/AtlasChapterPreview.tsx
// Panel derecho: detalle del capítulo seleccionado.
//
// Estructura (basado en capitulos-reference.png):
//   eyebrow "CAPÍTULO XX"
//   título grande poético
//   imagen panorámica
//   descripción larga (2-3 párrafos)
//   meta grid (Fecha · Lugar · Personajes · Estado)
//   recompensas grid (4 íconos con valor)
//   CTA "Continuar lectura"

import { useEffect, useState } from "react";
import Link from "next/link";
import type { V2Chapter } from "@/data/atlas/chapters";
import AtlasEntityReader from "./AtlasEntityReader";

type Props = {
  chapter: V2Chapter;
};

const FALLBACK_SCENE = "/assets/atlas/scenes/_placeholder-scene.svg";

export default function AtlasChapterPreview({ chapter }: Props) {
  const [src, setSrc] = useState(chapter.imageSrc);
  const [activeTab, setActiveTab] = useState<"resumen" | "cronica">("resumen");

  // Resync cuando cambia el capítulo seleccionado.
  useEffect(() => {
    setSrc(chapter.imageSrc);
    setActiveTab("resumen"); // Resetea la pestaña al cambiar de capítulo
  }, [chapter.id, chapter.imageSrc]);

  function handleError() {
    if (src !== FALLBACK_SCENE) setSrc(FALLBACK_SCENE);
  }

  const hasNarrative = (chapter.sections?.length ?? 0) > 0;

  return (
    <article
      key={chapter.id}
      className="av2-chapter-preview av2-preview-fade-in"
      aria-label={`Capítulo ${chapter.numero}`}
    >
      <header className="av2-chapter-head">
        <p className="av2-chapter-eyebrow">{chapter.eyebrow}</p>
        <h2 className="av2-chapter-title">{chapter.titulo}</h2>
        {chapter.descripcion && activeTab === "resumen" && (
          <p className="av2-chapter-summary">{chapter.descripcion}</p>
        )}
      </header>

      {hasNarrative && (
        <nav className="av2-chapter-tabs" aria-label="Secciones del capítulo">
          <button
            type="button"
            className="av2-chapter-tab"
            data-active={activeTab === "resumen" ? "true" : undefined}
            onClick={() => setActiveTab("resumen")}
          >
            Resumen
          </button>
          <button
            type="button"
            className="av2-chapter-tab"
            data-active={activeTab === "cronica" ? "true" : undefined}
            onClick={() => setActiveTab("cronica")}
          >
            Crónica
          </button>
        </nav>
      )}

      {activeTab === "resumen" ? (
        <>
          <div className="av2-chapter-scene">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" onError={handleError} />
          </div>

          <dl className="av2-chapter-meta">
            {chapter.fecha && (
              <div className="av2-chapter-meta-row">
                <dt>Fecha</dt>
                <dd>{chapter.fecha}</dd>
              </div>
            )}
            {chapter.lugar && (
              <div className="av2-chapter-meta-row">
                <dt>Lugar</dt>
                <dd>{chapter.lugar}</dd>
              </div>
            )}
            {chapter.personajes.length > 0 && (
              <div className="av2-chapter-meta-row">
                <dt>Personajes</dt>
                <dd>{chapter.personajes.join(" · ")}</dd>
              </div>
            )}
            <div className="av2-chapter-meta-row">
              <dt>Estado</dt>
              <dd>{chapter.estado}</dd>
            </div>
          </dl>

          {(chapter.rewards?.length ?? 0) > 0 && (
            <section className="av2-chapter-rewards" aria-label="Recompensas desbloqueadas">
              <h3 className="av2-chapter-rewards-title">Recompensas desbloqueadas</h3>
              <div className="av2-chapter-rewards-grid">
                {chapter.rewards!.map((r) => (
                  <div key={r.key} className="av2-reward">
                    <span className="av2-reward-glyph" aria-hidden="true">{r.glyph}</span>
                    <span className="av2-reward-label">{r.label}</span>
                    <span className="av2-reward-value">{r.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <Link
            href={`/capitulos/${chapter.numero}`}
            className="av2-btn av2-btn--primary av2-chapter-cta"
          >
            Continuar lectura
          </Link>
        </>
      ) : (
        <div className="av2-chapter-reader-wrap">
          <AtlasEntityReader sections={chapter.sections ?? []} label="Narración" />
        </div>
      )}
    </article>
  );
}
