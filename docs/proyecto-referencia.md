# Referencia ampliada del proyecto

> Leer solo cuando haga falta el detalle. El contexto operativo vive en `CLAUDE.md`.

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

- **Mysha** (Kero) — PJ, **una más del grupo, NO la protagonista**. Bruja de sangre. Crece en el Coven Rojo (nombre original: Coven Rosa); tras la masacre que lo destruye, vuelve a ese origen para refundarlo. **Tiene 3 personalidades**: Mysha (principal), Selenne, Veltra — la misma persona.
- **Borok** (Mati), **Layra** (Layla), **Narcissa** (Mica), **David Ilcard** (Lucho), **Io Campbell** (Mile/Kuzu/Sis/Nico) — los otros 5 PJs.
- **Champi** — búho familiar de Mysha.
- **Coven Rojo / Negro / Blanco / Verde** — 4 covens (Rosa = nombre original del Rojo; «de sangre»/«oscuro»/«radiante» = variantes).
- **Hermandad de Cobre** — gremio en Metrópolis de Cobre.

## Estado actual

- ✅ Pipeline sin API: download+transcribe (auto) → resumen + extracción (Claude/Codex a mano) → `/review` o `commit-manual.ts` → vault
- ✅ 55 tests pasando, TypeScript compila sin errores
- ✅ Gemini y Ollama retirados del todo (deps desinstaladas)
- ⏳ Los 67 episodios se procesan de a poco
- El vault se genera en `vault-recuerdos-de-cobre/` (configurable via VAULT_PATH en .env.local)

## Graphify — rebuild tras refactors (sin LLM)

```powershell
graphify update app; graphify update lib; graphify update components; graphify update scripts
graphify merge-graphs app/graphify-out/graph.json lib/graphify-out/graph.json components/graphify-out/graph.json scripts/graphify-out/graph.json --out graphify-out/merged-graph.json
```

Benchmark del grafo unificado: ~56x menos tokens por consulta. Es AST puro
(estructural: contains/calls); edges semánticos necesitarían una API (no se usa).
