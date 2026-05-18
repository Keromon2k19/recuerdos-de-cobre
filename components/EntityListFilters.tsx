"use client";

// components/EntityListFilters.tsx — Filtros y agrupación de entidades.
// Filtros como dropdowns (no chips sueltos). Group-by también como dropdown.

import { useState, useMemo } from "react";
import Link from "next/link";
import FilterDropdown, { type FilterOption } from "@/components/FilterDropdown";
import EmptyState from "@/components/EmptyState";
import type { EntityListItem } from "@/lib/vault";
import type { EntityType } from "@/lib/types";

// ─── Configuración por tipo ────────────────────────────────────────────────

type DimensionKey =
  | "rol"
  | "facciones"
  | "region"
  | "categoria"
  | "acto"
  | "jugador";

type FilterDimension = {
  key: DimensionKey;
  label: string;
  isArray?: boolean;
  valueLabels?: Record<string, string>;
  valueOrder?: string[];
};

type TypeConfig = {
  defaultGroupBy?: DimensionKey;
  dimensions: FilterDimension[];
};

const ROL_LABELS: Record<string, string> = {
  PJ: "PJ",
  NPC: "NPC",
  familiar: "Familiar",
  antagonista: "Antagonista",
};

const CATEGORIA_LABELS: Record<string, string> = {
  ciudad: "Ciudad",
  aldea: "Aldea",
  edificio: "Edificio",
  subterraneo: "Subterráneo",
  geografia: "Geografía",
  plano: "Plano",
  continente: "Continente",
  politica: "Política",
  coven: "Coven",
  gremio: "Gremio",
  militar: "Militar",
  banda: "Banda",
  evento: "Evento",
  dios_principal: "Dios principal",
  dios_secundario: "Dios secundario",
  entidad_planar: "Entidad planar",
  concepto: "Concepto",
  magia: "Magia",
  ritual: "Ritual",
  artefacto: "Artefacto",
  carta_tarot: "Carta de tarot",
  libro: "Libro",
  arma: "Arma",
  consumible: "Consumible",
  documento: "Documento",
};

