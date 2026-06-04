"use client";

// components/atlas-v2/AtlasRegionInfo.tsx
// Panel inferior con informacion del lugar seleccionado.

import Link from "next/link";
import type { V2Region } from "@/data/atlas-v2/locations";

type Props = {
  region: V2Region;
};

const META_LABELS: Array<[keyof V2Region["meta"], string]> = [
  ["gobierno", "Gobierno"],
  ["poblacion", "Poblacion"],
  ["industria", "Industria principal"],
  ["influencia", "Nivel de influencia"],
];

export default function AtlasRegionInfo({ region }: Props) {
  return (
    <aside className="av2-region-info" aria-label={`Informacion de ${region.nombre}`}>
      <div className="av2-region-info-thumb" aria-hidden="true">
        {region.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={region.imageSrc}
            alt=""
            className="av2-region-info-image"
          />
        ) : (
          <span className="av2-region-info-glyph">{region.glyph}</span>
        )}
      </div>

      <div className="av2-region-info-body">
        <p className="av2-region-info-kicker">{region.category}</p>
        <h2 className="av2-region-info-name">{region.nombre}</h2>
        <p className="av2-region-info-tagline">{region.tagline}</p>
        <p className="av2-region-info-desc">{region.descripcion}</p>
        <Link
          href={`/v2/lugares/${region.slug}`}
          className="av2-region-info-cta"
          aria-label={`Ver ${region.nombre}`}
        >
          Ver lugar
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M5 12h14M13 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>

      <dl className="av2-region-info-meta">
        {META_LABELS.map(([key, label]) => (
          <div key={key} className="av2-region-info-meta-row">
            <dt>{label}</dt>
            <dd>{region.meta[key]}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
