"use client";

// app/(v2)/v2/mapa/MapaClient.tsx
// Layout: lista izq + mapa centro (flex:1) + drawer derecho con info del lugar.
// El drawer se abre automáticamente al seleccionar un lugar; el toggle permite cerrarlo
// para que el mapa ocupe todo el ancho disponible.

import { useEffect, useState } from "react";
import AtlasRegionList from "@/components/atlas-v2/AtlasRegionList";
import AtlasMapViewer from "@/components/atlas-v2/AtlasMapViewer";
import AtlasRegionInfo from "@/components/atlas-v2/AtlasRegionInfo";
import { runAtlasViewTransition } from "@/components/atlas-v2/AtlasViewTransitions";
import type { V2Region } from "@/data/atlas-v2/locations";

export default function MapaClient({
  regions,
  additionSlugs = [],
}: {
  regions: V2Region[];
  additionSlugs?: string[];
}) {
  const [selectedSlug, setSelectedSlug] = useState<string>(regions[0]?.slug ?? "");
  const [infoOpen, setInfoOpen] = useState<boolean>(true);
  const selected = regions.find((r) => r.slug === selectedSlug) ?? regions[0];

  // Re-abrir el drawer cuando se selecciona un nuevo lugar
  useEffect(() => {
    if (selectedSlug) setInfoOpen(true);
  }, [selectedSlug]);

  function clearSelection() {
    runAtlasViewTransition(() => {
      setSelectedSlug("");
      setInfoOpen(false);
    }, "state-place");
  }

  function selectRegion(slug: string) {
    if (slug === selectedSlug && infoOpen) return;
    runAtlasViewTransition(() => {
      setSelectedSlug(slug);
      setInfoOpen(true);
    }, "state-place");
  }

  if (!selected) {
    return <div className="av2-empty"><p>Sin regiones disponibles.</p></div>;
  }

  return (
    <div className="av2-mapa-layout">
      <AtlasRegionList
        regions={regions}
        selectedSlug={selected.slug}
        onSelect={selectRegion}
      />
      <div className={`av2-mapa-main av2-mapa-main--row ${infoOpen ? "is-info-open" : ""}`}>
        <div className="av2-mapa-canvas">
          <AtlasMapViewer
            regions={regions}
            additionSlugs={additionSlugs}
            selectedSlug={selectedSlug || null}
            onSelect={selectRegion}
            onClearSelection={clearSelection}
          />
        </div>

        <button
          type="button"
          className="av2-mapa-info-toggle"
          onClick={() => {
            runAtlasViewTransition(() => {
              setInfoOpen((v) => !v);
            }, "state-place");
          }}
          aria-label={infoOpen ? "Cerrar panel de información" : "Abrir panel de información"}
          aria-expanded={infoOpen}
          aria-controls="mapa-info-drawer"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d={infoOpen ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <aside
          id="mapa-info-drawer"
          className="av2-mapa-info-drawer"
          aria-hidden={!infoOpen}
        >
          <AtlasRegionInfo region={selected} />
        </aside>
      </div>
    </div>
  );
}
