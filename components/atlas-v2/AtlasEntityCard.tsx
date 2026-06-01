"use client";

// components/atlas-v2/AtlasEntityCard.tsx
// Card de personaje estilo "trading card" del códice.
//
// Hallazgos del análisis de personajes-reference.png:
// - Portrait 3:4, ocupa toda la card (no padding alrededor de la imagen)
// - Nombre serif + rol/epíteto en cobre pequeño, overlay con gradiente al pie
// - Border 1px sutil cobre-oscuro; estado activo: cobre más brillante
// - Sin nested boxes — la imagen ES la card, solo agrega overlay + border
// - Tactile feedback en :active (taste-skill): translate-y(-1px)

import { useState } from "react";
import type { V2Character } from "@/data/atlas-v2/characters";

type Props = {
  entity: V2Character;
  active?: boolean;
  onClick?: () => void;
};

const PLACEHOLDERS = [
  "/assets/atlas-v2/portraits/_placeholder-1.svg",
  "/assets/atlas-v2/portraits/_placeholder-2.svg",
  "/assets/atlas-v2/portraits/_placeholder-3.svg",
  "/assets/atlas-v2/portraits/_placeholder-4.svg",
] as const;

/** Hash estable del slug → índice 0..N-1. Determinístico, sin random. */
function placeholderFor(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return PLACEHOLDERS[h % PLACEHOLDERS.length];
}

export default function AtlasEntityCard({ entity, active, onClick }: Props) {
  // Cadena de fallback: imagen real → placeholder por hash → (CSS gradient si todo falla)
  const [src, setSrc] = useState(entity.imageSrc);
  const fallback = placeholderFor(entity.slug);

  function handleError() {
    if (src !== fallback) setSrc(fallback);
  }

  return (
    <button
      type="button"
      className="av2-card"
      data-active={active ? "true" : undefined}
      onClick={onClick}
      aria-pressed={active ?? false}
      aria-label={`${entity.nombre}${entity.rol ? ` — ${entity.rol}` : ""}`}
    >
      <div className="av2-card-portrait">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="av2-card-img"
          onError={handleError}
          loading="lazy"
        />
        <div className="av2-card-overlay">
          <span className="av2-card-name">{entity.nombre}</span>
          {entity.epiteto ? (
            <span className="av2-card-kicker">{entity.epiteto}</span>
          ) : (
            <span className="av2-card-kicker">{entity.rol}</span>
          )}
        </div>
      </div>
    </button>
  );
}
