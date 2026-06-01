# Antología · Recuerdos de Cobre — Contexto para Claude

> Nota de reinicio: para el objetivo vigente del proyecto, leer primero
> `docs/GOAL.md`. Fuente de verdad del resumen: `PROMPT_RESUMEN.md`.
> No reconstruir "Sala de Cobre" como diseño final.

## UI V2 pública

Cuando el pedido sea de frontend, diseño o nueva interfaz pública, usar como
fuente de verdad:

- `docs/rdc-ui-v2-brief.md`
- `docs/rdc-ui-v2-implementation-plan.md`
- `docs/rdc-ui-v2-reference-index.md`
- `docs/rdc-ui-v2-qa-checklist.md`
- `docs/rdc-ui-v2-agent-prompts.md`

La UI V2 debe construirse en paralelo, bajo la ruta activa `app/(v2)/v2/`,
`components/atlas-v2/`, `data/atlas-v2/` y `public/assets/atlas-v2/`. No borrar
el sitio actual ni romper rutas existentes. La dirección visual es atlas/códice
dark fantasy steampunk: cobre, bronce, humo, engranajes, metal oxidado,
tipografía serif elegante y navegación inmersiva. No usar Tailwind ni shadcn
para esta UI V2; CSS puro bajo `.atlas` en `app/(v2)/v2/atlas-v2.css`.

### Protocolo obligatorio de referencia visual

Para cualquier pedido de UI V2 visual, layout, responsive, polish, motion o QA:

1. Antes de editar, abrir la referencia correcta:
   - Home: `public/assets/atlas-v2/references/home-reference.png`
   - Personajes: `public/assets/atlas-v2/references/personajes-reference.png`
   - Capitulos: `public/assets/atlas-v2/references/capitulos-reference.png`
   - Mapa: `public/assets/atlas-v2/references/mapa-reference.png`
   - Dioses: `public/assets/atlas-v2/references/dioses-reference.png`
   - Archivos: `public/assets/atlas-v2/references/archivos-reference.png`
2. Abrir o generar screenshot actual con `scripts/v2-screenshot.mjs` en desktop
   y mobile. Usar `V2_BROWSER_CHANNEL=msedge` o `chrome` si Chromium no esta.
3. Comparar referencia vs screenshot actual y listar diferencias P0/P1/P2 antes
   de tocar CSS o componentes.
4. Despues de editar, generar screenshots nuevos y compararlos contra la misma
   referencia. No declarar terminado solo por TypeScript/build.
5. No usar `.design-bundle*`, `PRODUCT.md`, `DESIGN.md`, screenshots viejos del
   repo padre ni UI legacy como direccion visual para UI V2, salvo pedido
   explicito de Joaquin. Son contexto historico, no fuente de verdad.
6. Si se usa skill o subagent, el brief local y estas referencias mandan sobre
   cualquier regla generica de la skill.

## Qué es este proyecto

Antología de la campaña TTRPG **Recuerdos de Cobre** (67 episodios de YouTube, dirigida por *Mates y Mazmorras*). App Next.js local-first. Pipeline **sin API de pago**: descarga + transcripción (Whisper) automáticas; el **resumen y la extracción de lore los hacen Claude/Codex a mano** siguiendo `PROMPT_RESUMEN.md` (resumen) y `lib/schema.ts`/`lib/prompts.ts` (extracción → JSON); se persiste como Markdown editable desde Obsidian.

> El proyecto vive en `recuerdos-de-cobre/` y el vault local por defecto es `vault-recuerdos-de-cobre/`; la app, branding y dominio se llaman **Antología · Recuerdos de Cobre · Grimorio de Lore**. **Es una campaña coral de 6 PJs: Mysha NO es la protagonista**, es una más del grupo.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Design system propio**: el panel local/rdc usa `app/globals.css`; el sitio publico legacy usa `app/(public)/public.css`; la UI V2 activa usa `app/(v2)/v2/atlas-v2.css`, scoped bajo `.atlas`, con Cormorant Garamond + Spectral + IBM Plex Mono, modo atlas via `data-atlas-mode` y anti-FOUC.
- **gray-matter** — parse/serialize Markdown con frontmatter
- **zod** + **zod-to-json-schema** — validación del JSON de extracción
- **openai** — SOLO embeddings de `/buscar` (degrada a búsqueda por substring si no hay saldo). NO se usa para extracción.
- **vitest** — unit tests
- **Cola de procesamiento**: jobs en `_jobs/N.json`, worker auto-encadenado en `scripts/process-episode.ts` que hace download → transcribe (Whisper batched) → **STOP** en `esperando_resumen`. Resumen y extracción los hacen Claude/Codex a mano (a `output/epNN.resumen.md` y `output/epNN.extraccion.json`); Joaquín revisa en `/review` o corre `scripts/commit-manual.ts` → commit al vault. La cola sigue descargando+transcribiendo en paralelo.

