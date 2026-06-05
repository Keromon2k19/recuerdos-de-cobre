# Elevación visual UI V2 — Fundación + Piloto Objetos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formalizar la materialidad del home V2 como sistema/kit compartido y elevar la página piloto (Objetos: índice + ficha) a ese nivel, validando el patrón antes del rollout al resto.

**Architecture:** Las páginas rotas ya tienen estructura (`AtlasPageScene` + `AtlasDomainExplorer` + `AtlasEntityDetail`); el trabajo es de materialidad. Se extraen dos primitivas nuevas (`AtlasPageHeader`, `AtlasSectionHero`) desde la gramática del hero del home, se refina el CSS compartido, se valida todo en un catálogo `/v2/kit`, y se eleva Objetos de punta a punta con el loop de screenshot vs home.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript, CSS puro bajo `.av2` en `app/(v2)/v2/atlas-v2.css`, `scripts/v2-screenshot.mjs` (Playwright/Edge), vitest.

**Nota sobre verificación visual:** los componentes de UI son presentacionales; no se unit-testean con vitest (igual que el resto del kit V2). Su verificación es por **screenshot a 1440 comparado contra el home + medición P0/P1/P2 + review `impeccable`**, según el protocolo de `CLAUDE.md`. El CSS fino se ajusta en ese loop, por eso las tareas fijan estructura/código nuevo + pasos de verificación, no valores de píxel pre-adivinados sobre el stylesheet de ~9000 líneas.

**Fuente de verdad visual:** home (`app/(v2)/v2/page.tsx`, clases `av2-hero*`, `av2-ornament*`, `av2-title-*`), tokens `.av2` en `atlas-v2.css`, y `docs/superpowers/specs/2026-06-04-elevacion-visual-v2-design.md`.

---

## File Structure

**Crear:**
- `components/atlas-v2/AtlasPageHeader.tsx` — encabezado de página (eyebrow + ornamento + título display + intro). Extraído del header inline de `AtlasPageScene` y alineado al hero del home.
- `components/atlas-v2/AtlasSectionHero.tsx` — hero/foco de sección con variantes `image` y `material`. Reemplaza el "artifact" inline de `AtlasEntityDetail` y queda disponible para los stages.
- `app/(v2)/v2/kit/page.tsx` — catálogo de desarrollo no enlazado que renderiza cada primitiva en sus variantes.
- `docs/mockups/2026-06-04-objetos-A.html`, `-B.html`, `-C.html` — mockups del gabinete de Objetos (2-3 variantes toggleables) para aprobar layout.

**Modificar:**
- `components/atlas-v2/AtlasPageScene.tsx` — componer `AtlasPageHeader`; fondo material cuando no hay imagen.
- `components/atlas-v2/AtlasEntityDetail.tsx` — usar `AtlasSectionHero` para el artifact.
- `app/(v2)/v2/atlas-v2.css` — bloques `av2-page-header`, `av2-section-hero`; refinar `av2-page-scene`, `av2-domain-*`, `av2-relic-*`, `av2-entity-detail-*` a la materialidad del home.
- `docs/rdc-ui-v2-qa.md` — registrar el resultado del piloto.

**Fuera de este plan (plan siguiente):** Misterios, Mundo, fichas de detalle de esos dominios, y el resto (Personajes, Capítulos, Facciones, Dioses, Lugares, Mapa, Buscar). Se replican sobre el kit ya validado.

---

## Task 1: Baseline — capturar home y Objetos actual

**Files:** ninguno (captura de referencia).

- [ ] **Step 1: Levantar dev server**

Run (background): `npm run dev`
Expected: server en `http://localhost:3000` (anotar el puerto real si difiere).

- [ ] **Step 2: Capturar home (referencia de materialidad) y Objetos actual a 1440**

