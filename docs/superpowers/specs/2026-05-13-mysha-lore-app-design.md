# Diseño — App de lore Mysha

**Fecha:** 2026-05-13
**Estado:** Aprobado, listo para pasar a plan de implementación
**Audiencia inicial:** Joaquín (un solo usuario, local-first)

---

## 1. Objetivo

Construir una app local que transforme los resúmenes automáticos de Gemini (los 67 episodios de YouTube de la campaña Mysha) en una base de datos de lore navegable, persistida como archivos Markdown editables desde Obsidian.

**Criterio de éxito del MVP:**
1. Pegar un resumen en español + número de episodio → la IA extrae lore estructurado en 10 categorías (9 tipos de entidad + relaciones cruzadas).
2. Pantalla de revisión editable: corregir, descartar, reasignar antes de guardar.
3. Al confirmar, la app escribe/actualiza archivos `.md` en un vault que Obsidian puede leer simultáneamente.
4. Navegación dual: por episodio (cronológica) y por entidad (acumulada por mención).

**Anti-objetivos (fuera del MVP):**
- Multi-usuario, autenticación, sincronización cloud.
- Notas colaborativas en vivo, manejo de spells/hojas de personaje.
- Merge automático de info conflictiva entre episodios.
- Hosting público — corre en `localhost`.

---

## 2. Decisiones clave (con razones)

| Decisión | Elegido | Por qué |
|---|---|---|
| Audiencia inicial | Solo Joaquín, local | Evita backend y auth; libera para iterar rápido. La capa de persistencia queda desacoplada para evolucionar a multi-user después. |
| Modelo de navegación | Híbrido (entidad + timeline) | El usuario quiere ambas vistas: ficha de personaje acumulada y repaso cronológico antes de sesión. |
| Categorías de extracción | 10 tipos | Personajes, lugares, eventos, objetos, facciones, worldbuilding + relaciones, misterios, quotes, decisiones clímax. |
| Estrategia de acumulación | Sin merge automático | Cada mención queda con su episodio; el usuario saca conclusiones leyendo el archivo. Sin riesgo de que la IA sobreescriba matices. |
| Persistencia | Markdown como fuente única | Compatible con Obsidian sin sincronización bidireccional. Archivos editables desde ambos lados sin conflictos. |
| Estructura del vault | Carpetas por tipo | Estructura autodescriptiva: `personajes/`, `lugares/`, etc. Obsidian le da igual cuántas carpetas hay. |
| Stack | Next.js 15 (App Router) | API routes + server actions integradas → un solo `npm run dev`. Acceso a filesystem trivial desde server actions. |
| Pantalla home (MVP) | Cargar episodio | El usuario está en fase de carga masiva (67 episodios pendientes). Cuando esté llena se evoluciona a vista grimorio/dashboard. |
| Flujo de extracción | Revisión editable antes de guardar | Más confianza, lore más limpio. Aceptamos el costo de un click extra por episodio. |
| Estética inicial | "Sangriento" (rojo crimson + oro) | Provisional. Encaja con Coven Rosa / Té de Medianoche. Iterable post-MVP. |

---

## 3. Arquitectura

### 3.1 Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** para estética grimorio
- **`@anthropic-ai/sdk`** para llamadas a Claude API
- **`gray-matter`** para parse/serialize Markdown con frontmatter
- **`zod`** para validar el output del LLM contra el esquema
- **`vitest`** para unit tests

### 3.2 Topología