## Estructura del proyecto

```
app/
  page.tsx                    # Home = formulario de carga
  (local)/review/             # Revisión post-extracción (editable)
  (local)/procesar/           # Cola / formulario de carga
  (public)/...                # Antología pública read-only
  actions/
    extract.ts                # Server action: LEE output/epNN.extraccion.json (sin API)
    commit.ts                 # Server action: escribe vault
    process.ts                # Server actions: cola (enqueue/resume/cancel)
    search.ts                 # Búsqueda (semántica si hay embeddings; si no, substring)

lib/
  types.ts                    # EntityType, Mention, Entity, Relacion, Episodio
  schema.ts                   # Zod schema de ExtractionResult (fuente del shape)
  prompts.ts                  # Reglas de extracción versionadas (SYSTEM_PROMPT)
  markdown.ts · vault.ts · slugify.ts · commit.ts · embeddings.ts
  config.ts                   # Validación de env vars
  claude.ts                   # Legacy (Anthropic SDK), sin uso en el pipeline

scripts/
  process-episode.ts          # Worker download+transcribe
  commit-manual.ts            # Commitea output/epNN.{resumen.md,extraccion.json} al vault
  build-search-index.ts       # Índice de búsqueda (embeddings OpenAI)

tests/
  config / schema / markdown / vault / extract / claude / slugify / youtube
```

## Personajes y facciones clave (cheat-sheet)

> Fuente de verdad completa: `vault-recuerdos-de-cobre/_glossary.md`

- **Mysha** (Kero) — PJ, **una más del grupo, NO la protagonista**. Bruja de sangre. Empieza en el Coven Rojo, después Coven Rosa. **Tiene 3 personalidades**: Mysha (principal), Selenne, Veltra — la misma persona.
- **Borok** (Mati), **Layra** (Layla), **Narcissa** (Mica), **David Ilcard** (Lucho), **Io Campbell** (Mile/Kuzu/Sis/Nico) — los otros 5 PJs.
- **Champi** — búho familiar de Mysha.
- **Coven Rojo / Rosa / Negro / Blanco / Verde** — 5 covens.
- **Hermandad de Cobre** — gremio en Metrópolis de Cobre.

## Estado actual

- ✅ Pipeline sin API: download+transcribe (auto) → resumen + extracción (Claude/Codex a mano) → `/review` o `commit-manual.ts` → vault
- ✅ 55 tests pasando, TypeScript compila sin errores
- ✅ Gemini y Ollama retirados del todo (deps desinstaladas)
- ⏳ Los 67 episodios se procesan de a poco
- El vault se genera en `vault-recuerdos-de-cobre/` (configurable via VAULT_PATH en .env.local)

## Instrucciones para Claude

- Responder siempre en **español**
- El usuario trabaja desde Claude Code CLI y Antigravity (IDE de Google)
- **Resúmenes**: seguir `PROMPT_RESUMEN.md` al pie de la letra (leer transcript → escribir `output/epNN.resumen.md` → inyectar en el job).
- **Extracción**: a mano, sin API. Generar `output/epNN.extraccion.json` conforme a `lib/schema.ts` (`ExtractionResult`) y las reglas de `lib/prompts.ts`. Se commitea con `/review` (lee ese archivo) o `npx tsx scripts/commit-manual.ts NN "<título>" [fechaISO]`. Gemini/Ollama/OpenAi-extracción fueron retirados.
- **Regla de no-colisión con Codex** ⚠️: Codex trabaja en paralelo y es **dueño exclusivo** de resumen + extracción — `output/epNN.resumen.md`, `output/epNN.extraccion.json` y `vault-recuerdos-de-cobre/_jobs/0NN.json`. Claude **no toca** esos archivos salvo pedido explícito. Claude es dueño de `app/`, `lib/`, `components/`, `scripts/`, `docs/` y los commits. Los paths de Codex están gitignored. Ver `AGENTS.md`.
- Si se edita el prompt de resumen (`PROMPT_RESUMEN.md`) o el de extracción (`lib/prompts.ts`), **alinear ambos** — son la misma campaña.
- La persistencia es Markdown plano — compatible con Obsidian sin sync bidireccional.

