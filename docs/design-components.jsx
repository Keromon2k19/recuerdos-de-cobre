// components.jsx — Sidebar, cards, badges, ornaments, toasts, accordion.
// All components are pushed onto window at the bottom so app.jsx can read them.

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ───── Ornament glyphs ───── */
function Glyph({ name = "lozenge", size = 14 }) {
  const g =
    { lozenge: "❖", flourish: "❦", leaf: "❧", crest: "⚜", scale: "⚖",
      sun: "☉", moon: "☽", mercury: "☿", cross: "✠", star: "✦" }[name] || name;
  return (
    <span style={{ fontFamily: "var(--rdc-display)", fontSize: size, color: "var(--rdc-gold)" }}>
      {g}
    </span>
  );
}

function Flourish({ children = "❦" }) {
  return (
    <div className="rdc-flourish" aria-hidden>
      <span>{children}</span>
    </div>
  );
}

/* ───── Badges ───── */
function StateBadge({ state }) {
  const label =
    { pendiente: "En espera", procesando: "Procesando", listo: "Indexado", error: "Error" }[state] || state;
  return (
    <span className="rdc-badge" data-state={state}>
      {state === "procesando" ? <span className="rdc-pulse" /> : null}
      {label}
    </span>
  );
}

/* ───── Sidebar ───── */
function Sidebar({ active, setActive, counts, edition, setEdition, mode, setMode }) {
  const nav = [
    { id: "episodios", glyph: "✦", label: "Episodios", count: counts.episodios },
    { id: "personajes", glyph: "❦", label: "Personajes", count: counts.personajes },
    { id: "facciones", glyph: "⚜", label: "Facciones", count: counts.facciones },
    { id: "lugares", glyph: "❖", label: "Lugares", count: counts.lugares },
    { id: "worldbuilding", glyph: "☉", label: "Worldbuilding", count: counts.worldbuilding }
  ];
  const sys = [{ id: "sistema", glyph: "✚", label: "Sistema de diseño", count: "—" }];

  return (
    <aside className="rdc-sidebar">
      <div className="rdc-brand">
        <div className="rdc-mark">Vol. I · 2024 — ⁂</div>
        <h1>Recuerdos<br/>de Cobre</h1>
        <div className="rdc-sub">Códice privado de una campaña en curso.</div>
      </div>

      <div className="rdc-nav-group">
        <div className="rdc-nav-label">El Archivo</div>
        {nav.map((it) => (
          <div
            key={it.id}
            className="rdc-nav-item"
            data-active={active === it.id}
            onClick={() => setActive(it.id)}
          >
            <span className="rdc-glyph">{it.glyph}</span>
            <span className="rdc-name">{it.label}</span>
            <span className="rdc-count">{String(it.count).padStart(2, "0")}</span>
          </div>
        ))}
      </div>

      <div className="rdc-nav-group">
        <div className="rdc-nav-label">Apéndice</div>
        {sys.map((it) => (
          <div
            key={it.id}
            className="rdc-nav-item"
            data-active={active === it.id}
            onClick={() => setActive(it.id)}
          >
            <span className="rdc-glyph">{it.glyph}</span>
            <span className="rdc-name">{it.label}</span>
            <span className="rdc-count">{it.count}</span>
          </div>
        ))}
      </div>

      <div className="rdc-side-controls">
        <div>
          <div className="rdc-nav-label" style={{ margin: "0 0 8px" }}>Edición</div>
          <div className="rdc-segmented" role="group" aria-label="Edición visual">
            {["I","II","III"].map((e) => (
              <button key={e} data-on={edition === e} onClick={() => setEdition(e)}>{e}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="rdc-nav-label" style={{ margin: "0 0 8px" }}>Vela / Lámpara</div>
          <div className="rdc-segmented" role="group" aria-label="Modo">
            {[
              ["light","Día"],
              ["dark","Noche"],
              ["auto","Auto"]
            ].map(([v,l]) => (
              <button key={v} data-on={mode === v} onClick={() => setMode(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ───── Section header ───── */
function SectionHead({ eyebrow, title, sub, count, extra }) {
  return (
    <header className="rdc-section-head">
      <div className="rdc-eyebrow">
        <span className="rdc-eyebrow-glyph">❦</span>
        <span>{eyebrow}</span>
      </div>
      <h2 className="rdc-section-title">{title}</h2>
      {sub ? <p className="rdc-section-sub">{sub}</p> : null}
      {count != null ? (
        <div className="rdc-section-meta">
          <b>{count}</b> {count === 1 ? "entrada" : "entradas"} catalogadas {extra ? `· ${extra}` : ""}
        </div>
      ) : null}
    </header>
  );
}

/* ───── Entity card ───── */
function EntityCard({ entity, kind = "personaje", onOpen }) {
  const tags = useMemo(() => {
    const t = [];
    if (entity.rol) t.push({ label: entity.rol, tone: "rol" });
    if (entity.tipo) t.push({ label: entity.tipo, tone: "rol" });
    if (entity.region) t.push({ label: entity.region });
    if (entity.jugador) t.push({ label: "↗ " + entity.jugador });
    (entity.facciones || []).slice(0, 2).forEach((f) => t.push({ label: f, tone: "gold" }));
    if (entity.lider) t.push({ label: "Líder · " + entity.lider });
    if (entity.miembros) t.push({ label: entity.miembros + " miembros" });
    return t;
  }, [entity]);

  return (
    <article className="rdc-card" onClick={() => onOpen && onOpen(entity)}>
      <div className="rdc-card-head">
        <div className="rdc-card-sigilo" aria-hidden>{entity.sigilo || "❖"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="rdc-card-title">{entity.nombre}</h3>
          {entity.epiteto ? <div className="rdc-card-epi">{entity.epiteto}</div> : null}
        </div>
      </div>
      <p className="rdc-card-body">{entity.sumario}</p>
      <div className="rdc-tags">
        {tags.map((t, i) => (
          <span key={i} className="rdc-tag" data-tone={t.tone}>{t.label}</span>
        ))}
      </div>
    </article>
  );
}

/* ───── Accordion ───── */
function Accordion({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rdc-accordion">
      <div className="rdc-acc-head" data-open={open} onClick={() => setOpen(!open)}>
        <span className="rdc-chev">❯</span>
        <span className="rdc-acc-title">{title}</span>
        {count != null ? <span className="rdc-acc-count">{count}</span> : null}
      </div>
      {open ? <div className="rdc-acc-body">{children}</div> : null}
    </div>
  );
}

/* ───── Toast system ───── */
const ToastCtx = React.createContext({ push: () => {} });
function useToasts() { return React.useContext(ToastCtx); }

function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    const t = { id, tone: "default", duration: 3400, ...toast };
    setItems((arr) => [...arr, t]);
    setTimeout(() => {
      setItems((arr) => arr.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
      setTimeout(() => {
        setItems((arr) => arr.filter((x) => x.id !== id));
      }, 240);
    }, t.duration);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="rdc-toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={"rdc-toast" + (t.leaving ? " rdc-leaving" : "")} data-tone={t.tone}>
            <span className="rdc-toast-glyph">{t.glyph || "❦"}</span>
            <div>
              {t.title ? <b>{t.title}</b> : null}
              {t.title && t.body ? <span> — </span> : null}
              {t.body}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

Object.assign(window, {
  Glyph, Flourish, StateBadge, Sidebar, SectionHead, EntityCard, Accordion,
  ToastProvider, useToasts
});
