# Ficha técnica (Foundry) en el expediente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sumar al expediente de `/te-de-media-noche` un reverso con flip que muestra la ficha técnica (D&D 5e) del PJ, importada desde exports de FoundryVTT.

**Architecture:** Un módulo puro `lib/foundry-stats.ts` (`parseFoundryActor` + tablas dnd5e→español, testeable) consumido por un script de I/O `scripts/foundry-stats.ts` que lee exports crudos (gitignored) y genera `data/atlas/tdmn-stats.ts`. El helper `buildConstellation` adjunta `stats` + identidad curada a cada miembro; el componente `AtlasConstellation` convierte la tarjeta del expediente en una flip-card con reverso técnico. Degrada solo: sin stats, sin flip.

**Tech Stack:** Next.js 15 · React 19 · TypeScript · CSS puro (tokens `--av2-*`) · vitest · tsx (scripts). Solo desktop.

**Spec:** `docs/superpowers/specs/2026-06-10-tdmn-ficha-tecnica-design.md`
**Referencia visual (manda en lo estético):** `docs/ui-v2/te-de-media-noche-ficha-reference.html` (abrir en navegador; retratos requieren `npm run dev` en :3000).

**Hechos del repo verificados (HEAD = `98d5464`):**
- `buildConstellation(details, resolve)` en `lib/te-de-media-noche.ts:73` devuelve `ConstellationData`; `ConstellationMember` (línea 16) tiene `slug,name,etiqueta,rolCorto,estado,imageSrc,aliases,bio,episodes,href`. Las 7 tests viven en `tests/te-de-media-noche.test.ts`.
- `TdmnMemberConfig` y `TDMN_MEMBERS` en `data/atlas/te-de-media-noche.ts` (Mysha es el primer elemento).
- La tarjeta del expediente está en `components/atlas/AtlasConstellation.tsx:261-282` (`.av2-tdmn-card` con `inert={!expanded}`, dentro: `card-x`, `card-img`, `card-body` con eyebrow/name/alias/bio/stats/foot).
- Estilos de la card en `app/(atlas)/atlas-te-de-media-noche.css` (`.av2-tdmn-card*`).
- La página `app/(atlas)/te-de-media-noche/page.tsx` arma `data` con `buildConstellation(detailMap, resolve)`.
- Export real de Mysha disponible en `I:\Descargas\fvtt-Actor-mysha-UxLsx1zlEjs1CDev.json` (dnd5e 5.3.2).
- ⚠️ El working tree puede tener cambios ajenos (mapa). NUNCA `git add -A`/`git add .`/`git commit -a`; stagear solo los archivos de cada task.

---

### Task 1: `lib/foundry-stats.ts` — parser puro + traducciones (TDD)

**Files:**
- Create: `tests/foundry-stats.test.ts`
- Create: `lib/foundry-stats.ts`

- [ ] **Step 1: Escribir el test (falla)**

