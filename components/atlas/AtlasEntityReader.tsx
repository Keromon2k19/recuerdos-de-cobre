"use client";

import { useState, useEffect, type ReactNode } from "react";

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

// components/atlas/AtlasEntityReader.tsx
// Lector tabulado de secciones de una entidad.
//
// Estructura:
//   Sidebar de tabs con iconos SVG (matched por keyword del id/title)
//   Contenido principal en "hoja de pergamino" con transición de página
//   Los labels de los tabs usan el título original de la sección.

const getTabConfig = (title: string, id: string) => {
  const normTitle = title.toLowerCase();
  const normId = id.toLowerCase();

  // Match icon by keyword, but always use the section's original title as the label
  // to prevent duplicate labels when multiple sections match the same keyword.
  const iconMap: Array<{ test: (nId: string, nTitle: string) => boolean; icon: ReactNode }> = [
    {
      test: (nId, nTitle) => nId.includes("resumen-cronologico") || nTitle.includes("cronologico") || nId.includes("cronología") || nId.includes("cronologia"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M5 2h14M5 22h14M19 2l-7 7-7-7M5 22l7-7 7 7M12 9v6" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("resumen") || nTitle.includes("resumen"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("cast") || nTitle.includes("cast"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 9H9V9h2v2zm4 0h-2V9h2v2zm-5 4c0-1.1.9-2 2-2s2 .9 2 2H10z" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("personaje") || nTitle.includes("personaje"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("lugar") || nTitle.includes("lugar"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("evento") || nTitle.includes("evento"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("objeto") || nTitle.includes("objeto"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M2 11h20M12 7V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v4M10 11v4a2 2 0 0 0 4 0v-4" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("faccion") || nTitle.includes("faccion"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("relacion") || nTitle.includes("relacion"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("misterio") || nTitle.includes("misterio"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("worldbuilding") || nId.includes("mundo") || nTitle.includes("worldbuilding") || nTitle.includes("mundo"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("archivos") || nTitle.includes("archivo") || nId.includes("lore") || nTitle.includes("lore"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("decision") || nTitle.includes("decision"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M6 3v12" /><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path d="M15 6a9 9 0 0 1-9 9" />
        </svg>
      ),
    },
    {
      test: (nId, nTitle) => nId.includes("cita") || nId.includes("quote"),
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
        </svg>
      ),
    },
  ];

  const defaultIcon = (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-icon">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );

  const matched = iconMap.find((entry) => entry.test(normId, normTitle));

  return {
    label: title,
    icon: matched?.icon ?? defaultIcon,
  };
};

export default function AtlasEntityReader({
  sections,
  label = "Lectura del atlas",
}: Props) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [displayId, setDisplayId] = useState(sections[0]?.id ?? "");
  const [transitionState, setTransitionState] = useState<"idle" | "exiting" | "entering">("idle");

  // Resetear estados si las secciones cambian dinámicamente y la sección activa ya no existe
  useEffect(() => {
    if (sections.length > 0 && !sections.some((s) => s.id === activeId)) {
      setActiveId(sections[0].id);
      setDisplayId(sections[0].id);
      setTransitionState("idle");
    }
  }, [sections, activeId]);

  const selected =
    sections.find((section) => section.id === displayId) ?? sections[0];

  const handleSelect = (id: string) => {
    if (id === activeId || transitionState !== "idle") return;
    setActiveId(id);
    setTransitionState("exiting");
    setTimeout(() => {
      setDisplayId(id);
      setTransitionState("entering");
      setTimeout(() => {
        setTransitionState("idle");
      }, 150);
    }, 150);
  };

  if (!selected) {
    return (
      <div className="av2-entity-reader av2-entity-reader--empty">
        <p>Este registro todavía no tiene narrativa desarrollada.</p>
      </div>
    );
  }

  return (
    <section className="av2-entity-reader">
      <nav className="av2-entity-reader-index" aria-label={label}>
        {sections.map((section) => {
          const config = getTabConfig(section.title, section.id);
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              className="av2-entity-reader-tab"
              data-active={isActive ? "true" : undefined}
              onClick={() => handleSelect(section.id)}
            >
              {config.icon}
              <span>{config.label}</span>
              {isActive && <span className="av2-entity-reader-connector" />}
            </button>
          );
        })}
      </nav>

      <article
        className="av2-entity-reader-page"
        data-kind={selected.kind}
        data-id={selected.id}
        data-transition={transitionState}
      >
        <span className="av2-entity-reader-inner-border" />
        <header>
          {(() => {
            const sub = selected.id === "citas-destacadas" || selected.id === "quotes"
              ? "Citas destacadas"
              : selected.kind === "mentions"
                ? "Registro de apariciones"
                : label;
            return sub && sub !== "Crónica completa" ? <p>{sub}</p> : null;
          })()}
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
