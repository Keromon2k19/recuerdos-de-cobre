"use client";

// components/atlas-v2/AtlasRegionList.tsx
// Lista lateral de lugares para /v2/lugares y /v2/mapa.

import type { V2Region } from "@/data/atlas-v2/locations";

type Props = {
  regions: V2Region[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

export default function AtlasRegionList({ regions, selectedSlug, onSelect }: Props) {
  return (
    <aside className="av2-region-list" aria-label="Lugares del mundo">
      <div className="av2-region-list-head">Lugares registrados</div>

      <ul className="av2-region-list-items">
        {regions.map((r) => (
          <li key={r.slug}>
            <button
              type="button"
              className="av2-region-item"
              data-active={selectedSlug === r.slug ? "true" : undefined}
              data-tone={r.tone}
              onClick={() => onSelect(r.slug)}
              aria-pressed={selectedSlug === r.slug}
            >
              <span className="av2-region-item-glyph" aria-hidden="true">{r.glyph}</span>
              <span className="av2-region-item-text">
                <span className="av2-region-item-name">{r.nombre}</span>
                <span className="av2-region-item-tagline">{r.tagline}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="av2-region-list-foot">
        {regions.length} lugares visibles
      </div>
    </aside>
  );
}
