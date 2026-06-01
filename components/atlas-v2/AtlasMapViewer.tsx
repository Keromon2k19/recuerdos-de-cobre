"use client";

// components/atlas-v2/AtlasMapViewer.tsx
// Visor de mapa con pins HTML overlay y controles de zoom.

import { useState } from "react";
import type { V2Region } from "@/data/atlas-v2/locations";

const MAP_SRC = "/mapa/eyira.webp";

type Props = {
  regions: V2Region[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

export default function AtlasMapViewer({ regions, selectedSlug, onSelect }: Props) {
  const [zoom, setZoom] = useState(1);

  function zoomIn() {
    setZoom((z) => Math.min(z + 0.2, 2.5));
  }

  function zoomOut() {
    setZoom((z) => Math.max(z - 0.2, 0.6));
  }

  function zoomReset() {
    setZoom(1);
  }

  return (
    <section className="av2-map-viewer" aria-label="Mapa del mundo">
      <div className="av2-map-stage">
        <div
          className="av2-map-canvas"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MAP_SRC}
            alt="Mapa de Eyira"
            className="av2-map-img"
          />

          {regions.map((r) => {
            const edge = r.pin.x > 82 ? "right" : r.pin.x < 18 ? "left" : undefined;

            return (
              <button
                key={r.slug}
                type="button"
                className="av2-map-pin"
                data-active={selectedSlug === r.slug ? "true" : undefined}
                data-edge={edge}
                data-tone={r.tone}
                style={{ left: `${r.pin.x}%`, top: `${r.pin.y}%` }}
                onClick={() => onSelect(r.slug)}
                aria-label={r.nombre}
              >
                <span className="av2-map-pin-dot" aria-hidden="true" />
                <span className="av2-map-pin-label">{r.nombre}</span>
              </button>
            );
          })}
        </div>

        <div className="av2-map-zoom" aria-label="Controles de zoom">
          <button type="button" className="av2-map-zoom-btn" onClick={zoomIn} aria-label="Acercar">+</button>
          <button type="button" className="av2-map-zoom-btn" onClick={zoomReset} aria-label="Reiniciar zoom">1x</button>
          <button type="button" className="av2-map-zoom-btn" onClick={zoomOut} aria-label="Alejar">-</button>
        </div>
      </div>
    </section>
  );
}
