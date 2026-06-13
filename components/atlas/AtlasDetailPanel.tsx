"use client";

// components/atlas/AtlasDetailPanel.tsx
// Ficha de detalle del personaje seleccionado.
//
// Hallazgos del reference (ISADORA VAEL):
// Estructura vertical:
// 1. Portrait grande (mismo aspect 3:4 que las cards)
// 2. Eyebrow: NOMBRE PEQUEÑO en small-caps cobre
// 3. NOMBRE GRANDE en display serif (caps)
// 4. Subtitle: "Antagonista" en italic
// 5. Sección "ORIGEN" con 2-3 campos meta
// 6. Quote/cita en italic destacada (con comillas tipográficas)
// 7. Sección "BIOGRAFÍA" header + body
// 8. CTA al pie: "VER FICHA COMPLETA"
// 9. Cerrar (X) discreto arriba a la derecha

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { V2Character } from "@/data/atlas/characters";

const PLACEHOLDERS = [
  "/assets/atlas/portraits/_placeholder-1.svg",
  "/assets/atlas/portraits/_placeholder-2.svg",
  "/assets/atlas/portraits/_placeholder-3.svg",
  "/assets/atlas/portraits/_placeholder-4.svg",
] as const;

function placeholderFor(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return PLACEHOLDERS[h % PLACEHOLDERS.length];
}

type Props = {
  entity: V2Character;
  onClose: () => void;
};

export default function AtlasDetailPanel({ entity, onClose }: Props) {
  const [src, setSrc] = useState(entity.imageSrc);
  const fallback = placeholderFor(entity.slug);
  const imageStyle: CSSProperties | undefined =
    entity.imageFit || entity.imagePosition
      ? {
          objectFit: entity.imageFit,
          objectPosition: entity.imagePosition,
        }
      : undefined;

  // Resync cuando cambia la entidad seleccionada — si no, el panel sigue
  // mostrando el retrato anterior hasta que falle onError.
  useEffect(() => {
    setSrc(entity.imageSrc);
  }, [entity.imageSrc]);

  function handleError() {
    if (src !== fallback) setSrc(fallback);
  }

  return (
    <aside className="av2-detail" aria-label={`Ficha de ${entity.nombre}`}>
      <button
        type="button"
        className="av2-detail-close"
        onClick={onClose}
        aria-label="Cerrar ficha"
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
          <path d="M3 3L9 9M9 3L3 9" />
        </svg>
      </button>

      <div className="av2-detail-portrait">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" style={imageStyle} onError={handleError} />
      </div>

      <div className="av2-detail-head">
        <p className="av2-detail-eyebrow">{entity.nombre}</p>
        <h2 className="av2-detail-name">{entity.nombre}</h2>
        {entity.epiteto && (
          <p className="av2-detail-epiteto">{entity.epiteto}</p>
        )}
      </div>

      <div className="av2-detail-section">
        <h3 className="av2-detail-section-title">Origen</h3>
        <dl className="av2-detail-meta">
          {entity.region && (
            <>
              <dt>Región</dt>
              <dd>{entity.region}</dd>
            </>
          )}
          <dt>Rol</dt>
          <dd>{entity.rol}</dd>
          {entity.jugador && (
            <>
              <dt>Jugador</dt>
              <dd>{entity.jugador}</dd>
            </>
          )}
          {entity.facciones.length > 0 && (
            <>
              <dt>Facciones</dt>
              <dd>{entity.facciones.join(" · ")}</dd>
            </>
          )}
          <dt>Apariciones</dt>
          <dd>{entity.apariciones} episodios</dd>
        </dl>
      </div>

      <div className="av2-detail-section">
        <h3 className="av2-detail-section-title">Biografía</h3>
        <p className="av2-detail-bio">{entity.descripcion}</p>
      </div>

      <Link
        href={`/personajes/${entity.slug}`}
        className="av2-btn av2-btn--primary av2-detail-cta"
      >
        Ver ficha completa
      </Link>
    </aside>
  );
}