## Eficiencia de tokens (prioridad de Joaquín)

Regla rectora: **navegar y leer lo mínimo necesario**, nunca volcar archivos o
carpetas enteras al contexto.

- **Navegar, no volcar**: usar `serena` (símbolos, referencias, definiciones) y
  Grep/Glob dirigido en vez de leer archivos completos. Leer solo los rangos que
  hacen falta.
- **Búsqueda en 2 pasos**: primero `files_with_matches`, después contenido acotado
  con contexto chico. Usar el subagente `Explore` para fan-out (devuelve la
  conclusión, no llena el contexto principal con dumps).
- **No re-leer** archivos recién editados: `Edit`/`Write` ya confirman el cambio.
- **Mapear el repo**: `npx repomix --include "app,lib,components,scripts"` en vez de
  recorrer carpeta por carpeta. **Nunca** leer `node_modules/`, `*.bak.*/`, `.next/`
  ni el vault completo.
- **Vault grande**: usar `/buscar` o grep dirigido; jamás cargar el vault entero.
- **PNGs/screenshots del repo padre**: históricos — no abrirlos salvo pedido explícito.
- **Docs de librerías**: usar `context7` (Next 15 / React 19 / Tailwind / Zod / etc.)
  en vez de adivinar o leer `node_modules`.
- Respuestas en español, concisas. Planificar antes de tocar muchos archivos y
  mantener los cambios acotados al feature.

## Herramientas / MCP disponibles

- **`serena`** (MCP, global): navegación semántica del código → la principal palanca
  de ahorro de tokens. Crea `.serena/` en el repo (gitignored).
- **`context7`** (MCP, global): documentación actualizada y version-accurate de libs.
- **Playwright** (`plugin:playwright:playwright`, instalado): probar la web en
  navegador real, screenshots, QA responsive. Para UI V2, además seguir el protocolo
  de referencia visual de arriba y `scripts/v2-screenshot.mjs`.
- **`ui-ux-pro-max`** (skill, instalada): diseño/UX, paletas, tipografías. El brief
  local de UI V2 y sus referencias mandan sobre cualquier regla genérica de la skill.
- **`shadcn`** (MCP, en `.mcp.json`, solo carga dentro del repo): SOLO panel
  local/legacy. La **UI V2 NO usa shadcn ni Tailwind** (CSS puro en `atlas-v2.css`).
  `magic` está con API key placeholder → no funciona hasta poner una key real.
- **repomix**: on-demand (`npx repomix`), sin instalar — empaquetar repo con conteo de tokens.
- **Graphify** (CLI `graphify`, instalado vía `uv tool`, permitido en
  `.claude/settings.local.json`): grafo de conocimiento del código **sin LLM**
  (extracción AST). **Sin hook PreToolUse** a propósito — se usa on-demand.
  - Grafo canónico del código: `graphify-out/merged-graph.json`
    (app+lib+components+scripts, ~864 nodos). Consultar SIEMPRE contra ese:
    `graphify query "<pregunta>" --graph graphify-out/merged-graph.json --budget 1400`,
    `graphify explain "<símbolo>" --graph graphify-out/merged-graph.json`,
    `graphify affected "<símbolo>" --graph graphify-out/merged-graph.json`.
  - Reconstruir tras refactors (sin LLM): `graphify update app; graphify update lib;
    graphify update components; graphify update scripts; graphify merge-graphs
    app/graphify-out/graph.json lib/graphify-out/graph.json
    components/graphify-out/graph.json scripts/graphify-out/graph.json
    --out graphify-out/merged-graph.json`.
  - Benchmark del grafo unificado: ~56x menos tokens por consulta. Es AST puro
    (estructural: contains/calls); edges semánticos necesitarían una API (no se usa).
- **Planificación**: usar las skills de superpowers ya instaladas (`brainstorming`,
  `writing-plans`, `executing-plans`, `to-prd`, `to-issues`) — no se instaló BMAD.
