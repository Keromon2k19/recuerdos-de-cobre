"use client";

// components/public/EntityReader.tsx — Lector por secciones de una ficha de
// entidad. Antes la ficha era un volcado: narrativa + apariciones + relaciones
// apiladas en un scroll de muchas pantallas. Ahora cada bloque es una sección
// y un índice lateral pegajoso salta entre ellas; se ve una a la vez.

import { useState, type ReactNode } from "react";

export type ReaderSection = {
  id: string;
  label: string;
  /** Conteo breve junto al label en el índice (ej. "46", "120 vínculos"). */
  meta?: string;
  content: ReactNode;
};

export default function EntityReader({
  sections,
}: {
  sections: ReaderSection[];
}) {
  const [active, setActive] = useState(0);
  if (sections.length === 0) return null;
  const idx = Math.min(active, sections.length - 1);
  const cur = sections[idx];

  return (
    <div className="ficha-reader">
      <nav className="ficha-index" aria-label="Secciones de la ficha">
        <p className="block-label">En esta ficha</p>
        <ul>
          {sections.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className="ficha-index-item"
                data-active={i === idx}
                aria-current={i === idx ? "true" : undefined}
                onClick={() => setActive(i)}
              >
                <span className="ficha-index-label">{s.label}</span>
                {s.meta && <span className="ficha-index-meta">{s.meta}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ficha-body" key={cur.id}>
        {cur.content}
      </div>
    </div>
  );
}
