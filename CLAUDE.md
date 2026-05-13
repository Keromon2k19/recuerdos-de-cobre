# Proyecto Mysha — Contexto para Claude

## Qué es este proyecto

App Next.js local-first que extrae lore de una campaña TTRPG (67 episodios de YouTube) usando Claude API. Los resúmenes automáticos de Gemini se pegan en la app, la IA extrae lore estructurado en 10 categorías, y se persiste como archivos Markdown editables desde Obsidian.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** — paleta grimorio oscuro (crimson + gold)
- **@anthropic-ai/sdk** — Claude API con tool use + prompt caching
- **gray-matter** — parse/serialize Markdown con frontmatter
- **zod** + **zod-to-json-schema** — validación del output del LLM
- **vitest** — unit tests (19 tests, 4 suites)

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
    extract.ts                # Server action: Claude API
    commit.ts                 # Server action: escribe vault

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

## Personajes y facciones clave

- **Mysha** — personaje principal
- **Selenne** — personaje relevante
- **Veltra** — personaje relevante
- **Coven Rosa** — facción
- **Té de Medianoche** — facción/evento

## Estado actual

- ✅ App completa y funcional (MVP)
- ✅ 19 tests pasando, TypeScript compila sin errores
- ✅ Flujo completo: pegar resumen → extraer con Claude → revisar/editar → guardar al vault
- ✅ Navegación: episodios (cronológica) + entidades (por tipo)
- ⏳ Los 67 episodios todavía NO están cargados — pendiente de API key
- El vault se genera en `vault-mysha/` (configurable via VAULT_PATH en .env.local)

## Instrucciones para Claude

- Responder siempre en **español**
- El usuario trabaja desde Claude Code CLI y Antigravity (IDE de Google)
- Los resúmenes de Gemini están en **español**
- Modelo usado para extracción: `claude-sonnet-4-6`
- La persistencia es Markdown plano — compatible con Obsidian sin sync bidireccional
