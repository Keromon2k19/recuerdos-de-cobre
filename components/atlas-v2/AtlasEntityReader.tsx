"use client";

import { useState } from "react";

export type AtlasEntityReaderSection = {
  id: string;
  title: string;
  kind: "profile" | "mentions" | "narrative";
  html: string;
};

type Props = {
  sections: AtlasEntityReaderSection[];
  label?: string;
};

export default function AtlasEntityReader({
  sections,
  label = "Lectura del atlas",
}: Props) {
  const [selectedId, setSelectedId] = useState(sections[0]?.id ?? "");
  const selected =
    sections.find((section) => section.id === selectedId) ?? sections[0];

  if (!selected) {
    return (
      <div className="av2-entity-reader av2-entity-reader--empty">
        <p>Este registro todavia no tiene narrativa desarrollada.</p>
      </div>
    );
  }

  return (
    <section className="av2-entity-reader">
      <nav className="av2-entity-reader-index" aria-label={label}>
        <p>{label}</p>
        {sections.map((section, index) => (
          <button
            key={section.id}
            type="button"
            data-active={section.id === selected.id ? "true" : undefined}
            onClick={() => setSelectedId(section.id)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {section.title}
          </button>
        ))}
      </nav>

      <article className="av2-entity-reader-page" data-kind={selected.kind}>
        <header>
          <p>{selected.kind === "mentions" ? "Registro de apariciones" : label}</p>
          <h2>{selected.title}</h2>
        </header>
        <div
          className="av2-entity-reader-prose"
          dangerouslySetInnerHTML={{ __html: selected.html }}
        />
      </article>
    </section>
  );
}
