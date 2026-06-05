# Handoff — Rollout de elevación visual UI V2 (para Codex)

> Continuación del esfuerzo "elevar cada página pública `/v2` al nivel estético
> del home". El kit y el piloto (Objetos) ya están hechos y mergeados a `main`.
> Este doc tiene todo lo necesario para seguir sin contexto previo.

## 1. Objetivo

Tomar la estética del **home** (`/v2`) como sistema base y elevar **cada página
pública de `/v2`** a ese nivel: fondo atmosférico inmersivo, encabezado display
centrado, marcos de cobre, materialidad cálida, foco narrativo. No dashboard, no
wiki. Solo **escritorio** (mobile fuera de alcance). Fuentes de verdad:
`docs/GOAL.md`, el home, y `docs/superpowers/specs/2026-06-04-elevacion-visual-v2-design.md`.

## 2. Estado actual (rama `main`, HEAD `af306d5`)

### Kit de primitivas (listo, en `components/atlas-v2/`)
- `AtlasPageScene` — envoltorio de página: **fondo atmosférico del home por
  defecto** (`DEFAULT_HERO_BACKGROUND` = `/assets/atlas-v2/backgrounds/hero.png`)
  + capa de gears (en el shell) + compone `AtlasPageHeader`. Override por página
  con `backgroundSrc` (a futuro: imágenes distintas por página). Si se pasa
  `backgroundSrc=""` cae a un gradiente material cálido (`data-bg="material"`).
- `AtlasPageHeader` — eyebrow mono + ornamento (rombo) + título display Cormorant
  + intro. Gramática del hero, escala "sección".
- `AtlasSectionHero` — foco/relic. `variant` `image|material`, `layout`
  `stack|inline`, `showCaption`. Material = artefacto iluminado (glow + glifo oro).
- `AtlasDomainExplorer` — índice + **expediente** (variante `relic` ya migrada).
- `AtlasEntityDetail` / `AtlasVaultEntityPage` — ficha/dossier (usa
  `AtlasSectionHero`, sin caption duplicada, subtítulo corto).
- Catálogo de desarrollo NO enlazado en **`/v2/kit`** (ver cada primitiva ahí).
- Todo el CSS vive bajo `.av2` en `app/(v2)/v2/atlas-v2.css`. **CSS puro, sin
  Tailwind/shadcn en V2.** Tokens `--av2-*` (cobre/bronce/oro, serif
  Cormorant/Spectral/IBM Plex Mono, radios, sombras, glow).

### Qué quedó elevado y qué no

| Página | AtlasPageScene? | Estado |
|---|---|---|
| `/v2/objetos` (índice) | sí | ✅ **completo** (expediente B, estándar de referencia) |
| `/v2/objetos/[slug]` (ficha) | vía VaultEntityPage | ✅ completo |
| `/v2/misterios` (índice) | sí | ✅ **completo** (expediente, commit posterior a `5ef29e6`) |
| `/v2/mundo` (índice) | sí | ✅ **completo** (expediente) |
| `/v2/{misterios,mundo}/[slug]` | vía VaultEntityPage | ✅ ya elevadas |
| `/v2/dioses` (índice) | sí | ⚠️ header + fondo OK; cuerpo propio `DiosesClient` sin revisar |
| `/v2/buscar` | sí | ⚠️ header + fondo OK; cuerpo a diseñar (estado inicial rico) |
| `/v2/personajes` (índice) | sí (ahora) | ✅ header del sistema + fondo inmersivo; grid/filtros/detalle propios conservados |
| `/v2/capitulos` (índice) | **no** | ❌ layout propio (`CapitulosClient`) |
| `/v2/capitulos/[num]` (detalle) | sí | ⚠️ header + fondo OK; composición a revisar |
| `/v2/facciones` (índice) | **no** | ❌ layout propio (`FaccionesClient`) |
| `/v2/facciones/[slug]` (ficha) | vía VaultEntityPage | ✅ ya elevada |
| `/v2/lugares` (índice) | **no** | ❌ layout propio |
| `/v2/lugares/[slug]` (ficha) | vía VaultEntityPage | ✅ ya elevada |
| `/v2/mapa` | **no** | ❌ visor propio (`MapaClient`) — no rediseñar el visor, solo encuadrar en el sistema |

**No tocar el home** (`/v2`, `app/(v2)/v2/page.tsx`): usa `av2-hero-*`, NO
`AtlasPageScene`. Es la referencia.

