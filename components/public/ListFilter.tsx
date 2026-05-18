"use client";

// components/public/ListFilter.tsx — Grilla filtrable de fichas. Filtro de
// texto liviano (cliente, instantáneo, sin red), insensible a acentos.
// Útil con listados grandes (objetos/worldbuilding son cientos).

import { useMemo, useState } from "react";
import Link from "next/link";

export type ListItem = {
  slug: string;
  nombre: string;
  kicker: string;
  desc?: string;
  tags: string[];
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default function ListFilter({
  items,
  segment,
  glyph,
}: {
  items: ListItem[];
  segment: string;
  glyph: string;
}) {
  const [q, setQ] = useState("");
  const nq = norm(q.trim());
  const shown = useMemo(() => {
    if (!nq) return items;
    return items.filter(
      (it) => norm(it.nombre).includes(nq) || (it.desc && norm(it.desc).includes(nq))
    );
  }, [items, nq]);

  return (
    <>
      <div className="list-tools">
        <input
          type="search"
          className="list-search"
          placeholder="Filtrar por nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Filtrar la lista"
        />
        <span className="list-count">
          {shown.length === items.length
            ? `${items.length}`
            : `${shown.length} / ${items.length}`}
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <p className="e-title">Sin coincidencias</p>
          <p>Probá con otro término.</p>
        </div>
      ) : (
        <div className="card-grid">
          {shown.map((it, i) => (
            <Link
              key={it.slug}
              href={`/${segment}/${it.slug}`}
              className="entity-card rise"
              style={{ "--i": Math.min(i, 14) } as React.CSSProperties}
            >
              <div className="portrait">
                <div className="ph" data-glyph={glyph} aria-hidden="true" />
              </div>
              <div className="body">
                <span className="kicker">{it.kicker}</span>
                <h3>{it.nombre}</h3>
                {it.desc && <p className="desc">{it.desc}</p>}
                {it.tags.length > 0 && (
                  <div className="tagrow">
                    {it.tags.map((t, j) => (
                      <span className="tag" key={j}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