```
mysha/                            # repo del proyecto
├── app/
│   ├── page.tsx                  # Home = pantalla de carga
│   ├── layout.tsx                # Layout con sidebar + paleta grimorio
│   ├── review/page.tsx           # Pantalla de revisión post-extracción
│   ├── episodios/[num]/page.tsx  # Ficha de episodio
│   ├── entidades/
│   │   ├── [tipo]/page.tsx       # Lista por tipo (personajes, lugares, ...)
│   │   └── [tipo]/[slug]/page.tsx # Ficha individual
│   └── actions/
│       ├── extract.ts            # server action: llama Claude API
│       └── commit.ts             # server action: escribe .md al vault
├── components/
│   ├── LoadEpisodeForm.tsx
│   ├── ReviewCard.tsx            # card editable por categoría
│   ├── EntityCard.tsx
│   ├── EpisodeView.tsx
│   ├── EntityView.tsx
│   └── Sidebar.tsx
├── lib/
│   ├── claude.ts                 # cliente Anthropic + prompt caching
│   ├── prompts.ts                # exporta el prompt versionado
│   ├── schema.ts                 # zod schema del output del LLM
│   ├── vault.ts                  # read/write .md (usa VAULT_PATH)
│   ├── markdown.ts               # parse/serialize .md ↔ objetos
│   ├── slugify.ts                # nombre → filename
│   └── types.ts                  # tipos compartidos
├── prompts/
│   └── extract-lore.md           # prompt versionado en disco
├── tests/
│   ├── markdown.test.ts
│   ├── vault.test.ts
│   └── schema.test.ts
├── .env.local                    # ANTHROPIC_API_KEY + VAULT_PATH (gitignored)
├── .env.example                  # plantilla commiteada
├── .gitignore                    # .env.local, .next, node_modules, .superpowers
├── next.config.ts
├── tsconfig.json
├── package.json
└── CLAUDE.md                     # contexto para Claude
```

```
vault-mysha/                      # carpeta separada apuntable desde Obsidian
├── episodios/
│   ├── 001-prologo.md
│   ├── 002-...md
│   └── 067-...md
├── personajes/
│   ├── Mysha.md
│   ├── Selenne.md
│   └── Veltra.md
├── lugares/
├── facciones/
├── eventos/
├── objetos/
├── misterios/
├── quotes/
├── decisiones/
└── worldbuilding/
```

**Nota sobre la ubicación del vault:** `VAULT_PATH` es una ruta absoluta configurable. Puede vivir en cualquier lado (incluso dentro de un vault Obsidian existente). Por defecto sugerimos `../vault-mysha/` relativo al repo, pero la app la lee desde `.env.local` y soporta cualquier path.

**Nota sobre relaciones:** las relaciones entre personajes (`Mysha`↔`Selenne`) no tienen carpeta propia — viven en el frontmatter del personaje (campo `relaciones`). Son edges entre nodos, no nodos. La carpeta `relaciones/` que aparecería intuitivamente NO existe. Las 10 categorías de extracción de la IA mapean a 9 tipos de archivo + relaciones embebidas.

### 3.3 Capas y responsabilidades

| Módulo | Responsabilidad | Depende de |
|---|---|---|
| `lib/claude.ts` | Llamada al LLM con prompt caching y structured output. No conoce el filesystem. | `prompts.ts`, `schema.ts`, SDK |
| `lib/vault.ts` | Lee/escribe archivos en `VAULT_PATH`. No conoce Claude. Expone `readEntity`, `writeEpisode`, `appendMention`, `listByType`. | `markdown.ts`, `fs/promises` |
| `lib/markdown.ts` | Parse/serialize entre objeto TS y archivo `.md` con frontmatter. Reversible. | `gray-matter` |
| `lib/schema.ts` | Define el shape JSON que Claude debe devolver. Usado por `claude.ts` (tool schema) y por server actions (validación). | `zod` |
| `app/actions/extract.ts` | Server action: recibe texto + número de episodio → devuelve objeto validado. Maneja errores de API. | `claude.ts`, `schema.ts` |
| `app/actions/commit.ts` | Server action: recibe objeto revisado → escribe episodio + actualiza fichas de entidades. Idempotente. | `vault.ts` |

**Regla de aislamiento:** ningún componente cliente toca `claude.ts` o `vault.ts` directamente. Todo pasa por server actions. El cliente nunca ve `ANTHROPIC_API_KEY` ni `VAULT_PATH`.

---

## 4. Modelo de datos

### 4.1 Tipos en TypeScript