Run (PowerShell):
```powershell
$env:V2_BROWSER_CHANNEL="msedge"; $env:V2_BASE_URL="http://localhost:3000"; node scripts/v2-screenshot.mjs --routes "/v2,/v2/objetos" --width 1440
```
Expected: capturas en `artifacts/screenshots/ui-v2/`. Guardar como baseline "antes".

- [ ] **Step 3: Listar el gap P0/P1/P2 de Objetos vs home**

Abrir ambas capturas y anotar, en un comentario para las tareas siguientes, las diferencias de materialidad (encabezado, marcos de cobre, sombras, ornamentos, foco narrativo). No editar código todavía.

---

## Task 2: AtlasPageHeader + refactor de AtlasPageScene

**Files:**
- Create: `components/atlas-v2/AtlasPageHeader.tsx`
- Modify: `components/atlas-v2/AtlasPageScene.tsx`

- [ ] **Step 1: Crear `AtlasPageHeader`**

```tsx
// components/atlas-v2/AtlasPageHeader.tsx
// Encabezado de página V2 — misma gramática que el hero del home, en escala
// "sección": eyebrow mono + ornamento (rombo) + título display + intro.
import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  align?: "center" | "left";
};

export default function AtlasPageHeader({
  eyebrow,
  title,
  intro,
  align = "center",
}: Props) {
  return (
    <header className="av2-page-header" data-align={align}>
      <p className="av2-page-header-eyebrow">{eyebrow}</p>
      <div className="av2-ornament" aria-hidden="true">
        <span className="av2-ornament-diamond" />
      </div>
      <h1 className="av2-page-header-title">{title}</h1>
      {intro && <p className="av2-page-header-intro">{intro}</p>}
    </header>
  );
}
```

- [ ] **Step 2: Refactor `AtlasPageScene` para componer el header**

Reemplazar el cuerpo de `AtlasPageScene.tsx` por:

```tsx
import type { ReactNode } from "react";
import AtlasPageHeader from "./AtlasPageHeader";

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  backgroundSrc?: string;
  variant?: string;
  className?: string;
  children: ReactNode;
};

export default function AtlasPageScene({
  eyebrow,
  title,
  subtitle,
  backgroundSrc,
  variant,
  className = "",
  children,
}: Props) {
  return (
    <section
      className={`av2-page-scene ${className}`.trim()}
      data-variant={variant}
      data-bg={backgroundSrc ? "image" : "material"}
    >
      <div className="av2-page-scene-bg" aria-hidden="true">
        {backgroundSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundSrc} alt="" />
        ) : null}
      </div>

      <AtlasPageHeader eyebrow={eyebrow} title={title} intro={subtitle} />

      <div className="av2-page-scene-content">{children}</div>
    </section>
  );
}
```

Nota: se quita el default `backgroundSrc = ".../hero.png"`. Cuando no hay imagen, `data-bg="material"` deja que el CSS pinte un fondo material (gradiente) en vez de la foto del hero. Las páginas que quieran foto siguen pasando `backgroundSrc`.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sin errores (las llamadas existentes pasan `title` string, compatible con `ReactNode`).

- [ ] **Step 4: Commit**

```bash
git add components/atlas-v2/AtlasPageHeader.tsx "components/atlas-v2/AtlasPageScene.tsx"
git commit -m "feat(v2): AtlasPageHeader + AtlasPageScene compone el header (kit)"
```

---

## Task 3: AtlasSectionHero + uso en AtlasEntityDetail

**Files:**
- Create: `components/atlas-v2/AtlasSectionHero.tsx`
- Modify: `components/atlas-v2/AtlasEntityDetail.tsx`

- [ ] **Step 1: Crear `AtlasSectionHero`**

