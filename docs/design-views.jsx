// views.jsx — Episodios (Ingesta + listado), Directorio, Lectura, Sistema.

const { useState: useStateV, useEffect: useEffectV, useMemo: useMemoV, useRef: useRefV } = React;

/* ───── Episodios view ───── */
function EpisodiosView({ data, setCola, openLectura }) {
  const toasts = useToasts();
  const [url, setUrl] = useStateV("");

  // Simulated processing tick
  useEffectV(() => {
    const id = setInterval(() => {
      setCola((cola) =>
        cola.map((q) => {
          if (q.estado !== "procesando") return q;
          const next = Math.min(q.progreso + 0.012 + Math.random() * 0.005, 1);
          let paso = q.paso;
          if (next > (paso + 1) / q.pasos.length && paso < q.pasos.length - 1) paso += 1;
          if (next >= 1) {
            toasts.push({ tone: "success", title: q.titulo, body: "Extracción completada.", glyph: "❦" });
            return { ...q, progreso: 1, paso: q.pasos.length - 1, estado: "listo" };
          }
          return { ...q, progreso: next, paso };
        })
      );
    }, 900);
    return () => clearInterval(id);
  }, [setCola, toasts]);

  function startExtract() {
    if (!url.trim()) {
      toasts.push({ tone: "error", title: "URL requerida", body: "Pega un enlace al episodio antes de invocar.", glyph: "⚠" });
      return;
    }
    const id = "q-" + Math.random().toString(36).slice(2, 7);
    const titulo = "Ep. nuevo — " + url.replace(/.*\//, "").replace(/[-_]/g, " ").slice(0, 64);
    const item = {
      id, url, titulo,
      paso: 0,
      pasos: ["Descarga", "Transcripción", "Identificación", "Extracción", "Resumen"],
      estado: "procesando", progreso: 0.03
    };
    setCola((c) => [item, ...c]);
    setUrl("");
    toasts.push({ tone: "success", title: "Invocación lanzada", body: "El amanuense ya copia la sesión.", glyph: "❦" });
  }

  function retry(qId) {
    setCola((c) => c.map((q) => (q.id === qId ? { ...q, estado: "procesando", progreso: 0.05, paso: 0 } : q)));
    toasts.push({ tone: "success", title: "Reintentando", body: "El conjuro vuelve a intentarse.", glyph: "↻" });
  }
  function discard(qId) {
    setCola((c) => c.filter((q) => q.id !== qId));
    toasts.push({ tone: "error", title: "Descartado", body: "La entrada fue tachada del registro.", glyph: "✕" });
  }

  const enCola = data.cola.filter((q) => q.estado === "procesando" || q.estado === "pendiente" || q.estado === "error");
  const procesados = [...data.cola.filter((q) => q.estado === "listo"), ...data.episodios.map((e) => ({
    id: e.id, titulo: `Ep. ${String(e.numero).padStart(2, "0")} — ${e.titulo}`, estado: "listo", fecha: e.fecha, duracion: e.duracion
  }))];

  return (
    <div>
      <SectionHead
        eyebrow="Tomo I — Crónicas"
        title="Episodios"
        sub="Lecturas grabadas de cada sesión, transcritas por un amanuense paciente."
        count={data.episodios.length}
        extra={`${enCola.length} en proceso · ${procesados.length} archivados`}
      />

      {/* Ingest panel */}
      <div className="rdc-ingest-card">
        <div className="rdc-eyebrow" style={{ margin: 0 }}>
          <span className="rdc-eyebrow-glyph">❧</span>
          <span>Invocación de nueva sesión</span>
        </div>
        <div style={{ fontStyle: "italic", color: "var(--rdc-ink-soft)", fontSize: 15, marginTop: -4 }}>
          Pega la URL del video. El amanuense bajará el audio, lo transcribirá y extraerá personajes, lugares y eventos.
        </div>
        <div className="rdc-ingest-row">
          <input
            className="rdc-input"
            placeholder="https://… enlace al video del episodio"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startExtract()}
          />
          <button className="rdc-btn" data-variant="primary" onClick={startExtract}>
            ✶ Extraer Lore
          </button>
          <button className="rdc-btn" data-variant="ghost" onClick={() => setUrl("")}>Limpiar</button>
        </div>
        <div style={{ fontFamily: "var(--rdc-mono)", fontSize: 11, color: "var(--rdc-ink-faint)", letterSpacing: ".06em" }}>
          PIPELINE · DESCARGA → TRANSCRIPCIÓN → IDENTIFICACIÓN → EXTRACCIÓN → RESUMEN
        </div>
      </div>

      {/* In-progress queue */}
      <div style={{ marginTop: 28 }}>
        <div className="rdc-eyebrow" style={{ marginBottom: 10 }}>
          <span className="rdc-eyebrow-glyph">⌛</span>
          <span>Cola activa</span>
        </div>
        <div className="rdc-queue">
          {enCola.length === 0 ? (
            <div style={{ padding: 28, textAlign: "center", color: "var(--rdc-ink-faint)", fontStyle: "italic" }}>
              No hay sesiones en cola. El archivo descansa.
            </div>
          ) : enCola.map((q, i) => (
            <div key={q.id} className="rdc-queue-row">
              <div className="rdc-queue-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="rdc-queue-title">
                {q.titulo}
                <small>{q.url} · paso {q.paso + 1} / {q.pasos.length} — {q.pasos[q.paso]}</small>
                {q.mensaje ? (
                  <small style={{ color: "var(--rdc-danger)" }}>↳ {q.mensaje}</small>
                ) : null}
              </div>
              <div className="rdc-progress" data-state={q.estado}>
                <span style={{ "--p": (Math.round(q.progreso * 100)) + "%" }} />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
                <StateBadge state={q.estado} />
                {q.estado === "error" ? (
                  <button className="rdc-btn" data-variant="ghost" style={{ padding: "5px 9px", fontSize: 10 }} onClick={() => retry(q.id)}>↻</button>
                ) : null}
                <button className="rdc-btn" data-variant="ghost" style={{ padding: "5px 9px", fontSize: 10 }} onClick={() => discard(q.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Processed accordion */}
      <div style={{ marginTop: 28 }}>
        <Accordion title="Episodios ya transcritos" count={procesados.length} defaultOpen={false}>
          <div className="rdc-eplist" style={{ borderTop: 0 }}>
            {data.episodios.map((e) => (
              <div key={e.id} className="rdc-eprow" onClick={() => openLectura(e.id)}>
                <div className="rdc-eprow-num">{String(e.numero).padStart(2, "0")}</div>
                <div>
                  <div className="rdc-eprow-title">{e.titulo}</div>
                  <span className="rdc-eprow-sub">{e.sumario}</span>
                </div>
                <div className="rdc-eprow-meta">{e.fecha}</div>
                <div className="rdc-eprow-meta">{e.duracion}</div>
                <div style={{ textAlign: "right" }}>
                  <StateBadge state={e.estado} />
                </div>
              </div>
            ))}
            {data.cola.filter((q) => q.estado === "listo").map((q, idx) => (
              <div key={q.id} className="rdc-eprow">
                <div className="rdc-eprow-num">·</div>
                <div>
                  <div className="rdc-eprow-title">{q.titulo}</div>
                  <span className="rdc-eprow-sub">Procesado en esta sesión — pendiente de catalogación manual.</span>
                </div>
                <div className="rdc-eprow-meta">—</div>
                <div className="rdc-eprow-meta">—</div>
                <div style={{ textAlign: "right" }}>
                  <StateBadge state="listo" />
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      </div>

      <Flourish>❦ ❧ ❦</Flourish>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="rdc-spec-block">
          <div className="rdc-spec-label">Atajos de teclado</div>
          <div style={{ fontFamily: "var(--rdc-mono)", fontSize: 13, lineHeight: 1.9, color: "var(--rdc-ink-soft)" }}>
            <div><b>⌘ K</b> — Buscar en el archivo</div>
            <div><b>⌘ ↵</b> — Invocar extracción</div>
            <div><b>E</b> — Editar entrada actual</div>
            <div><b>?</b> — Mostrar ayuda</div>
          </div>
        </div>
        <div className="rdc-spec-block">
          <div className="rdc-spec-label">Próxima sesión</div>
          <div style={{ fontSize: 16, color: "var(--rdc-ink)", fontStyle: "italic" }}>
            Acto V — “La Luna Cuelga de un Clavo”.
          </div>
          <div style={{ fontFamily: "var(--rdc-mono)", fontSize: 11, color: "var(--rdc-ink-faint)", marginTop: 8 }}>
            Sábado, 18 de mayo · 21:00 — Casa de Tato
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Directorio view ───── */
function DirectorioView({ kind, data, openLectura }) {
  const items = data[kind] || [];
  const [query, setQuery] = useStateV("");
  const [region, setRegion] = useStateV("Todas");
  const [rol, setRol] = useStateV("Todos");

  const regions = useMemoV(() => ["Todas", ...Array.from(new Set(items.map((i) => i.region).filter(Boolean)))], [items]);
  const roles = useMemoV(() => {
    const key = kind === "personajes" ? "rol" : "tipo";
    return ["Todos", ...Array.from(new Set(items.map((i) => i[key]).filter(Boolean)))];
  }, [items, kind]);

  const filtered = useMemoV(() => {
    return items.filter((i) => {
      if (region !== "Todas" && i.region !== region) return false;
      const key = kind === "personajes" ? "rol" : "tipo";
      if (rol !== "Todos" && i[key] !== rol) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = [i.nombre, i.epiteto, i.sumario, ...(i.facciones || []), ...(i.alias || [])]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, region, rol, query, kind]);

  const titulos = {
    personajes: { eyebrow: "Tomo II — Dramatis Personae", title: "Personajes", sub: "Quien camina por la campaña, en orden de aparición y de peligro." },
    facciones: { eyebrow: "Tomo III — Heráldica", title: "Facciones", sub: "Las casas, gremios y cofradías cuyos sellos hemos visto en cera." },
    lugares: { eyebrow: "Tomo IV — Cartografía", title: "Lugares", sub: "Geografía conocida: ciudades, templos, escenarios y los abismos entre ellos." },
    worldbuilding: { eyebrow: "Tomo V — Cosmologías", title: "Worldbuilding", sub: "Leyes, fenómenos y rituales que dan forma al mundo más allá de los personajes." }
  }[kind] || { eyebrow: "", title: kind, sub: "" };

  return (
    <div>
      <SectionHead
        eyebrow={titulos.eyebrow}
        title={titulos.title}
        sub={titulos.sub}
        count={filtered.length}
        extra={filtered.length !== items.length ? `de ${items.length} en total` : ""}
      />

      <div className="rdc-filters">
        <div className="rdc-search">
          <span className="rdc-search-glyph">✦</span>
          <input
            placeholder={`Buscar en ${titulos.title.toLowerCase()}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="rdc-select" value={region} onChange={(e) => setRegion(e.target.value)}>
          {regions.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className="rdc-select" value={rol} onChange={(e) => setRol(e.target.value)}>
          {roles.map((r) => <option key={r}>{r}</option>)}
        </select>
        {(query || region !== "Todas" || rol !== "Todos") ? (
          <button className="rdc-btn" data-variant="ghost" style={{ padding: "6px 12px", fontSize: 10 }}
            onClick={() => { setQuery(""); setRegion("Todas"); setRol("Todos"); }}>
            ✕ Limpiar
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--rdc-ink-faint)", fontStyle: "italic", border: "1px dashed var(--rdc-rule)", borderRadius: "var(--rdc-radius)" }}>
          Ningún registro coincide con tu búsqueda. <br/>
          <small style={{ fontFamily: "var(--rdc-mono)", fontStyle: "normal" }}>Prueba a vaciar los filtros, viajero.</small>
        </div>
      ) : (
        <div className="rdc-grid">
          {filtered.map((i) => (
            <EntityCard key={i.id} entity={i} kind={kind} onOpen={() => openLectura(i.id, kind)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───── Lectura view ───── */
function LecturaView({ entityId, kind, data, onBack }) {
  const toasts = useToasts();
  const isEpisode = data.episodios.find((e) => e.id === entityId);
  const entity =
    data[kind || "personajes"]?.find((x) => x.id === entityId) ||
    data.personajes.find((x) => x.id === entityId) ||
    data.facciones.find((x) => x.id === entityId) ||
    data.lugares.find((x) => x.id === entityId) ||
    data.worldbuilding.find((x) => x.id === entityId);

  // For demo: if it's an episode, show the script. Otherwise show the entity profile.
  if (isEpisode) {
    return <EpisodeReading episode={isEpisode} data={data} onBack={onBack} toasts={toasts} />;
  }
  if (!entity) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "var(--rdc-ink-faint)" }}>
        Entrada no encontrada.
        <div style={{ marginTop: 16 }}>
          <button className="rdc-btn" data-variant="ghost" onClick={onBack}>← Volver</button>
        </div>
      </div>
    );
  }
  return <EntityReading entity={entity} kind={kind} onBack={onBack} toasts={toasts} />;
}

function InlineField({ value, onSave, multiline = false, label }) {
  const [editing, setEditing] = useStateV(false);
  const [draft, setDraft] = useStateV(value);
  const ref = useRefV(null);
  useEffectV(() => setDraft(value), [value]);
  useEffectV(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  function save() {
    onSave(draft);
    setEditing(false);
  }
  if (!editing) {
    return (
      <span className="rdc-rh-val" onDoubleClick={() => setEditing(true)} style={{ cursor: "text" }}>
        {value || <em style={{ color: "var(--rdc-ink-faint)" }}>—</em>}
      </span>
    );
  }
  return (
    <div className="rdc-edit-row">
      {multiline ? (
        <textarea ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)}
          rows={3} className="rdc-input" style={{ fontFamily: "var(--rdc-serif)", fontSize: 15 }} />
      ) : (
        <input ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} />
      )}
      <button className="rdc-btn" data-variant="primary" style={{ padding: "5px 10px", fontSize: 10 }} onClick={save}>Guardar</button>
      <button className="rdc-btn" data-variant="ghost" style={{ padding: "5px 10px", fontSize: 10 }} onClick={() => setEditing(false)}>Cancelar</button>
    </div>
  );
}

function EntityReading({ entity, kind, onBack, toasts }) {
  const [data, setData] = useStateV(entity);
  function update(field, value) {
    setData((d) => ({ ...d, [field]: value }));
    toasts.push({ tone: "success", title: "Guardado", body: `“${field}” actualizado en el códice.`, glyph: "❦" });
  }
  function remove() {
    toasts.push({ tone: "error", title: "Entrada tachada", body: `${data.nombre} ha sido marcada para revisión.`, glyph: "✕" });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <button className="rdc-btn" data-variant="ghost" style={{ padding: "6px 12px", fontSize: 10 }} onClick={onBack}>← Volver al directorio</button>
        <span style={{ flex: 1 }} />
        <button className="rdc-btn" data-variant="ghost" style={{ padding: "6px 12px", fontSize: 10 }}>↗ Compartir</button>
        <button className="rdc-btn" data-variant="danger" style={{ padding: "6px 12px", fontSize: 10 }} onClick={remove}>Tachar entrada</button>
      </div>

      <div className="rdc-readhead">
        <div className="rdc-rh-row">
          <div className="rdc-rh-key">Nombre</div>
          <InlineField value={data.nombre} onSave={(v) => update("nombre", v)} />
          <span />
        </div>
        {data.epiteto != null ? (
          <div className="rdc-rh-row">
            <div className="rdc-rh-key">Epíteto</div>
            <InlineField value={data.epiteto} onSave={(v) => update("epiteto", v)} />
            <span />
          </div>
        ) : null}
        {data.rol != null ? (
          <div className="rdc-rh-row">
            <div className="rdc-rh-key">Rol</div>
            <InlineField value={data.rol} onSave={(v) => update("rol", v)} />
            <span />
          </div>
        ) : null}
        {data.tipo != null ? (
          <div className="rdc-rh-row">
            <div className="rdc-rh-key">Tipo</div>
            <InlineField value={data.tipo} onSave={(v) => update("tipo", v)} />
            <span />
          </div>
        ) : null}
        {data.region != null ? (
          <div className="rdc-rh-row">
            <div className="rdc-rh-key">Región</div>
            <InlineField value={data.region} onSave={(v) => update("region", v)} />
            <span />
          </div>
        ) : null}
        {data.jugador ? (
          <div className="rdc-rh-row">
            <div className="rdc-rh-key">Jugador</div>
            <InlineField value={data.jugador} onSave={(v) => update("jugador", v)} />
            <span />
          </div>
        ) : null}
        {data.facciones ? (
          <div className="rdc-rh-row">
            <div className="rdc-rh-key">Facciones</div>
            <span className="rdc-rh-val">
              {data.facciones.map((f, i) => (
                <span key={i} className="rdc-tag" data-tone="gold" style={{ marginRight: 6 }}>{f}</span>
              ))}
            </span>
            <span />
          </div>
        ) : null}
        {data.alias ? (
          <div className="rdc-rh-row">
            <div className="rdc-rh-key">Alias</div>
            <span className="rdc-rh-val" style={{ fontStyle: "italic" }}>{data.alias.join(", ")}</span>
            <span />
          </div>
        ) : null}
      </div>

      <div className="rdc-doc">
        {data.cita ? (
          <div className="rdc-epigrafe">
            {data.cita}
            <small>— {data.nombre}</small>
          </div>
        ) : null}

        <h2>Canon</h2>
        <p className="rdc-has-cap">{data.sumario}</p>
        <p>
          Las notas que siguen son borradores tomados entre sesiones; pueden contradecirse a sí mismas
          y deben tratarse como impresiones, no como dogma. Cuando un dato resulte canónico, márcalo con
          un rombo doble (❖❖) al margen.
        </p>

        <div className="rdc-doc-rule">❦ · ❦ · ❦</div>

        <h2>Apariciones notables</h2>
        <p className="rdc-has-cap">
          La primera mención registrada ocurre en el <b>Episodio 1 — Un Voto de Confianza</b>, cuando
          la cuadrilla llega a la Metrópolis de Cobre. Las siguientes apariciones quedan archivadas en los
          tomos correspondientes y enlazadas desde la barra lateral.
        </p>
        {data.enlaces ? (
          <p>
            <b>Enlaces vivos:</b>{" "}
            {data.enlaces.map((e, i) => (
              <React.Fragment key={i}>
                <a style={{ color: "var(--rdc-accent)", borderBottom: "1px dotted var(--rdc-accent)", textDecoration: "none" }}>{e}</a>
                {i < data.enlaces.length - 1 ? ", " : ""}
              </React.Fragment>
            ))}
          </p>
        ) : null}

        <div className="rdc-margin">
          <b>Nota marginal —</b> Verificar con Kero si la transformación en Coven Rosa ocurre en el Acto III
          o en el IV. Mi memoria miente un poco después de medianoche.
        </div>

        <div className="rdc-doc-rule">❧</div>

        <h2>Resumen editable</h2>
        <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--rdc-ink)" }}>
          <InlineField value={data.sumario} onSave={(v) => update("sumario", v)} multiline />
        </div>
      </div>
    </div>
  );
}

function EpisodeReading({ episode, data, onBack, toasts }) {
  const fragments = data.lectura_ep01;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <button className="rdc-btn" data-variant="ghost" style={{ padding: "6px 12px", fontSize: 10 }} onClick={onBack}>← Volver</button>
        <span style={{ flex: 1 }} />
        <button className="rdc-btn" data-variant="ghost" style={{ padding: "6px 12px", fontSize: 10 }}
          onClick={() => toasts.push({ tone: "success", title: "Marcado", body: "Episodio anclado a tus favoritos.", glyph: "❦" })}>
          ✶ Marcar
        </button>
        <button className="rdc-btn" data-variant="ghost" style={{ padding: "6px 12px", fontSize: 10 }}>↗ Exportar</button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div className="rdc-eyebrow" style={{ justifyContent: "center" }}>
          <span className="rdc-eyebrow-glyph">❦</span>
          <span>Tomo I · Crónica · Episodio {String(episode.numero).padStart(2, "0")}</span>
          <span className="rdc-eyebrow-glyph">❦</span>
        </div>
        <h2 className="rdc-section-title" style={{ fontSize: 64, marginTop: 8 }}>{episode.titulo}</h2>
        <div className="rdc-section-meta" style={{ marginTop: 14 }}>
          {episode.fecha} · {episode.duracion} · {episode.apariciones.length} entidades aparecen
        </div>
      </div>

      <div className="rdc-doc">
        {fragments.map((f, i) => {
          if (f.tipo === "epigrafe") {
            return (
              <div key={i} className="rdc-epigrafe">
                {f.texto}<small>— {f.atrib}</small>
              </div>
            );
          }
          if (f.tipo === "seccion") {
            return (
              <React.Fragment key={i}>
                <h2>{f.titulo}</h2>
                {f.cuerpo.map((b, j) => {
                  if (b.tipo === "parrafo") {
                    return <p key={j} className={b.capitular ? "rdc-has-cap" : ""}>{b.texto}</p>;
                  }
                  if (b.tipo === "cita") {
                    return (
                      <div key={j} className="rdc-cita">
                        {b.texto}
                        {b.atrib ? <small>— {b.atrib}</small> : null}
                      </div>
                    );
                  }
                  if (b.tipo === "marginalia") {
                    return <div key={j} className="rdc-margin"><b>Margen —</b> {b.texto}</div>;
                  }
                  return null;
                })}
                {i < fragments.length - 1 ? <div className="rdc-doc-rule">❦ · ❧ · ❦</div> : null}
              </React.Fragment>
            );
          }
          return null;
        })}

        <Flourish>⁂</Flourish>

        <div className="rdc-readhead" style={{ maxWidth: "none" }}>
          <div className="rdc-rh-row">
            <div className="rdc-rh-key">Apariciones</div>
            <span className="rdc-rh-val">
              {episode.apariciones.map((id) => {
                const p = data.personajes.find((x) => x.id === id);
                return p ? <span key={id} className="rdc-tag" data-tone="gold" style={{ marginRight: 6 }}>{p.nombre}</span> : null;
              })}
            </span>
            <span />
          </div>
          <div className="rdc-rh-row">
            <div className="rdc-rh-key">Resumen</div>
            <InlineField value={episode.sumario}
              onSave={() => toasts.push({ tone: "success", title: "Guardado", body: "Resumen actualizado.", glyph: "❦" })}
              multiline />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Sistema (design system specimen) ───── */
function SistemaView({ edition, mode, palette }) {
  return (
    <div className="rdc-specimen">
      <SectionHead
        eyebrow="Apéndice — Sistema"
        title="Sistema de diseño"
        sub={`Edición ${edition} · ${mode === "dark" ? "Noche" : "Día"} · paleta ${palette}. Tipos, color, ornamentos y componentes.`}
      />

      <div className="rdc-spec-block">
        <div className="rdc-spec-label">Escala tipográfica</div>
        <div className="rdc-type-scale">
          <div>
            <div className="rdc-type-row">
              <div className="rdc-meta">DISPLAY · 52 px</div>
              <div style={{ fontFamily: "var(--rdc-display)", fontSize: 52, lineHeight: 1, letterSpacing: "var(--rdc-display-tracking)" }}>Recuerdos de Cobre</div>
            </div>
          </div>
          <div>
            <div className="rdc-type-row">
              <div className="rdc-meta">H2 · 28 px</div>
              <div style={{ fontFamily: "var(--rdc-display)", fontSize: 28 }}>Llegada a la Metrópolis</div>
            </div>
          </div>
          <div>
            <div className="rdc-type-row">
              <div className="rdc-meta">CUERPO · 17 px</div>
              <div style={{ fontFamily: "var(--rdc-serif)", fontSize: 17, maxWidth: 540 }}>
                Era un tren oscuro, y el desierto detrás de la ventana se había vuelto un solo color sin nombre. Mysha contó los faroles dos veces, y dos veces se equivocó.
              </div>
            </div>
          </div>
          <div>
            <div className="rdc-type-row">
              <div className="rdc-meta">CITA · 19 px italic</div>
              <div style={{ fontStyle: "italic", fontSize: 19, color: "var(--rdc-ink-soft)" }}>“Un voto de sangre no se firma con tinta, niña.”</div>
            </div>
          </div>
          <div>
            <div className="rdc-type-row">
              <div className="rdc-meta">MONO · 12 px</div>
              <div style={{ fontFamily: "var(--rdc-mono)", fontSize: 12, letterSpacing: ".06em" }}>QUEUE · 02 PROCESSED · 04 PENDING · 01</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rdc-spec-block">
        <div className="rdc-spec-label">Paleta</div>
        <div className="rdc-swatches">
          {[
            ["Papiro", "--rdc-paper", "var(--rdc-paper)", "var(--rdc-ink)"],
            ["Papiro suave", "--rdc-paper-soft", "var(--rdc-paper-soft)", "var(--rdc-ink)"],
            ["Tinta", "--rdc-ink", "var(--rdc-ink)", "var(--rdc-paper)"],
            ["Acento", "--rdc-accent", "var(--rdc-accent)", "var(--rdc-paper)"],
            ["Oro", "--rdc-gold", "var(--rdc-gold)", "var(--rdc-paper)"],
            ["Regla", "--rdc-rule-strong", "var(--rdc-rule-strong)", "var(--rdc-ink)"]
          ].map(([name, varName, bg, fg]) => (
            <div key={name} className="rdc-swatch" style={{ background: bg, color: fg, borderColor: "var(--rdc-rule)" }}>
              <b>{name}</b>
              <small>{varName}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="rdc-spec-block">
        <div className="rdc-spec-label">Ornamentos</div>
        <div className="rdc-ornament-grid">
          {[
            ["❦", "flourish"],["❧", "leaf"],["❖", "lozenge"],["⚜", "crest"],["⚖", "scale"],
            ["☉", "sun"],["☽", "moon"],["☿", "mercury"],["✠", "cross"],["✦", "star"]
          ].map(([g, n]) => (
            <div key={n}>
              <span className="glyph">{g}</span>
              <span className="name">{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rdc-spec-block">
        <div className="rdc-spec-label">Componentes</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <button className="rdc-btn" data-variant="primary">✶ Acción principal</button>
          <button className="rdc-btn">Secundario</button>
          <button className="rdc-btn" data-variant="ghost">Fantasma</button>
          <button className="rdc-btn" data-variant="danger">Tachar</button>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <StateBadge state="pendiente" />
          <StateBadge state="procesando" />
          <StateBadge state="listo" />
          <StateBadge state="error" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <EntityCard entity={{
            nombre: "Annora", epiteto: "Voz de la Hermandad", rol: "NPC",
            region: "Metrópolis de Cobre", facciones: ["Hermandad de Cobre"],
            sigilo: "❧", sumario: "Líder rebelde con parche y collar de rubí. 150 000 monedas de recompensa."
          }} />
          <EntityCard entity={{
            nombre: "Metrópolis de Cobre", tipo: "Ciudad", region: "Eyra",
            sigilo: "❖", sumario: "Ciudad steampunk de cobre y vapor. La magia está prohibida intramuros."
          }} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EpisodiosView, DirectorioView, LecturaView, SistemaView });
