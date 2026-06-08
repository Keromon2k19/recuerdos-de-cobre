"use client";

// app/(v2)/v2/facciones/FaccionesClient.tsx
// Orquesta busqueda, categoria y seleccion del tablero de facciones.

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { V2Faction, V2FactionCategory } from "@/data/atlas-v2/factions";

const ALL = "Todas" as const;

type CategoryFilter = typeof ALL | V2FactionCategory;

type Props = {
  factions: V2Faction[];
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function FactionMark({
  faction,
  className,
}: {
  faction: V2Faction;
  className: string;
}) {
  return (
    <span className={className} data-tone={faction.tono}>
      {faction.imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={faction.imageSrc} alt="" aria-hidden="true" />
      ) : (
        faction.sigil
      )}
    </span>
  );
}

export default function FaccionesClient({ factions }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(factions[0]?.slug ?? "");
  const [category, setCategory] = useState<CategoryFilter>(ALL);
  const [search, setSearch] = useState("");

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(factions.map((f) => f.categoria)))] as CategoryFilter[],
    [factions]
  );

  const filtered = useMemo(() => {
    const q = normalize(search.trim());

    return factions.filter((faction) => {
      const byCategory = category === ALL || faction.categoria === category;
      if (!byCategory) return false;

      if (!q) return true;
      const haystack = normalize(
        [
          faction.nombre,
          faction.categoria,
          faction.estado,
          faction.alcance,
          faction.descripcion,
          faction.foco,
          ...faction.tags,
          ...faction.figures.map((figure) => figure.nombre),
        ].join(" ")
      );
      return haystack.includes(q);
    });
  }, [category, factions, search]);

  const selected =
    filtered.find((faction) => faction.slug === selectedSlug) ??
    filtered[0] ??
    factions.find((faction) => faction.slug === selectedSlug) ??
    factions[0];

  if (!selected) {
    return (
      <div className="av2-empty">
        <p>No hay facciones disponibles.</p>
      </div>
    );
  }

  const covens = factions.filter((faction) => faction.categoria === "Coven").length;
  const threats = factions.filter((faction) => faction.tono === "threat").length;

  return (
    <div className="av2-facciones-layout">
      <aside className="av2-faction-index" aria-label="Indice de facciones">
        <div className="av2-faction-index-head">
          <span>Registro de poderes</span>
          <strong>{filtered.length}/{factions.length}</strong>
        </div>

        <label className="av2-faction-search">
          <span className="av2-faction-search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="8" cy="8" r="5" />
              <path d="M11.8 11.8L15.5 15.5" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar faccion"
            aria-label="Buscar faccion"
          />
        </label>

        <div className="av2-faction-tabs" aria-label="Categorias de facciones">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className="av2-faction-tab"
              data-active={category === item ? "true" : undefined}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <ul className="av2-faction-index-list" aria-label="Facciones">
          {filtered.map((faction) => (
            <li key={faction.slug}>
              <button
                type="button"
                className="av2-faction-index-item"
                data-active={selected.slug === faction.slug ? "true" : undefined}
                onClick={() => setSelectedSlug(faction.slug)}
                aria-pressed={selected.slug === faction.slug}
              >
                <FactionMark faction={faction} className="av2-faction-mini-sigil" />
                <span className="av2-faction-index-text">
                  <span className="av2-faction-index-name">{faction.nombre}</span>
                  <span className="av2-faction-index-meta">{faction.categoria}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="av2-faction-stage" aria-label="Tablero de influencia">
        <div className="av2-faction-stage-head">
          <div>
            <p className="av2-faction-kicker">Mapa politico</p>
            <h2>Influencias en movimiento</h2>
          </div>
          <dl className="av2-faction-stage-stats">
            <div>
              <dt>Covens</dt>
              <dd>{covens}</dd>
            </div>
            <div>
              <dt>Amenazas</dt>
              <dd>{threats}</dd>
            </div>
            <div>
              <dt>Registros</dt>
              <dd>{factions.length}</dd>
            </div>
          </dl>
        </div>

        <div className="av2-faction-network" role="list" aria-label="Facciones filtradas">
          {filtered.map((faction, index) => (
            <button
              key={faction.slug}
              type="button"
              className="av2-faction-node"
              data-active={selected.slug === faction.slug ? "true" : undefined}
              data-tone={faction.tono}
              onClick={() => setSelectedSlug(faction.slug)}
              style={{ "--i": index } as CSSProperties}
            >
              <FactionMark faction={faction} className="av2-faction-node-sigil" />
              <span className="av2-faction-node-body">
                <span className="av2-faction-node-name">{faction.nombre}</span>
                <span className="av2-faction-node-meta">{faction.estado} · {faction.apariciones} eps.</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <aside className="av2-faction-detail" aria-label={`Ficha de ${selected.nombre}`}>
        <FactionMark faction={selected} className="av2-faction-detail-mark" />

        <div className="av2-faction-detail-head">
          <p className="av2-faction-kicker">{selected.categoria}</p>
          <h2>{selected.nombre}</h2>
          {selected.foco && <p>{selected.foco}</p>}
        </div>

        <dl className="av2-faction-detail-meta">
          {selected.estado && (
            <div>
              <dt>Estado</dt>
              <dd>{selected.estado}</dd>
            </div>
          )}
          {selected.alcance && (
            <div>
              <dt>Alcance</dt>
              <dd>{selected.alcance}</dd>
            </div>
          )}
          <div>
            <dt>Apariciones</dt>
            <dd>{selected.apariciones} episodios</dd>
          </div>
        </dl>

        {selected.descripcion && (
          <section className="av2-faction-detail-section">
            <h3>Perfil</h3>
            <p>{selected.descripcion}</p>
          </section>
        )}

        {selected.figures.length > 0 && (
          <section className="av2-faction-detail-section">
            <h3>Figuras vinculadas</h3>
            <ul className="av2-faction-figures">
              {selected.figures.map((figure) => (
                <li key={`${selected.slug}-${figure.nombre}`}>
                  {figure.slug ? (
                    <Link href={`/personajes/${figure.slug}`}>{figure.nombre}</Link>
                  ) : (
                    <span>{figure.nombre}</span>
                  )}
                  <small>{figure.rol}</small>
                </li>
              ))}
            </ul>
          </section>
        )}

        {selected.relaciones.length > 0 && (
          <section className="av2-faction-detail-section">
            <h3>Lectura del archivo</h3>
            <ul className="av2-faction-relations">
              {selected.relaciones.map((relation) => (
                <li key={`${selected.slug}-${relation.label}`}>
                  <strong>{relation.label}</strong>
                  <span>{relation.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link href={`/facciones/${selected.slug}`} className="av2-btn av2-btn--primary av2-faction-cta">
          Ver ficha completa
        </Link>
      </aside>
    </div>
  );
}
