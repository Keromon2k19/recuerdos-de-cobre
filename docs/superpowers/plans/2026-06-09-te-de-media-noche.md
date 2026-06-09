# Té de Media Noche (constelación del grupo) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página pública `/te-de-media-noche` con los 10 integrantes del grupo en una constelación interactiva (anillo → foco → expediente), datos reales del vault.

**Architecture:** Página server (`app/(atlas)/`) que carga los 10 `AtlasEntityDetail` del vault + config curada, arma props con un helper puro testeable (`lib/te-de-media-noche.ts`) y las pasa a un client component coreografiado (`components/atlas/AtlasConstellation.tsx`). CSS puro en `app/(atlas)/atlas.css` bajo prefijo `.av2-tdmn-`. NO se reusa `AtlasRelationsGraph` (force-directed); esta vista es determinista.

**Tech Stack:** Next.js 15 App Router · React 19 · TypeScript · CSS puro (tokens `--av2-*`) · vitest.

**Spec:** `docs/superpowers/specs/2026-06-09-te-de-media-noche-design.md`
**Referencia visual aprobada (manda sobre este plan en lo estético):** `docs/ui-v2/te-de-media-noche-reference.html` — abrirla en navegador antes de implementar Tasks 3-4 (los retratos requieren `npm run dev` en :3000).

**Hechos del repo que este plan usa (verificados):**
- `cachedAtlasEntityDetail(vaultPath, kind, slug)` y `cachedListByType` viven en `lib/public-cache.ts`.
- `AtlasEntityDetail` (en `lib/atlas-content.ts:21`) tiene `slug, name, aliases: string[], description, imageSrc?, appearances: number[], meta: {label,value}[], relations: {name, detail, episode?}[]`.
- `cachedBuildAtlasWikiResolver(vaultPath): Promise<WikiResolver>` en `lib/wiki-resolver.ts:116`; el resolver devuelve paths tipo `/personajes/<slug>` o `null`.
- Retratos: `ATLAS_V2_KNOWN_PORTRAITS` + `ATLAS_V2_PORTRAIT_PLACEHOLDER` en `lib/atlas-portraits.ts` (los 10 miembros ya están mapeados).
- Patrón de página: ver `app/(atlas)/timeline/page.tsx` (`AtlasPageScene` + `publicVaultPath()` + `export const dynamic = "force-static"`). `AtlasPageScene` acepta `variant?: string` libre.
- Nav: array `GROUPS` en `components/atlas/AtlasTopNav.tsx:24`; el indicador se mide dinámico (NO hay offsets que recalcular).
- Tests: vitest, patrón `tests/*.test.ts` con `import { describe, it, expect } from "vitest"` y alias `@/`.

---

### Task 1: Config curada de miembros

**Files:**
- Create: `data/atlas/te-de-media-noche.ts`

- [ ] **Step 1: Crear la config**

```ts
// data/atlas/te-de-media-noche.ts
// Membresía de Té de Media Noche — curada a mano (el vault no registra
// grupos). El orden del array es el orden del anillo. La etiqueta visible
// gana sobre `rol:` del vault (David/Borok figuran PJ en el vault pero
// Joaquín los clasifica distinto para esta vista).

export type TdmnEstado = "activo" | "separado";

export type TdmnMemberConfig = {
  slug: string;          // slug del .md en vault personajes/
  nombre: string;        // display name (fallback si el vault no carga)
  etiqueta: string;      // eyebrow del expediente
  rolCorto: string;      // stat "rol" del expediente
  estado: TdmnEstado;
};

export const TDMN_MEMBERS: TdmnMemberConfig[] = [
  { slug: "mysha", nombre: "Mysha", etiqueta: "PJ · Bruja de Sangre · Líder actual", rolCorto: "PJ", estado: "activo" },
  { slug: "layra", nombre: "Layra", etiqueta: "PJ · Dracónica", rolCorto: "PJ", estado: "activo" },
  { slug: "narcissa", nombre: "Narcissa", etiqueta: "PJ", rolCorto: "PJ", estado: "activo" },
  { slug: "io-campbell", nombre: "Io Campbell", etiqueta: "PJ · Druida, Retoño de Trent", rolCorto: "PJ", estado: "activo" },
  { slug: "eryon", nombre: "Eryon", etiqueta: "PJ", rolCorto: "PJ", estado: "activo" },
  { slug: "david-ilcard", nombre: "David Ilcard", etiqueta: "NPC · Compañero del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "rylen", nombre: "Rylen", etiqueta: "NPC · Compañero del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "pilar", nombre: "Pilar", etiqueta: "NPC · Compañera del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "pat-pat", nombre: "Pat-Pat", etiqueta: "NPC · Compañera del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "borok", nombre: "Borok", etiqueta: "Primer líder · se separó", rolCorto: "Ex líder", estado: "separado" },
];

// Vínculos rotos curados (estuvo y se fue): pares [a, b].
export const TDMN_CUT_LINKS: Array<[string, string]> = [["borok", "mysha"]];
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos (el repo compila limpio).

- [ ] **Step 3: Commit**

```bash
git add data/atlas/te-de-media-noche.ts
git commit -m "feat(tdmn): config curada de integrantes de Té de Media Noche"
```

---

### Task 2: Helper puro `buildConstellation` (TDD)

**Files:**
- Create: `tests/te-de-media-noche.test.ts`
- Create: `lib/te-de-media-noche.ts`

- [ ] **Step 1: Escribir los tests (fallan)**

```ts
// tests/te-de-media-noche.test.ts
import { describe, it, expect } from "vitest";
import type { AtlasEntityDetail } from "@/lib/atlas-content";
import { TDMN_MEMBERS, TDMN_CUT_LINKS } from "@/data/atlas/te-de-media-noche";
import { buildConstellation } from "@/lib/te-de-media-noche";

