"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AtlasV2EntitySummary } from "@/lib/atlas-v2-content";
import AtlasEntityIndex from "./AtlasEntityIndex";
import AtlasNarrativeFrame from "./AtlasNarrativeFrame";

export type AtlasDomainVariant = "relic" | "mystery" | "world";

type Props = {
  items: AtlasV2EntitySummary[];
  variant: AtlasDomainVariant;
  indexLabel: string;
  detailBaseHref: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function AtlasDomainExplorer({
  items,
  variant,
  indexLabel,
  detailBaseHref,
}: Props) {
  const [selectedSlug, setSelectedSlug] = useState(items[0]?.slug ?? "");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = normalize(query.trim());
    if (!normalized) return items;
    return items.filter((item) =>
      normalize(
        [item.name, item.eyebrow, item.description, item.meta].join(" "),
      ).includes(normalized),
    );
  }, [items, query]);

  const visibleLimit = variant === "world" ? 54 : 96;
  const visible = filtered.slice(0, visibleLimit);
  const selected =
    items.find((item) => item.slug === selectedSlug) ??
    visible[0] ??
    items[0];

  if (!selected) {
    return (
      <AtlasNarrativeFrame variant="primary">
        <div className="av2-domain-empty">
          <p>No hay registros disponibles en esta seccion.</p>
        </div>
      </AtlasNarrativeFrame>
    );
  }

  return (
    <div className="av2-domain-explorer" data-variant={variant}>
      <div className="av2-domain-index">
        <label className="av2-domain-search">
          <span>Buscar</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Filtrar ${indexLabel.toLowerCase()}`}
          />
        </label>
        <AtlasEntityIndex
          label={
            variant === "world"
              ? "Conceptos destacados"
              : `${indexLabel} · ${filtered.length}`
          }
          items={visible.map((item) => ({
            slug: item.slug,
            name: item.name,
            eyebrow: item.eyebrow,
            meta: item.meta,
            glyph: item.glyph,
          }))}
          selectedSlug={selected.slug}
          onSelect={setSelectedSlug}
        />
      </div>

      <AtlasNarrativeFrame
        variant="primary"
        className="av2-domain-stage-frame"
      >
        <DomainStage item={selected} variant={variant} />
      </AtlasNarrativeFrame>

      <AtlasNarrativeFrame
        eyebrow={selected.eyebrow}
        title={selected.name}
        variant="secondary"
        className="av2-domain-context"
      >
        <div className="av2-domain-context-body">
          <p className="av2-domain-context-description">
            {selected.description || "Este registro todavia no tiene una descripcion narrativa."}
          </p>
          <dl className="av2-domain-context-meta">
            <div>
              <dt>Apariciones</dt>
              <dd>{selected.appearances}</dd>
            </div>
            <div>
              <dt>Clasificacion</dt>
              <dd>{selected.eyebrow}</dd>
            </div>
            {variant === "relic" && (
              <div>
                <dt>Custodia</dt>
                <dd>No registrada</dd>
              </div>
            )}
          </dl>
          <Link
            href={`${detailBaseHref}/${selected.slug}`}
            className="av2-btn av2-btn--primary av2-domain-detail-link"
          >
            Abrir registro completo
          </Link>
        </div>
      </AtlasNarrativeFrame>
    </div>
  );
}

function DomainStage({
  item,
  variant,
}: {
  item: AtlasV2EntitySummary;
  variant: AtlasDomainVariant;
}) {
  if (variant === "mystery") {
    const appearances = Array.from(
      { length: Math.min(4, Math.max(1, item.appearances)) },
      (_, index) => index + 1,
    );
    return (
      <div className="av2-domain-stage av2-domain-stage--mystery">
        <div className="av2-mystery-lines" aria-hidden="true" />
        {appearances.map((number) => (
          <div
            key={number}
            className={`av2-mystery-clue av2-mystery-clue--${number}`}
          >
            <span>Pista {String(number).padStart(2, "0")}</span>
            <p>Una aparicion conecta este hilo con otro registro.</p>
          </div>
        ))}
        <div className="av2-mystery-question">
          <p>Investigacion abierta</p>
          <h2>{item.name}</h2>
          <span>{item.meta}</span>
        </div>
      </div>
    );
  }

  if (variant === "world") {
    return (
      <div className="av2-domain-stage av2-domain-stage--world">
        <div className="av2-world-ledger">
          <p className="av2-world-ledger-kicker">{item.eyebrow}</p>
          <h2>{item.name}</h2>
          <p>{item.description || "Registro de mundo pendiente de clasificar."}</p>
          <dl>
            <div>
              <dt>Apariciones</dt>
              <dd>{item.appearances}</dd>
            </div>
            <div>
              <dt>Archivo</dt>
              <dd>{item.meta || "Sin referencias"}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="av2-domain-stage av2-domain-stage--relic">
      <div className="av2-relic-rings" aria-hidden="true" />
      <div className="av2-relic-artifact">
        {item.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageSrc} alt={item.name} />
        ) : (
          <span aria-hidden="true">{item.glyph}</span>
        )}
      </div>
      <div className="av2-relic-caption">
        <p>{item.eyebrow}</p>
        <h2>{item.name}</h2>
        <span>{item.meta}</span>
      </div>
    </div>
  );
}