```ts
// lib/types.ts

export type EntityType =
  | 'personaje' | 'lugar' | 'evento' | 'objeto'
  | 'faccion' | 'worldbuilding' | 'mistero' | 'quote' | 'decision';

export type Mention = {
  episodio: number;          // 67
  texto: string;             // "Mysha es maga"
  contexto?: string;         // qué pasó alrededor (opcional)
};

export type Entity = {
  tipo: EntityType;
  nombre: string;            // "Mysha"
  alias: string[];
  apariciones: number[];     // [3, 7, 12, 23, 47, 67]
  menciones: Mention[];      // append-only
};

export type Relacion = {
  de: string;                // "Mysha"
  a: string;                 // "Selenne"
  tipo: string;              // "personalidad-compartida"
  episodio: number;
};

export type Episodio = {
  numero: number;
  titulo: string;
  fecha_grabacion?: string;
  procesado: string;         // ISO timestamp
  resumen_original: string;  // texto crudo pegado
  extraido: {                // lo que confirmó el usuario en revisión
    personajes: Array<{ nombre: string; descripcion: string; alias?: string[] }>;
    lugares: Array<{ nombre: string; descripcion: string }>;
    eventos: Array<{ nombre: string; descripcion: string }>;
    objetos: Array<{ nombre: string; descripcion: string }>;
    facciones: Array<{ nombre: string; descripcion: string }>;
    worldbuilding: Array<{ tema: string; descripcion: string }>;
    relaciones: Relacion[];
    misterios: string[];
    quotes: Array<{ texto: string; autor?: string }>;
    decisiones: Array<{ descripcion: string; protagonistas: string[] }>;
  };
};
```

### 4.2 Formato de archivos `.md`

**`episodios/067-la-hoguera.md`:**

```markdown
---
tipo: episodio
numero: 67
titulo: "La hoguera"
fecha_grabacion: 2025-08-12
procesado: 2026-05-13T14:22:00
menciones:
  personajes: ["[[Mysha]]", "[[Selenne]]", "[[Io]]"]
  lugares: ["[[Bosque de Espinas]]"]
  facciones: ["[[Coven Rosa]]"]
  eventos: ["[[Ritual del Té]]"]
  misterios: 1
  quotes: 2
---

## Resumen original (Gemini)

{texto crudo pegado por el usuario}

## Lore extraído

### Personajes
- **[[Mysha]]** — recita el conjuro del té
- **[[Selenne]]** — interrumpe la voz de Mysha durante el ritual

### Lugares
- **[[Bosque de Espinas]]** — escenario de la hoguera

### Eventos
- **[[Ritual del Té]]** — primera vez que aparece completo

### Misterios
- ¿Quién dejó la nota en el altar?

### Quotes
> "Que el humo recuerde lo que la sangre olvidó" — Mysha
```

**`personajes/Mysha.md`:**

```markdown
---
tipo: personaje
sub_tipo: PJ
nombre: "Mysha"
alias: ["la bruja roja"]
relaciones:
  - { con: "[[Selenne]]", tipo: "personalidad-compartida", episodio: 3 }
  - { con: "[[Veltra]]", tipo: "personalidad-compartida", episodio: 3 }
apariciones: [3, 7, 12, 23, 47, 67]
ultima_actualizacion: 2026-05-13T14:22:00
---

## Menciones por episodio

### [[067-la-hoguera|Ep. 67 — La hoguera]]
- Mysha es maga.
- Recita el conjuro del té.

### [[047-...|Ep. 47]]
- Mysha es bruja según el bardo.

### [[023-...|Ep. 23]]
- ...
```

**Convenciones:**
- Slug del filename = `slugify(nombre)`, ej. `Té de Medianoche` → `te-de-medianoche.md`. El frontmatter mantiene el nombre original con acentos.
- Wikilinks usan el nombre del frontmatter (no el slug). Obsidian resuelve por nombre.
- `apariciones` en el frontmatter de entidad se recalcula en cada escritura — es el índice rápido para conteos sin parsear el cuerpo.
- El cuerpo siempre es append-only por episodio. Nunca se reescriben menciones existentes salvo que el usuario re-procese el mismo número (entonces se reemplaza la sección de ese episodio puntual).

### 4.3 Idempotencia y re-procesamiento

Procesar el mismo número de episodio dos veces:
1. Sobreescribe `episodios/067-*.md` completo.
2. Para cada entidad mencionada, **reemplaza** la sección `### [[Ep. 67 — ...]]` dentro del `.md` de la entidad (sin tocar otras secciones).
3. Recalcula `apariciones` y `relaciones` en el frontmatter.

Esto permite re-procesar un episodio si la IA se equivocó sin contaminar el resto del lore.

