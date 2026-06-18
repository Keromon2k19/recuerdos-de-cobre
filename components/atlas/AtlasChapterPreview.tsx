"use client";

// components/atlas/AtlasChapterPreview.tsx
// Panel derecho: card de preview del capítulo seleccionado.
//
// Estructura:
//   título grande + "Continuar lectura →"
//   pergamino con descripción
//   meta grid (Fecha · Lugar · Personajes)
//   imagen panorámica de la escena

import { useEffect, useState } from "react";
import Link from "next/link";
import type { V2Chapter } from "@/data/atlas/chapters";

type Props = {
  chapter: V2Chapter;
};

const FALLBACK_SCENE = "/assets/atlas/scenes/_placeholder-scene.svg";

export default function AtlasChapterPreview({ chapter }: Props) {
  const [src, setSrc] = useState(chapter.imageSrc);

  // Resync cuando cambia el capítulo seleccionado.
  useEffect(() => {
    setSrc(chapter.imageSrc);
  }, [chapter.id, chapter.imageSrc]);

  function handleError() {
    if (src !== FALLBACK_SCENE) setSrc(FALLBACK_SCENE);
  }

  return (
    <article
      key={chapter.id}
      className="av2-chapter-preview av2-preview-fade-in"
      aria-label={`Capítulo ${chapter.numero}`}
    >
      <header className="av2-chapter-head">
        <div className="av2-chapter-head-top">
          <h2 className="av2-chapter-title">{chapter.titulo}</h2>
          <Link
            href={`/capitulos/${chapter.numero}`}
            className="av2-chapter-link-more"
          >
            Continuar lectura <span className="av2-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <div className="av2-chapter-resumen-body">
        {chapter.descripcion && (
          <p className="av2-chapter-summary">{chapter.descripcion}</p>
        )}

        <div className="av2-chapter-resumen-details">
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
          </dl>

          <div className="av2-chapter-resumen-media">
            <div className="av2-chapter-scene">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" onError={handleError} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

