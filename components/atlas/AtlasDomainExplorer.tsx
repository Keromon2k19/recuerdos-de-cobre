"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AtlasEntitySummary } from "@/lib/atlas-content";
import AtlasEntityIndex from "./AtlasEntityIndex";
import AtlasNarrativeFrame from "./AtlasNarrativeFrame";
import AtlasSectionHero from "./AtlasSectionHero";

export type AtlasDomainVariant = "relic" | "mystery" | "world";

type Props = {
  items: AtlasEntitySummary[];
  variant: AtlasDomainVariant;
  indexLabel: string;
  detailBaseHref: string;
};

const VARIANT_COPY: Record<
  AtlasDomainVariant,
  { focusKicker: string; thirdLabel: string; thirdValue: string }
> = {
  relic: {
    focusKicker: "pieza catalogada",
    thirdLabel: "Custodia",
    thirdValue: "No registrada",
  },
  mystery: {
    focusKicker: "investigacion abierta",
    thirdLabel: "Estado",
    thirdValue: "Sin resolver",
  },
  world: {
    focusKicker: "concepto del mundo",
    thirdLabel: "Plano",
    thirdValue: "Registrado",
  },
};

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

function appearancesLabel(count: number): string {
  if (count <= 0) return "Sin apariciones";
  return `${count} ${count === 1 ? "aparicion" : "apariciones"}`;
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

  const copy = VARIANT_COPY[variant];

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
          label={`${indexLabel} · ${filtered.length}`}
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

      <AtlasNarrativeFrame variant="primary" className="av2-domain-expediente">
        <div className="av2-expediente-focus" key={selected.slug}>
          <AtlasSectionHero
            variant={selected.imageSrc ? "image" : "material"}
            imageSrc={selected.imageSrc}
            glyph={selected.glyph}
            alt={selected.name}
            eyebrow={`${selected.eyebrow} · ${copy.focusKicker}`}
            title={selected.name}
            description={
              selected.description ||
              "Este registro todavia no tiene una descripcion narrativa."
            }
            meta={appearancesLabel(selected.appearances)}
            layout="inline"
          />
        </div>

        <div className="av2-expediente-body">
          <dl className="av2-expediente-meta">
            <div>
              <dt>Apariciones</dt>
              <dd>{selected.appearances}</dd>
            </div>
            <div>
              <dt>Clasificacion</dt>
              <dd>{selected.eyebrow}</dd>
            </div>
            <div>
              <dt>{copy.thirdLabel}</dt>
              <dd>{copy.thirdValue}</dd>
            </div>
          </dl>

          <Link
            href={`${detailBaseHref}/${selected.slug}`}
            className="av2-btn av2-btn--primary av2-expediente-cta"
          >
            Abrir registro completo
          </Link>
        </div>
      </AtlasNarrativeFrame>
    </div>
  );
}
