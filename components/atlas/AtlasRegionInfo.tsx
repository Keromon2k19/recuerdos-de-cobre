"use client";

// components/atlas/AtlasRegionInfo.tsx
// Panel inferior con informacion del lugar seleccionado.

import Link from "next/link";
import type { CSSProperties } from "react";
import type { V2Region } from "@/data/atlas/locations";

type Props = {
  region: V2Region;
  connections?: Array<{
    slug: string;
    nombre: string;
    imageSrc: string;
    relation: string;
    episode?: number;
  }>;
};

const META_LABELS: Array<[keyof V2Region["meta"], string]> = [
  ["gobierno", "Gobierno"],
  ["poblacion", "Poblacion"],
  ["industria", "Industria principal"],
  ["influencia", "Nivel de influencia"],
];

export default function AtlasRegionInfo({ region, connections = [] }: Props) {
  const imageStyle = {
    viewTransitionName: `av2-place-${region.slug}`,
  } as CSSProperties;

  return (
    <aside className="av2-region-info" aria-label={`Informacion de ${region.nombre}`}>
      <div className="av2-region-info-thumb" aria-hidden="true">
        {region.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={region.slug}
            src={region.imageSrc}
            alt=""
            className="av2-region-info-image"
            style={imageStyle}
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

        {connections.length > 0 && (
          <div className="av2-region-linked-chars">
            <h3 className="av2-region-linked-title">Personajes vinculados</h3>
            <ul className="av2-region-linked-list">
              {connections.map((conn, idx) => {
                const charLetter = conn.nombre.charAt(0).toUpperCase();
                return (
                  <li key={`${conn.slug}-${idx}`}>
                    <Link
                      href={`/personajes/${conn.slug}`}
                      className="av2-region-linked-char"
                      title={`${conn.nombre}: ${conn.relation}${conn.episode ? ` (Ep. ${conn.episode})` : ""}`}
                    >
                      {conn.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={conn.imageSrc}
                          alt=""
                          className="av2-region-linked-avatar"
                        />
                      ) : (
                        <span className="av2-region-linked-avatar-fallback">
                          {charLetter}
                        </span>
                      )}
                      <span>{conn.nombre}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Link
          href={`/lugares/${region.slug}`}
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
