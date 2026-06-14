# Antología · Recuerdos de Cobre — Contexto para Claude

> Reinicio: objetivo vigente en `docs/GOAL.md`. Fuente de verdad del resumen:
> `PROMPT_RESUMEN.md`. No reconstruir "Sala de Cobre" como diseño final.

## Qué es este proyecto

Antología de la campaña TTRPG **Recuerdos de Cobre** (67 episodios de YouTube,
dirigida por *Mates y Mazmorras*). App Next.js local-first. Pipeline **sin API
de pago**: download + transcripción (Whisper) automáticas; resumen y extracción
de lore los hacen Claude/Codex **a mano** (`PROMPT_RESUMEN.md` para resumen;
`lib/schema.ts` + `lib/prompts.ts` para extracción → JSON) → Markdown editable
desde Obsidian. **Campaña coral de 6 PJs: Mysha NO es la protagonista.**

Detalle ampliado (estructura de carpetas, cheat-sheet de personajes, estado
actual, comandos de rebuild de graphify): `docs/proyecto-referencia.md` —
leerlo solo cuando haga falta.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** · **gray-matter**
  · **zod** (+zod-to-json-schema) · **vitest** · **openai** SOLO embeddings de
  `/buscar` (degrada a substring sin saldo).
- CSS propio: panel local `app/globals.css` · público legacy
  `app/(public)/public.css` · UI V2 `app/(v2)/v2/atlas-v2.css` (scoped `.atlas`,
  Cormorant Garamond + Spectral + IBM Plex Mono, `data-atlas-mode`, anti-FOUC).
- **Cola**: jobs en `_jobs/N.json`; worker `scripts/process-episode.ts` hace
  download → transcribe (Whisper) → **STOP** en `esperando_resumen`. Resumen y
  extracción a mano (`output/epNN.resumen.md`, `output/epNN.extraccion.json`);
  revisión en `/review` o `scripts/commit-manual.ts` → commit al vault.

## UI V2 pública

Fuente de verdad: `docs/rdc-ui-v2-brief.md` + `-implementation-plan.md` +
`-reference-index.md` + `-qa-checklist.md` + `-agent-prompts.md`. Construir en
paralelo bajo `app/(v2)/v2/`, `components/atlas-v2/`, `data/atlas-v2/` y
`public/assets/atlas-v2/`, sin borrar el sitio actual ni romper rutas.
Dirección visual: atlas/códice dark fantasy steampunk (cobre, bronce, humo,
engranajes, serif elegante). **Sin Tailwind ni shadcn** — CSS puro en
`atlas-v2.css`.

⚠️ **Para cualquier tarea visual de UI V2** (layout, responsive, polish,
motion, QA): leer y seguir `docs/ui-v2-protocolo-visual.md` ANTES de editar —
protocolo obligatorio de referencias PNG + screenshots + comparación P0/P1/P2.

## Instrucciones para Claude

- Responder siempre en **español**. Llamar al usuario por su nick **Kero** al
  inicio de cada conversación / mensaje que le envíes.
- **Planificación y alineación previa (REGLA MANDATORIA)**: Antes de realizar cualquier cambio en el código, crear archivos nuevos o ejecutar comandos modificadores en la terminal, debes explicar primero a Kero tu análisis del problema y proponer detalladamente la solución para obtener su consentimiento. No realices modificaciones directas de forma unilateral.
- El usuario trabaja desde Claude Code CLI y Antigravity (IDE de Google).
- **Resúmenes**: seguir `PROMPT_RESUMEN.md` al pie de la letra. **Extracción**:
  a mano, sin API, conforme a `lib/schema.ts` (`ExtractionResult`) y
  `lib/prompts.ts`; commit con `/review` o
  `npx tsx scripts/commit-manual.ts NN "<título>" [fechaISO]`.
- **No-colisión con Codex** ⚠️: Codex es dueño exclusivo de
  `output/epNN.resumen.md`, `output/epNN.extraccion.json` y
  `vault-recuerdos-de-cobre/_jobs/0NN.json` — Claude **no los toca** salvo
  pedido explícito. Claude es dueño de `app/`, `lib/`, `components/`,
  `scripts/`, `docs/` y los commits. Ver `AGENTS.md`.
- Si se edita `PROMPT_RESUMEN.md` o `lib/prompts.ts`, **alinear ambos**.
- Persistencia: Markdown plano, compatible con Obsidian sin sync bidireccional.

## Eficiencia de tokens (prioridad de Kero)

Regla rectora: **navegar y leer lo mínimo necesario**, nunca volcar archivos o
carpetas enteras al contexto.

- **Graphify primero** (ver Herramientas), después serena/Grep/Glob dirigido;
  leer solo los rangos necesarios. Búsqueda en 2 pasos: `files_with_matches` →
  contenido acotado. Subagente `Explore` para fan-out.
- **No re-leer** archivos recién editados: `Edit`/`Write` ya confirman.
- **Nunca** leer `node_modules/`, `*.bak.*/`, `.next/` ni el vault completo
  (usar `/buscar` o grep dirigido). PNGs/screenshots del repo padre son
  históricos — no abrirlos salvo pedido explícito.
- **Docs de librerías**: `context7` (Next 15 / React 19 / Zod / etc.), no
  adivinar ni leer `node_modules`.
- Respuestas en español, concisas. Planificar antes de tocar muchos archivos.

## Herramientas / MCP disponibles

- **Graphify** — **regla de uso proactivo (obligatoria)**: antes de leer
  archivos de código para entender estructura, dependencias o impacto de un
  cambio, consultar primero el grafo canónico
  `graphify-out/merged-graph.json` (app+lib+components+scripts, ~864 nodos,
  ~56x menos tokens). Obligatorio cuando la tarea implique: cómo fluye algo,
  qué usa un símbolo, qué se rompe al tocarlo, o el camino entre dos partes.
  Solo leer archivos si el grafo no resuelve la pregunta.
  - `graphify query "<pregunta>" --graph graphify-out/merged-graph.json --budget 1400`
  - `graphify explain "<símbolo>" --graph graphify-out/merged-graph.json`
  - `graphify affected "<símbolo>" --graph graphify-out/merged-graph.json`
  - `graphify path "A" "B" --graph graphify-out/merged-graph.json`
  - Rebuild tras refactors: comandos en `docs/proyecto-referencia.md`. Sin
    hook PreToolUse a propósito — uso on-demand.
- **serena** (MCP, global): navegación semántica (símbolos, referencias).
- **context7** (MCP, global): documentación version-accurate de libs.
- **Playwright** (plugin): QA en navegador real; para UI V2 seguir
  `docs/ui-v2-protocolo-visual.md` + `scripts/v2-screenshot.mjs`.
- **ui-ux-pro-max** (skill): diseño/UX — el brief local de UI V2 manda sobre
  cualquier regla genérica de la skill.
- **shadcn** (MCP, `.mcp.json`): SOLO panel local/legacy — la UI V2 NO usa
  shadcn ni Tailwind. `magic` tiene API key placeholder (no funciona).
- **repomix**: on-demand (`npx repomix --include "app,lib,components,scripts"`).
- **Planificación**: skills de superpowers (`brainstorming`, `writing-plans`,
  `executing-plans`, `to-prd`, `to-issues`) — no se instaló BMAD.