```tsx
// components/atlas-v2/AtlasSectionHero.tsx
// Foco/hero de sección. variant="image": foto grande con marco de cobre.
// variant="material": glifo/sigilo material cuando no hay imagen propia.
type Props = {
  variant: "image" | "material";
  imageSrc?: string;
  glyph: string;
  alt: string;
  eyebrow?: string;
  title: string;
  meta?: string;
};

export default function AtlasSectionHero({
  variant,
  imageSrc,
  glyph,
  alt,
  eyebrow,
  title,
  meta,
}: Props) {
  const showImage = variant === "image" && Boolean(imageSrc);
  return (
    <div className="av2-section-hero" data-variant={showImage ? "image" : "material"}>
      <div className="av2-section-hero-rings" aria-hidden="true" />
      <div className="av2-section-hero-focus">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={alt} />
        ) : (
          <span aria-hidden="true">{glyph}</span>
        )}
      </div>
      <div className="av2-section-hero-caption">
        {eyebrow && <p>{eyebrow}</p>}
        <h2>{title}</h2>
        {meta && <span>{meta}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Usar `AtlasSectionHero` en `AtlasEntityDetail`**

En `AtlasEntityDetail.tsx`, importar el componente:

```tsx
import AtlasSectionHero from "./AtlasSectionHero";
```

y reemplazar el bloque actual `<div className="av2-entity-detail-artifact">…</div>` (líneas ~38-45) por:

```tsx
        <AtlasSectionHero
          variant={detail.imageSrc ? "image" : "material"}
          imageSrc={detail.imageSrc}
          glyph={detail.name.charAt(0)}
          alt={detail.name}
          title={detail.name}
          eyebrow={detail.kind}
          meta={detail.appearances.length > 0 ? `${detail.appearances.length} apariciones` : undefined}
        />
```

(Se mantiene `av2-entity-detail-identity`, `-meta` y el resto del componente igual.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add components/atlas-v2/AtlasSectionHero.tsx components/atlas-v2/AtlasEntityDetail.tsx
git commit -m "feat(v2): AtlasSectionHero (image/material) usado en la ficha (kit)"
```

---

## Task 4: CSS del sistema (header + section-hero + materialidad)

**Files:**
- Modify: `app/(v2)/v2/atlas-v2.css`

- [ ] **Step 1: Agregar el bloque base de las primitivas nuevas**

Agregar al final de `atlas-v2.css` (valores de arranque; se afinan en el loop de Task 7):

```css
/* ============================================================
   Sistema de página (av2-page-header / av2-section-hero)
   Materialidad alineada al hero del home.
   ============================================================ */

.av2-page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: clamp(48px, 7vw, 96px) 24px clamp(24px, 3vw, 40px);
  text-align: center;
}
.av2-page-header[data-align="left"] { align-items: flex-start; text-align: left; }
.av2-page-header-eyebrow {
  font-family: var(--av2-mono);
  font-size: 12px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--av2-copper);
}
.av2-page-header-title {
  font-family: var(--av2-display);
  font-size: clamp(2.6rem, 5.2vw, 4.4rem);
  line-height: 1.04;
  color: var(--av2-ink);
}
.av2-page-header-title .av2-title-copper { color: var(--av2-copper); }
.av2-page-header-intro {
  max-width: 60ch;
  font-family: var(--av2-body);
  font-size: 1.08rem;
  line-height: 1.7;
  color: var(--av2-ink-soft);
}

.av2-section-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 28px;
}
.av2-section-hero-rings {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 38%, var(--av2-glow-copper), transparent 60%);
  opacity: 0.7;
}
.av2-section-hero-focus {
  position: relative;
  width: min(320px, 70%);
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  border: 1px solid var(--av2-rule-copper);
  border-radius: var(--av2-r-lg);
  background: var(--av2-bg-raised);
  box-shadow: var(--av2-shadow-deep);
  overflow: hidden;
}
.av2-section-hero-focus img { width: 100%; height: 100%; object-fit: cover; }
.av2-section-hero-focus span {
  font-family: var(--av2-display);
  font-size: 5rem;
  color: var(--av2-copper-dim);
}
.av2-section-hero-caption { text-align: center; }
.av2-section-hero-caption p {
  font-family: var(--av2-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--av2-ink-faint);
}
.av2-section-hero-caption h2 {
  font-family: var(--av2-display);
  font-size: 2rem;
  color: var(--av2-ink);
}
.av2-section-hero-caption span {
  font-family: var(--av2-mono);
  font-size: 12px;
  color: var(--av2-copper);
}

/* Fondo material para escenas sin foto (data-bg="material") */
.av2-page-scene[data-bg="material"] .av2-page-scene-bg {
  background:
    radial-gradient(120% 80% at 50% -10%, oklch(0.172 0.016 56 / 0.9), transparent 70%),
    linear-gradient(180deg, var(--av2-bg-raised), var(--av2-bg));
}
```