```ts
// tests/foundry-stats.test.ts
import { describe, it, expect } from "vitest";
import { parseFoundryActor, type MemberStats } from "@/lib/foundry-stats";

// Actor mínimo estilo dnd5e 5.3.2 (recorte de la hoja real de Mysha).
const ACTOR = {
  name: "Mysha",
  type: "character",
  items: [
    { _id: "CLS1", type: "class", name: "Blood Witch", system: { levels: 14 } },
    { _id: "CLS2", type: "class", name: "Warlock", system: { levels: 3 } },
    { _id: "EQ1", type: "equipment", name: "Daga", system: {} },
  ],
  system: {
    abilities: {
      str: { value: 9 }, dex: { value: 12 }, con: { value: 18 },
      int: { value: 19 }, wis: { value: 15 }, cha: { value: 20 },
    },
    attributes: {
      ac: { flat: null, calc: "custom", formula: "17" },
      hp: { value: 148, max: 191, temp: 40 },
      movement: { walk: "30", units: "ft" },
      senses: { units: "ft", special: "Blood Sense 60", ranges: { darkvision: 60, blindsight: null, truesight: 0, tremorsense: 0 } },
    },
    details: { originalClass: "CLS1" },
    traits: {
      dr: { value: ["cold", "fire", "necrotic"], custom: "" },
      di: { value: [], custom: "" },
      ci: { value: [], custom: "sleep" },
      languages: { value: ["common", "draconic", "abyssal"], custom: "" },
    },
  },
};

describe("parseFoundryActor", () => {
  const s: MemberStats = parseFoundryActor(ACTOR);

  it("clase principal (originalClass) y nivel = suma de clases", () => {
    expect(s.clase).toBe("Blood Witch");
    expect(s.nivel).toBe(17);
  });

  it("AC desde formula numérica; HP es el máximo (no el value en vivo)", () => {
    expect(s.ac).toBe(17);
    expect(s.hpMax).toBe(191);
  });

  it("velocidad con unidades", () => {
    expect(s.speed).toBe("30 ft");
  });

  it("atributos con modificador calculado", () => {
    expect(s.abilities.cha).toEqual({ value: 20, mod: 5 });
    expect(s.abilities.str).toEqual({ value: 9, mod: -1 });
    expect(s.abilities.con.mod).toBe(4);
  });

  it("resistencias e inmunidades de condición traducidas al español", () => {
    expect(s.resistances).toEqual(["Frío", "Fuego", "Necrótico"]);
    expect(s.damageImmunities).toEqual([]);
    expect(s.conditionImmunities).toEqual(["Dormir"]);
  });

  it("sentidos: rangos > 0 + especial verbatim", () => {
    expect(s.senses).toEqual(["Visión en la oscuridad 60 ft", "Blood Sense 60"]);
  });

  it("idiomas traducidos", () => {
    expect(s.languages).toEqual(["Común", "Dracónico", "Abisal"]);
  });

  it("AC null cuando no hay flat ni formula numérica", () => {
    const noAc = parseFoundryActor({
      ...ACTOR,
      system: { ...ACTOR.system, attributes: { ...ACTOR.system.attributes, ac: { flat: null, calc: "default", formula: "" } } },
    });
    expect(noAc.ac).toBeNull();
  });

  it("no rompe con campos ausentes (degrada a vacío)", () => {
    const bare = parseFoundryActor({ name: "X", items: [], system: { attributes: {}, abilities: {}, traits: {}, details: {} } });
    expect(bare.resistances).toEqual([]);
    expect(bare.languages).toEqual([]);
    expect(bare.senses).toEqual([]);
    expect(bare.nivel).toBe(0);
    expect(bare.clase).toBe("");
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/foundry-stats.test.ts`
Expected: FAIL — `Cannot find module '@/lib/foundry-stats'`.

- [ ] **Step 3: Implementar el módulo**

