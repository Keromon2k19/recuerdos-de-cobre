"use client";

// app/(v2)/v2/capitulos/CapitulosClient.tsx
// Orquesta selección de capítulo. Layout 2 columnas: lista + preview.

import { useState } from "react";
import AtlasChapterList from "@/components/atlas/AtlasChapterList";
import AtlasChapterPreview from "@/components/atlas/AtlasChapterPreview";
import type { V2Chapter } from "@/data/atlas/chapters";

export default function CapitulosClient({ chapters }: { chapters: V2Chapter[] }) {
  // Por defecto seleccionamos el capítulo más reciente (primero)
  const [selectedId, setSelectedId] = useState<string>(chapters[0]?.id ?? "");
  const selected = chapters.find((c) => c.id === selectedId) ?? chapters[0];

  if (!selected) {
    return (
      <div className="av2-empty">
        <p>No hay capítulos disponibles aún.</p>
      </div>
    );
  }

  return (
    <div className="av2-capitulos-layout">
      <AtlasChapterList
        chapters={chapters}
        selectedId={selected.id}
        onSelect={setSelectedId}
      />
      <AtlasChapterPreview chapter={selected} />
    </div>
  );
}
