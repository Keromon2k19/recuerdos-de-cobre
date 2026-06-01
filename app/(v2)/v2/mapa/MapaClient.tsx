"use client";

// app/(v2)/v2/mapa/MapaClient.tsx
// Orquesta selección de región. Layout: lista izq + mapa der + info debajo del mapa.

import { useState } from "react";
import AtlasRegionList from "@/components/atlas-v2/AtlasRegionList";
import AtlasMapViewer from "@/components/atlas-v2/AtlasMapViewer";
import AtlasRegionInfo from "@/components/atlas-v2/AtlasRegionInfo";
import type { V2Region } from "@/data/atlas-v2/locations";

export default function MapaClient({ regions }: { regions: V2Region[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string>(regions[0]?.slug ?? "");
  const selected = regions.find((r) => r.slug === selectedSlug) ?? regions[0];

  if (!selected) {
    return <div className="av2-empty"><p>Sin regiones disponibles.</p></div>;
  }

  return (
    <div className="av2-mapa-layout">
      <AtlasRegionList
        regions={regions}
        selectedSlug={selected.slug}
        onSelect={setSelectedSlug}
      />
      <div className="av2-mapa-main">
        <AtlasMapViewer
          regions={regions}
          selectedSlug={selected.slug}
          onSelect={setSelectedSlug}
        />
        <AtlasRegionInfo region={selected} />
      </div>
    </div>
  );
}