```ts
// lib/foundry-stats.ts
// Parser PURO de un actor exportado de FoundryVTT (dnd5e 5.3.2) → ficha
// técnica "Esencial". Sin I/O. Incluye traducción dnd5e→español.

export type Ability = { value: number; mod: number };
export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type MemberStats = {
  clase: string;
  nivel: number;
  ac: number | null;
  hpMax: number;
  speed: string;
  abilities: Record<AbilityKey, Ability>;
  resistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: string[];
  languages: string[];
};

const DAMAGE_ES: Record<string, string> = {
  acid: "Ácido", bludgeoning: "Contundente", cold: "Frío", fire: "Fuego",
  force: "Fuerza", lightning: "Relámpago", necrotic: "Necrótico", poison: "Veneno",
  psychic: "Psíquico", radiant: "Radiante", slashing: "Cortante", piercing: "Perforante",
  thunder: "Trueno",
};
const CONDITION_ES: Record<string, string> = {
  blinded: "Cegado", charmed: "Hechizado", deafened: "Ensordecido", frightened: "Asustado",
  grappled: "Apresado", incapacitated: "Incapacitado", invisible: "Invisible",
  paralyzed: "Paralizado", petrified: "Petrificado", poisoned: "Envenenado", prone: "Derribado",
  restrained: "Restringido", stunned: "Aturdido", unconscious: "Inconsciente",
  exhaustion: "Agotamiento", sleep: "Dormir", diseased: "Enfermo",
};
const LANGUAGE_ES: Record<string, string> = {
  common: "Común", dwarvish: "Enano", elvish: "Élfico", giant: "Gigante", gnomish: "Gnómico",
  goblin: "Goblin", halfling: "Mediano", orc: "Orco", abyssal: "Abisal", celestial: "Celestial",
  draconic: "Dracónico", deep: "Habla Profunda", infernal: "Infernal", primordial: "Primordial",
  sylvan: "Silvano", undercommon: "Infracomún",
};
const SENSE_ES: Record<string, string> = {
  darkvision: "Visión en la oscuridad", blindsight: "Visión ciega",
  tremorsense: "Sentido sísmico", truesight: "Visión verdadera",
};

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Traduce una lista `value[]` + `custom` (coma-separado, texto libre) a español.
function traitList(node: unknown, map: Record<string, string>): string[] {
  const n = (node ?? {}) as { value?: unknown; custom?: unknown };
  const out: string[] = [];
  for (const k of Array.isArray(n.value) ? (n.value as string[]) : []) {
    out.push(map[k] ?? cap(String(k)));
  }
  if (typeof n.custom === "string" && n.custom.trim()) {
    for (const raw of n.custom.split(",")) {
      const k = raw.trim();
      if (k) out.push(map[k.toLowerCase()] ?? cap(k));
    }
  }
  return out;
}

function abilityMod(value: number): number {
  return Math.floor((value - 10) / 2);
}

export function parseFoundryActor(actor: unknown): MemberStats {
  const a = (actor ?? {}) as any;
  const sys = a.system ?? {};
  const items: any[] = Array.isArray(a.items) ? a.items : [];

  // Clase / nivel
  const classes = items.filter((it) => it?.type === "class");
  const nivel = classes.reduce((sum, c) => sum + (Number(c?.system?.levels) || 0), 0);
  const original = classes.find((c) => c?._id === sys?.details?.originalClass);
  const clase = (original ?? classes[0])?.name ?? "";

  // Atributos
  const abil = (sys.abilities ?? {}) as Record<string, { value?: number }>;
  const ability = (k: AbilityKey): Ability => {
    const v = Number(abil[k]?.value) || 0;
    return { value: v, mod: abilityMod(v) };
  };
  const abilities: Record<AbilityKey, Ability> = {
    str: ability("str"), dex: ability("dex"), con: ability("con"),
    int: ability("int"), wis: ability("wis"), cha: ability("cha"),
  };

  // AC: flat numérico, o formula numérica, o null.
  const acNode = sys.attributes?.ac ?? {};
  let ac: number | null = null;
  if (typeof acNode.flat === "number") ac = acNode.flat;
  else if (acNode.formula != null && acNode.formula !== "" && Number.isFinite(Number(acNode.formula))) ac = Number(acNode.formula);

  // HP máximo (nunca el value/temp en vivo)
  const hpMax = Number(sys.attributes?.hp?.max) || 0;

  // Velocidad
  const mv = sys.attributes?.movement ?? {};
  const walk = mv.walk != null && mv.walk !== "" ? `${mv.walk} ${mv.units ?? "ft"}` : "";

  // Sentidos: rangos > 0 + especial verbatim
  const senses: string[] = [];
  const ranges = (sys.attributes?.senses?.ranges ?? {}) as Record<string, number | null>;
  const sUnits = sys.attributes?.senses?.units ?? "ft";
  for (const [k, v] of Object.entries(ranges)) {
    if (typeof v === "number" && v > 0) senses.push(`${SENSE_ES[k] ?? cap(k)} ${v} ${sUnits}`);
  }
  const special = sys.attributes?.senses?.special;
  if (typeof special === "string" && special.trim()) senses.push(special.trim());

  return {
    clase,
    nivel,
    ac,
    hpMax,
    speed: walk,
    abilities,
    resistances: traitList(sys.traits?.dr, DAMAGE_ES),
    damageImmunities: traitList(sys.traits?.di, DAMAGE_ES),
    conditionImmunities: traitList(sys.traits?.ci, CONDITION_ES),
    senses,
    languages: traitList(sys.traits?.languages, LANGUAGE_ES),
  };
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run tests/foundry-stats.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Suite completa**

Run: `npx vitest run`
Expected: verde (109 previos + 9 nuevos = 118).

- [ ] **Step 6: Commit**

```bash
git add lib/foundry-stats.ts tests/foundry-stats.test.ts
git commit -m "feat(ficha): parser puro de actor Foundry → ficha técnica (dnd5e→es)"
```

---

### Task 2: Script de import + archivo generado

**Files:**
- Create: `scripts/foundry-stats.ts`
- Modify: `.gitignore` (append)
- Create (generado): `data/atlas/tdmn-stats.ts`

- [ ] **Step 1: Escribir el script**

```ts
// scripts/foundry-stats.ts
// I/O: lee exports crudos de foundry-export/<slug>.json y genera
// data/atlas/tdmn-stats.ts. El slug es el nombre del archivo (sin .json).
// Re-correr cuando cambie una hoja: `npx tsx scripts/foundry-stats.ts`.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { parseFoundryActor, type MemberStats } from "../lib/foundry-stats";

