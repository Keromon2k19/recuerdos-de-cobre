// app.jsx — App shell, state, routing, tweaks wiring.

const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA, useCallback: useCallbackA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "edition": "III",
  "mode": "auto",
  "accentHex": "#7d1f2a",
  "ornament": "medio",
  "bodySize": 17
}/*EDITMODE-END*/;

const PALETTE_FROM_HEX = {
  "#7d1f2a": "wine",
  "#4a5d3a": "moss",
  "#2f4a6b": "midnight"
};

function App() {
  const data = window.LORE;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Live system preference for "auto" mode
  const [systemDark, setSystemDark] = useStateA(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffectA(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e) => setSystemDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn);
    return () => mq.removeEventListener ? mq.removeEventListener("change", fn) : mq.removeListener(fn);
  }, []);

  const effectiveMode = t.mode === "auto" ? (systemDark ? "dark" : "light") : t.mode;

  const palette = PALETTE_FROM_HEX[t.accentHex] || "wine";

  // Apply data attributes to <html>
  useEffectA(() => {
    const r = document.documentElement;
    r.setAttribute("data-edition", t.edition);
    r.setAttribute("data-mode", effectiveMode);
    r.setAttribute("data-palette", palette);
    r.setAttribute("data-ornament", t.ornament);
    r.style.setProperty("--rdc-body", t.bodySize + "px");
  }, [t.edition, palette, t.ornament, t.bodySize, effectiveMode]);

  // Local mutable cola
  const [cola, setCola] = useStateA(data.cola);
  const liveData = useMemoA(() => ({ ...data, cola }), [data, cola]);

  const counts = {
    episodios: data.episodios.length,
    personajes: data.personajes.length,
    facciones: data.facciones.length,
    lugares: data.lugares.length,
    worldbuilding: data.worldbuilding.length
  };

  // Routing
  const [view, setView] = useStateA("episodios"); // section id
  const [open, setOpen] = useStateA(null); // { id, kind } | null

  const openLectura = useCallbackA((id, kind) => {
    setOpen({ id, kind });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const setActive = useCallbackA((id) => {
    setView(id);
    setOpen(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  function renderView() {
    if (open) {
      return <LecturaView entityId={open.id} kind={open.kind} data={liveData} onBack={() => setOpen(null)} />;
    }
    switch (view) {
      case "episodios":     return <EpisodiosView data={liveData} setCola={setCola} openLectura={(id) => openLectura(id, "episodios")} />;
      case "personajes":    return <DirectorioView kind="personajes" data={liveData} openLectura={openLectura} />;
      case "facciones":     return <DirectorioView kind="facciones" data={liveData} openLectura={openLectura} />;
      case "lugares":       return <DirectorioView kind="lugares" data={liveData} openLectura={openLectura} />;
      case "worldbuilding": return <DirectorioView kind="worldbuilding" data={liveData} openLectura={openLectura} />;
      case "sistema":       return <SistemaView edition={t.edition} mode={effectiveMode} palette={palette} />;
      default:              return null;
    }
  }

  const editionLabel = {
    "I":  "Edición I · Iluminado Bermellón",
    "II": "Edición II · Códice Sepia",
    "III":"Edición III · Cuero Medianoche"
  }[t.edition];

  const sectionLabel = {
    episodios: "Tomo I · Crónicas",
    personajes: "Tomo II · Dramatis Personae",
    facciones: "Tomo III · Heráldica",
    lugares: "Tomo IV · Cartografía",
    worldbuilding: "Tomo V · Cosmologías",
    sistema: "Apéndice · Sistema"
  }[view] || "";

  return (
    <ToastProvider>
      <div className="rdc-shell rdc-paper">
        <Sidebar
          active={view}
          setActive={setActive}
          counts={counts}
          edition={t.edition}
          setEdition={(v) => setTweak("edition", v)}
          mode={t.mode}
          setMode={(v) => setTweak("mode", v)}
        />
        <main className="rdc-main">
          <div className="rdc-ribbon">
            <div className="rdc-bread">
              <span>❦</span> {editionLabel} <span>·</span> {sectionLabel}
            </div>
            <div className="rdc-spacer" />
          </div>
          <div className="rdc-page-frame">
            {renderView()}
          </div>
        </main>
      </div>

      <TweaksPanel>
        <TweakSection label="Edición visual" />
        <TweakRadio
          label="Tratamiento"
          value={t.edition}
          options={["I", "II", "III"]}
          onChange={(v) => setTweak("edition", v)}
        />
        <div style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 10.5,
          color: "rgba(41,38,27,.55)",
          marginTop: -4,
          lineHeight: 1.4
        }}>
          {{
            "I":"Cinzel · Cormorant · Vino + oro pesado.",
            "II":"EB Garamond · Tinta sepia, capitulares clásicas.",
            "III":"Cardo · Crimson · Cuero, musgo y cobre."
          }[t.edition]}
        </div>

        <TweakSection label="Iluminación" />
        <TweakRadio label="Modo" value={t.mode} options={["light","dark","auto"]} onChange={(v) => setTweak("mode", v)} />

        <TweakSection label="Paleta de acento" />
        <TweakColor
          label="Tono"
          value={t.accentHex}
          options={["#7d1f2a", "#4a5d3a", "#2f4a6b"]}
          onChange={(v) => setTweak("accentHex", v)}
        />

        <TweakSection label="Ornamentación" />
        <TweakRadio label="Nivel" value={t.ornament} options={["bajo","medio","alto"]} onChange={(v) => setTweak("ornament", v)} />

        <TweakSection label="Lectura" />
        <TweakSlider label="Cuerpo" value={t.bodySize} min={14} max={22} step={1} unit="px"
          onChange={(v) => setTweak("bodySize", v)} />
      </TweaksPanel>
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
