"use client";

// Drawer lateral derecho con la info extendida del lugar.
// El default export es el TRIGGER (botón "Leer más") que abre el drawer.
// El drawer en sí se renderiza en un Portal a body para escapar de los
// stacking contexts intermedios (.av2-shell crea uno).

import { useEffect, useState, useId } from "react";
import { createPortal } from "react-dom";

export type LugarSection = {
  id: string;
  label: string;
  body: string;
  empty?: boolean; // true = placeholder "Próximamente"
};

type Props = {
  title: string;
  eyebrow?: string;
  sections: LugarSection[];
  ctaLabel?: string;
};

export default function LugarInfoDrawer({
  title,
  eyebrow,
  sections,
  ctaLabel = "Leer más sobre el lugar",
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => { setMounted(true); }, []);

  // Esc cierra
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const drawerNode = (
    <div
      className={`av2-ld-drawer-root ${open ? "is-open" : ""}`}
      aria-hidden={!open}
    >
        <button
          type="button"
          className="av2-ld-drawer-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          tabIndex={open ? 0 : -1}
        />
        <aside
          className="av2-ld-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="av2-ld-drawer-head">
            <div className="av2-ld-drawer-head-text">
              {eyebrow && <p className="av2-ld-drawer-eyebrow">{eyebrow}</p>}
              <h2 id={titleId} className="av2-ld-drawer-title">{title}</h2>
            </div>
            <button
              type="button"
              className="av2-ld-drawer-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar panel"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M6 6L18 18M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div className="av2-ld-drawer-body">
            {sections.map((s) => (
              <section key={s.id} className="av2-ld-drawer-section">
                <h3 className="av2-ld-drawer-section-title">{s.label}</h3>
                {s.empty ? (
                  <p className="av2-ld-drawer-empty">{s.body}</p>
                ) : (
                  <p className="av2-ld-drawer-prose">{s.body}</p>
                )}
              </section>
            ))}
          </div>
        </aside>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="av2-hc-cta-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {ctaLabel}
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            d="M5 12h14M13 5l7 7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {mounted && createPortal(drawerNode, document.body)}
    </>
  );
}
