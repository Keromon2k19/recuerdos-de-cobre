# Plan de implementación — Timeline de la campaña (UI V2)

> **Para quien lo implemente (Codex/Claude):** Este plan es autocontenido. Antes
> de tocar nada, leer `CLAUDE.md` (sección "UI V2 pública" + "Protocolo obligatorio
> de referencia visual") y abrir la referencia visual aprobada:
> `docs/ui-v2/timeline-reference.html` (abrir en navegador / screenshot). Es la
> fuente de verdad del look & feel y de la animación. Los pasos usan checkbox
> `- [ ]` para tracking.

**Goal:** Una página nueva `/v2/timeline` que muestra los ~81 registros de episodios
como una línea de tiempo vertical scrolleable, con eje central numerado, cards
alternadas izquierda/derecha y una animación anclada al scroll (las cards entran al
subir desde abajo y se desvanecen al salir por arriba).

**Architecture:** Página server component que reutiliza la carga de datos de
`/v2/capitulos` (`cachedListEpisodes` + `cachedListByType("personaje")`), mapea a
`TimelineItem[]` con un helper puro y testeable (`lib/atlas-v2-timeline.ts`), y los
pasa a un client component (`components/atlas-v2/AtlasTimeline.tsx`) que renderiza el
eje, las cards y la animación scroll-scrubbed. Estilos en CSS puro dentro de
`app/(v2)/v2/atlas-v2.css`, scoped bajo `.atlas`, usando los tokens `--av2-*`
existentes. Sin Tailwind, sin shadcn.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript · CSS puro
(atlas-v2.css) · vitest (unit del helper) · `scripts/v2-screenshot.mjs` (QA visual).

---

## Decisiones de diseño (acordadas en brainstorming)

1. **Página nueva e independiente** en `/v2/timeline`. NO reemplaza ni modifica
   `/v2/capitulos` (que sigue siendo el master-detail). Se suma a la nav.
2. **Orden ascendente**: Episodio 1 arriba → último abajo (al revés de capítulos/home
   que muestran lo más nuevo primero). Es una línea de tiempo que se recorre reviviendo
   la campaña.
3. **Agrupación: lineal y plana (1→N)** con un **índice flotante de progreso** a la
   derecha. La agrupación por **Actos/arcos** queda como mejora futura (ver abajo).
4. **Anatomía de la card** (de adentro hacia afuera): `eyebrow` mono ("EPISODIO 2 ·
   PARTE 1") → `título` serif grande → `ubicación` con ícono de pin → `descripción`
   recortada a 3 líneas → `chips de personajes` (avatar-inicial + nombre, PJs primero,
   tope ~4 visibles + "+N"). **Sin miniatura de imagen** (texto limpio/editorial).
5. **Eje central** con gradiente de cobre y **nodos circulares** (46px) con el número
   del episodio. El número va **ópticamente centrado** (ver Task 2, helper de
   auto-centrado). Conector fino exacto entre el borde de la card y el nodo.
6. **Partes**: una card por archivo de episodio. Los episodios con partes comparten
   número, así que el nodo muestra el mismo número dos veces (ej. "2" y "2"); la
   distinción va en el eyebrow ("Parte 1" / "Parte 2"). **Sin badge** en el nodo
   (probado y descartado).
7. **Animación anclada al scroll (scrubbed, bidireccional)**: cada card está ligada a
   su posición en el viewport. Entra deslizándose desde su lado (izq/der) + apareciendo
   cuando sube desde abajo, queda firme en el centro, y se desliza + desvanece al salir
   por arriba. El **nodo** escala/aparece junto con su card pero **siempre queda clavado
   en el eje** (nunca se traslada horizontalmente). Solo `transform` + `opacity`.
   **Respetar `prefers-reduced-motion`**: con reduced-motion, todo a opacidad 1, sin
   transform.

> Nota de alineación con `docs/GOAL.md`: la timeline es una página exploratoria/
> cinematográfica, no de lectura larga, pero igual cumple las reglas de animación del
> GOAL: solo `transform`/`opacity`, y `prefers-reduced-motion` desactiva el efecto. No
> debe competir con la lectura de las cards (la card queda estática y legible mientras
> está en el centro).

---

## Estructura de archivos

- **Crear** `lib/atlas-v2-timeline.ts` — helper puro `buildTimelineItems(episodes,
  characters) → TimelineItem[]`. Sin acceso a fs. Testeable. Responsabilidad única:
  transformar episodios del vault en items listos para render (orden, eyebrow, lugar,
  personajes ordenados, lado alternado).
- **Crear** `tests/atlas-v2-timeline.test.ts` — unit test del helper (orden, eyebrow,
  lado, personajes).
- **Crear** `components/atlas-v2/AtlasTimeline.tsx` — client component. Render del eje,
  filas/cards/nodos, índice de progreso, y la lógica de animación scroll-scrubbed +
  auto-centrado del número.
- **Crear** `app/(v2)/v2/timeline/page.tsx` — server component. Carga datos, llama al
  helper, envuelve en `AtlasPageScene` y renderiza `<AtlasTimeline items={...} />`.
- **Modificar** `app/(v2)/v2/atlas-v2.css` — agregar el bloque de estilos `av2-tl-*`
  (al final del archivo, en una sección comentada).
- **Modificar** `components/atlas-v2/AtlasTopNav.tsx:24` — agregar el link de la
  timeline al grupo "Crónicas".

> **Decisión de aislamiento (DRY vs riesgo):** los helpers de string (`stripWikilink`,
> `cleanTitulo`, `episodeEyebrow`, `normalizeName`, `buildRoleIndex`, `sortPersonajes`)
> existen hoy inline en `app/(v2)/v2/capitulos/page.tsx`. Para NO tocar una página que
> ya funciona, este plan los **re-implementa dentro de `lib/atlas-v2-timeline.ts`**
> (≈30 líneas duplicadas). Es una decisión consciente que prioriza no romper capítulos.
> Mejora futura opcional: extraer estos helpers a `lib/atlas-v2-episode-fields.ts` y
> que ambos (capítulos + timeline) los importen.

---

## Modelo de datos

```ts
// lib/atlas-v2-timeline.ts

export type TimelinePersona = {
  name: string;       // "Mysha"
  initial: string;    // "M"
  isPlayer: boolean;  // rol === "pj"
};

export type TimelineItem = {
  id: string;          // único por archivo, ej. "2-1" (numero-parte)
  numero: number;      // número de episodio (etiqueta del nodo)
  eyebrow: string;     // "EPISODIO 2 - PARTE 1"
  titulo: string;      // título limpio (sin "Recuerdos de Cobre N:")
  lugar: string;       // ubicación principal (primer lugar de menciones)
  descripcion: string; // resumen corto (puede quedar "")
  personajes: TimelinePersona[]; // ordenados, PJs primero, tope 8
  side: "left" | "right";        // alternado por índice
  href: string;        // "/v2/capitulos/2" (link al expediente) — ver Decisión abierta
};
```

`cachedListEpisodes(vp)` devuelve objetos con
`{ numero, titulo, filename, procesado, image?, imageAlt?, menciones?, descripcion? }`.
`cachedListByType(vp, "personaje")` devuelve items con `{ nombre, slug, rol, ... }`.
`parseEpisodioRef(titulo)` (de `@/lib/episode-number`) devuelve `{ ep, parte } | null`.

---

## Task 1: Helper de datos `lib/atlas-v2-timeline.ts` (+ test)

**Files:**
- Create: `lib/atlas-v2-timeline.ts`
- Test: `tests/atlas-v2-timeline.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/atlas-v2-timeline.test.ts
import { describe, it, expect } from "vitest";
import { buildTimelineItems } from "@/lib/atlas-v2-timeline";

const episodes = [
  // Desordenados a propósito: el helper debe ordenarlos ascendente.
  { numero: 2, titulo: "Recuerdos de Cobre 2, Parte 2: Bajo la Sombra del Tsunami",
    filename: "003.md", procesado: "", menciones: {
      personajes: ["[[mysha|Mysha]]", "[[borok|Borok]]"],
      lugares: ["[[lugares/metropolis-de-cobre|Metrópolis de Cobre]]"] },
    descripcion: "De vuelta en el gremio." },
  { numero: 1, titulo: "Recuerdos de Cobre 1: Un Voto de Confianza",
    filename: "001.md", procesado: "", menciones: {
      personajes: ["[[narcissa|Narcissa]]", "[[mysha|Mysha]]"],
      lugares: ["[[lugares/metropolis-de-cobre|Metrópolis de Cobre]]"] },
    descripcion: "Seis desconocidos bajan del tren." },
  { numero: 2, titulo: "Recuerdos de Cobre 2, Parte 1: Bajo la Sombra del Tsunami",
    filename: "002.md", procesado: "", menciones: {
      personajes: ["[[mysha|Mysha]]"],
      lugares: ["[[alcantarillas-antiguas|Alcantarillas antiguas]]"] },
    descripcion: "Tras los trogloditas." },
];

const characters = [
  { nombre: "Mysha", slug: "mysha", rol: "PJ", apariciones: [] },
  { nombre: "Borok", slug: "borok", rol: "PJ", apariciones: [] },
  { nombre: "Narcissa", slug: "narcissa", rol: "PJ", apariciones: [] },
];

describe("buildTimelineItems", () => {
  it("ordena ascendente por episodio y parte", () => {
    const items = buildTimelineItems(episodes as any, characters as any);
    expect(items.map((i) => i.id)).toEqual(["1-0", "2-1", "2-2"]);
  });

  it("formatea el eyebrow con parte", () => {
    const items = buildTimelineItems(episodes as any, characters as any);
    expect(items[0].eyebrow).toBe("EPISODIO 1");
    expect(items[1].eyebrow).toBe("EPISODIO 2 - PARTE 1");
  });

  it("alterna los lados empezando por la izquierda", () => {
    const items = buildTimelineItems(episodes as any, characters as any);
    expect(items.map((i) => i.side)).toEqual(["left", "right", "left"]);
  });

  it("limpia el título y toma el primer lugar como ubicación", () => {
    const items = buildTimelineItems(episodes as any, characters as any);
    expect(items[0].titulo).toBe("Un Voto de Confianza");
    expect(items[0].lugar).toBe("Metrópolis de Cobre");
  });

  it("ordena personajes con iniciales", () => {
    const items = buildTimelineItems(episodes as any, characters as any);
    // Ep 1: menciona Narcissa, Mysha -> ambos PJ, se respeta orden de mención.
    expect(items[0].personajes.map((p) => p.initial)).toEqual(["N", "M"]);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run tests/atlas-v2-timeline.test.ts`
Expected: FAIL — "Cannot find module '@/lib/atlas-v2-timeline'".

- [ ] **Step 3: Implementar el helper**

```ts
// lib/atlas-v2-timeline.ts
import { parseEpisodioRef } from "@/lib/episode-number";

export type TimelinePersona = { name: string; initial: string; isPlayer: boolean };
export type TimelineItem = {
  id: string; numero: number; eyebrow: string; titulo: string;
  lugar: string; descripcion: string; personajes: TimelinePersona[];
  side: "left" | "right"; href: string;
};

type VaultEpisode = {
  numero: number; titulo: string;
  menciones?: { personajes?: string[]; lugares?: string[] };
  descripcion?: string;
};
type CharacterItem = { nombre: string; slug: string; rol?: string };

const MAX_PERSONAJES = 8;
const PLAYER_ORDER = ["mysha", "narcissa", "eryon", "io campbell", "layra", "selenne", "veltra"];

function stripWikilink(s: string): string {
  return s.replace(/^\[\[(?:[^|\]]+\|)?([^\]]+)\]\]$/, "$1").trim();
}
function cleanTitulo(titulo: string): string {
  const i = titulo.indexOf(": ");
  return i > 0 ? titulo.slice(i + 2) : titulo;
}
function normalizeName(s: string): string {
  return stripWikilink(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function episodeEyebrow(titulo: string, fallbackNumero: number): string {
  const ref = parseEpisodioRef(titulo);
  if (!ref) return `REGISTRO ${String(fallbackNumero).padStart(3, "0")}`;
  const ep = `EPISODIO ${Number.isInteger(ref.ep) ? ref.ep : String(ref.ep)}`;
  return ref.parte ? `${ep} - PARTE ${ref.parte}` : ep;
}
function initialOf(name: string): string {
  const c = stripWikilink(name).trim().charAt(0);
  return c ? c.toUpperCase() : "·";
}
function buildRoleIndex(characters: CharacterItem[]): Map<string, string> {
  const idx = new Map<string, string>();
  for (const c of characters) {
    if (!c.rol) continue;
    idx.set(normalizeName(c.nombre), c.rol);
    idx.set(normalizeName(c.slug), c.rol);
  }
  return idx;
}
function sortPersonajes(menciones: string[] | undefined, roles: Map<string, string>): TimelinePersona[] {
  const seen = new Set<string>();
  const list = (menciones ?? [])
    .map((raw, index) => ({ name: stripWikilink(raw), key: normalizeName(raw), index }))
    .filter((it) => { if (!it.key || seen.has(it.key)) return false; seen.add(it.key); return true; });
  return list
    .sort((a, b) => {
      const aP = roles.get(a.key)?.toLowerCase() === "pj";
      const bP = roles.get(b.key)?.toLowerCase() === "pj";
      if (aP !== bP) return aP ? -1 : 1;
      if (aP && bP) {
        const ai = PLAYER_ORDER.indexOf(a.key); const bi = PLAYER_ORDER.indexOf(b.key);
        const ar = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
        const br = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
        if (ar !== br) return ar - br;
      }
      return a.index - b.index;
    })
    .slice(0, MAX_PERSONAJES)
    .map((it) => ({
      name: it.name, initial: initialOf(it.name),
      isPlayer: roles.get(it.key)?.toLowerCase() === "pj",
    }));
}

export function buildTimelineItems(
  episodes: VaultEpisode[], characters: CharacterItem[],
): TimelineItem[] {
  const roles = buildRoleIndex(characters);
  const withKey = episodes.map((ep) => {
    const ref = parseEpisodioRef(ep.titulo);
    const epNum = ref && Number.isInteger(ref.ep) ? (ref.ep as number) : ep.numero;
    const parte = ref?.parte ?? 0;
    return { ep, sortEp: epNum, sortParte: parte };
  });
  withKey.sort((a, b) => a.sortEp - b.sortEp || a.sortParte - b.sortParte);

  return withKey.map(({ ep, sortEp, sortParte }, index) => {
    const lugar = ep.menciones?.lugares?.[0] ? stripWikilink(ep.menciones.lugares[0]) : "";
    return {
      id: `${sortEp}-${sortParte}`,
      numero: ep.numero,
      eyebrow: episodeEyebrow(ep.titulo, ep.numero),
      titulo: cleanTitulo(ep.titulo),
      lugar,
      descripcion: ep.descripcion ?? "",
      personajes: sortPersonajes(ep.menciones?.personajes, roles),
      side: index % 2 === 0 ? "left" : "right",
      href: `/v2/capitulos/${ep.numero}`,
    };
  });
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run tests/atlas-v2-timeline.test.ts`
Expected: PASS (5 tests).

> Si `parseEpisodioRef` no separa "ep" de "parte" como asume el test (revisar
> `lib/episode-number.ts`), ajustar las expectativas del test al contrato real de esa
> función — NO inventar el formato.

- [ ] **Step 5: Commit**

```bash
git add lib/atlas-v2-timeline.ts tests/atlas-v2-timeline.test.ts
git commit -m "feat(timeline): helper de datos buildTimelineItems + test"
```

---

## Task 2: Client component `components/atlas-v2/AtlasTimeline.tsx`

**Files:**
- Create: `components/atlas-v2/AtlasTimeline.tsx`

Responsabilidad: render del eje + filas/cards/nodos + índice de progreso + animación
scroll-scrubbed + auto-centrado óptico del número. Toda la lógica de animación va acá
(no en el server). Markup y clases reflejan `docs/ui-v2/timeline-reference.html`.

- [ ] **Step 1: Escribir el componente**

```tsx
"use client";

// components/atlas-v2/AtlasTimeline.tsx
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { TimelineItem } from "@/lib/atlas-v2-timeline";

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const MAX_CHIPS = 4;

export default function AtlasTimeline({ items }: { items: TimelineItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Auto-centrado óptico del número dentro del nodo (mide métricas reales del glifo).
  useEffect(() => {
    const apply = () => {
      try {
        const fs = 20, lh = 20;
        const ctx = document.createElement("canvas").getContext("2d");
        if (!ctx) return;
        ctx.font = `600 ${fs}px "Cormorant Garamond", serif`;
        const m = ctx.measureText("012345678");
        const halfLeading = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
        const baselineFromTop = halfLeading + m.fontBoundingBoxAscent;
        const inkCenter = baselineFromTop + (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;
        const nudge = Math.round(-(inkCenter - lh / 2) * 100) / 100;
        rootRef.current?.style.setProperty("--av2-tl-num-nudge", `${nudge}px`);
      } catch { /* fallback en CSS: 1px */ }
    };
    if (document.fonts?.ready) document.fonts.ready.then(apply);
    else apply();
  }, []);

  // Animación anclada al scroll + índice de progreso.
  // Se "arma" agregando .is-animated (oculta cards/nodos vía CSS) solo si hay JS y no
  // hay reduced-motion → sin JS o con reduced-motion, todo queda visible por defecto.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = Array.from(root.querySelectorAll<HTMLElement>(".av2-tl-row"));
    const thumb = root.querySelector<HTMLElement>(".av2-tl-progress-thumb");
    const caption = root.querySelector<HTMLElement>(".av2-tl-progress-cap");

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const smooth = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    if (!reduce) root.classList.add("is-animated");

    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      let best = 0, bestD = Infinity;
      rows.forEach((row, i) => {
        const r = row.getBoundingClientRect();
        const center = r.top + r.height / 2;
        if (!reduce) {
          const card = row.querySelector<HTMLElement>(".av2-tl-card");
          const node = row.querySelector<HTMLElement>(".av2-tl-node");
          if (card && node) {
            const from = row.dataset.side === "right" ? 52 : -52;
            const rel = center / vh; // 1 = abajo, 0 = arriba
            let op: number, tx: number, ns: number;
            if (rel > 0.7) { const t = smooth((1 - rel) / 0.3); op = t; tx = lerp(from, 0, t); ns = lerp(0.55, 1, t); }
            else if (rel < 0.3) { const t = smooth((0.3 - rel) / 0.3); op = 1 - t; tx = lerp(0, from, t); ns = lerp(1, 0.55, t); }
            else { op = 1; tx = 0; ns = 1; }
            card.style.opacity = String(op);
            card.style.transform = `translateX(${tx.toFixed(1)}px)`;
            node.style.opacity = String(op);
            node.style.transform = `translate(-50%,-50%) scale(${ns.toFixed(3)})`;
          }
        }
        const d = Math.abs(center - vh / 2);
        if (d < bestD) { bestD = d; best = i; }
      });
      // Índice de progreso: thumb proporcional al avance + caption del episodio activo.
      const rb = root.getBoundingClientRect();
      const total = rb.height - vh;
      const p = clamp(total > 0 ? -rb.top / total : 0, 0, 1);
      if (thumb) thumb.style.top = `${(p * 100).toFixed(2)}%`;
      if (caption && rows[best]) caption.textContent = `EP ${rows[best].dataset.num ?? ""}`;
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", update); };
  }, [items.length]);

  return (
    <div className="av2-tl" ref={rootRef}>
      <div className="av2-tl-spine" aria-hidden="true" />
      <div className="av2-tl-progress" aria-hidden="true">
        <span className="av2-tl-progress-label">Episodios</span>
        <span className="av2-tl-progress-track"><span className="av2-tl-progress-thumb" /></span>
        <span className="av2-tl-progress-cap">EP {items[0]?.numero ?? ""}</span>
      </div>
      <ol className="av2-tl-list">
        {items.map((it) => {
          const shown = it.personajes.slice(0, MAX_CHIPS);
          const rest = it.personajes.length - shown.length;
          return (
            <li key={it.id} className="av2-tl-row" data-side={it.side} data-num={it.numero}>
              <div className="av2-tl-node" aria-hidden="true">
                <span className="av2-tl-num">{it.numero}</span>
              </div>
              <Link href={it.href} className="av2-tl-card">
                <div className="av2-tl-eyebrow">{it.eyebrow}</div>
                <h3 className="av2-tl-title">{it.titulo}</h3>
                {it.lugar ? (
                  <div className="av2-tl-meta"><PinIcon />{it.lugar}</div>
                ) : null}
                {it.descripcion ? <p className="av2-tl-desc">{it.descripcion}</p> : null}
                {it.personajes.length ? (
                  <div className="av2-tl-chips">
                    {shown.map((p) => (
                      <span className="av2-tl-chip" key={p.name}>
                        <span className="av2-tl-av" data-player={p.isPlayer || undefined}>{p.initial}</span>
                        <span>{p.name}</span>
                      </span>
                    ))}
                    {rest > 0 ? <span className="av2-tl-chip av2-tl-more">+{rest}</span> : null}
                  </div>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add components/atlas-v2/AtlasTimeline.tsx
git commit -m "feat(timeline): client component AtlasTimeline con animación scroll-scrubbed"
```

---

## Task 3: Estilos en `app/(v2)/v2/atlas-v2.css`

**Files:**
- Modify: `app/(v2)/v2/atlas-v2.css` (agregar al final, sección comentada `/* === TIMELINE === */`)

Usar los tokens existentes: `--av2-bg`, `--av2-bg-panel`, `--av2-copper`,
`--av2-copper-hi`, `--av2-copper-deep`, `--av2-ink`, `--av2-ink-soft`,
`--av2-ink-faint`, `--av2-rule-copper`, `--av2-glow-copper`. Fuentes ya cargadas en
el layout `(v2)`: Cormorant Garamond (títulos/número), Spectral (cuerpo), IBM Plex
Mono (eyebrow/meta/chips).

- [ ] **Step 1: Agregar el bloque CSS** (traducción de la referencia a tokens del sistema)

```css
/* === TIMELINE (/v2/timeline) === */
.atlas .av2-tl{ --av2-tl-gap:80px; --av2-tl-node:46px; --av2-tl-num-nudge:1px;
  position:relative; max-width:1100px; margin:0 auto; padding:24px 0 160px; }
.atlas .av2-tl-spine{ position:absolute; left:50%; top:0; bottom:0; width:2px;
  transform:translateX(-50%);
  background:linear-gradient(180deg,transparent,var(--av2-copper-deep) 6%,
    var(--av2-copper) 50%,var(--av2-copper-deep) 94%,transparent);
  box-shadow:var(--av2-glow-copper); }
.atlas .av2-tl-list{ list-style:none; margin:0; padding:0; }
.atlas .av2-tl-row{ position:relative; display:grid; grid-template-columns:1fr 1fr;
  column-gap:var(--av2-tl-gap); margin:0 0 78px; }
.atlas .av2-tl-row .av2-tl-card{ grid-column:1; }
.atlas .av2-tl-row[data-side="right"] .av2-tl-card{ grid-column:2; }

.atlas .av2-tl-node{ position:absolute; left:50%; top:38px;
  transform:translate(-50%,-50%); width:var(--av2-tl-node); height:var(--av2-tl-node);
  border-radius:50%; z-index:2; display:flex; align-items:center; justify-content:center;
  background:radial-gradient(circle at 50% 34%, var(--av2-bg-panel), var(--av2-bg));
  border:1.5px solid var(--av2-copper);
  box-shadow:0 0 0 5px var(--av2-bg), var(--av2-glow-copper),
    inset 0 0 10px oklch(0.715 0.118 56 / 0.22);
  will-change:opacity,transform; }
.atlas .av2-tl-num{ font-family:"Cormorant Garamond",serif; font-weight:600;
  font-size:20px; line-height:1; color:var(--av2-copper-hi);
  transform:translateY(var(--av2-tl-num-nudge)); }

.atlas .av2-tl-card{ position:relative; display:block; text-decoration:none;
  background:var(--av2-bg-panel); border:1px solid var(--av2-rule-copper);
  border-radius:4px; padding:22px 24px 24px; backdrop-filter:blur(6px);
  box-shadow:0 18px 40px -24px rgba(0,0,0,.9); color:inherit;
  will-change:opacity,transform; transition:border-color .2s ease; }
.atlas .av2-tl-card:hover{ border-color:var(--av2-copper); }
.atlas .av2-tl-card::before{ content:""; position:absolute; top:0; height:100%; width:2px;
  background:linear-gradient(180deg,var(--av2-copper),transparent 80%); }
.atlas .av2-tl-row[data-side="left"] .av2-tl-card::before{ right:-1px; }
.atlas .av2-tl-row[data-side="right"] .av2-tl-card::before{ left:-1px; }
.atlas .av2-tl-card::after{ content:""; position:absolute; top:38px; height:1.5px; width:17px; }
.atlas .av2-tl-row[data-side="left"] .av2-tl-card::after{ right:-17px;
  background:linear-gradient(90deg,transparent,var(--av2-copper)); }
.atlas .av2-tl-row[data-side="right"] .av2-tl-card::after{ left:-17px;
  background:linear-gradient(90deg,var(--av2-copper),transparent); }

.atlas .av2-tl-eyebrow{ font-family:"IBM Plex Mono",monospace; font-size:11px;
  letter-spacing:.22em; text-transform:uppercase; color:var(--av2-copper); margin-bottom:8px; }
.atlas .av2-tl-title{ font-family:"Cormorant Garamond",serif; font-weight:600;
  font-size:30px; line-height:1.1; margin:0 0 12px; color:var(--av2-ink); }
.atlas .av2-tl-row[data-side="right"] .av2-tl-title,
.atlas .av2-tl-row[data-side="right"] .av2-tl-eyebrow,
.atlas .av2-tl-row[data-side="right"] .av2-tl-meta{ text-align:right; }
.atlas .av2-tl-row[data-side="right"] .av2-tl-chips{ justify-content:flex-end; }
.atlas .av2-tl-meta{ display:flex; align-items:center; gap:7px; color:var(--av2-copper-hi);
  font-family:"IBM Plex Mono",monospace; font-size:11.5px; letter-spacing:.08em;
  text-transform:uppercase; margin-bottom:14px; }
.atlas .av2-tl-meta svg{ width:13px; height:13px; flex:none; }
.atlas .av2-tl-desc{ color:var(--av2-ink-soft); font-size:15.5px; margin:0 0 18px;
  display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.atlas .av2-tl-chips{ display:flex; flex-wrap:wrap; gap:7px; align-items:center; }
.atlas .av2-tl-chip{ display:inline-flex; align-items:center; gap:6px; padding:3px 10px 3px 3px;
  border:1px solid var(--av2-rule-copper); border-radius:20px;
  background:oklch(0.715 0.118 56 / 0.06); }
.atlas .av2-tl-av{ width:22px; height:22px; border-radius:50%; display:flex;
  align-items:center; justify-content:center; font-family:"IBM Plex Mono",monospace;
  font-size:10px; font-weight:500; color:var(--av2-bg);
  background:linear-gradient(135deg,var(--av2-copper-hi),var(--av2-copper-deep)); }
.atlas .av2-tl-chip > span:last-child{ font-size:12.5px; color:var(--av2-ink-soft);
  font-family:"IBM Plex Mono",monospace; }
.atlas .av2-tl-more{ color:var(--av2-ink-faint); padding:4px 11px; font-size:12px;
  font-family:"IBM Plex Mono",monospace; }

/* Estado inicial pre-animación: solo cuando el JS "arma" con .is-animated.
   Sin JS o con reduced-motion (no se agrega .is-animated) todo queda visible. */
.atlas .av2-tl.is-animated .av2-tl-card{ opacity:0; }
.atlas .av2-tl.is-animated .av2-tl-node{ opacity:0; }
@media (prefers-reduced-motion: reduce){
  .atlas .av2-tl.is-animated .av2-tl-card,
  .atlas .av2-tl.is-animated .av2-tl-node{ opacity:1 !important; }
}

/* Índice flotante de progreso (rail escalable; no 81 dots) */
.atlas .av2-tl-progress{ position:fixed; right:26px; top:50%; transform:translateY(-50%);
  z-index:10; display:flex; flex-direction:column; align-items:center; gap:10px; }
.atlas .av2-tl-progress-label, .atlas .av2-tl-progress-cap{ writing-mode:vertical-rl;
  font-family:"IBM Plex Mono",monospace; font-size:10px; letter-spacing:.2em;
  text-transform:uppercase; color:var(--av2-ink-faint); }
.atlas .av2-tl-progress-cap{ color:var(--av2-copper-hi); }
.atlas .av2-tl-progress-track{ position:relative; width:2px; height:160px;
  background:var(--av2-rule-copper); border-radius:2px; }
.atlas .av2-tl-progress-thumb{ position:absolute; left:50%; top:0;
  transform:translate(-50%,-50%); width:9px; height:9px; border-radius:50%;
  background:var(--av2-copper-hi); box-shadow:0 0 10px var(--av2-copper-hi);
  transition:top .1s linear; }
@media (max-width:760px){ .atlas .av2-tl-progress{ display:none; } }

@media (max-width:760px){
  .atlas .av2-tl-spine{ left:26px; }
  .atlas .av2-tl-row, .atlas .av2-tl-row[data-side="right"]{ grid-template-columns:1fr; }
  .atlas .av2-tl-row .av2-tl-card{ grid-column:1; margin-left:60px; }
  .atlas .av2-tl-node{ left:26px; }
  .atlas .av2-tl-card::after,
  .atlas .av2-tl-row[data-side="right"] .av2-tl-card::after{ left:-16px; right:auto; width:16px;
    background:linear-gradient(90deg,var(--av2-copper),transparent); }
  .atlas .av2-tl-card::before,
  .atlas .av2-tl-row[data-side="right"] .av2-tl-card::before{ left:-1px; right:auto; }
  .atlas .av2-tl-row[data-side="right"] .av2-tl-title,
  .atlas .av2-tl-row[data-side="right"] .av2-tl-eyebrow,
  .atlas .av2-tl-row[data-side="right"] .av2-tl-meta{ text-align:left; }
  .atlas .av2-tl-row[data-side="right"] .av2-tl-chips{ justify-content:flex-start; }
}
```

> Importante: en mobile **todas** las cards van del mismo lado (eje a la izquierda).
> El JS usa `data-side` para el `from` del desplazamiento; en mobile igual desliza,
> queda bien. Verificar en el screenshot mobile.

- [ ] **Step 2: Commit**

```bash
git add "app/(v2)/v2/atlas-v2.css"
git commit -m "feat(timeline): estilos av2-tl con tokens del sistema + responsive"
```

---

## Task 4: Página server `app/(v2)/v2/timeline/page.tsx`

**Files:**
- Create: `app/(v2)/v2/timeline/page.tsx`

- [ ] **Step 1: Escribir la página** (espeja la carga de datos de `capitulos/page.tsx`)

```tsx
// app/(v2)/v2/timeline/page.tsx
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import AtlasTimeline from "@/components/atlas-v2/AtlasTimeline";
import { cachedListByType, cachedListEpisodes } from "@/lib/public-cache";
import { buildTimelineItems } from "@/lib/atlas-v2-timeline";

export const dynamic = "force-dynamic";
export const metadata = { title: "Línea de tiempo · Grimorio de Lore" };

export default async function TimelinePage() {
  const vp = process.env.VAULT_PATH?.trim() || "";
  const [episodes, personajes] = vp
    ? await Promise.all([cachedListEpisodes(vp), cachedListByType(vp, "personaje")])
    : [[], []];
  const items = buildTimelineItems(episodes as any, personajes as any);

  return (
    <AtlasPageScene
      eyebrow="La crónica, de principio a fin"
      title="Línea de tiempo"
      subtitle="Recorré la campaña episodio por episodio: qué pasó, dónde y quiénes estuvieron."
      variant="timeline"
    >
      <AtlasTimeline items={items} />
    </AtlasPageScene>
  );
}
```

- [ ] **Step 2: Verificar build + ruta viva**

Run: `npx tsc --noEmit` (sin errores nuevos). Levantar dev y abrir `/v2/timeline`.

- [ ] **Step 3: Commit**

```bash
git add "app/(v2)/v2/timeline/page.tsx"
git commit -m "feat(timeline): ruta /v2/timeline con AtlasPageScene"
```

---

## Task 5: Link en la nav `components/atlas-v2/AtlasTopNav.tsx`

**Files:**
- Modify: `components/atlas-v2/AtlasTopNav.tsx:24` (grupo "Crónicas")

- [ ] **Step 1: Agregar el link** dentro del grupo `cronicas`, después de "Capítulos":

```tsx
{
  id: "cronicas",
  label: "Crónicas",
  items: [
    { href: "/v2/capitulos", label: "Capítulos" },
    { href: "/v2/timeline", label: "Línea de tiempo" },
    { href: "/v2/misterios", label: "Misterios" },
  ],
},
```

- [ ] **Step 2: Commit**

```bash
git add components/atlas-v2/AtlasTopNav.tsx
git commit -m "feat(timeline): link 'Línea de tiempo' en la nav (grupo Crónicas)"
```

---

## Task 6: QA visual (protocolo obligatorio UI V2) + skills

**Files:** ninguno (verificación).

- [ ] **Step 1: Screenshots desktop + mobile**

Run (según `CLAUDE.md`; usar `V2_BROWSER_CHANNEL=msedge` o `chrome` si hace falta):
```bash
node scripts/v2-screenshot.mjs /v2/timeline
```
Generar desktop (1440×900) y mobile (390×844).

- [ ] **Step 2: Comparar contra la referencia aprobada**

Abrir `docs/ui-v2/timeline-reference.html` en el navegador y comparar contra los
screenshots. Listar diferencias P0/P1/P2. Verificar específicamente:
- Número **centrado** en el nodo (P0 — fue el punto más sensible).
- Conector card↔nodo bien alineado.
- Animación: cards entran desde su lado y se desvanecen al salir (scroll lento, ambos
  sentidos). Con `prefers-reduced-motion` todo visible y sin transform.
- Mobile: eje a la izquierda, una sola columna, todo legible.

- [ ] **Step 3: Correr las skills de UI** (preferencia explícita de Joaquín)

Pasar por `impeccable` / `frontend-design` y `code-reviewer` antes de declarar listo.
No declarar terminado solo por TypeScript/build.

- [ ] **Step 4: Commit de ajustes de QA (si hubo)**

```bash
git add -A
git commit -m "fix(timeline): ajustes de QA visual desktop/mobile"
```

---

## Decisiones abiertas (confirmar con Joaquín al implementar)

1. **Card clickeable → expediente.** El plan hace que toda la card linkee a
   `/v2/capitulos/{numero}` (reutiliza la ruta existente). Para partes, ambas linkean
   al mismo número. Si se prefiere una timeline puramente de lectura (sin navegación),
   cambiar `<Link>` por `<article>` y quitar `href`.
2. **Resumen vacío.** Se usa `ep.descripcion`; si muchos episodios la tienen vacía,
   portar el fallback de excerpt del cuerpo que ya usa `lib/atlas-v2-home.ts`
   (`truncate(body, 220)`).

## Mejoras futuras (fuera de alcance de este plan)

- **Rail de progreso: click para saltar.** El rail de v1 es read-only (thumb + caption
  "EP N"). Mejora: hacerlo clickeable/draggable para saltar a un punto de la timeline.
- **Opción B — Agrupación por Actos/arcos.** Separadores "ACTO I/II…" + nav pegajosa
  para saltar entre actos. Requiere definir los cortes a mano (los episodios no tienen
  campo `acto`). Joaquín lo suma cuando le guste cómo quedó la versión lineal.
- **Fondos con imágenes del lugar.** Dos enfoques a prototipar: (a) imagen sutil detrás
  de cada card; (b) banda full-width que cambia con el scroll (parallax). Reutilizar
  `data/atlas-v2/location-images.ts` / imágenes en `public/`.

## Criterios de aceptación

- [ ] `/v2/timeline` lista los episodios en orden ascendente, una card por archivo.
- [ ] Eje central con nodos numerados; número ópticamente centrado; conector alineado.
- [ ] Cards alternadas izq/der con eyebrow, título, ubicación, resumen (3 líneas) y
      chips de personajes (PJs primero, +N de overflow). Sin miniatura.
- [ ] Animación anclada al scroll (entra/sale), solo `transform`/`opacity`, respeta
      `prefers-reduced-motion` y degrada visible sin JS.
- [ ] Índice flotante de progreso (rail) a la derecha en desktop, con caption "EP N"
      que sigue el scroll; oculto en mobile.
- [ ] Link "Línea de tiempo" en la nav (grupo Crónicas).
- [ ] `npx vitest run tests/atlas-v2-timeline.test.ts` en verde; `npx tsc --noEmit` sin
      errores nuevos.
- [ ] QA visual desktop + mobile comparada contra `docs/ui-v2/timeline-reference.html`,
      sin P0/P1 abiertos.
- [ ] No se rompió `/v2/capitulos` ni otras rutas existentes.
```
