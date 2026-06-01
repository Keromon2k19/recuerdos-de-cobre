"use client";

// components/atlas-v2/AtlasEntityGrid.tsx
// Grid de cards. Ancho de card FIJO via CSS auto-fill — la cantidad de
// columnas se ajusta al espacio disponible (más cuando no hay detail
// panel, menos cuando sí). El TAMAÑO de la card no cambia.

import AtlasEntityCard from "./AtlasEntityCard";
import type { V2Character } from "@/data/atlas-v2/characters";

type Props = {
  entities: V2Character[];
  selectedSlug?: string | null;
  onSelect?: (slug: string) => void;
};

export default function AtlasEntityGrid({
  entities,
  selectedSlug,
  onSelect,
}: Props) {
  if (entities.length === 0) {
    return (
      <div className="av2-grid-empty">
        <p>Ningún personaje coincide con esos filtros.</p>
      </div>
    );
  }

  return (
    <div className="av2-grid">
      {entities.map((e) => (
        <AtlasEntityCard
          key={e.id}
          entity={e}
          active={selectedSlug === e.slug}
          onClick={() => onSelect?.(e.slug)}
        />
      ))}
    </div>
  );
}