---

## 5. Pipeline de extracción IA

### 5.1 Modelo y configuración

- **Modelo:** `claude-sonnet-4-6`
- **`max_tokens`:** 8000 (los resúmenes de Gemini son cortos; el output estructurado pesa más que el input)
- **`temperature`:** 0.2 (queremos consistencia, no creatividad)
- **Prompt caching:** el prompt + categorías + ejemplos few-shot van en el bloque cacheado (`cache_control: { type: "ephemeral" }`). El input variable es solo `{resumen + número de episodio}`. Con 67 episodios el cache hit save ≈ 90%.

### 5.2 Structured output (tool use)

Se define una tool `registrar_lore` cuyo `input_schema` es el JSON Schema que matchea `Episodio.extraido` (sección 4.1). Claude **debe** llamar a esta tool; el server action toma el `tool_use.input`, lo valida con zod, y lo devuelve al cliente.

Si la validación falla:
1. Reintento con `temperature=0` y un mensaje al modelo indicando el error.
2. Si falla de nuevo, error visible al usuario con el JSON crudo para edición manual.

### 5.3 Resolución de duplicados durante revisión

Durante la pantalla de revisión, para cada entidad propuesta por la IA:
- La app pregunta a `vault.ts` si ya existe una entidad con ese nombre o alias.
- Si existe: la card muestra badge **"Ya existe — se agregará mención"**.
- El usuario puede:
  - Aceptar el match (default).
  - Reasignar a otro nombre existente (autocomplete de entidades del mismo tipo).
  - Forzar nueva entidad (escapar el match falso positivo).

### 5.4 Costo estimado

Sonnet 4.6 a ~$3/MTok input, ~$15/MTok output. Con prompt caching el input cae ~90% en hits.
- 67 episodios × ~2K tokens input variable + ~1K output ≈ **$0.50–1.50 USD total**. Despreciable.

---

## 6. Flujo de UI

### 6.1 Pantallas

1. **`/` — Home (Cargar episodio)**
   - Textarea grande para el resumen.
   - Inputs: `número de episodio`, `título`, `fecha (opcional)`.
   - Sidebar: links rápidos a `personajes/`, `lugares/`, etc. + buscador básico.
   - Botón **"Extraer lore"** → llama server action `extractLore` → navega a `/review`.

2. **`/review` — Revisión (estado en memoria)**
   - El resultado del LLM en cards agrupadas por categoría.
   - Cada card es editable inline: nombre, descripción, alias.
   - Botones por card: **Aceptar**, **Editar**, **Reasignar**, **Descartar**.
   - Badge "Ya existe" para matches con entidades del vault.
   - Botón **"Confirmar y guardar"** → server action `commitEpisode` → redirige a `/episodios/[num]`.
   - Botón **"Volver y reextraer"** preserva el texto crudo.

3. **`/episodios/[num]` — Vista de episodio**
   - Renderiza el `.md` del episodio.
   - Wikilinks navegables a las fichas de entidad.
   - Botón "Reprocesar este episodio".

4. **`/entidades/[tipo]` — Lista de un tipo**
   - Grid de cards con nombre + nº de apariciones.
   - Filtros y búsqueda.

5. **`/entidades/[tipo]/[slug]` — Ficha de entidad**
   - Renderiza el `.md` de la entidad.
   - Sección "menciones por episodio" con links cronológicos.

### 6.2 Estado y navegación

- El resultado de extracción **no se persiste** hasta que el usuario confirme. Vive en una cookie de sesión o en el server state de la action.
- Si el usuario cierra la pestaña con un draft → se pierde, pero el texto crudo se guarda en `localStorage` y la home lo ofrece restaurar.

### 6.3 Estética (provisional)

- Paleta: fondos `#0a0202`–`#1a0505`, acentos crimson `#c8302a`, dorado envejecido `#d4a070`.
- Tipografía: **Cinzel** para títulos, **Crimson Text** para cuerpo.
- Componentes con bordes finos y glow sutil rojo en focus.
- A iterar post-MVP — el usuario indicó que no le encanta y lo cambiamos después.

---

## 7. Configuración y secrets

### 7.1 `.env.local` (gitignored)

