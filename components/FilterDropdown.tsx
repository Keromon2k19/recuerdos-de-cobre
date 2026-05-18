"use client";

// components/FilterDropdown.tsx — Single-select dropdown filter.
// Click-outside-to-close. ESC to close. Keyboard navigation on options.

import { useEffect, useRef, useState, useId } from "react";

export type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

type Props = {
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  /** Texto cuando no hay selección activa (default: "Todas") */
  placeholder?: string;
};

export default function FilterDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = "Todas",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedOption = value ? options.find((o) => o.value === value) : null;
  const displayValue = selectedOption?.label ?? placeholder;
  const isActive = value !== null;

  function handleSelect(next: string | null) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="filter-dropdown" ref={wrapRef}>
      <button
        type="button"
        className={`filter-dropdown-trigger ${isActive ? "is-active" : ""}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={popoverId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="filter-dropdown-label">{label}</span>
        <span className="filter-dropdown-value">{displayValue}</span>
        <svg
          className="filter-dropdown-chevron"
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M1 1.5L6 6.5L11 1.5" />
        </svg>
      </button>

      {open && (
        <div
          className="filter-dropdown-popover"
          id={popoverId}
          role="listbox"
          aria-label={label}
        >
          <button
            type="button"
            className={`filter-option ${!isActive ? "is-selected" : ""}`}
            role="option"
            aria-selected={!isActive}
            onClick={() => handleSelect(null)}
          >
            <CheckIcon />
            <span className="filter-option-label">{placeholder}</span>
            <span className="filter-option-count">
              {options.reduce((acc, o) => acc + (o.count ?? 0), 0)}
            </span>
          </button>

          {options.length > 0 && <div className="filter-option-divider" />}

          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-option ${value === option.value ? "is-selected" : ""}`}
              role="option"
              aria-selected={value === option.value}
              onClick={() => handleSelect(option.value)}
            >
              <CheckIcon />
              <span className="filter-option-label">{option.label}</span>
              {option.count !== undefined && (
                <span className="filter-option-count">{option.count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="filter-option-check"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7.5L6 10.5L11 4.5" />
    </svg>
  );
}
