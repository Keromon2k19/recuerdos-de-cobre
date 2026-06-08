"use client";

// app/(v2)/v2/personajes/PersonajesClient.tsx
// Orquesta el estado de selección + filtros + composición de los 4 componentes.

import { useMemo, useState } from "react";
import AtlasEntityGrid from "@/components/atlas/AtlasEntityGrid";
import AtlasFilterPanel, {
  EMPTY_FILTERS,
  type FilterValue,
} from "@/components/atlas/AtlasFilterPanel";
import AtlasDetailPanel from "@/components/atlas/AtlasDetailPanel";
import { characterMatchesSearch } from "@/lib/atlas-character-search";
import type { V2Character } from "@/data/atlas/characters";

function aparicionBucket(n: number): string {
  if (n >= 30) return "Protagónico";
  if (n >= 10) return "Recurrente";
  if (n >= 1) return "Episódico";
  return "Mencionado";
}

const APARICION_OPTIONS = [
  "Protagónico",
  "Recurrente",
  "Episódico",
  "Mencionado",
];

export default function PersonajesClient({
  characters,
}: {
  characters: V2Character[];
}) {
  const [filters, setFilters] = useState<FilterValue>(EMPTY_FILTERS);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    characters[0]?.slug ?? null
  );

  const roles = useMemo(
    () =>
      Array.from(new Set(characters.map((c) => c.rol).filter(Boolean))).sort(),
    [characters]
  );
  const facciones = useMemo(
    () =>
      Array.from(new Set(characters.flatMap((c) => c.facciones))).sort(),
    [characters]
  );

  const filtered = useMemo(() => {
    let list = characters;
    if (filters.search) {
      list = list.filter((c) => characterMatchesSearch(c, filters.search));
    }
    if (filters.rol) list = list.filter((c) => c.rol === filters.rol);
    if (filters.faccion)
      list = list.filter((c) => c.facciones.includes(filters.faccion));
    if (filters.aparicion)
      list = list.filter(
        (c) => aparicionBucket(c.apariciones) === filters.aparicion
      );
    return list;
  }, [characters, filters]);

  const selected = useMemo(
    () =>
      selectedSlug
        ? characters.find((c) => c.slug === selectedSlug) ?? null
        : null,
    [characters, selectedSlug]
  );

  return (
    <div
      className="av2-personajes-layout"
      data-detail={selected ? "open" : "closed"}
    >
      <AtlasFilterPanel
        value={filters}
        onChange={setFilters}
        options={{
          roles,
          facciones,
          apariciones: APARICION_OPTIONS,
        }}
        totalCount={characters.length}
        filteredCount={filtered.length}
      />

      <section className="av2-personajes-main">
        <AtlasEntityGrid
          entities={filtered}
          selectedSlug={selectedSlug}
          onSelect={(slug) =>
            setSelectedSlug((prev) => (prev === slug ? null : slug))
          }
        />
      </section>

      {selected && (
        <AtlasDetailPanel
          entity={selected}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
