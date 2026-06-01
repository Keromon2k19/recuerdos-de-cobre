"use client";

// components/atlas-v2/AtlasFilterPanel.tsx
// Panel izquierdo de filtros del códice.
//
// Hallazgos del reference:
// - "FILTROS" header en Plex Mono small-caps al tope
// - Secciones expandibles "ROL", "FACCIONES", "APARICIÓN" con chevron
// - Cada item de sección con glyph pequeño + label + (count opcional)
// - Items toggleables (visualmente como una list, no como pills)
// - "Limpiar filtros" link cobre al pie
// - Background semi-transparente (deja ver la imagen sutil)

import { useState } from "react";

export type FilterValue = {
  search: string;
  rol: string;
  faccion: string;
  aparicion: string;
};

export const EMPTY_FILTERS: FilterValue = {
  search: "",
  rol: "",
  faccion: "",
  aparicion: "",
};

type Props = {
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  options: {
    roles: string[];
    facciones: string[];
    apariciones: string[];
  };
  totalCount: number;
  filteredCount: number;
};

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L13.5 13.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: open ? "rotate(0deg)" : "rotate(-90deg)",
        transition: "transform 0.2s var(--av2-ease)",
      }}
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}

function Section({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: string[];
  selected: string;
  onToggle: (val: string) => void;
}) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;

  return (
    <div className="av2-filter-section" data-open={open ? "true" : "false"}>
      <button
        type="button"
        className="av2-filter-section-head"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown open={open} />
      </button>
      {open && (
        <ul className="av2-filter-list" aria-label={label}>
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="av2-filter-item"
                data-active={selected === item ? "true" : undefined}
                onClick={() => onToggle(item)}
                aria-pressed={selected === item}
              >
                <span className="av2-filter-item-glyph" aria-hidden="true">◆</span>
                <span className="av2-filter-item-label">{item}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AtlasFilterPanel({
  value,
  onChange,
  options,
  totalCount,
  filteredCount,
}: Props) {
  const toggle = (key: keyof FilterValue, val: string) => {
    onChange({ ...value, [key]: value[key] === val ? "" : val });
  };

  const hasFilters =
    value.search !== "" ||
    value.rol !== "" ||
    value.faccion !== "" ||
    value.aparicion !== "";

  return (
    <aside className="av2-filters" aria-label="Filtros">
      <div className="av2-filters-head">Filtros</div>

      <div className="av2-filters-search">
        <span className="av2-filters-search-icon">
          <IconSearch />
        </span>
        <input
          type="search"
          className="av2-filters-search-input"
          placeholder="Buscar"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          aria-label="Buscar personaje"
        />
      </div>

      <Section
        label="Rol"
        items={options.roles}
        selected={value.rol}
        onToggle={(v) => toggle("rol", v)}
      />

      <Section
        label="Facciones"
        items={options.facciones}
        selected={value.faccion}
        onToggle={(v) => toggle("faccion", v)}
      />

      <Section
        label="Aparición"
        items={options.apariciones}
        selected={value.aparicion}
        onToggle={(v) => toggle("aparicion", v)}
      />

      <div className="av2-filters-footer">
        {hasFilters && (
          <button
            type="button"
            className="av2-filters-clear"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Limpiar filtros
          </button>
        )}
        <div className="av2-filters-count">
          {filteredCount} / {totalCount}
        </div>
      </div>
    </aside>
  );
}