const SRC = "foundry-export";
const OUT = "data/atlas/tdmn-stats.ts";

if (!existsSync(SRC)) {
  console.error(`No existe la carpeta ${SRC}/. Creala y dejá ahí los exports (un <slug>.json por PJ).`);
  process.exit(1);
}

const files = readdirSync(SRC).filter((f) => f.toLowerCase().endsWith(".json")).sort();
const stats: Record<string, MemberStats> = {};
for (const f of files) {
  const slug = basename(f, extname(f));
  const actor = JSON.parse(readFileSync(join(SRC, f), "utf8"));
  stats[slug] = parseFoundryActor(actor);
  console.log(`  ✓ ${slug}: ${stats[slug].clase} · Nivel ${stats[slug].nivel}`);
}

const out =
  `// GENERADO por scripts/foundry-stats.ts — NO editar a mano.\n` +
  `// Fuente: exports de Foundry en foundry-export/ (gitignored).\n` +
  `import type { MemberStats } from "@/lib/foundry-stats";\n\n` +
  `export const TDMN_STATS: Record<string, MemberStats> = ${JSON.stringify(stats, null, 2)};\n`;

writeFileSync(OUT, out);
console.log(`\ntdmn-stats: ${files.length} actor(es) → ${OUT}`);
```

- [ ] **Step 2: Gitignorear los crudos**

Verificá si ya está: `git check-ignore foundry-export/x.json` (si imprime la ruta, ya está; saltá este step). Si no, agregá al final de `.gitignore`:

```
# Exports crudos de FoundryVTT (se procesan a data/atlas/tdmn-stats.ts)
foundry-export/
```

- [ ] **Step 3: Colocar el export real de Mysha y generar**

```bash
mkdir -p foundry-export
cp "/i/Descargas/fvtt-Actor-mysha-UxLsx1zlEjs1CDev.json" "foundry-export/mysha.json"
npx tsx scripts/foundry-stats.ts
```

Expected: imprime `✓ mysha: Blood Witch · Nivel 17` y `1 actor(es) → data/atlas/tdmn-stats.ts`. Si el `cp` falla por la ruta de Windows, copiá el archivo a mano a `foundry-export/mysha.json` y re-corré el `npx tsx`.

- [ ] **Step 4: Verificar el generado**

Run: `npx tsc --noEmit`
Expected: sin errores. Abrí `data/atlas/tdmn-stats.ts` y confirmá que `TDMN_STATS.mysha` tiene `clase: "Blood Witch"`, `nivel: 17`, `ac: 17`, `hpMax: 191`, `abilities.cha.mod: 5`, `resistances: ["Frío","Fuego","Necrótico"]`.

- [ ] **Step 5: Commit**

```bash
git add scripts/foundry-stats.ts .gitignore data/atlas/tdmn-stats.ts
git commit -m "feat(ficha): script de import Foundry + tdmn-stats generado (Mysha)"
```

---

### Task 3: Identidad curada + cableado en el helper y la página

**Files:**
- Modify: `data/atlas/te-de-media-noche.ts`
- Modify: `lib/te-de-media-noche.ts`
- Modify: `tests/te-de-media-noche.test.ts`
- Modify: `app/(atlas)/te-de-media-noche/page.tsx`

- [ ] **Step 1: Test de cableado (falla)**

En `tests/te-de-media-noche.test.ts`, agregá este bloque al final del archivo (usa el `resolve` y `fakeDetail` ya definidos arriba en ese archivo):

```ts
import { TDMN_STATS } from "@/data/atlas/tdmn-stats";