const CONFIGS: Partial<Record<EntityType, TypeConfig>> = {
  personaje: {
    defaultGroupBy: "rol",
    dimensions: [
      {
        key: "rol",
        label: "Rol",
        valueLabels: ROL_LABELS,
        valueOrder: ["PJ", "NPC", "familiar", "antagonista"],
      },
      { key: "facciones", label: "Facción", isArray: true },
      { key: "region", label: "Región" },
    ],
  },
  lugar: {
    defaultGroupBy: "region",
    dimensions: [
      { key: "categoria", label: "Tipo", valueLabels: CATEGORIA_LABELS },
      { key: "region", label: "Región" },
    ],
  },
  faccion: {
    defaultGroupBy: "categoria",
    dimensions: [
      { key: "categoria", label: "Tipo", valueLabels: CATEGORIA_LABELS },
      { key: "region", label: "Región" },
    ],
  },
  worldbuilding: {
    defaultGroupBy: "categoria",
    dimensions: [
      {
        key: "categoria",
        label: "Tipo",
        valueLabels: CATEGORIA_LABELS,
        valueOrder: [
          "dios_principal",
          "dios_secundario",
          "entidad_planar",
          "concepto",
          "magia",
          "ritual",
        ],
      },
    ],
  },
  objeto: {
    defaultGroupBy: "categoria",
    dimensions: [{ key: "categoria", label: "Tipo", valueLabels: CATEGORIA_LABELS }],
  },
  evento: {
    defaultGroupBy: "acto",
    dimensions: [
      { key: "acto", label: "Acto" },
      { key: "region", label: "Región" },
    ],
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const UNCLASSIFIED = "__unclassified__";
const UNCLASSIFIED_LABEL = "Sin clasificar";

function getEntityValues(
  entity: EntityListItem,
  key: DimensionKey,
  isArray: boolean
): string[] {
  const raw = entity[key];
  if (raw === undefined || raw === null) return [UNCLASSIFIED];
  if (isArray) {
    if (Array.isArray(raw) && raw.length > 0) return raw.map(String);
    return [UNCLASSIFIED];
  }
  return [String(raw)];
}

function labelFor(value: string, dim: FilterDimension): string {
  if (value === UNCLASSIFIED) return UNCLASSIFIED_LABEL;
  return dim.valueLabels?.[value] ?? value;
}

function sortValues(values: string[], dim: FilterDimension): string[] {
  const order = dim.valueOrder ?? [];
  return [...values].sort((a, b) => {
    if (a === UNCLASSIFIED) return 1;
    if (b === UNCLASSIFIED) return -1;
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return labelFor(a, dim).localeCompare(labelFor(b, dim), "es");
  });
}

// ─── Componente ────────────────────────────────────────────────────────────

type Props = {
  tipo: EntityType;
  entities: EntityListItem[];
};

export default function EntityListFilters({ tipo, entities }: Props) {
  const config = CONFIGS[tipo];
  const dimensions = config?.dimensions ?? [];
  const defaultGroupBy = config?.defaultGroupBy ?? null;

  const [filters, setFilters] = useState<Record<string, string | null>>({});
  const [groupBy, setGroupBy] = useState<DimensionKey | null>(defaultGroupBy);

  const filtered = useMemo(() => {
    return entities.filter((e) => {
      for (const dim of dimensions) {
        const sel = filters[dim.key];
        if (!sel) continue;
        const values = getEntityValues(e, dim.key, !!dim.isArray);
        if (!values.includes(sel)) return false;
      }
      return true;
    });
  }, [entities, dimensions, filters]);

  // Para el dropdown de cada dimensión, las opciones se calculan SOBRE
  // las entidades ya filtradas por LAS OTRAS dimensiones — así los counts
  // reflejan lo que efectivamente se puede seleccionar (Linear-style).
  const optionsByDim = useMemo(() => {
    const map: Record<string, FilterOption[]> = {};
    for (const dim of dimensions) {
      const otherFiltered = entities.filter((e) => {
        for (const other of dimensions) {
          if (other.key === dim.key) continue;
          const sel = filters[other.key];
          if (!sel) continue;
          const values = getEntityValues(e, other.key, !!other.isArray);
          if (!values.includes(sel)) return false;
        }
        return true;
      });

      const counts = new Map<string, number>();
      for (const e of otherFiltered) {
        for (const v of getEntityValues(e, dim.key, !!dim.isArray)) {
          counts.set(v, (counts.get(v) ?? 0) + 1);
        }
      }

      const sorted = sortValues(Array.from(counts.keys()), dim);
      map[dim.key] = sorted.map((value) => ({
        value,
        label: labelFor(value, dim),
        count: counts.get(value) ?? 0,
      }));
    }
    return map;
  }, [entities, dimensions, filters]);

  const groups = useMemo(() => {
    if (!groupBy) {
      return [{ key: "__all__", label: null, items: filtered }];
    }
    const dim = dimensions.find((d) => d.key === groupBy);
    if (!dim) return [{ key: "__all__", label: null, items: filtered }];
    const map = new Map<string, EntityListItem[]>();
    for (const e of filtered) {
      const values = getEntityValues(e, dim.key, !!dim.isArray);
      for (const v of values) {
        if (!map.has(v)) map.set(v, []);
        map.get(v)!.push(e);
      }
    }
    const sorted = sortValues(Array.from(map.keys()), dim);
    return sorted.map((k) => ({
      key: k,
      label: labelFor(k, dim),
      items: map.get(k)!,
    }));
  }, [filtered, groupBy, dimensions]);

  function handleClearAll() {
    setFilters({});
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasGroupByDimension = dimensions.length > 0;

  // Resumen textual de los filtros activos (no chips): "Rol: PJ · Region: Cobre"
  const activeSummary = dimensions
    .map((dim) => {
      const sel = filters[dim.key];
      if (!sel) return null;
      return `${dim.label}: ${labelFor(sel, dim)}`;
    })
    .filter(Boolean)
    .join(" · ");

  if (!config || entities.length === 0) {
    return <SimpleGrid tipo={tipo} entities={entities} />;
  }

  const groupByOptions: FilterOption[] = dimensions.map((d) => ({
    value: d.key,
    label: d.label,
  }));

  return (
    <>
      <div className="filter-bar">
        <div className="filter-bar-group">
          {dimensions.map((dim) => (
            <FilterDropdown
              key={dim.key}
              label={dim.label}
              options={optionsByDim[dim.key] ?? []}
              value={filters[dim.key] ?? null}
              onChange={(v) =>
                setFilters((prev) => ({ ...prev, [dim.key]: v }))
              }
              placeholder="Todas"
            />
          ))}
        </div>

        {hasGroupByDimension && (
          <>
            <div className="filter-bar-divider" aria-hidden="true" />
            <FilterDropdown
              label="Agrupar"
              options={groupByOptions}
              value={groupBy}
              onChange={(v) => setGroupBy(v as DimensionKey | null)}
              placeholder="Sin grupo"
            />
          </>
        )}

        <div className="filter-bar-spacer" />

        {activeSummary && (
          <span className="filter-bar-summary">
            Filtrando por <b>{activeSummary}</b>
          </span>
        )}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="filter-bar-clear"
          >
            Limpiar
          </button>
        )}
        <span className="filter-bar-meta">
          {filtered.length} / {entities.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message="Ninguna entidad coincide con los filtros activos. Proba aflojar la seleccion para volver a ver el archivo completo."
          action={
            <button
              type="button"
              onClick={handleClearAll}
              className="btn-secondary rdc-empty-action"
            >
              Limpiar filtros
            </button>
          }
        />
      ) : (
        <div className="entity-grid" data-tipo={tipo}>
          {groups.map((group) => (
            <section key={group.key} className="entity-group">
              {group.label !== null && (
                <h2 className="entity-group-header">
                  {group.label}
                  <span className="entity-group-count">
                    {group.items.length}
                  </span>
                </h2>
              )}
              <div className="entity-ledger" data-tipo={tipo}>
                {group.items.map((entity, idx) => (
                  <EntityCard
                    key={entity.slug}
                    tipo={tipo}
                    entity={entity}
                    index={idx}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function SimpleGrid({
  tipo,
  entities,
}: {
  tipo: EntityType;
  entities: EntityListItem[];
}) {
  if (entities.length === 0) return null;
  return (
    <div className="entity-ledger" data-tipo={tipo}>
      {entities.map((entity, idx) => (
        <EntityCard key={entity.slug} tipo={tipo} entity={entity} index={idx} />
      ))}
    </div>
  );
}

function EntityCard({
  tipo,
  entity,
  index,
}: {
  tipo: EntityType;
  entity: EntityListItem;
  index: number;
}) {
  return (
    <Link
      href={`/entidades/${tipo}/${entity.slug}`}
      className="entity-card rdc-rise"
      style={{ ["--rdc-rise-i" as string]: index }}
    >
      <div className="entity-card-name">
        {entity.nombre}
        {entity.origen === "glosario" && (
          <span
            className="entity-card-badge"
            title="Definido en el glosario canónico"
          >
            canon
          </span>
        )}
      </div>
      {entity.descripcion && (
        <p className="entity-card-desc">{entity.descripcion}</p>
      )}
      <div className="entity-card-meta">
        {entity.jugador && (
          <span className="entity-card-jugador">{entity.jugador}</span>
        )}
        {entity.apariciones.length > 0 ? (
          <span>
            {entity.apariciones.length} ep
            {entity.apariciones.length !== 1 ? "s" : ""}
            {" "}
            ({entity.apariciones.join(", ")})
          </span>
        ) : (
          <span className="entity-card-canon-only">Solo canon</span>
        )}
      </div>
    </Link>
  );
}
