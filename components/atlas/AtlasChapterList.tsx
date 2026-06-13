"use client";

// components/atlas/AtlasChapterList.tsx
// Panel izquierdo: lista vertical de capítulos.
//
// Hallazgos del reference de capitulos:
// - Cada item: número grande (42) + eyebrow "CAPÍTULO X" + título poético
// - Item activo: borde cobre brillante + bg ligeramente más cobrizo
// - Header "TODOS LOS CAPÍTULOS" + footer link "EXPLORAR ARCHIVOS"
// - Scroll interno si pasa de N items

import Link from "next/link";
import type { V2Chapter } from "@/data/atlas/chapters";

type Props = {
  chapters: V2Chapter[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function AtlasChapterList({ chapters, selectedId, onSelect }: Props) {
  return (
    <aside className="av2-chapter-list" aria-label="Lista de capítulos">
      <div className="av2-chapter-list-head">Todos los capítulos</div>

      <ul className="av2-chapter-list-items">
        {chapters.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="av2-chapter-item"
              data-active={selectedId === c.id ? "true" : undefined}
              onClick={() => onSelect(c.id)}
              aria-pressed={selectedId === c.id}
            >
              <span className="av2-chapter-item-num" aria-hidden="true">
                {c.numeroDisplay ?? String(c.numero).padStart(2, "0")}
              </span>
              <span className="av2-chapter-item-text">
                <span className="av2-chapter-item-eyebrow">{c.eyebrow}</span>
                <span className="av2-chapter-item-title">{c.titulo}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Link href="/buscar" className="av2-chapter-list-foot">
        Buscar en el atlas
      </Link>
    </aside>
  );
}