### Imágenes por dominio (define image-led vs material-led)
- Image-led: **Lugares** (~174 webp, `data/atlas-v2/location-images.ts`),
  **Dioses** (8 medallones/imgs en `public/assets/atlas-v2/{gods,medallions}`).
- Híbrido: **Personajes** (~3 retratos en `portraits/`, resto placeholder por hash
  — ver `AtlasEntityCard`), **Facciones** (2).
- Material-led (sin foto propia): **Objetos, Misterios, Mundo** → materialidad +
  tipografía + el fondo inmersivo compartido.

## 3. Tareas faltantes (en orden)

### R1 — Misterios + Mundo al expediente (arrancar acá)
Generalizar `AtlasDomainExplorer` para que **todas** las variantes usen el
expediente (hoy solo `relic`). El código concreto está en la sección 5. Las
fichas ya están elevadas, así que con esto Misterios y Mundo quedan listos.

### R2 — Personajes (índice + ficha)
El índice NO usa el kit: `PersonajesClient` tiene grid de cards propio. Envolver
en `AtlasPageScene` (header + fondo), y elevar el grid (image-led, cards con
marco de cobre, foco del personaje seleccionado). La ficha ya está elevada.

### R3 — Capítulos (índice + detalle)
`CapitulosClient` índice con layout propio → envolver en `AtlasPageScene` y
elevar (expediente de episodio: crónica seleccionada domina, índice secundario).
El detalle (`capitulos/[num]`) ya usa `AtlasPageScene`; revisar composición.

### R4 — Facciones (índice)
`FaccionesClient` propio → `AtlasPageScene` + elevar (emblema/campo de
influencias). Ficha ya elevada.

### R5 — Dioses + Lugares (image-led)
- Dioses: ya tiene header+fondo; elevar `DiosesClient` con medallones grandes.
- Lugares: índice propio → `AtlasPageScene` + grid image-led con las 174 fotos.

### R6 — Buscar + Mapa
- Buscar: estado inicial rico (sugerencias + categorías reales), evitar el vacío.
- Mapa: encuadrar el visor en el sistema (header + fondo), sin rediseñar el visor.

### R7 — Verificación final
`npm run typecheck && npm test && npm run build` en verde. Screenshots de todas
las rutas vs home. Actualizar `docs/rdc-ui-v2-qa.md`. Commit por página.

## 4. Protocolo de trabajo (obligatorio)

1. **Referencia = el home.** Antes de editar, capturar el home y la página
   objetivo, listar diferencias **P0/P1/P2**, editar, re-capturar, comparar.
2. Screenshots (dev server en `localhost:3000`):
   ```powershell
   $env:V2_BROWSER_CHANNEL="msedge"; $env:V2_BASE_URL="http://localhost:3000"
   node scripts/v2-screenshot.mjs --routes=/v2/misterios,/v2/mundo --desktop
   ```
   Flags reales: `--routes=a,b` (con `=`), `--desktop` (1440/2048/2560),
   `--priority`, `--full-page`. **No existe `--width`.** Salen en
   `artifacts/screenshots/ui-v2/`.
3. Verificación por página: `npm run typecheck` + screenshot vs home + commit.
   Correr `npm test` y `npm run build` al cerrar grupos de páginas.
4. CSS puro bajo `.av2`. Reusar tokens `--av2-*` y las primitivas del kit; no
   estilos ad-hoc por página (que el sistema se herede).
5. Motion: solo `transform`/`opacity`, ~260ms (`--av2-dur`/`--av2-ease`),
   respetar `prefers-reduced-motion`.
6. No romper el home. Mobile fuera de alcance.

## 5. R1 — código concreto

**Reemplazar `components/atlas-v2/AtlasDomainExplorer.tsx` por:**

```tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AtlasV2EntitySummary } from "@/lib/atlas-v2-content";
import AtlasEntityIndex from "./AtlasEntityIndex";
import AtlasNarrativeFrame from "./AtlasNarrativeFrame";
import AtlasSectionHero from "./AtlasSectionHero";

export type AtlasDomainVariant = "relic" | "mystery" | "world";

type Props = {
  items: AtlasV2EntitySummary[];
  variant: AtlasDomainVariant;
  indexLabel: string;
  detailBaseHref: string;
};

const VARIANT_COPY: Record<
  AtlasDomainVariant,
  { focusKicker: string; thirdLabel: string; thirdValue: string }
> = {
  relic: { focusKicker: "pieza catalogada", thirdLabel: "Custodia", thirdValue: "No registrada" },
  mystery: { focusKicker: "investigacion abierta", thirdLabel: "Estado", thirdValue: "Sin resolver" },
  world: { focusKicker: "concepto del mundo", thirdLabel: "Plano", thirdValue: "Registrado" },
};

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

function appearancesLabel(count: number): string {
  if (count <= 0) return "Sin apariciones";
  return `${count} ${count === 1 ? "aparicion" : "apariciones"}`;
}

export default function AtlasDomainExplorer({ items, variant, indexLabel, detailBaseHref }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(items[0]?.slug ?? "");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = normalize(query.trim());
    if (!normalized) return items;
    return items.filter((item) =>
      normalize([item.name, item.eyebrow, item.description, item.meta].join(" ")).includes(normalized),
    );
  }, [items, query]);

  const visibleLimit = variant === "world" ? 54 : 96;
  const visible = filtered.slice(0, visibleLimit);
  const selected = items.find((item) => item.slug === selectedSlug) ?? visible[0] ?? items[0];

  if (!selected) {
    return (
      <AtlasNarrativeFrame variant="primary">
        <div className="av2-domain-empty">
          <p>No hay registros disponibles en esta seccion.</p>
        </div>
      </AtlasNarrativeFrame>
    );
  }

  const copy = VARIANT_COPY[variant];

  return (
    <div className="av2-domain-explorer" data-variant={variant}>
      <div className="av2-domain-index">
        <label className="av2-domain-search">
          <span>Buscar</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Filtrar ${indexLabel.toLowerCase()}`}
          />
        </label>
        <AtlasEntityIndex
          label={`${indexLabel} · ${filtered.length}`}
          items={visible.map((item) => ({
            slug: item.slug,
            name: item.name,
            eyebrow: item.eyebrow,
            meta: item.meta,
            glyph: item.glyph,
          }))}
          selectedSlug={selected.slug}
          onSelect={setSelectedSlug}
        />
      </div>

      <AtlasNarrativeFrame variant="primary" className="av2-domain-expediente">
        <div className="av2-expediente-focus" key={selected.slug}>
          <AtlasSectionHero
            variant={selected.imageSrc ? "image" : "material"}
            imageSrc={selected.imageSrc}
            glyph={selected.glyph}
            alt={selected.name}
            eyebrow={`${selected.eyebrow} · ${copy.focusKicker}`}
            title={selected.name}
            description={selected.description || "Este registro todavia no tiene una descripcion narrativa."}
            meta={appearancesLabel(selected.appearances)}
            layout="inline"
          />
        </div>

        <div className="av2-expediente-body">
          <dl className="av2-expediente-meta">
            <div><dt>Apariciones</dt><dd>{selected.appearances}</dd></div>
            <div><dt>Clasificacion</dt><dd>{selected.eyebrow}</dd></div>
            <div><dt>{copy.thirdLabel}</dt><dd>{copy.thirdValue}</dd></div>
          </dl>
          <Link href={`${detailBaseHref}/${selected.slug}`} className="av2-btn av2-btn--primary av2-expediente-cta">
            Abrir registro completo
          </Link>
        </div>
      </AtlasNarrativeFrame>
    </div>
  );
}
```

**Y en `app/(v2)/v2/atlas-v2.css`, que el grid 2-columnas aplique a todas las
variantes** (hoy el base es 3-col y hay override de `world` a 3-col):

```css
/* base (~línea 8472): pasar a 2 columnas */
.av2-domain-explorer {
  display: grid;
  grid-template-columns: minmax(15rem, 0.5fr) minmax(34rem, 1.7fr);
  gap: 1rem;
  height: clamp(35rem, calc(100vh - 16rem), 48rem);
  min-height: 0;
}
/* y neutralizar el override de world (~línea 8479) a 2 columnas igual */
.av2-domain-explorer[data-variant="world"] {
  grid-template-columns: minmax(15rem, 0.5fr) minmax(34rem, 1.7fr);
}
```

Verificar: `npm run typecheck`, screenshot `/v2/misterios` y `/v2/mundo` vs home,
y un par de fichas (ej. `/v2/misterios/<slug>`). Sacar slugs reales del índice o
de `vault-recuerdos-de-cobre/{misterios,worldbuilding}/`.

## 6. Deuda / P2 (no bloqueante)

- Al generalizar el expediente, queda **CSS muerto**: `av2-domain-stage*`,
  `av2-mystery-*`, `av2-world-*`, `av2-domain-context*`, y el header viejo del
  page-scene (`av2-page-scene-head/-eyebrow/-title/-subtitle`, sin uso desde que
  `AtlasPageScene` usa `AtlasPageHeader`). Limpiar cuando convenga.
- La ficha de detalle es densa (3 columnas) — candidata a recomposición.
- La descripción derivada arrastra el prefijo "Ep. NN — …" cuando no hay sección
  "Perfil"; mejorar en `lib/atlas-v2-content.ts` (afecta a todos los dominios).

## 7. Git y coordinación

- Todo en `main`. HEAD `af306d5`. **`main` está 12 commits adelante de `origin`
  sin pushear** — Joaquín decide cuándo pushear (deploy).
- Commits del piloto: `8cccb77..af306d5`. Spec/plan/mockups/QA:
  `docs/superpowers/specs/2026-06-04-elevacion-visual-v2-design.md`,
  `docs/superpowers/plans/2026-06-04-elevacion-visual-v2-fundacion-piloto.md`,
  `docs/mockups/2026-06-04-objetos-*.html`, `docs/rdc-ui-v2-qa.md`.
- **Colisión con Claude:** por `CLAUDE.md`, normalmente Codex es dueño de
  resumen/extracción (`output/`, `_jobs/`, `vault-*/*.md`) y Claude del frontend
  (`app/`, `lib/`, `components/`, `scripts/`, `docs/`). Para este rollout Codex
  toma el frontend; conviene que Claude **no** edite estos mismos archivos en
  paralelo para evitar pisarse.

---

## 8. Estado actualizado (rollout avanzado)

Casi todo el rollout quedó hecho en esta sesión (commits `967b941..34c4a42`).
Estado real por página:

- ✅ **En `AtlasPageScene` + expediente/sistema**: objetos, misterios, mundo,
  personajes, capítulos, facciones (índices) + todas las fichas de detalle.
- ✅ **Ya on-system de antes**: dioses (dossier con medallón), buscar (categorías
  + resultados), `capitulos/[num]`.
- 🗺️ **Visor de mapa** (`/v2/lugares` y `/v2/mapa`, ambos `MapaClient`):
  experiencia full-bleed distinta, **dejada como está** a propósito (la
  indicación fue no rediseñar el visor). Las fotos de lugares viven en las fichas
  `/v2/lugares/[slug]` (ya elevadas). Único pendiente opcional: pulir el header
  `av2-page-head--mapa` para que no roce la nav.

Verificado: `typecheck`, 81 tests y `build` (24 rutas) en verde.

**Lo que queda:**
- ⚠️ **Unificación de materialidad de las páginas bespoke** (Dioses, Facciones,
  Personajes). Estas se construyeron ANTES del kit con clases propias
  (`av2-god-*`, `av2-faction-*`, `av2-personajes-*`/`av2-card`). El rollout les
  unificó **header + scroll**, pero NO sus superficies internas: el blur, los
  marcos de cobre, los corner-brackets (color/estilo) y las superficies divergen
  del home/kit. Joaquín lo notó (ej. Dioses: el índice no tenía blur; los
  corner-brackets en otro color). Es un **pase de craft real por página**
  (comparar cada panel contra el home y alinear blur=`blur(12px) saturate(1.1)`,
  borde=`--av2-rule-copper`, corners, bg), idealmente con iteración en browser.
  Parche aplicado: blur del índice/detalle de Dioses (commit pendiente). Falta el
  resto de Dioses + Facciones + Personajes.
- Limpieza de CSS muerto: ✅ **completa** — removidos `av2-domain-stage*`,
  `av2-mystery-*`, `av2-world-*`, `av2-relic-*`, `av2-domain-context*` (commit
  `8016fd1`) y el header viejo del page-scene `av2-page-scene-head/-eyebrow/
  -title/-subtitle` (se separó `.av2-page-scene-content`, que está vivo). Quedan
  solo refs mobile residuales en media queries (`av2-page-scene-head` en
  `@media`), inofensivas. (`av2-p-wrap`/`av2-p-bg`/`av2-page-head` NO son
  muertos — los usan `/v2/mapa` y `/v2/lugares`.)
- ✅ Header del visor de mapa (`av2-page-head`) ya despeja la nav (padding-top
  con `--av2-nav-h`).
- P2 contenido: ✅ descripción con prefijo "Ep. NN" arreglada (commit `95e1740`,
  `firstProseBlock` en `lib/atlas-v2-content.ts` + test). **Queda** solo la ficha
  de detalle densa (3 columnas, candidata a recomposición opcional).
- Operativo: parar el `next dev` antes de `npm run build` (comparten `.next`; si
  no, el dev server tira HTTP 500 hasta reiniciarlo).
```