function fakeDetail(partial: Partial<AtlasEntityDetail> & { slug: string }): AtlasEntityDetail {
  return {
    kind: "personaje",
    name: partial.slug,
    aliases: [],
    description: "",
    appearances: [],
    meta: [],
    relations: [],
    sections: [],
    ...partial,
  } as AtlasEntityDetail;
}

// resolver de mentira: mapea nombres conocidos a paths del atlas
const PATHS: Record<string, string> = {
  Mysha: "/personajes/mysha",
  Layra: "/personajes/layra",
  Narcissa: "/personajes/narcissa",
  Borok: "/personajes/borok",
  Champi: "/personajes/champi",
  "Coven Rojo": "/facciones/coven-rojo",
  "Hermandad de Cobre": "/facciones/hermandad-de-cobre",
  "Oráculo Encantado": "/lugares/oraculo-encantado",
};
const resolve = (name: string) => PATHS[name] ?? null;

describe("config TDMN", () => {
  it("tiene 10 miembros con slugs únicos y borok separado", () => {
    expect(TDMN_MEMBERS).toHaveLength(10);
    expect(new Set(TDMN_MEMBERS.map((m) => m.slug)).size).toBe(10);
    expect(TDMN_MEMBERS.find((m) => m.slug === "borok")?.estado).toBe("separado");
    expect(TDMN_CUT_LINKS).toContainEqual(["borok", "mysha"]);
  });
});

