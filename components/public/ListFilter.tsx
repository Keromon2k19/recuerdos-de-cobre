"use client";

// components/public/ListFilter.tsx — Grilla filtrable de fichas.
// Dos capas de filtro, ambas en cliente, instantáneas, sin red:
//   1. Texto libre por nombre/descripción (insensible a acentos).
//   2. Facetas agrupadas en dropdowns colapsados (rol, facción, etc.).
// Dentro de un grupo los valores son OR; entre grupos es AND.

import { useMemo, useState } from "react";
import Link from "next/link";

export type FacetOption = { value: string; label: string; count: number };
export type FacetGroup = { key: string; label: string; options: FacetOption[] };

export type ListItem = {
  slug: string;
  nombre: string;
  kicker: string;
  desc?: string;
  image?: string;
  imageAlt?: string;
  tags: string[];
  /** Por cada facet key, los valores que este ítem satisface. */
  facets: Record<string, string[]>;
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
  facets = [],
}: {
  items: ListItem[];
  segment: string;
  glyph: string;
  facets?: FacetGroup[];
}) {
  const [q, setQ] = useState("");
  // active[groupKey] = valores seleccionados de ese grupo
  const [active, setActive] = useState<Record<string, string[]>>({});

  const nq = norm(q.trim());

  const shown = useMemo(() => {
    return items.filter((it) => {
      if (nq) {
        const hit =
          norm(it.nombre).includes(nq) ||
          (it.desc ? norm(it.desc).includes(nq) : false);
        if (!hit) return false;
      }
      for (const g of facets) {
        const sel = active[g.key];
        if (!sel || sel.length === 0) continue;
        const vals = it.facets[g.key] ?? [];
        // OR dentro del grupo
        if (!sel.some((v) => vals.includes(v))) return false;
      }
      return true;
    });
  }, [items, nq, facets, active]);

  const activeCount = Object.values(active).reduce(
    (n, arr) => n + arr.length,
    0
  );

  function toggleValue(groupKey: string, value: string) {
    setActive((prev) => {
      const cur = prev[groupKey] ?? [];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return { ...prev, [groupKey]: next };
    });
  }

  function clearAll() {
    setActive({});
    setQ("");
  }

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

      {facets.length > 0 && (
        <div className="list-facets">
          {facets.map((g) => {
            const sel = active[g.key] ?? [];
            return (
              <details className="meta-drop" name="list-facet" key={g.key}>
                <summary>
                  <span>{g.label}</span>
                  {sel.length > 0 && <b>{sel.length}</b>}
                </summary>
                <div className="meta-pop facet-pop">
                  {g.options.map((opt) => {
                    const checked = sel.includes(opt.value);
                    return (
                      <label
                        className="facet-opt"
                        key={opt.value}
                        data-checked={checked}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleValue(g.key, opt.value)}
                        />
                        <span className="facet-opt-label">{opt.label}</span>
                        <span className="facet-opt-count">{opt.count}</span>
                      </label>
                    );
                  })}
                </div>
              </details>
            );
          })}
          {activeCount > 0 && (
            <button type="button" className="facet-clear" onClick={clearAll}>
              Limpiar
              <span>{activeCount}</span>
            </button>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="empty">
          <p className="e-title">Sin coincidencias</p>
          <p>
            {activeCount > 0
              ? "Ningún registro cumple esos filtros."
              : "Probá con otro término."}
          </p>
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
                {it.image ? (
                  <img src={it.image} alt={it.imageAlt || it.nombre} loading="lazy" />
                ) : (
                  <div className="ph" data-glyph={glyph} aria-hidden="true" />
                )}
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
