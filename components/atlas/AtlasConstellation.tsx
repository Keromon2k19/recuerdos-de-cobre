"use client";

// Constelación de Té de Media Noche. Coreografía determinista (anillo →
// foco → expediente) — NO es el grafo force-directed (AtlasRelationsGraph).
// Referencia visual: docs/ui-v2/te-de-media-noche-reference.html

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ConstellationData,
  ConstellationMember,
  ConstellationSat,
} from "@/lib/te-de-media-noche";

type XY = { x: number; y: number };
type WireSpec = {
  key: string;
  x1: number; y1: number; x2: number; y2: number;
  kind: "normal" | "soft" | "cut";
  delay: number;
  lit?: boolean;   // hover: vínculo del retrato señalado
  dim?: boolean;   // hover: el resto cede protagonismo
};

const DEG = Math.PI / 180;

function ringPos(cx: number, cy: number, r: number, count: number, i: number, offset = 0): XY {
  const a = (-90 + (i + offset) * (360 / count)) * DEG;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

const ABILITY_ROWS: Array<[string, "str" | "dex" | "con" | "int" | "wis" | "cha"]> = [
  ["FUE", "str"], ["DES", "dex"], ["CON", "con"], ["INT", "int"], ["SAB", "wis"], ["CAR", "cha"],
];
function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`; // signo menos tipográfico U+2212
}

// Línea con animación de dibujado (stroke-dashoffset) o fade (cut).
function Wire({ w }: { w: WireSpec }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), w.delay);
    return () => clearTimeout(t);
  }, [w.delay]);
  const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
  const draw = w.kind !== "cut";
  return (
    <line
      x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
      className={`av2-tdmn-wire${w.kind === "soft" ? " is-soft" : ""}${w.kind === "cut" ? " is-cut" : ""}${on ? " show" : ""}${w.lit ? " is-lit" : ""}${w.dim ? " is-dimmed" : ""}`}
      style={
        draw
          ? {
              strokeDasharray: len,
              strokeDashoffset: on ? 0 : len,
              transition:
                "stroke-dashoffset 1.15s cubic-bezier(.22,1,.36,1), opacity .4s ease",
              // desfasa la respiración del glow para que no late todo junto
              animationDelay: `${(w.delay % 900)}ms`,
            }
          : { transition: "opacity .8s ease" }
      }
    />
  );
}

export default function AtlasConstellation({ data }: { data: ConstellationData }) {
  const { members, edges, cutEdges, satsByMember } = data;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [size, setSize] = useState({ w: 1200, h: 720 });
  const [focused, setFocused] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Escape cierra por niveles (ficha → expediente → foco → reposo)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (flipped) setFlipped(false);
      else if (expanded) setExpanded(false);
      else if (focused) setFocused(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, expanded, focused]);

  // Al abrir el expediente, llevar el foco al botón de cierre (a11y dialog).
  useEffect(() => {
    if (expanded) closeBtnRef.current?.focus();
  }, [expanded]);

  // Resetea el giro al cerrar el expediente.
  useEffect(() => {
    if (!expanded) setFlipped(false);
  }, [expanded]);

  const cx = size.w / 2;
  const cy = size.h / 2;

  // Posiciones por miembro según estado
  const memberPos = useMemo(() => {
    const map = new Map<string, XY>();
    if (!focused) {
      const R = Math.min(size.w * 0.34, size.h * 0.4, 400);
      members.forEach((m, i) => map.set(m.slug, ringPos(cx, cy, R, members.length, i)));
    } else {
      map.set(focused, { x: cx, y: cy });
      const others = members.filter((m) => m.slug !== focused);
      const Ro = Math.min(size.w * 0.43, size.h * 0.47, 460);
      others.forEach((m, i) => map.set(m.slug, ringPos(cx, cy, Ro, others.length, i, 0.5)));
    }
    return map;
  }, [members, focused, cx, cy, size.w, size.h]);

  const sats: ConstellationSat[] = focused ? satsByMember[focused] ?? [] : [];
  const satPos = useMemo(() => {
    const Rs = Math.min(size.w * 0.23, size.h * 0.29, 250);
    return sats.map((_, i) => ringPos(cx, cy, Rs, Math.max(sats.length, 1), i));
  }, [sats, cx, cy, size.w, size.h]);

  // Wires según estado. Cut = dos tramos punteados con hueco (t=0.42).
  const wires = useMemo(() => {
    const list: WireSpec[] = [];
    const pushCut = (p1: XY, p2: XY, key: string, delay: number) => {
      const t = 0.42, gx = p2.x - p1.x, gy = p2.y - p1.y;
      list.push({ key: `${key}-a`, x1: p1.x, y1: p1.y, x2: p1.x + gx * t, y2: p1.y + gy * t, kind: "cut", delay });
      list.push({ key: `${key}-b`, x1: p2.x, y1: p2.y, x2: p2.x - gx * t, y2: p2.y - gy * t, kind: "cut", delay: delay + 120 });
    };
    if (!focused) {
      const hov = hoveredSlug;
      edges.forEach((e, i) => {
        const p1 = memberPos.get(e.a), p2 = memberPos.get(e.b);
        if (!p1 || !p2) return;
        const lit = hov != null && (e.a === hov || e.b === hov);
        list.push({ key: `e-${e.a}-${e.b}`, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, kind: "normal", delay: i * 95 + 80, lit, dim: hov != null && !lit });
      });
      cutEdges.forEach(([a, b], i) => {
        const p1 = memberPos.get(a), p2 = memberPos.get(b);
        if (!p1 || !p2) return;
        const lit = hov != null && (a === hov || b === hov);
        const before = list.length;
        pushCut(p1, p2, `cut-${a}-${b}`, (edges.length + i) * 95 + 80);
        for (let k = before; k < list.length; k++) { list[k].lit = lit; list[k].dim = hov != null && !lit; }
      });
    } else {
      const c = { x: cx, y: cy };
      sats.forEach((s, i) => {
        const p = satPos[i];
        list.push({ key: `s-${focused}-${s.slug}`, x1: c.x, y1: c.y, x2: p.x, y2: p.y, kind: "normal", delay: i * 95 + 80 });
      });
      const focusedMember = members.find((m) => m.slug === focused);
      members.filter((m) => m.slug !== focused).forEach((m, i) => {
        const p = memberPos.get(m.slug);
        if (!p) return;
        const broken = m.estado === "separado" || focusedMember?.estado === "separado";
        if (broken) pushCut(c, p, `cut-f-${focused}-${m.slug}`, (sats.length + i) * 95 + 80);
        else list.push({ key: `o-${focused}-${m.slug}`, x1: c.x, y1: c.y, x2: p.x, y2: p.y, kind: "soft", delay: (sats.length + i) * 95 + 80 });
      });
    }
    return list;
  }, [focused, hoveredSlug, edges, cutEdges, memberPos, sats, satPos, members, cx, cy]);

  const focusedMember: ConstellationMember | undefined = members.find((m) => m.slug === focused);

  const onStageClick = useCallback((e: React.MouseEvent) => {
    const t = e.target as Element;
    if (t.closest(".av2-tdmn-node") || t.closest(".av2-tdmn-card") || t.closest(".av2-tdmn-back")) return;
    if (expanded) setExpanded(false);
    else if (focused) setFocused(null);
  }, [expanded, focused]);

  const onMemberClick = useCallback((slug: string) => {
    // Con el expediente abierto los nodos están velados: cerrar, no re-enfocar.
    if (expanded) { setExpanded(false); return; }
    if (focused === slug) setExpanded(true);
    else setFocused(slug);
  }, [focused, expanded]);

  const meta = expanded
    ? "Expediente abierto · click afuera o ✕ para cerrar"
    : focusedMember
      ? focusedMember.estado === "separado"
        ? `${focusedMember.name} · primer líder · dejó el grupo · otro click abre su expediente`
        : `${sats.length} vínculos cercanos · otro click abre su expediente`
      : "El grupo — diez integrantes · tocá a uno para abrir sus vínculos";

  return (
    <>
    <div
      ref={stageRef}
      className={`av2-tdmn-stage${expanded ? " is-veil" : ""}${focused ? " is-focused" : ""}`}
      onClick={onStageClick}
    >
      <div className={`av2-tdmn-page-fade${expanded ? " show" : ""}`} aria-hidden="true" />
      <div className="av2-tdmn-head">
        {/* En reposo el subtítulo de la página ya presenta al grupo */}
        <p className="av2-tdmn-meta">{focused ? meta : ""}</p>
        <button
          type="button"
          className={`av2-tdmn-back${focused ? " show" : ""}`}
          tabIndex={focused ? 0 : -1}
          onClick={() => { setExpanded(false); setFocused(null); }}
        >
          ← Té de Media Noche
        </button>
      </div>

      <svg className="av2-tdmn-wires" width={size.w} height={size.h}>
        {wires.map((w) => <Wire key={w.key} w={w} />)}
      </svg>

      {members.map((m, i) => {
        const p = memberPos.get(m.slug)!;
        const isCenter = focused === m.slug;
        const isDim = focused !== null && !isCenter;
        return (
          <div
            key={m.slug}
            className={`av2-tdmn-pos${isDim ? " is-dim" : ""}${m.estado === "separado" && !isCenter ? " is-ex" : ""}`}
            style={{ left: p.x, top: p.y, animationDelay: `${-i * 0.8}s` }}
          >
            <button
              type="button"
              className={`av2-tdmn-node${isCenter ? " is-center" : ""}${m.estado === "separado" ? " is-ex" : ""}`}
              style={{ animationDelay: `${i * 110}ms` }}
              onClick={() => onMemberClick(m.slug)}
              onMouseEnter={() => { if (!focused) setHoveredSlug(m.slug); }}
              onMouseLeave={() => setHoveredSlug(null)}
              aria-label={isCenter ? `Abrir expediente de ${m.name}` : `Ver vínculos de ${m.name}`}
            >
              <span className="av2-tdmn-ring" />
              <span className="av2-tdmn-disc">
                <img src={m.imageSrc} alt={`Retrato de ${m.name}`} />
              </span>
              <span className="av2-tdmn-label">
                {m.name}
                {m.estado === "separado" && <small>primer líder · se separó</small>}
              </span>
            </button>
          </div>
        );
      })}

      {focused && sats.map((s, i) => {
        const p = satPos[i];
        return (
          <div
            key={`${focused}-${s.slug}`}
            className="av2-tdmn-pos"
            style={{ left: p.x, top: p.y, animationDelay: `${-i * 0.7}s` }}
          >
            <div
              className={`av2-tdmn-node is-sat${s.kind === "faccion" ? " is-fac" : ""}`}
              style={{ animationDelay: `${280 + i * 110}ms` }}
            >
              <span className="av2-tdmn-ring" />
              <span className="av2-tdmn-disc">
                {s.kind === "faccion"
                  ? <span className="av2-tdmn-sig">{s.sigla}</span>
                  : <img src={s.imageSrc} alt={`Retrato de ${s.name}`} />}
              </span>
              <span className="av2-tdmn-label">
                {s.name}
                {s.kind === "faccion" && <small>facción</small>}
              </span>
            </div>
          </div>
        );
      })}

      {focusedMember && (
        <div
          className={`av2-tdmn-card${expanded ? " show" : ""}${flipped ? " is-flipped" : ""}`}
          role="dialog"
          aria-label={flipped ? `Ficha técnica de ${focusedMember.name}` : `Expediente de ${focusedMember.name}`}
          inert={!expanded}
        >
          <div className="av2-tdmn-card-flip">
            {/* FRENTE — narrativa */}
            <div className="av2-tdmn-card-face is-front" inert={flipped || undefined}>
              <button type="button" className="av2-tdmn-card-x" ref={closeBtnRef} onClick={() => setExpanded(false)} aria-label="Cerrar expediente">✕</button>
              <div className="av2-tdmn-card-img">
                <img src={focusedMember.imageSrc} alt={`Retrato de ${focusedMember.name}`} />
              </div>
              <div className="av2-tdmn-card-body">
                {/* La audiencia es el grupo: nada de PJ/NPC como apertura */}
                {focusedMember.etiqueta && <p className="av2-tdmn-card-eye">{focusedMember.etiqueta}</p>}
                <h2 className="av2-tdmn-card-name">{focusedMember.name}</h2>
                <p className="av2-tdmn-card-alias">
                  {focusedMember.aliases.length > 0 ? `alias — ${focusedMember.aliases.join(" · ")}` : " "}
                </p>
                <p className="av2-tdmn-card-bio">{focusedMember.bio}</p>
                <div className="av2-tdmn-card-stats">
                  <div><b>{focusedMember.episodes}</b><span>episodios</span></div>
                  <div><b>{(satsByMember[focusedMember.slug] ?? []).length}</b><span>vínculos</span></div>
                  {focusedMember.stats && (
                    <div><b>{focusedMember.stats.nivel}</b><span>nivel</span></div>
                  )}
                </div>
                <div className="av2-tdmn-foot-row">
                  <Link className="av2-tdmn-card-foot" href={focusedMember.href}>Ver ficha completa →</Link>
                  {focusedMember.stats && (
                    <button type="button" className="av2-tdmn-card-foot av2-tdmn-flip-link" onClick={() => setFlipped(true)}>
                      Ficha técnica ↻
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* REVERSO — ficha técnica (solo si hay stats) */}
            {focusedMember.stats && (
              <div className="av2-tdmn-card-face is-back" inert={!flipped || undefined}>
                <div className="av2-tdmn-sheet">
                  <div className="av2-tdmn-sheet-top">
                    <div>
                      <p className="av2-tdmn-card-eye">Ficha técnica · D&amp;D 5e</p>
                      <h3>{focusedMember.name}</h3>
                      <div className="av2-tdmn-sheet-cls">{focusedMember.stats.clase} · Nivel {focusedMember.stats.nivel}</div>
                      {(focusedMember.edad || focusedMember.altura) && (
                        <div className="av2-tdmn-sheet-ident">
                          {[focusedMember.edad ? `${focusedMember.edad} años` : null, focusedMember.altura].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    {focusedMember.raza && <div className="av2-tdmn-sheet-race">{focusedMember.raza}</div>}
                  </div>

                  <div className="av2-tdmn-vitals">
                    {focusedMember.stats.ac != null && <div className="av2-tdmn-vital"><b>{focusedMember.stats.ac}</b><span>Clase de Armadura</span></div>}
                    <div className="av2-tdmn-vital"><b>{focusedMember.stats.hpMax}</b><span>Puntos de golpe</span></div>
                    {focusedMember.stats.speed && <div className="av2-tdmn-vital"><b>{focusedMember.stats.speed}</b><span>Velocidad</span></div>}
                  </div>

                  <div className="av2-tdmn-abil">
                    {ABILITY_ROWS.map(([label, key]) => {
                      const ab = focusedMember.stats!.abilities[key];
                      return (
                        <div key={key} className={`av2-tdmn-ab${ab.mod >= 4 ? " is-hi" : ""}`}>
                          <div className="k">{label}</div>
                          <div className="v">{ab.value}</div>
                          <div className="m">{fmtMod(ab.mod)}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="av2-tdmn-traits">
                    {focusedMember.stats.resistances.length > 0 && (
                      <div className="av2-tdmn-trait"><div className="lab">Resist.</div><div className="val res">{focusedMember.stats.resistances.join(" · ")}</div></div>
                    )}
                    {[...focusedMember.stats.damageImmunities, ...focusedMember.stats.conditionImmunities].length > 0 && (
                      <div className="av2-tdmn-trait"><div className="lab">Inmune</div><div className="val">{[...focusedMember.stats.damageImmunities, ...focusedMember.stats.conditionImmunities].join(" · ")}</div></div>
                    )}
                    {focusedMember.stats.senses.length > 0 && (
                      <div className="av2-tdmn-trait"><div className="lab">Sentidos</div><div className="val">{focusedMember.stats.senses.join(" · ")}</div></div>
                    )}
                    {focusedMember.stats.languages.length > 0 && (
                      <div className="av2-tdmn-trait"><div className="lab">Idiomas</div><div className="val">{focusedMember.stats.languages.join(", ")}</div></div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="av2-tdmn-card-foot av2-tdmn-flip-link av2-tdmn-flip-back"
                    onClick={() => { setFlipped(false); requestAnimationFrame(() => closeBtnRef.current?.focus()); }}
                  >
                    ↻ Volver al expediente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
    <p className="av2-tdmn-hint" style={{ opacity: focused ? 0 : 1 }}>
      Pasá el cursor · <b>click</b> abre vínculos · <b>segundo click</b> abre el expediente · click afuera vuelve
    </p>
    </>
  );
}