- [ ] **Step 2: Typecheck + build sanity**

Run: `npm run typecheck`
Expected: sin errores (CSS no rompe TS, pero confirma que nada de Task 2/3 quedó colgado).

- [ ] **Step 3: Commit**

```bash
git add "app/(v2)/v2/atlas-v2.css"
git commit -m "style(v2): bloque base de av2-page-header y av2-section-hero (kit)"
```

---

## Task 5: Catálogo de desarrollo `/v2/kit`

**Files:**
- Create: `app/(v2)/v2/kit/page.tsx`

- [ ] **Step 1: Crear la ruta catálogo**

```tsx
// app/(v2)/v2/kit/page.tsx
// Catálogo de desarrollo NO enlazado: renderiza cada primitiva del kit en sus
// variantes para validar el sistema en aislamiento. No se enlaza desde la nav
// ni se indexa en búsqueda.
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import AtlasSectionHero from "@/components/atlas-v2/AtlasSectionHero";
import AtlasNarrativeFrame from "@/components/atlas-v2/AtlasNarrativeFrame";

export const metadata = { title: "Kit V2 (dev) · Grimorio de Lore" };

export default function KitPage() {
  return (
    <AtlasPageScene
      eyebrow="Desarrollo · Kit"
      title="Catálogo de primitivas"
      subtitle="Validación en aislamiento del sistema visual compartido."
    >
      <div style={{ display: "grid", gap: 32, padding: "0 24px 80px" }}>
        <AtlasNarrativeFrame eyebrow="Hero" title="AtlasSectionHero — material" variant="primary">
          <AtlasSectionHero variant="material" glyph="C" alt="" title="Carta de Nabish" eyebrow="objeto" meta="3 apariciones" />
        </AtlasNarrativeFrame>

        <AtlasNarrativeFrame eyebrow="Hero" title="AtlasSectionHero — image" variant="primary">
          <AtlasSectionHero variant="image" imageSrc="/assets/atlas-v2/scenes/metropolis.webp" glyph="M" alt="Metrópolis de Cobre" title="Metrópolis de Cobre" eyebrow="lugar" meta="12 apariciones" />
        </AtlasNarrativeFrame>

        <AtlasNarrativeFrame eyebrow="Marco" title="AtlasNarrativeFrame — variantes" variant="secondary">
          <p>Cuerpo de marco narrativo de ejemplo.</p>
        </AtlasNarrativeFrame>
      </div>
    </AtlasPageScene>
  );
}
```

- [ ] **Step 2: Verificar en browser + screenshot**

Run (PowerShell, dev server arriba):
```powershell
$env:V2_BROWSER_CHANNEL="msedge"; $env:V2_BASE_URL="http://localhost:3000"; node scripts/v2-screenshot.mjs --routes "/v2/kit" --width 1440
```
Expected: las primitivas se ven con la materialidad del home (ornamento, marco cobre, glow). Anotar P0/P1 y corregir en el CSS de Task 4 si hace falta.

- [ ] **Step 3: Commit**

```bash
git add "app/(v2)/v2/kit/page.tsx"
git commit -m "chore(v2): catalogo de desarrollo del kit en /v2/kit"
```

