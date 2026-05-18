"use client";

// components/Accordion.tsx — Acordeón del códice (sistema rdc).
// Usado para ocultar por defecto los episodios ya procesados.

import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  count?: number | string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export default function Accordion({
  title,
  count,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rdc-accordion">
      <button
        type="button"
        className="rdc-acc-head"
        data-open={open}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          className="rdc-chev"
          viewBox="0 0 8 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          width="8"
          height="12"
        >
          <path d="M1.5 1.5L6 6L1.5 10.5" />
        </svg>
        <span className="rdc-acc-title">{title}</span>
        {count != null ? <span className="rdc-acc-count">{count}</span> : null}
      </button>
      {open ? <div className="rdc-acc-body">{children}</div> : null}
    </div>
  );
}