```bash
ANTHROPIC_API_KEY=sk-ant-...
VAULT_PATH=C:/Users/joaqu/Obsidian/MyshaVault
```

### 7.2 `.env.example` (commiteado)

```bash
ANTHROPIC_API_KEY=
VAULT_PATH=
```

### 7.3 Validación al arrancar

`lib/config.ts` valida con zod que ambas vars existen y que `VAULT_PATH` es un directorio accesible. Si falla, la app muestra un error claro en la home con instrucciones, no en el momento de guardar.

### 7.4 Setup inicial (primer arranque)

Si el `VAULT_PATH` está vacío, la app crea las 10 carpetas automáticamente. No requiere intervención manual.

---

## 8. Manejo de errores

| Error | Comportamiento |
|---|---|
| `ANTHROPIC_API_KEY` ausente o inválida | Pantalla de configuración al home, no permite extraer. |
| `VAULT_PATH` inexistente o sin permisos | Mismo. |
| Claude API timeout / rate limit | Toast con retry manual. El texto pegado se conserva. |
| Output del LLM no matchea schema | Reintento automático con `temperature=0` + mensaje al modelo. Si falla 2 veces → modal con JSON crudo editable. |
| Filesystem write falla a mitad de un commit | El commit es transaccional: escribe a archivos `.tmp` y hace rename atómico al final. Si falla, deja el vault sin cambios. |
| Usuario re-procesa un episodio | Funciona (ver §4.3). UI confirma antes. |

---

## 9. Testing

**Alcance MVP — unit only:**
- `markdown.test.ts` — parse de un `.md` ejemplo → objeto → re-serialize → idéntico (roundtrip).
- `vault.test.ts` — usa `tmpdir`, escribe un episodio, lee la entidad, verifica que `apariciones` se actualizó y que la sección por episodio se appendeó.
- `schema.test.ts` — un payload válido pasa, uno inválido falla con error descriptivo.

**Fuera del MVP:**
- E2E con Playwright (se puede agregar después).
- Tests del prompt (cuando lo movamos a evaluación regular).

---

## 10. Lo que NO se construye en este MVP

| Anti-feature | Por qué se posterga |
|---|---|
| Auth / multi-user | Sin valor mientras es un solo usuario local. La capa de persistencia queda lista para evolucionar. |
| Backend cloud (Vercel / Supabase) | Markdown local es suficiente. Migrar después implicará agregar otro repository sin cambiar la UI. |
| Notas colaborativas en vivo | Feature futura. Requiere backend + auth. |
| Manejo de spells / hojas de personaje | Feature futura. Diferente modelo de datos (estructurado por sistema de juego). |
| Merge automático de info conflictiva | Requiere otro LLM call por entidad. YAGNI hasta tener datos. |
| Vista de grafo (relaciones) | Obsidian ya lo provee gratis al apuntar al vault. |
| Export a Markdown | El Markdown **es** la fuente. |
| Procesamiento batch automático de los 67 episodios | El flujo de revisión asume un episodio por vez. |

---

## 11. Evolución futura (después del MVP)

| Cuándo | Qué |
|---|---|
| Con 20+ episodios cargados | Cambiar home de "cargar" a "grimorio/dashboard" (la pantalla B/C de los wireframes). Detección automática: home vacío vs lleno. |
| Cuando los jugadores quieran acceso | Migrar persistencia a Supabase: implementar `SupabaseRepository` que cumpla la misma interfaz que `FilesystemRepository`. Agregar auth con magic link. |
| Notas colaborativas | Nuevo módulo `notas/`. Comparten el vault o van a DB cloud según el deploy. |
| Spells/hojas de personaje | Schema separado, posiblemente otro tipo en `personajes/` con sub_tipo PJ. |
| Iteración de estética | Reemplazar tema "sangriento" por lo que el usuario prefiera (los componentes están Tailwind, fácil de retematizar). |

---

## 12. Resumen ejecutivo

App Next.js local-first que extrae lore TTRPG con Claude API, lo presenta en una pantalla de revisión editable, y lo persiste como Markdown navegable desde Obsidian. Cada episodio agrega menciones a fichas de entidad sin mergear automáticamente. Stack ligero, ~10 archivos de código clave, costo de extracción despreciable, escalable a multi-user cuando llegue el momento.