---

## Task 6: Mockups del gabinete de Objetos (aprobación)

**Files:**
- Create: `docs/mockups/2026-06-04-objetos-A.html`, `-B.html`, `-C.html`

- [ ] **Step 1: Generar 2-3 variantes HTML del layout "gabinete de reliquias"**

Cada archivo es un HTML standalone (estilos inline embebidos con los tokens `--av2-*` copiados) que muestra el layout de la página Objetos: foco material del artefacto seleccionado + índice secundario + ficha contextual. Variar la composición (foco centrado vs. foco a la izquierda con índice a la derecha; ficha contextual debajo vs. al costado).

- [ ] **Step 2: Abrir las variantes y elegir una (CHECKPOINT con Joaquín)**

Abrir los HTML en el browser. Joaquín aprueba UNA variante. Registrar la elección antes de implementar. No avanzar sin aprobación.

- [ ] **Step 3: Commit de los mockups**

```bash
git add docs/mockups/
git commit -m "docs(v2): mockups del gabinete de Objetos para aprobacion"
```

---

## Task 7: Elevar el índice de Objetos al nivel home

**Files:**
- Modify: `app/(v2)/v2/atlas-v2.css` (bloques `av2-domain-*`, `av2-relic-*`)
- Modify: `components/atlas-v2/AtlasDomainExplorer.tsx` (si la variante aprobada requiere ajustar el stage relic; usar `AtlasSectionHero` para el foco)

- [ ] **Step 1: Ajustar el stage relic para usar `AtlasSectionHero`**

En `AtlasDomainExplorer.tsx`, en la rama `relic` de `DomainStage`, reemplazar el bloque `av2-relic-*` inline por `AtlasSectionHero`:

```tsx
  return (
    <AtlasSectionHero
      variant={item.imageSrc ? "image" : "material"}
      imageSrc={item.imageSrc}
      glyph={item.glyph}
      alt={item.name}
      eyebrow={item.eyebrow}
      title={item.name}
      meta={item.meta}
    />
  );
```

(añadir `import AtlasSectionHero from "./AtlasSectionHero";` arriba.)

- [ ] **Step 2: Afinar el CSS `av2-domain-*` a la materialidad del home**

Ajustar en `atlas-v2.css` el grid del explorador (índice + stage + contexto), marcos de cobre, sombras y espaciado editorial para que matchee la variante aprobada y el home. (Loop visual, Step 3.)

- [ ] **Step 3: Loop de screenshot vs home (P0/P1/P2)**

Run (PowerShell):
```powershell
$env:V2_BROWSER_CHANNEL="msedge"; $env:V2_BASE_URL="http://localhost:3000"; node scripts/v2-screenshot.mjs --routes "/v2/objetos" --width 1440
```
Comparar contra `/v2` (home) y contra el mockup aprobado. Corregir P0/P1 (materialidad, foco, marcos, jerarquía) y repetir hasta que no queden P0/P1. Anotar P2 no bloqueantes.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add "app/(v2)/v2/atlas-v2.css" components/atlas-v2/AtlasDomainExplorer.tsx
git commit -m "feat(v2): índice de Objetos elevado al sistema del home (piloto)"
```

---

## Task 8: Elevar la ficha de Objeto al nivel home

**Files:**
- Modify: `app/(v2)/v2/atlas-v2.css` (bloques `av2-entity-detail-*`)

- [ ] **Step 1: Loop de screenshot de la ficha vs home**

Elegir un slug real con datos (ej. mirar el índice de `/v2/objetos`). Run:
```powershell
$env:V2_BROWSER_CHANNEL="msedge"; $env:V2_BASE_URL="http://localhost:3000"; node scripts/v2-screenshot.mjs --routes "/v2/objetos/<slug>" --width 1440
```
Verificar que la ficha usa `AtlasSectionHero` (Task 3), el reader cómodo, las relaciones y apariciones, con la materialidad del home.

- [ ] **Step 2: Afinar `av2-entity-detail-*`**

Ajustar el CSS de la ficha (stage del artifact, identity, meta, reader, relaciones) a la materialidad del home y la columna de lectura cómoda. Corregir P0/P1 en el loop.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add "app/(v2)/v2/atlas-v2.css"
git commit -m "feat(v2): ficha de Objeto elevada al sistema del home (piloto)"
```

