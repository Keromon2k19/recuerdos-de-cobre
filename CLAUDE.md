# Antología · Recuerdos de Cobre — Contexto para Claude

> Nota de reinicio: este documento refleja una iteracion anterior del MVP.
> Para el objetivo actual del proyecto, leer primero `docs/GOAL.md`.
> No reconstruir "Sala de Cobre" como diseno final.

## Qué es este proyecto

Antología de la campaña TTRPG **Recuerdos de Cobre** (67 episodios de YouTube, dirigida por *Mates y Mazmorras*). App Next.js local-first. Pipeline: descarga + transcripción (Whisper) automáticas; el **resumen lo hace Claude Code a mano** siguiendo `PROMPT_RESUMEN.md` (Gemini bloquea el contenido oscuro de la campaña); la extracción de lore estructurado en 10 categorías la hace **Gemini** (sin créditos de API); se persiste como Markdown editable desde Obsidian.

> El nombre de la **carpeta del proyecto** (`Mysha/`) y el del **vault** (`vault-mysha/`) son legacy y se mantienen para no romper paths; la app, branding y dominio se llaman **Antología · Recuerdos de Cobre · Grimorio de Lore**. **Es una campaña coral de 6 PJs: Mysha NO es la protagonista**, es una más del grupo (su nombre quedó en los paths legacy).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Design system propio**: Cinzel + EB Garamond + IBM Plex Mono, modo claro (papiro envejecido / tinta vino) + oscuro (cuero / oro viejo) con anti-FOUC. CSS en `app/globals.css`.
- **@anthropic-ai/sdk** — Claude API con tool use + prompt caching
- **gray-matter** — parse/serialize Markdown con frontmatter
- **zod** + **zod-to-json-schema** — validación del output del LLM
- **vitest** — unit tests
- **Cola de procesamiento**: jobs en `_jobs/N.json`, worker auto-encadenado en `scripts/process-episode.ts` que hace download → transcribe (Whisper batched) → **STOP** en estado `esperando_resumen`. El resumen lo hace Claude Code a mano (ver `PROMPT_RESUMEN.md`) e inyecta en el job; después el formulario corre extracción (Gemini) → revisión manual en `/review` → commit al vault. La cola sigue descargando+transcribiendo otros episodios en paralelo.

## Estructura del proyecto

```
app/
  page.tsx                    # Home = formulario de carga
  layout.tsx                  # Layout con sidebar
  review/page.tsx             # Revisión post-extracción (editable)
  episodios/page.tsx          # Lista de episodios
  episodios/[num]/page.tsx    # Ficha de episodio
  entidades/[tipo]/page.tsx   # Lista por tipo
  entidades/[tipo]/[slug]/page.tsx  # Ficha de entidad
  actions/
    extract.ts                # Server action: extracción con Gemini
    commit.ts                 # Server action: escribe vault
    process.ts                # Server actions: cola (enqueue/resume/cancel)

components/
  Sidebar.tsx                 # Navegación lateral
  LoadEpisodeForm.tsx         # Formulario de carga
  ReviewCard.tsx              # Card editable de revisión

lib/
  types.ts                    # EntityType, Mention, Entity, Relacion, Episodio
  schema.ts                   # Zod schemas + JSON Schema para tool use
  slugify.ts                  # Slugificación Unicode-safe
  markdown.ts                 # Parse/serialize .md ↔ objetos
  vault.ts                    # CRUD filesystem (read/write/list)
  claude.ts                   # Cliente Anthropic con tool use
  prompts.ts                  # Prompt versionado
  config.ts                   # Validación de env vars

tests/
  config.test.ts, schema.test.ts, markdown.test.ts, vault.test.ts
```

## Personajes y facciones clave (cheat-sheet)

> Fuente de verdad completa: `vault-mysha/_glossary.md`

- **Mysha** (Kero) — PJ, **una más del grupo, NO la protagonista**. Bruja de sangre. Empieza en el Coven Rojo, después Coven Rosa. **Tiene 3 personalidades**: Mysha (principal), Selenne, Veltra — la misma persona.
- **Borok** (Mati), **Layra** (Layla), **Narcissa** (Mica), **David Ilcard** (Lucho), **Io Campbell** (Mile/Kuzu/Sis/Nico) — los otros 5 PJs.
- **Champi** — búho familiar de Mysha.
- **Coven Rojo / Rosa / Negro / Blanco / Verde** — 5 covens.
- **Hermandad de Cobre** — gremio en Metrópolis de Cobre.

## Estado actual

- ✅ App completa y funcional (MVP)
- ✅ 19 tests pasando, TypeScript compila sin errores
- ✅ Flujo: download+transcribe (auto) → resumen (Claude Code a mano) → extraer con Gemini → revisar/editar → guardar al vault
- ✅ Navegación: episodios (cronológica) + entidades (por tipo)
- ⏳ Los 67 episodios se procesan de a poco (resúmenes manuales)
- El vault se genera en `vault-mysha/` (configurable via VAULT_PATH en .env.local)

## Instrucciones para Claude

- Responder siempre en **español**
- El usuario trabaja desde Claude Code CLI y Antigravity (IDE de Google)
- **Resúmenes los hace Claude Code**: cuando el usuario pida resumir un episodio, seguir `PROMPT_RESUMEN.md` al pie de la letra (leer transcript → escribir resumen → inyectar en el job). NO usar Gemini para resumir.
- Extracción y formulario corren con **Gemini** (no hay créditos de Anthropic API; el plan Pro de claude.ai NO da acceso a la API)
- Si se edita el prompt de resumen o el de extracción (`lib/prompts.ts`), **alinear ambos** — son la misma campaña
- La persistencia es Markdown plano — compatible con Obsidian sin sync bidireccional