describe("buildConstellation — ficha técnica e identidad", () => {
  it("adjunta stats por slug y null si no hay", () => {
    const data = buildConstellation(new Map(), resolve, { mysha: TDMN_STATS.mysha });
    const mysha = data.members.find((m) => m.slug === "mysha")!;
    const pilar = data.members.find((m) => m.slug === "pilar")!;
    expect(mysha.stats?.clase).toBe("Blood Witch");
    expect(pilar.stats).toBeNull();
  });

  it("expone la identidad curada de la config", () => {
    const data = buildConstellation(new Map(), resolve);
    const mysha = data.members.find((m) => m.slug === "mysha")!;
    expect(mysha.raza).toBe("Humana");
    expect(mysha.edad).toBe("16");
    expect(mysha.altura).toBe("1,65 m");
  });

  it("stats por defecto vacío no rompe las 7 tests previas (3 args opcional)", () => {
    const data = buildConstellation(new Map(), resolve);
    expect(data.members).toHaveLength(10);
    expect(data.members.every((m) => m.stats === null)).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run tests/te-de-media-noche.test.ts`
Expected: FAIL — `raza`/`stats` no existen en el tipo, y `buildConstellation` no acepta 3er arg.

- [ ] **Step 3: Agregar identidad a la config**

En `data/atlas/te-de-media-noche.ts`, extendé el tipo: agregá estas 3 líneas dentro de `TdmnMemberConfig` (después de `estado: TdmnEstado;`):

```ts
  raza?: string;        // curado — Foundry lo tiene vacío (race: null)
  edad?: string;        // curado — Foundry lo tiene vacío
  altura?: string;      // curado — Foundry lo tiene vacío
```

Y en el primer elemento del array `TDMN_MEMBERS` (Mysha) agregá los valores (al final del objeto, antes del `}`):

```ts
    raza: "Humana", edad: "16", altura: "1,65 m",
```

- [ ] **Step 4: Cablear el helper**

En `lib/te-de-media-noche.ts`:

(a) Agregá el import arriba (después del import de `atlas-portraits`):

```ts
import type { MemberStats } from "@/lib/foundry-stats";
```

(b) Extendé `ConstellationMember` (agregá estas líneas antes de `href: string;`):

```ts
  raza: string | null;
  edad: string | null;
  altura: string | null;
  stats: MemberStats | null;
```

(c) Cambiá la firma de `buildConstellation` para aceptar el 3er parámetro opcional:

```ts
export function buildConstellation(
  details: Map<string, AtlasEntityDetail | null>,
  resolve: Resolver,
  stats: Record<string, MemberStats> = {},
): ConstellationData {
```

(d) En el `.map` que crea `members` (objeto que se retorna por miembro), agregá estos campos junto a los existentes:

```ts
      raza: cfg.raza ?? null,
      edad: cfg.edad ?? null,
      altura: cfg.altura ?? null,
      stats: stats[cfg.slug] ?? null,
```

- [ ] **Step 5: Pasar TDMN_STATS desde la página**

En `app/(atlas)/te-de-media-noche/page.tsx`:

(a) Agregá el import (después del import de `buildConstellation`):

```ts
import { TDMN_STATS } from "@/data/atlas/tdmn-stats";
```

(b) Cambiá la línea `const data = buildConstellation(detailMap, resolve);` por:

```ts
  const data = buildConstellation(detailMap, resolve, TDMN_STATS);
```

- [ ] **Step 6: Correr tests y tipos**

Run: `npx vitest run && npx tsc --noEmit`
Expected: todo verde (118 tests, incluidas las 3 nuevas; las 7 previas de buildConstellation siguen pasando).

- [ ] **Step 7: Commit**

```bash
git add data/atlas/te-de-media-noche.ts lib/te-de-media-noche.ts tests/te-de-media-noche.test.ts "app/(atlas)/te-de-media-noche/page.tsx"
git commit -m "feat(ficha): identidad curada + stats cableados en buildConstellation"
```

---

### Task 4: CSS — flip + hoja del reverso

**Files:**
- Modify: `app/(atlas)/atlas-te-de-media-noche.css` (append al final)

Portado de la referencia, adaptado a `.av2-tdmn-*` y a la card existente (que ya hace el centrado/entrada). Solo se APPENDEA; no se tocan reglas existentes (el bloque agrega `perspective`/`min-height` a `.av2-tdmn-card` con una regla nueva del mismo selector, que mergea).

- [ ] **Step 1: Append del bloque al final de `app/(atlas)/atlas-te-de-media-noche.css`**

```css
/* ============================================================
   Ficha técnica — flip del expediente (.av2-tdmn-card / -sheet)
   Referencia: docs/ui-v2/te-de-media-noche-ficha-reference.html
   ============================================================ */
/* Altura fija: ambas caras son absolute inset:0, así que la card necesita
   altura definida. 400px piso cómodo para front y hoja; si algo desborda,
   scrollea adentro en vez de recortarse. */
.av2-tdmn-card { perspective: 1800px; min-height: 400px; }
.av2-tdmn-card-flip {
  position: relative; width: 100%; height: 100%; min-height: inherit;
  transform-style: preserve-3d; transition: transform .8s var(--av2-ease);
}
.av2-tdmn-card.is-flipped .av2-tdmn-card-flip { transform: rotateY(180deg); }
.av2-tdmn-card-face {
  position: absolute; inset: 0; display: flex; backface-visibility: hidden;
  -webkit-backface-visibility: hidden; border-radius: 8px; overflow: hidden;
}
.av2-tdmn-card-face.is-back { transform: rotateY(180deg); flex-direction: column; }
.av2-tdmn-card-face.is-front .av2-tdmn-card-body { overflow-y: auto; }

/* botón de giro */
.av2-tdmn-flip-btn {
  position: absolute; bottom: 12px; right: 14px; z-index: 3;
  font-family: var(--av2-mono); font-size: .58rem; letter-spacing: .1em; text-transform: uppercase;
  color: var(--av2-ink-soft); background: oklch(0.092 0.010 58 / .6);
  border: 1px solid var(--av2-rule-up); border-radius: 20px; padding: 6px 13px; cursor: pointer;
  transition: all .22s var(--av2-ease);
}
.av2-tdmn-flip-btn:hover { border-color: var(--av2-copper); color: var(--av2-copper-hi); }

/* hoja del reverso */
.av2-tdmn-sheet { padding: 20px 22px 44px; flex: 1; display: flex; flex-direction: column; gap: 13px; overflow-y: auto; }
.av2-tdmn-sheet-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.av2-tdmn-sheet-top h3 { font-family: var(--av2-display); font-weight: 600; font-size: 1.5rem; color: var(--av2-ink); margin: 0; line-height: 1; }
.av2-tdmn-sheet-cls { font-family: var(--av2-body); font-size: .82rem; color: var(--av2-copper-hi); margin-top: 2px; }
.av2-tdmn-sheet-ident { font-family: var(--av2-mono); font-size: .56rem; letter-spacing: .06em; color: var(--av2-ink-faint); margin-top: 4px; }
.av2-tdmn-sheet-race {
  font-family: var(--av2-mono); font-size: .54rem; letter-spacing: .12em; text-transform: uppercase;
  color: var(--av2-ink-faint); border: 1px solid var(--av2-rule); border-radius: 5px; padding: 5px 9px; white-space: nowrap;
}
.av2-tdmn-vitals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.av2-tdmn-vital { background: var(--av2-bg); border: 1px solid var(--av2-rule); border-radius: 6px; padding: 9px 6px; text-align: center; }
.av2-tdmn-vital b { display: block; font-family: var(--av2-display); font-size: 1.5rem; color: var(--av2-copper-hi); line-height: 1; font-weight: 600; }
.av2-tdmn-vital span { font-family: var(--av2-mono); font-size: .5rem; letter-spacing: .14em; text-transform: uppercase; color: var(--av2-ink-faint); margin-top: 3px; display: block; }
.av2-tdmn-abil { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px; }
.av2-tdmn-ab { background: var(--av2-bg-panel-up); border: 1px solid var(--av2-rule); border-radius: 5px; padding: 6px 2px 5px; text-align: center; }
.av2-tdmn-ab.is-hi { border-color: var(--av2-rule-copper); background: linear-gradient(180deg, var(--av2-bg-panel-up), var(--av2-copper-deep)); }
.av2-tdmn-ab .k { font-family: var(--av2-mono); font-size: .5rem; letter-spacing: .08em; color: var(--av2-ink-faint); }
.av2-tdmn-ab .v { font-family: var(--av2-display); font-size: 1.15rem; color: var(--av2-ink); line-height: 1.15; font-weight: 600; }
.av2-tdmn-ab .m { font-family: var(--av2-mono); font-size: .6rem; color: var(--av2-copper-hi); }
.av2-tdmn-traits { display: flex; flex-direction: column; gap: 7px; border-top: 1px solid var(--av2-rule); padding-top: 11px; margin-top: 2px; }
.av2-tdmn-trait { display: grid; grid-template-columns: 74px 1fr; gap: 10px; align-items: baseline; }
.av2-tdmn-trait .lab { font-family: var(--av2-mono); font-size: .54rem; letter-spacing: .12em; text-transform: uppercase; color: var(--av2-copper-dim); }
.av2-tdmn-trait .val { font-family: var(--av2-body); font-size: .8rem; color: var(--av2-ink-soft); line-height: 1.45; }
.av2-tdmn-trait .val.res { color: var(--av2-gold); }

@media (prefers-reduced-motion: reduce) {
  .av2-tdmn-card-flip { transition: none !important; }
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(atlas)/atlas-te-de-media-noche.css"
git commit -m "feat(ficha): estilos del flip y la hoja técnica del expediente"
```

---

### Task 5: Componente — flip-card con reverso técnico

**Files:**
- Modify: `components/atlas/AtlasConstellation.tsx`

- [ ] **Step 1: Estado de flip + reset al cerrar**

En `components/atlas/AtlasConstellation.tsx`, en la zona de estado (junto a `const [expanded, setExpanded] = useState(false);`), agregá:

```ts
  const [flipped, setFlipped] = useState(false);
```

Y agregá este efecto junto a los demás `useEffect` (resetea el giro cuando se cierra el expediente):

```ts
  useEffect(() => {
    if (!expanded) setFlipped(false);
  }, [expanded]);
```

- [ ] **Step 2: Helper de formato de modificador**

Agregá esta función pura a nivel de módulo (arriba del componente, junto a `ringPos`):

```ts
const ABILITY_ROWS: Array<[string, "str" | "dex" | "con" | "int" | "wis" | "cha"]> = [
  ["FUE", "str"], ["DES", "dex"], ["CON", "con"], ["INT", "int"], ["SAB", "wis"], ["CAR", "cha"],
];
function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`; // signo menos tipográfico U+2212
}
```

- [ ] **Step 3: Reestructurar la tarjeta en flip (front + back)**

Reemplazá TODO el bloque `{focusedMember && ( ... )}` (actualmente en `components/atlas/AtlasConstellation.tsx:261-282`) por:

```tsx
      {focusedMember && (
        <div
          className={`av2-tdmn-card${expanded ? " show" : ""}${flipped ? " is-flipped" : ""}`}
          role="dialog"
          aria-label={`Expediente de ${focusedMember.name}`}
          inert={!expanded}
        >
          <div className="av2-tdmn-card-flip">
            {/* FRENTE — narrativa */}
            <div className="av2-tdmn-card-face is-front">
              <button type="button" className="av2-tdmn-card-x" ref={closeBtnRef} onClick={() => setExpanded(false)} aria-label="Cerrar expediente">✕</button>
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
              {focusedMember.stats && (
                <button type="button" className="av2-tdmn-flip-btn" onClick={() => setFlipped(true)}>↻ Ficha técnica</button>
              )}
            </div>

            {/* REVERSO — ficha técnica (solo si hay stats) */}
            {focusedMember.stats && (
              <div className="av2-tdmn-card-face is-back">
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
                </div>
                <button type="button" className="av2-tdmn-flip-btn" onClick={() => setFlipped(false)}>↻ Volver</button>
              </div>
            )}
          </div>
        </div>
      )}
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add components/atlas/AtlasConstellation.tsx
git commit -m "feat(ficha): tarjeta del expediente con flip al reverso técnico"
```

---

### Task 6: Verificación final (tipos, tests, QA visual desktop)

**Files:**
- Read-only: `docs/ui-v2/te-de-media-noche-ficha-reference.html`, spec.

- [ ] **Step 1: Suite + tipos**

Run: `npx vitest run && npx tsc --noEmit`
Expected: todo verde (118 tests).

- [ ] **Step 2: Build + arranque**

```bash
npx next build
npx next start -p 3100
```
Expected: build OK, `/te-de-media-noche` como ○ (Static).

- [ ] **Step 3: QA visual con Playwright (desktop 1440×900)**

Navegá a `http://localhost:3100/te-de-media-noche`, entrá a Mysha (click → segundo click abre expediente), clickeá **↻ Ficha técnica**. Verificá contra `docs/ui-v2/te-de-media-noche-ficha-reference.html`:

- [ ] El frente muestra la narrativa; el botón "↻ Ficha técnica" aparece (Mysha tiene stats).
- [ ] Al girar: cabecera con "Blood Witch · Nivel 17", identidad "16 años · 1,65 m", chip "Humana".
- [ ] Vitales: CA **17** · HP **191** · **30 ft**.
- [ ] Atributos con mods correctos; CON/INT/CAR resaltados (mod ≥ +4).
- [ ] Rasgos: Resist. frío·fuego·necrótico · Inmune dormir · Sentidos (incluye Blood Sense 60) · Idiomas (7).
- [ ] "↻ Volver" gira de vuelta al frente; cerrar el expediente y reabrir lo muestra en el frente (flip reseteado).
- [ ] Otro PJ sin export (ej. Pilar): el expediente NO muestra el botón de giro ni el reverso.
- [ ] Con `prefers-reduced-motion` (emular en devtools): el cambio de cara es instantáneo, sin rotación.

- [ ] **Step 4: Commit de ajustes (si los hubo)**

```bash
git add "app/(atlas)/atlas-te-de-media-noche.css" components/atlas/AtlasConstellation.tsx
git commit -m "fix(ficha): ajustes de QA visual contra la referencia"
```