---

## Task 9: Review impeccable + ajustes

**Files:** los que surjan de la revisión.

- [ ] **Step 1: Pasar el piloto por `impeccable`**

Revisar `/v2/objetos` y una ficha con la skill `impeccable` (y `frontend-design`/`code-reviewer` si hace falta). Aplicar los ajustes que surjan (jerarquía, espaciado, contraste, motion, estados). No declarar terminado solo porque compila.

- [ ] **Step 2: Re-screenshot y confirmar**

Repetir el screenshot de `/v2/objetos` y la ficha; confirmar que no quedan P0/P1 vs home.

- [ ] **Step 3: Commit (si hubo ajustes)**

```bash
git add -A
git commit -m "polish(v2): ajustes de impeccable en el piloto Objetos"
```

---

## Task 10: Verificación de entrega + QA

**Files:**
- Modify: `docs/rdc-ui-v2-qa.md`

- [ ] **Step 1: Suite técnica completa**

Run:
```powershell
npm run typecheck
npm test
npm run build
```
Expected: los tres terminan con código 0.

- [ ] **Step 2: Registrar el piloto en el QA doc**

Anotar en `docs/rdc-ui-v2-qa.md`: que Objetos quedó como estándar de referencia del sistema unificado, las capturas (antes/después), y los P2 no bloqueantes pendientes.

- [ ] **Step 3: Commit**

```bash
git add docs/rdc-ui-v2-qa.md
git commit -m "docs(v2): QA del piloto Objetos (estandar del sistema unificado)"
```

---

## Self-Review

**Cobertura del spec (sección → tarea):**
- Sistema canónico (materialidad) → Task 2, 3, 4. ✅
- Kit de primitivas (`AtlasPageHeader`, `AtlasSectionHero`, refinar existentes) → Task 2, 3, 7 (stage). ✅
- Catálogo de desarrollo → Task 5. ✅
- Referencias por mockup HTML (Q2-B) → Task 6 (checkpoint de aprobación). ✅
- Piloto Objetos end-to-end (índice + ficha) → Task 7, 8. ✅
- Verificación por página (screenshot vs home + impeccable + typecheck/test/build + commit) → Task 1, 7, 8, 9, 10. ✅
- Image-led vs material-led → `AtlasSectionHero` variant + `data-bg` (Task 2, 3). ✅
- Mobile fuera de alcance → no hay tareas responsive. ✅
- Rollout (Misterios/Mundo/detalles/resto) → explícitamente plan siguiente, fuera de scope. ✅

**Placeholder scan:** sin TBD/TODO de implementación. El CSS fino se ajusta en loops de screenshot declarados como pasos reales (no placeholders), consistente con el protocolo visual del proyecto.

**Consistencia de tipos/nombres:**
- `AtlasPageHeader` props `{ eyebrow, title, intro, align }` — usados igual en Task 2 (PageScene pasa `intro={subtitle}`). ✅
- `AtlasSectionHero` props `{ variant, imageSrc, glyph, alt, eyebrow, title, meta }` — idénticos en Task 3 (detail), Task 5 (catálogo) y Task 7 (stage relic). ✅
- Clases CSS `av2-page-header*`, `av2-section-hero*` consistentes entre JSX (Task 2/3) y CSS (Task 4). ✅
- `data-bg="material|image"` en `AtlasPageScene` (Task 2) ↔ selector CSS (Task 4). ✅