describe("buildConstellation", () => {
  it("devuelve los 10 miembros en el orden de la config", () => {
    const data = buildConstellation(new Map(), resolve);
    expect(data.members.map((m) => m.slug)).toEqual(TDMN_MEMBERS.map((m) => m.slug));
  });

  it("usa nombre/placeholder de fallback cuando no hay detail del vault", () => {
    const data = buildConstellation(new Map(), resolve);
    const pilar = data.members.find((m) => m.slug === "pilar")!;
    expect(pilar.name).toBe("Pilar");
    expect(pilar.imageSrc).toBeTruthy();
  });

  it("prefiere datos del vault cuando hay detail", () => {
    const details = new Map([
      ["mysha", fakeDetail({ slug: "mysha", name: "Mysha", aliases: ["Selenne", "Veltra"], description: "Bruja de sangre.", appearances: [1, 2, 3] })],
    ]);
    const data = buildConstellation(details, resolve);
    const mysha = data.members.find((m) => m.slug === "mysha")!;
    expect(mysha.aliases).toEqual(["Selenne", "Veltra"]);
    expect(mysha.bio).toBe("Bruja de sangre.");
    expect(mysha.episodes).toBe(3);
  });

  it("arma edges entre miembros, deduplicados por par y sin borok", () => {
    const details = new Map([
      ["mysha", fakeDetail({ slug: "mysha", relations: [
        { name: "Layra", detail: "amiga", episode: 5 },
        { name: "Borok", detail: "ex compañero", episode: 2 },
      ] })],
      ["layra", fakeDetail({ slug: "layra", relations: [
        { name: "Mysha", detail: "amiga", episode: 9 }, // mismo par → dedupe
      ] })],
    ]);
    const data = buildConstellation(details, resolve);
    expect(data.edges).toEqual([{ a: "layra", b: "mysha" }]); // par ordenado, 1 sola vez, sin borok
    expect(data.cutEdges).toEqual([["borok", "mysha"]]);
  });

  it("satélites: solo personajes y facciones, orden por episodio desc, tope 8", () => {
    const rels = [
      { name: "Coven Rojo", detail: "miembro", episode: 3 },
      { name: "Oráculo Encantado", detail: "visitó", episode: 9 }, // lugar → fuera
      { name: "Champi", detail: "familiar", episode: 8 },
      ...Array.from({ length: 9 }, (_, i) => ({ name: "Narcissa", detail: `v${i}`, episode: i })), // mismo target → 1 satélite
    ];
    const details = new Map([["mysha", fakeDetail({ slug: "mysha", relations: rels })]]);
    const data = buildConstellation(details, resolve);
    const sats = data.satsByMember["mysha"];
    expect(sats.length).toBeLessThanOrEqual(8);
    expect(sats.map((s) => s.kind)).not.toContain("lugar");
    expect(sats[0].episode).toBeGreaterThanOrEqual(sats[sats.length - 1].episode ?? 0);
    expect(sats.find((s) => s.slug === "coven-rojo")?.kind).toBe("faccion");
    expect(sats.find((s) => s.slug === "champi")?.kind).toBe("personaje");
  });

  it("satélites que no resuelven a entidad del atlas quedan fuera", () => {
    const details = new Map([["mysha", fakeDetail({ slug: "mysha", relations: [
      { name: "Un Desconocido Sin Ficha", detail: "habló", episode: 1 },
    ] })]]);
    const data = buildConstellation(details, resolve);
    expect(data.satsByMember["mysha"]).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr tests y verificar que fallan**

Run: `npx vitest run tests/te-de-media-noche.test.ts`
Expected: FAIL — `Cannot find module '@/lib/te-de-media-noche'` (o equivalente).

- [ ] **Step 3: Implementar el helper**

```ts
// lib/te-de-media-noche.ts
// Helper puro: mapea details del vault + config curada → props de la
// constelación. Sin I/O — testeable con mocks.

import type { AtlasEntityDetail } from "@/lib/atlas-content";
import {
  ATLAS_V2_KNOWN_PORTRAITS,
  ATLAS_V2_PORTRAIT_PLACEHOLDER,
} from "@/lib/atlas-portraits";
import {
  TDMN_MEMBERS,
  TDMN_CUT_LINKS,
  type TdmnMemberConfig,
} from "@/data/atlas/te-de-media-noche";

export type ConstellationMember = {
  slug: string;
  name: string;
  etiqueta: string;
  rolCorto: string;
  estado: TdmnMemberConfig["estado"];
  imageSrc: string;
  aliases: string[];
  bio: string;
  episodes: number;
  href: string; // ficha completa
};

export type ConstellationEdge = { a: string; b: string };

export type SatKind = "personaje" | "faccion";

export type ConstellationSat = {
  slug: string;
  name: string;
  kind: SatKind;
  episode?: number;
  imageSrc?: string; // solo personajes
  sigla?: string;    // solo facciones
  href: string | null;
};

export type ConstellationData = {
  members: ConstellationMember[];
  edges: ConstellationEdge[];
  cutEdges: Array<[string, string]>;
  satsByMember: Record<string, ConstellationSat[]>;
};

const MAX_SATS = 8;

type Resolver = (name: string) => string | null;

function portraitFor(slug: string, detail?: AtlasEntityDetail | null): string {
  return (
    detail?.imageSrc ??
    ATLAS_V2_KNOWN_PORTRAITS[slug] ??
    ATLAS_V2_PORTRAIT_PLACEHOLDER
  );
}

function siglaDe(nombre: string): string {
  const words = nombre.split(/\s+/).filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(w));
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || nombre.slice(0, 2).toUpperCase();
}

function parseAtlasPath(path: string): { segment: string; slug: string } | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { segment: parts[0], slug: parts[1] };
}

export function buildConstellation(
  details: Map<string, AtlasEntityDetail | null>,
  resolve: Resolver,
): ConstellationData {
  const memberSlugs = new Set(TDMN_MEMBERS.map((m) => m.slug));

  const members: ConstellationMember[] = TDMN_MEMBERS.map((cfg) => {
    const d = details.get(cfg.slug) ?? null;
    return {
      slug: cfg.slug,
      name: d?.name ?? cfg.nombre,
      etiqueta: cfg.etiqueta,
      rolCorto: cfg.rolCorto,
      estado: cfg.estado,
      imageSrc: portraitFor(cfg.slug, d),
      aliases: d?.aliases ?? [],
      bio: d?.description ?? "",
      episodes: d?.appearances.length ?? 0,
      href: `/personajes/${cfg.slug}`,
    };
  });

  // Edges del anillo: relaciones del vault entre pares de miembros.
  // 1 edge por par (orden alfabético del par como key) y sin borok
  // (su vínculo es la línea cortada curada).
  const edgeKeys = new Set<string>();
  const edges: ConstellationEdge[] = [];
  const separados = new Set(
    TDMN_MEMBERS.filter((m) => m.estado === "separado").map((m) => m.slug),
  );

  for (const cfg of TDMN_MEMBERS) {
    const d = details.get(cfg.slug);
    if (!d) continue;
    for (const rel of d.relations) {
      const parsed = resolve(rel.name) ? parseAtlasPath(resolve(rel.name)!) : null;
      if (!parsed || parsed.segment !== "personajes") continue;
      const target = parsed.slug;
      if (!memberSlugs.has(target) || target === cfg.slug) continue;
      if (separados.has(cfg.slug) || separados.has(target)) continue;
      const [a, b] = [cfg.slug, target].sort();
      const key = `${a}---${b}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push({ a, b });
    }
  }

  // Satélites por miembro: personajes + facciones (alcance del spec),
  // 1 por target, orden episodio desc, tope MAX_SATS.
  const satsByMember: Record<string, ConstellationSat[]> = {};
  for (const cfg of TDMN_MEMBERS) {
    const d = details.get(cfg.slug);
    const byTarget = new Map<string, ConstellationSat>();
    for (const rel of d?.relations ?? []) {
      const path = resolve(rel.name);
      const parsed = path ? parseAtlasPath(path) : null;
      if (!parsed) continue;
      let kind: SatKind;
      if (parsed.segment === "personajes") kind = "personaje";
      else if (parsed.segment === "facciones") kind = "faccion";
      else continue; // lugares/objetos/etc. fuera de alcance
      const prev = byTarget.get(parsed.slug);
      const episode = rel.episode;
      if (prev && (prev.episode ?? -1) >= (episode ?? -1)) continue;
      byTarget.set(parsed.slug, {
        slug: parsed.slug,
        name: rel.name,
        kind,
        episode,
        imageSrc: kind === "personaje" ? portraitFor(parsed.slug) : undefined,
        sigla: kind === "faccion" ? siglaDe(rel.name) : undefined,
        href: path,
      });
    }
    satsByMember[cfg.slug] = [...byTarget.values()]
      .sort((x, y) => (y.episode ?? 0) - (x.episode ?? 0))
      .slice(0, MAX_SATS);
  }

  return { members, edges, cutEdges: TDMN_CUT_LINKS, satsByMember };
}
```

- [ ] **Step 4: Correr tests y verificar que pasan**

Run: `npx vitest run tests/te-de-media-noche.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Correr la suite completa**

Run: `npx vitest run`
Expected: todo verde (55 previos + 7 nuevos).

- [ ] **Step 6: Commit**

```bash
git add tests/te-de-media-noche.test.ts lib/te-de-media-noche.ts
git commit -m "feat(tdmn): helper buildConstellation con tests (miembros, edges, satélites)"
```

---

### Task 3: CSS de la constelación

**Files:**
- Modify: `app/(atlas)/atlas.css` (append al final del archivo)

Portado 1:1 de la referencia aprobada, con tokens `--av2-*` existentes y prefijo `.av2-tdmn-`. El stage es `position:relative` (vive dentro de `AtlasPageScene`, no fixed).

- [ ] **Step 1: Agregar el bloque CSS al final de `app/(atlas)/atlas.css`**

```css
/* ============================================================
   Té de Media Noche — constelación del grupo (.av2-tdmn-*)
   Referencia: docs/ui-v2/te-de-media-noche-reference.html
   ============================================================ */

.av2-tdmn-stage{position:relative;width:100%;height:min(78dvh,860px);min-height:560px;
  overflow:hidden;border-radius:var(--av2-r);}
.av2-tdmn-wires{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;
  transition:opacity .5s var(--av2-ease)}
.av2-tdmn-stage.is-veil .av2-tdmn-wires{opacity:.1}
.av2-tdmn-stage.is-veil .av2-tdmn-pos{opacity:.08}

.av2-tdmn-wire{stroke:var(--av2-rule-copper);stroke-width:2;fill:none;opacity:0;
  transition:opacity .5s var(--av2-ease)}
.av2-tdmn-wire.show{opacity:.7}
.av2-tdmn-wire.is-soft{stroke:var(--av2-rule)}
.av2-tdmn-wire.is-cut{stroke:var(--av2-copper-dim);stroke-dasharray:6 9}
.av2-tdmn-wire.is-cut.show{opacity:.45}

.av2-tdmn-pos{position:absolute;left:0;top:0;transform:translate(-50%,-50%);
  transition:left .9s var(--av2-ease),top .9s var(--av2-ease),opacity .6s var(--av2-ease);
  will-change:left,top;animation:av2TdmnIdle 6s ease-in-out infinite}
@keyframes av2TdmnIdle{0%,100%{transform:translate(-50%,-50%) translateY(0)}
  50%{transform:translate(-50%,-50%) translateY(-5px)}}
.av2-tdmn-pos.is-dim{opacity:.28}
.av2-tdmn-pos.is-ex{opacity:.6}

.av2-tdmn-node{position:relative;display:flex;flex-direction:column;align-items:center;gap:9px;
  background:none;border:none;cursor:pointer;padding:0;
  animation:av2TdmnNodeIn .95s var(--av2-ease) backwards}
@keyframes av2TdmnNodeIn{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:scale(1)}}

.av2-tdmn-disc{position:relative;border-radius:5px;overflow:hidden;background:var(--av2-bg-panel-up);
  box-shadow:0 0 0 1px var(--av2-rule-copper),0 10px 30px -8px oklch(0.04 0.01 58 / .8);
  transition:transform .4s var(--av2-ease),box-shadow .4s var(--av2-ease),filter .4s var(--av2-ease)}
.av2-tdmn-disc img{width:100%;height:100%;object-fit:cover;object-position:50% 22%;display:block;
  filter:saturate(.78) contrast(1.02) brightness(.92)}
.av2-tdmn-disc::after{content:"";position:absolute;inset:0;border-radius:5px;pointer-events:none;
  box-shadow:inset 0 -22px 30px -14px oklch(0.04 0.01 58 / .9),inset 0 0 0 3px oklch(0.092 0.010 58 / .55)}
.av2-tdmn-ring{position:absolute;inset:-5px;border-radius:5px;border:1px solid var(--av2-copper-deep);
  pointer-events:none;transition:all .4s var(--av2-ease)}
.av2-tdmn-node:hover .av2-tdmn-disc{transform:translateY(-3px) scale(1.05);
  box-shadow:0 0 0 1px var(--av2-copper),0 0 36px oklch(0.715 0.118 56 / .4);filter:none}
.av2-tdmn-node:hover .av2-tdmn-disc img{filter:saturate(1) contrast(1.04) brightness(1)}
.av2-tdmn-node:hover .av2-tdmn-ring{inset:-8px;border-color:var(--av2-copper)}
.av2-tdmn-node:hover .av2-tdmn-label{color:var(--av2-copper-hi)}

.av2-tdmn-node .av2-tdmn-disc{width:104px;height:104px}
.av2-tdmn-node.is-center .av2-tdmn-disc{width:156px;height:156px;
  box-shadow:0 0 0 2px var(--av2-copper),0 0 60px oklch(0.715 0.118 56 / .45)}
.av2-tdmn-node.is-center .av2-tdmn-disc img{filter:saturate(1) contrast(1.04)}
.av2-tdmn-node.is-center .av2-tdmn-ring{inset:-9px;border-color:var(--av2-copper)}
.av2-tdmn-node.is-center{cursor:zoom-in}
.av2-tdmn-node.is-sat .av2-tdmn-disc{width:64px;height:64px}

.av2-tdmn-label{position:absolute;top:calc(100% + 9px);left:50%;transform:translateX(-50%);
  white-space:nowrap;font-family:var(--av2-display);font-weight:600;font-size:1.05rem;
  color:var(--av2-ink);line-height:1.05;text-align:center;
  text-shadow:0 2px 12px oklch(0.04 0.01 58 / .9);transition:color .3s;pointer-events:none}
.av2-tdmn-node.is-center .av2-tdmn-label{font-size:1.6rem;color:var(--av2-copper-hi)}
.av2-tdmn-node.is-sat .av2-tdmn-label{font-size:.86rem;color:var(--av2-ink-soft)}
.av2-tdmn-label small{display:block;font-family:var(--av2-mono);font-weight:400;font-size:.54rem;
  letter-spacing:.1em;text-transform:uppercase;color:var(--av2-ink-faint);margin-top:3px}

/* Borok — primer líder que se separó */
.av2-tdmn-node.is-ex .av2-tdmn-disc img{filter:grayscale(.8) brightness(.6) contrast(.95)}
.av2-tdmn-node.is-ex .av2-tdmn-ring{border-style:dashed;border-color:var(--av2-rule-up)}
.av2-tdmn-node.is-ex .av2-tdmn-disc{box-shadow:0 0 0 1px var(--av2-rule-up),0 10px 30px -8px oklch(0.04 0.01 58 / .8)}
.av2-tdmn-node.is-ex .av2-tdmn-label{color:var(--av2-ink-faint)}
.av2-tdmn-node.is-ex .av2-tdmn-label small{color:var(--av2-copper-dim)}
.av2-tdmn-node.is-ex:hover .av2-tdmn-disc img{filter:grayscale(.4) brightness(.8)}

/* facción = sello cuadrado con sigla */
.av2-tdmn-node.is-fac .av2-tdmn-disc{background:linear-gradient(150deg,var(--av2-bg-panel-up),var(--av2-copper-deep));
  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px var(--av2-rule-copper)}
.av2-tdmn-node.is-fac .av2-tdmn-disc::after{display:none}
.av2-tdmn-node.is-fac .av2-tdmn-ring{display:none}
.av2-tdmn-sig{font-family:var(--av2-display);font-weight:700;font-size:1.1rem;color:var(--av2-gold)}

/* overlay interno: subtítulo dinámico + volver */
.av2-tdmn-head{position:absolute;top:14px;left:18px;right:18px;z-index:5;display:flex;
  align-items:center;justify-content:space-between;gap:14px;pointer-events:none}
.av2-tdmn-meta{font-family:var(--av2-mono);font-size:.72rem;color:var(--av2-ink-faint);
  letter-spacing:.05em;margin:0}
.av2-tdmn-meta b{color:var(--av2-gold);font-weight:500}
.av2-tdmn-back{pointer-events:auto;font-family:var(--av2-mono);font-size:.72rem;letter-spacing:.1em;
  text-transform:uppercase;color:var(--av2-ink-soft);background:var(--av2-bg-panel);
  border:1px solid var(--av2-rule-up);border-radius:5px;padding:9px 16px;cursor:pointer;
  opacity:0;transform:translateY(-6px);pointer-events:none;transition:all .35s var(--av2-ease)}
.av2-tdmn-back.show{opacity:1;transform:none;pointer-events:auto}
.av2-tdmn-back:hover{border-color:var(--av2-copper);color:var(--av2-copper-hi)}
.av2-tdmn-hint{position:absolute;bottom:12px;left:0;right:0;text-align:center;z-index:5;
  font-family:var(--av2-mono);font-size:.7rem;color:var(--av2-ink-faint);letter-spacing:.08em;
  transition:opacity .4s;pointer-events:none}
.av2-tdmn-hint b{color:var(--av2-copper)}

/* expediente (segundo click) */
.av2-tdmn-card{position:absolute;left:50%;top:50%;z-index:10;display:flex;width:min(660px,92%);
  background:linear-gradient(180deg,var(--av2-bg-panel),var(--av2-bg-raised));
  border:1px solid var(--av2-rule-copper);border-radius:8px;overflow:hidden;
  box-shadow:0 30px 90px -20px oklch(0.04 0.01 58 / .95),0 0 60px oklch(0.715 0.118 56 / .18);
  opacity:0;transform:translate(-50%,-50%) scale(.93) translateY(12px);pointer-events:none;
  transition:opacity .5s var(--av2-ease),transform .5s var(--av2-ease)}
.av2-tdmn-card.show{opacity:1;transform:translate(-50%,-50%) scale(1);pointer-events:auto}
.av2-tdmn-card-img{width:236px;flex:0 0 auto;background:var(--av2-bg-panel-up);position:relative}
.av2-tdmn-card-img img{width:100%;height:100%;min-height:330px;object-fit:cover;
  object-position:50% 18%;display:block}
.av2-tdmn-card-img::after{content:"";position:absolute;inset:0;
  box-shadow:inset -30px 0 40px -24px oklch(0.04 0.01 58 / .8)}
.av2-tdmn-card-body{padding:26px 28px 22px;flex:1;display:flex;flex-direction:column}
.av2-tdmn-card-eye{font-family:var(--av2-mono);font-size:.64rem;letter-spacing:.2em;
  text-transform:uppercase;color:var(--av2-copper);margin:0 0 8px}
.av2-tdmn-card-name{font-family:var(--av2-display);font-weight:600;font-size:2.2rem;line-height:1;
  margin:0 0 6px;color:var(--av2-ink)}
.av2-tdmn-card-alias{font-family:var(--av2-mono);font-size:.68rem;color:var(--av2-ink-faint);
  letter-spacing:.04em;margin:0 0 14px;min-height:1em}
.av2-tdmn-card-bio{font-size:.95rem;color:var(--av2-ink-soft);line-height:1.65;margin:0 0 18px;flex:1}
.av2-tdmn-card-stats{display:flex;gap:26px;border-top:1px dashed var(--av2-rule);
  padding-top:14px;margin-bottom:14px}
.av2-tdmn-card-stats b{display:block;font-family:var(--av2-display);font-weight:600;
  font-size:1.5rem;color:var(--av2-copper-hi);line-height:1}
.av2-tdmn-card-stats span{font-family:var(--av2-mono);font-size:.56rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--av2-ink-faint)}
.av2-tdmn-card-foot{font-family:var(--av2-mono);font-size:.68rem;letter-spacing:.08em;
  color:var(--av2-copper);margin:0;text-decoration:none;display:inline-block}
.av2-tdmn-card-foot:hover{color:var(--av2-copper-hi)}
.av2-tdmn-card-x{position:absolute;top:12px;right:12px;z-index:2;font-family:var(--av2-mono);
  font-size:.8rem;color:var(--av2-ink-soft);background:oklch(0.092 0.010 58 / .6);
  border:1px solid var(--av2-rule-up);border-radius:5px;width:30px;height:30px;cursor:pointer}
.av2-tdmn-card-x:hover{border-color:var(--av2-copper);color:var(--av2-copper-hi)}

@media (prefers-reduced-motion: reduce){
  .av2-tdmn-pos,.av2-tdmn-node{animation:none!important}
  .av2-tdmn-pos,.av2-tdmn-wire,.av2-tdmn-card{transition:none!important}
  .av2-tdmn-wire{opacity:.7}
}
@media(max-width:680px){
  .av2-tdmn-node .av2-tdmn-disc{width:72px;height:72px}
  .av2-tdmn-node.is-center .av2-tdmn-disc{width:112px;height:112px}
  .av2-tdmn-node.is-sat .av2-tdmn-disc{width:50px;height:50px}
  .av2-tdmn-label{font-size:.82rem}
  .av2-tdmn-card{flex-direction:column;max-height:86%;overflow:auto}
  .av2-tdmn-card-img{width:100%;height:200px}
  .av2-tdmn-card-img img{min-height:0;height:200px}
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(atlas)/atlas.css"
git commit -m "feat(tdmn): estilos de la constelación (.av2-tdmn-*)"
```

---

### Task 4: Client component `AtlasConstellation`

**Files:**
- Create: `components/atlas/AtlasConstellation.tsx`

Comportamiento (de la referencia): reposo (anillo 10 + edges dibujándose + cut Borok–Mysha en dos tramos con hueco) → click en miembro = foco (centro 156px, resto al borde atenuado, satélites en anillo medio, líneas desde el centro) → segundo click = expediente → click afuera/Escape cierra por niveles. Idle siempre. `<img>` nativo (los retratos son locales y de tamaño fijo; el linter del repo lo permite — `AtlasRelationsGraph` ya usa `<img>`).

- [ ] **Step 1: Escribir el componente completo**

```tsx
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
};

const DEG = Math.PI / 180;

function ringPos(cx: number, cy: number, r: number, count: number, i: number, offset = 0): XY {
  const a = (-90 + (i + offset) * (360 / count)) * DEG;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
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
      className={`av2-tdmn-wire${w.kind === "soft" ? " is-soft" : ""}${w.kind === "cut" ? " is-cut" : ""}${on ? " show" : ""}`}
      style={
        draw
          ? {
              strokeDasharray: len,
              strokeDashoffset: on ? 0 : len,
              transition:
                "stroke-dashoffset 1.15s cubic-bezier(.22,1,.36,1), opacity .4s ease",
            }
          : { transition: "opacity .8s ease" }
      }
    />
  );
}

export default function AtlasConstellation({ data }: { data: ConstellationData }) {
  const { members, edges, cutEdges, satsByMember } = data;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1200, h: 720 });
  const [focused, setFocused] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Escape cierra por niveles
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (expanded) setExpanded(false);
      else if (focused) setFocused(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, focused]);

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
      edges.forEach((e, i) => {
        const p1 = memberPos.get(e.a), p2 = memberPos.get(e.b);
        if (p1 && p2) list.push({ key: `e-${e.a}-${e.b}`, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, kind: "normal", delay: i * 95 + 80 });
      });
      cutEdges.forEach(([a, b], i) => {
        const p1 = memberPos.get(a), p2 = memberPos.get(b);
        if (p1 && p2) pushCut(p1, p2, `cut-${a}-${b}`, (edges.length + i) * 95 + 80);
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
        if (broken) pushCut(c, p, `cut-f-${m.slug}`, (sats.length + i) * 95 + 80);
        else list.push({ key: `o-${focused}-${m.slug}`, x1: c.x, y1: c.y, x2: p.x, y2: p.y, kind: "soft", delay: (sats.length + i) * 95 + 80 });
      });
    }
    return list;
  }, [focused, edges, cutEdges, memberPos, sats, satPos, members, cx, cy]);

  const focusedMember: ConstellationMember | undefined = members.find((m) => m.slug === focused);

  const onStageClick = useCallback((e: React.MouseEvent) => {
    const t = e.target as Element;
    if (t.closest(".av2-tdmn-node") || t.closest(".av2-tdmn-card") || t.closest(".av2-tdmn-back")) return;
    if (expanded) setExpanded(false);
    else if (focused) setFocused(null);
  }, [expanded, focused]);

  const onMemberClick = useCallback((slug: string) => {
    if (focused === slug && !expanded) setExpanded(true);
    else { setExpanded(false); setFocused(slug); }
  }, [focused, expanded]);

  const meta = expanded
    ? "Expediente abierto · click afuera o ✕ para cerrar"
    : focusedMember
      ? focusedMember.estado === "separado"
        ? `${focusedMember.name} · primer líder · dejó el grupo · otro click abre su expediente`
        : `${sats.length} vínculos cercanos · otro click abre su expediente`
      : "El grupo — diez integrantes · tocá a uno para abrir sus vínculos";

  return (
    <div
      ref={stageRef}
      className={`av2-tdmn-stage${expanded ? " is-veil" : ""}`}
      onClick={onStageClick}
    >
      <div className="av2-tdmn-head">
        <p className="av2-tdmn-meta">{meta}</p>
        <button
          type="button"
          className={`av2-tdmn-back${focused ? " show" : ""}`}
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
        <div className={`av2-tdmn-card${expanded ? " show" : ""}`} role="dialog" aria-label={`Expediente de ${focusedMember.name}`}>
          <button type="button" className="av2-tdmn-card-x" onClick={() => setExpanded(false)} aria-label="Cerrar expediente">✕</button>
          <div className="av2-tdmn-card-img">
            <img src={focusedMember.imageSrc} alt={`Retrato de ${focusedMember.name}`} />
          </div>
          <div className="av2-tdmn-card-body">
            <p className="av2-tdmn-card-eye">{focusedMember.etiqueta}</p>
            <h2 className="av2-tdmn-card-name">{focusedMember.name}</h2>
            <p className="av2-tdmn-card-alias">
              {focusedMember.aliases.length > 0 ? `alias — ${focusedMember.aliases.join(" · ")}` : " "}
            </p>
            <p className="av2-tdmn-card-bio">{focusedMember.bio}</p>
            <div className="av2-tdmn-card-stats">
              <div><b>{focusedMember.episodes}</b><span>episodios</span></div>
              <div><b>{(satsByMember[focusedMember.slug] ?? []).length}</b><span>vínculos</span></div>
              <div><b>{focusedMember.rolCorto}</b><span>rol</span></div>
            </div>
            <Link className="av2-tdmn-card-foot" href={focusedMember.href}>Ver ficha completa →</Link>
          </div>
        </div>
      )}

      <p className="av2-tdmn-hint" style={{ opacity: focused ? 0 : 1 }}>
        Pasá el cursor · <b>click</b> abre vínculos · <b>segundo click</b> abre el expediente · click afuera vuelve
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verificar compilación**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/atlas/AtlasConstellation.tsx
git commit -m "feat(tdmn): componente AtlasConstellation (anillo, foco, expediente)"
```

---

### Task 5: Página `/te-de-media-noche`

**Files:**
- Create: `app/(atlas)/te-de-media-noche/page.tsx`

- [ ] **Step 1: Crear la página (patrón de `app/(atlas)/timeline/page.tsx`)**

```tsx
import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import AtlasConstellation from "@/components/atlas/AtlasConstellation";
import { TDMN_MEMBERS } from "@/data/atlas/te-de-media-noche";
import { buildConstellation } from "@/lib/te-de-media-noche";
import { cachedAtlasEntityDetail } from "@/lib/public-cache";
import { cachedBuildAtlasWikiResolver } from "@/lib/wiki-resolver";
import { publicVaultPath } from "@/lib/public-vault-path";
import type { AtlasEntityDetail } from "@/lib/atlas-content";

export const dynamic = "force-static";

export const metadata = {
  title: "Té de Media Noche · Grimorio de Lore",
  description:
    "Los integrantes del grupo de la campaña Recuerdos de Cobre y los vínculos que los unen.",
};

export default async function TeDeMediaNochePage() {
  const vaultPath = publicVaultPath();
  // Tuple de 2 (no spread) para que TS conserve los tipos de cada parte.
  const [resolve, details] = await Promise.all([
    cachedBuildAtlasWikiResolver(vaultPath),
    Promise.all(
      TDMN_MEMBERS.map((m) =>
        cachedAtlasEntityDetail(vaultPath, "personaje", m.slug),
      ),
    ),
  ]);

  const detailMap = new Map<string, AtlasEntityDetail | null>(
    TDMN_MEMBERS.map((m, i) => [m.slug, details[i] ?? null]),
  );
  const data = buildConstellation(detailMap, resolve);

  return (
    <AtlasPageScene
      eyebrow="El grupo de la campaña"
      title="Té de Media Noche"
      subtitle="Diez destinos cruzados. Tocá a un integrante para abrir sus vínculos; otro click abre su expediente."
      variant="tdmn"
    >
      <AtlasConstellation data={data} />
    </AtlasPageScene>
  );
}
```

- [ ] **Step 2: Verificar compilación + smoke en dev**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run (si no hay dev server corriendo en :3000): `npm run dev` en background; luego abrir `http://localhost:3000/te-de-media-noche`.
Expected: la página renderiza el anillo de 10 con retratos (sin 404 de imágenes en consola).

- [ ] **Step 3: Commit**

```bash
git add "app/(atlas)/te-de-media-noche/page.tsx"
git commit -m "feat(tdmn): página /te-de-media-noche"
```

---

### Task 6: Item en la nav

**Files:**
- Modify: `components/atlas/AtlasTopNav.tsx:35-43` (grupo "atlas" del array `GROUPS`)

- [ ] **Step 1: Agregar el link al grupo Atlas (primer item)**

```ts
  {
    id: "atlas",
    label: "Atlas",
    items: [
      { href: "/te-de-media-noche", label: "Té de Media Noche" },
      { href: "/personajes", label: "Personajes" },
      { href: "/facciones", label: "Facciones" },
      { href: "/lugares", label: "Lugares" },
      { href: "/mapa", label: "Mapa" },
    ],
  },
```

(El indicador de la nav se mide dinámicamente con `moveIndicatorTo` — no hay offsets CSS que tocar.)

- [ ] **Step 2: Verificar en dev**

Abrir `http://localhost:3000` → menú "Atlas" → debe listar "Té de Media Noche" primero y navegar a la página.

- [ ] **Step 3: Commit**

```bash
git add components/atlas/AtlasTopNav.tsx
git commit -m "feat(tdmn): entrada de Té de Media Noche en la nav del atlas"
```

---

### Task 7: Verificación final contra spec y referencia

**Files:**
- Read-only: `docs/ui-v2/te-de-media-noche-reference.html`, `docs/superpowers/specs/2026-06-09-te-de-media-noche-design.md`

- [ ] **Step 1: Suite completa + tipos**

Run: `npx vitest run && npx tsc --noEmit`
Expected: todo verde.

- [ ] **Step 2: Comparación visual contra la referencia**

1. Abrir `docs/ui-v2/te-de-media-noche-reference.html` en el navegador (con dev server corriendo para los retratos).
2. Abrir `http://localhost:3000/te-de-media-noche` al lado (desktop ~1440px y mobile ~390px, con devtools o `scripts/v2-screenshot.mjs` si está configurado para la ruta).
3. Listar diferencias P0/P1/P2 contra la referencia y corregir P0/P1 antes de cerrar (la referencia manda en lo estético; las diferencias estructurales válidas son: header del sitio en vez del header propio del mockup, stage embebido en la página en vez de full-viewport, y datos reales del vault en vez de los de muestra).

- [ ] **Step 3: Checklist de aceptación del spec**

- [ ] Los 10 integrantes con retrato y nombre, en el orden de la config.
- [ ] Borok desaturado, marco punteado, etiqueta "primer líder · se separó", línea cortada (dos tramos con hueco) hacia Mysha.
- [ ] Click → foco con líneas dibujándose desde el centro; satélites solo personajes/facciones (≤8).
- [ ] Segundo click → expediente con alias/bio/apariciones reales del vault y link a la ficha.
- [ ] Click afuera y Escape cierran por niveles (expediente → foco → reposo).
- [ ] Idle flotante presente; `prefers-reduced-motion` lo desactiva (emular en devtools).
- [ ] Mobile (~390px): anillo legible, expediente en columna scrolleable.
- [ ] Animación de fade-in escalonada al cargar.

- [ ] **Step 4: Commit de ajustes (si los hubo)**

```bash
git add -A -- "app/(atlas)" components/atlas lib data/atlas tests
git commit -m "fix(tdmn): ajustes de QA visual contra la referencia"
```
