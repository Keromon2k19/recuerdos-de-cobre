# Antología · Recuerdos de Cobre — Contexto para Claude

> Nota de reinicio: para el objetivo vigente del proyecto, leer primero
> `docs/GOAL.md`. Fuente de verdad del resumen: `PROMPT_RESUMEN.md`.
> No reconstruir "Sala de Cobre" como diseño final.

## Qué es este proyecto

Antología de la campaña TTRPG **Recuerdos de Cobre** (67 episodios de YouTube, dirigida por *Mates y Mazmorras*). App Next.js local-first. Pipeline **sin API de pago**: descarga + transcripción (Whisper) automáticas; el **resumen y la extracción de lore los hacen Claude/Codex a mano** siguiendo `PROMPT_RESUMEN.md` (resumen) y `lib/schema.ts`/`lib/prompts.ts` (extracción → JSON); se persiste como Markdown editable desde Obsidian.

> El proyecto vive en `recuerdos-de-cobre/` y el vault local por defecto es `vault-recuerdos-de-cobre/`; la app, branding y dominio se llaman **Antología · Recuerdos de Cobre · Grimorio de Lore**. **Es una campaña coral de 6 PJs: Mysha NO es la protagonista**, es una más del grupo.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Design system propio**: Cinzel + EB Garamond + IBM Plex Mono, modo claro (papiro envejecido / tinta vino) + oscuro (cuero / oro viejo) con anti-FOUC. CSS en `app/globals.css`.
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
