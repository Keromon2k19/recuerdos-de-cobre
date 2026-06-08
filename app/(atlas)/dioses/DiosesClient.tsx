"use client";

// app/(v2)/v2/dioses/DiosesClient.tsx
// Orquesta busqueda, alianza y seleccion del panteon V2.

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import type { V2DivineAlliance, V2God } from "@/data/atlas-v2/gods";

const ALL = "Todos" as const;

type AllianceFilter = typeof ALL | V2DivineAlliance;

type Props = {
  gods: V2God[];
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function GodSigil({
  god,
  className,
}: {
  god: V2God;
  className: string;
}) {
  return (
    <span className={className} data-tone={god.tone}>
      {god.symbolSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={god.symbolSrc} alt="" aria-hidden="true" />
      ) : (
        god.sigil
      )}
    </span>
  );
}

export default function DiosesClient({ gods }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(gods[0]?.slug ?? "");
  const [alliance, setAlliance] = useState<AllianceFilter>(ALL);
  const [search, setSearch] = useState("");

  const alliances = useMemo(
    () => [ALL, ...Array.from(new Set(gods.map((god) => god.alliance)))] as AllianceFilter[],
    [gods]
  );

  const filtered = useMemo(() => {
    const q = normalize(search.trim());

    return gods.filter((god) => {
      const byAlliance = alliance === ALL || god.alliance === alliance;
      if (!byAlliance) return false;

      if (!q) return true;
      const haystack = normalize(
        [
          god.nombre,
          god.titulo,
          god.alliance,
          god.estado,
          god.profile,
          god.tension,
          god.sacredSymbol,
          ...god.domains,
          ...god.principles,
          ...god.sacredPlaces.map((place) => `${place.nombre} ${place.detalle}`),
          ...god.linkedLore.map((link) => `${link.label} ${link.detail}`),
        ].join(" ")
      );
      return haystack.includes(q);
    });
  }, [alliance, gods, search]);

  const selected =
    filtered.find((god) => god.slug === selectedSlug) ??
    filtered[0] ??
    gods.find((god) => god.slug === selectedSlug) ??
    gods[0];

  if (!selected) {
    return (
      <div className="av2-empty">
        <p>No hay dioses disponibles.</p>
      </div>
    );
  }

  const pactCount = gods.filter((god) => god.alliance === "Pacto del Eclipse").length;
  const hiddenCount = gods.filter(
    (god) => god.alliance === "Figura velada" || god.estado.toLowerCase().includes("oculto")
  ).length;

  return (
    <div className="av2-dioses-layout">
      <aside className="av2-gods-index" aria-label="Indice de dioses">
        <div className="av2-gods-index-head">
          <span>Panteon registrado</span>
          <strong>{filtered.length}/{gods.length}</strong>
        </div>

        <label className="av2-gods-search">
          <span className="av2-gods-search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="8" cy="8" r="5" />
              <path d="M11.8 11.8L15.5 15.5" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar dios"
            aria-label="Buscar dios"
          />
        </label>

        <div className="av2-gods-tabs" aria-label="Alianzas divinas">
          {alliances.map((item) => (
            <button
              key={item}
              type="button"
              className="av2-gods-tab"
              data-active={alliance === item ? "true" : undefined}
              onClick={() => setAlliance(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <ul className="av2-gods-list" aria-label="Dioses">
          {filtered.map((god, index) => (
            <li key={god.slug}>
              <button
                type="button"
                className="av2-god-list-item"
                data-active={selected.slug === god.slug ? "true" : undefined}
                data-tone={god.tone}
                onClick={() => setSelectedSlug(god.slug)}
                aria-pressed={selected.slug === god.slug}
                style={{ "--i": index } as CSSProperties}
              >
                <GodSigil god={god} className="av2-god-list-sigil" />
                <span className="av2-god-list-text">
                  <span className="av2-god-list-name">{god.nombre}</span>
                  <span className="av2-god-list-meta">{god.titulo}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="av2-god-dossier" aria-label={`Archivo divino de ${selected.nombre}`}>
        <div className="av2-god-identity">
          <div className="av2-god-profile-art" data-tone={selected.tone} aria-hidden="true">
            <div className="av2-god-symbol">
              <span className="av2-god-symbol-orbit av2-god-symbol-orbit--outer" />
              <span className="av2-god-symbol-orbit av2-god-symbol-orbit--inner" />
              <span className="av2-god-symbol-needle av2-god-symbol-needle--vertical" />
              <span className="av2-god-symbol-needle av2-god-symbol-needle--horizontal" />
              <GodSigil god={selected} className="av2-god-symbol-core" />
            </div>
          </div>

          <div className="av2-god-profile-main">
            <p className="av2-god-kicker">{selected.alliance}</p>
            <h2>{selected.nombre}</h2>
            <p className="av2-god-title">{selected.titulo}</p>

            <blockquote className="av2-god-quote">
              <p>{selected.quote}</p>
            </blockquote>

            <p className="av2-god-copy">{selected.profile}</p>
          </div>
        </div>

        <div className="av2-god-archive">
          <div className="av2-god-archive-head">
            <p className="av2-god-kicker">Archivo divino</p>
            <h3>{selected.nombre}</h3>
          </div>

          <dl className="av2-god-detail-meta">
            <div>
              <dt>Estado</dt>
              <dd>{selected.estado}</dd>
            </div>
            <div>
              <dt>Simbolo</dt>
              <dd>{selected.sacredSymbol}</dd>
            </div>
          </dl>

          <section className="av2-god-detail-section">
            <h3>Principios</h3>
            <ol className="av2-god-principles">
              {selected.principles.map((principle) => (
                <li key={`${selected.slug}-${principle}`}>{principle}</li>
              ))}
            </ol>
          </section>

          <section className="av2-god-detail-section">
            <h3>Lugares sagrados</h3>
            <ul className="av2-god-places">
              {selected.sacredPlaces.map((place) => (
                <li key={`${selected.slug}-${place.nombre}`}>
                  <strong>{place.nombre}</strong>
                  <span>{place.detalle}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="av2-god-detail-section">
            <h3>Lecturas vinculadas</h3>
            <ul className="av2-god-links">
              {selected.linkedLore.map((link) => (
                <li key={`${selected.slug}-${link.label}`}>
                  {link.href ? <Link href={link.href}>{link.label}</Link> : <span>{link.label}</span>}
                  <small>{link.detail}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="av2-god-tension">
            <span>Tension narrativa</span>
            <p>{selected.tension}</p>
          </section>

          <section className="av2-god-domains" aria-label="Dominios">
            <div className="av2-god-section-head">
              <span>Dominios</span>
              <small>{selected.domains.length} registros</small>
            </div>
            <div className="av2-god-domain-grid">
              {selected.domains.map((domain) => (
                <span key={`${selected.slug}-${domain}`} className="av2-god-domain">
                  {domain}
                </span>
              ))}
            </div>
          </section>

          <footer className="av2-god-dossier-footer">
            <dl className="av2-god-detail-stats" aria-label="Resumen del panteon">
              <div>
                <dt>Pacto</dt>
                <dd>{pactCount}</dd>
              </div>
              <div>
                <dt>Velados</dt>
                <dd>{hiddenCount}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{gods.length}</dd>
              </div>
            </dl>

            <Link href={selected.primaryHref} className="av2-btn av2-btn--primary av2-god-cta">
              Ver entrada del archivo
            </Link>
          </footer>
        </div>
      </section>
    </div>
  );
}
