# Antología · Recuerdos de Cobre — Contexto para Codex

> Fuente de verdad vigente del proyecto: `docs/GOAL.md`.
> Fuente de verdad del resumen: `PROMPT_RESUMEN.md`.
> Si algo en este archivo contradice esos dos, ellos mandan.
> Documentos legacy (`PRODUCT.md`, `DESIGN.md`) describen una iteración previa:
> contexto histórico, NO dirección final. No reconstruir "Sala de Cobre" como
> diseño final.

## Modo de trabajo por tarea

Este archivo cubre dos modos distintos. Elegí el modo según el pedido del
usuario:

- **Resumen/extracción de episodios**: seguir la sección "Tarea de Codex" de
  este archivo. En ese modo, Codex solo escribe `output/epNN.resumen.md`,
  `output/epNN.extraccion.json` y actualiza
  `vault-recuerdos-de-cobre/_jobs/0NN.json`.
- **UI V2 pública / frontend / diseño**: seguir
  `docs/rdc-ui-v2-brief.md`,
  `docs/rdc-ui-v2-implementation-plan.md`,
  `docs/rdc-ui-v2-reference-index.md`,
  `docs/rdc-ui-v2-qa-checklist.md` y
  `docs/rdc-ui-v2-agent-prompts.md`. En ese modo está permitido trabajar en
  `app/(v2)/v2/`, `components/atlas-v2/`, `data/atlas-v2/`,
  `public/assets/atlas-v2/`, `app/(v2)/v2/atlas-v2.css` y docs relacionados.

Si una regla de la sección de episodios contradice una tarea explícita de UI V2,
la tarea de UI V2 y los documentos `docs/rdc-ui-v2-*` mandan para ese trabajo.

### Regla dura para UI V2 visual

Para cualquier cambio visual, layout, polish, responsive, motion o QA de UI V2:

1. Antes de editar, abrir la referencia correcta en
   `public/assets/atlas-v2/references/`:
   - Home: `home-reference.png`
   - Personajes: `personajes-reference.png`
   - Capitulos: `capitulos-reference.png`
   - Mapa: `mapa-reference.png`
   - Dioses: `dioses-reference.png`
   - Archivos: `archivos-reference.png`
2. Abrir o generar screenshot actual de la ruta con `scripts/v2-screenshot.mjs`
   en desktop y mobile. Usar Edge/Chrome con `V2_BROWSER_CHANNEL` si hace falta.
3. Comparar referencia vs screenshot actual y escribir gaps concretos P0/P1/P2
   antes de tocar CSS o componentes.
4. Despues de editar, volver a correr screenshot y comparar contra la misma
   referencia. No decir "listo" solo por compilar.
5. No usar `.design-bundle*`, `PRODUCT.md`, `DESIGN.md`, screenshots viejos del
   repo padre ni UI legacy como direccion visual para UI V2, salvo pedido
   explicito del usuario. Son contexto historico, no fuente de verdad visual.
6. Si una skill o subagente sugiere algo distinto, la referencia local y los
   docs `rdc-ui-v2-*` mandan.

Nota de estructura actual: algunos docs antiguos mencionan `app/(public)/v2/`
o `app/(public)/public.css`. Para UI V2 activa, la implementacion vigente esta
en `app/(v2)/v2/` y el CSS principal es `app/(v2)/v2/atlas-v2.css`.

---

## ⭐ Tarea de Codex: resumen + extracción de cada episodio (desatendido, sin API)

En este proyecto, por episodio, hacés **dos artefactos a mano** (sin Gemini,
sin Ollama, sin API de pago): el **resumen** narrativo y la **extracción** de
lore estructurado. Trabajás en paralelo con Claude Code (app/diseño/código).
Para no pisarse, respetá el dominio de archivos **al pie de la letra**.

### Qué hacés y qué NO

- ✅ Resumen narrativo siguiendo **`PROMPT_RESUMEN.md`** exactamente.
- ✅ Extracción de lore: generás `output/epNN.extraccion.json` conforme al
  schema de `lib/schema.ts` (`ExtractionResult`) y a las reglas de
  `lib/prompts.ts` (`SYSTEM_PROMPT`). Lo hacés **vos a mano**, leyendo tu
  propio resumen. NO llamás a ningún modelo/API para esto.
- ✅ Ambos los escribís **vos** (modelo grande). Los modelos chicos no dan la
  talla. **Nunca** delegues en Gemini/Ollama/API.
- ❌ NO hacés `git`, `npm`, commits, ni tocás `app/`, `lib/`, `components/`,
  `scripts/`, `docs/`, configs (`lib/` y `lib/prompts.ts`/`lib/schema.ts` son
  **solo lectura**, como referencia del shape y las reglas).
- ❌ NO commiteás al vault. El commit lo hace Joaquín: revisa en `/review` o
  corre `scripts/commit-manual.ts`. Vos dejás los dos archivos en `output/`.

### Dominio de archivos

| Acción | Archivos |
|---|---|
| **Leer** | `output/epNN.transcript.txt`, `PROMPT_RESUMEN.md`, `docs/GOAL.md`, `vault-recuerdos-de-cobre/_glossary.md`, `lib/schema.ts`, `lib/prompts.ts`, `vault-recuerdos-de-cobre/_jobs/0NN.json` |
| **Escribir** | `output/epNN.resumen.md` y `output/epNN.extraccion.json` |
| **Editar** | `vault-recuerdos-de-cobre/_jobs/0NN.json` (solo los campos indicados abajo) |
| **Prohibido tocar** | todo lo demás del repo |

`output/` y `vault-recuerdos-de-cobre/` están en `.gitignore`: tu trabajo nunca entra en
commits ni genera conflictos de git. Ese es el contrato con Claude Code.

### Flujo por episodio

1. Leer el transcript completo en `output/epNN.transcript.txt`.
2. **Resumen**: aplicar **exactamente** `PROMPT_RESUMEN.md` (campaña coral de
   6 PJs, Mysha NO protagonista; sin meta-juego/OOC; sin mecánicas; excluir el
   recap inicial; normalizar nombres con el glosario; NPCs con rol/oficio/qué
   aportan; negritas en primera aparición de lugares/facciones; exactamente las
   4 secciones). Escribir `output/epNN.resumen.md`.
3. Inyectar el resumen en `vault-recuerdos-de-cobre/_jobs/0NN.json` (3 dígitos): setear
   `"resumen"` = contenido del `.md`, `"estado": "done"`,
   `"etapa_actual": "Resumen listo — cargá al formulario"`,
   `"actualizado_en"` = ISO actual; **eliminar** `"committed_entities"`,
   `"pid"`, `"progress"`, `"progress_detail"` si existen; mantener el resto
   (`numero`, `videoId`, `url`, `titulo`, `publicado_en`, `iniciado_en`,
   `auto_commit`, `audio_path`, `transcript_path`). No edites el JSON a mano:
   usá un script Node temporal en `output/` (gitignored) y borralo (patrón
   abajo).
4. **Extracción**: a partir de tu propio resumen, generar
   `output/epNN.extraccion.json` con este shape exacto (todas las claves
   presentes, listas vacías si no hay nada):

   ```json
   {
     "personajes":   [{ "nombre": "", "descripcion": "", "alias": [] }],
     "lugares":      [{ "nombre": "", "descripcion": "" }],
     "eventos":      [{ "nombre": "", "descripcion": "" }],
     "objetos":      [{ "nombre": "", "descripcion": "" }],
     "facciones":    [{ "nombre": "", "descripcion": "" }],
     "worldbuilding":[{ "tema": "",   "descripcion": "" }],
     "relaciones":   [{ "de": "", "a": "", "tipo": "", "episodio": NN }],
     "misterios":    [""],
     "quotes":       [{ "texto": "", "autor": "" }],
     "decisiones":   [{ "descripcion": "", "protagonistas": [""] }]
   }
   ```

   Reglas (ver `lib/prompts.ts` para el detalle): los 6 PJs siempre como
   personajes (Mysha con `alias:["Selenne","Veltra"]`); dioses como
   worldbuilding, no personajes; el DM nunca como personaje; descripciones
   diferenciales del episodio (no reafirmar identidad); `episodio` de TODAS
   las relaciones = NN del episodio analizado; exhaustivo en relaciones;
   respondé en español. Debe ser JSON válido que pase el Zod de
   `lib/schema.ts`.

5. El commit al vault lo hace Joaquín (revisa en `/review` o corre
   `npx tsx scripts/commit-manual.ts NN "<título>" [fechaISO]`). Vos no.

Patrón del script de inyección del job (paso 3):

```js
// output/_inject_epNN.cjs  (borrar tras correr)
const fs = require('fs');
const base = 'C:/Users/joaqu/OneDrive/Documentos/claudeprojects/recuerdos-de-cobre';
const job = JSON.parse(fs.readFileSync(base+'/vault-recuerdos-de-cobre/_jobs/0NN.json','utf8'));
job.resumen = fs.readFileSync(base+'/output/epNN.resumen.md','utf8');
job.estado = 'done';
job.etapa_actual = 'Resumen listo — cargá al formulario';
job.actualizado_en = new Date().toISOString();
delete job.committed_entities;
delete job.pid; delete job.progress; delete job.progress_detail;
fs.writeFileSync(base+'/vault-recuerdos-de-cobre/_jobs/0NN.json', JSON.stringify(job,null,2)+'\n','utf8');
```

Node preserva UTF-8 con acentos literales e indentación de 2 espacios.
Reemplazá `NN`/`0NN` por el episodio.

### Orden de trabajo y estado actual

- **ep06, ep07** → resumen ya hecho por Claude (no lo rehagas). Falta solo la
  **extracción**: generá `output/ep06.extraccion.json` y
  `output/ep07.extraccion.json` a partir de los resúmenes existentes.
- **ep08 → ep12** → resumen viejo de la tanda Gemini: rehacé resumen +
  extracción, en orden (08, 09, 10, 11, 12).
- **ep13+** → el worker sigue transcribiendo. Tomá cada episodio en cuanto
  exista `output/epNN.transcript.txt`.

Un episodio está **listo** cuando existen `output/epNN.resumen.md`,
`output/epNN.extraccion.json` y el job está en
`"etapa_actual": "Resumen listo — cargá al formulario"`. Tras cada episodio
escribí `epNN OK` y seguí sin pedir confirmación. Si falta un transcript,
saltealo; no inventes contenido.

### Lanzamiento (lo corre Joaquín)

Segunda terminal, en la carpeta del proyecto, Codex en modo autónomo con
escritura al workspace (confirmá el flag con `codex --help`; según versión es
`codex --full-auto` o `codex --ask-for-approval never --sandbox workspace-write`):

```
codex --full-auto "Leé AGENTS.md, PROMPT_RESUMEN.md, lib/schema.ts y lib/prompts.ts. Por cada episodio pendiente: hacé el resumen (PROMPT_RESUMEN.md) en output/epNN.resumen.md, inyectalo al job, y la extracción en output/epNN.extraccion.json (shape de AGENTS.md / schema de lib/schema.ts). Empezá por la extracción de ep06 y ep07 (su resumen ya está), después ep08..ep12 resumen+extracción, después ep13+. No toques nada fuera de output/ y vault-recuerdos-de-cobre/_jobs/. Sin git, npm, commits ni API. Escribí 'epNN OK' tras cada uno."
```

Recomendado: revisar a mano el primero para calibrar antes de soltar el resto.

---

## Qué es este proyecto

Antología de la campaña TTRPG **Recuerdos de Cobre** (67 episodios de YouTube,
dirigida por *Mates y Mazmorras*). App Next.js local-first. Pipeline:

```
Whisper local → transcript crudo (output/epNN.transcript.txt)
  → resumen narrativo (Codex/Claude a mano, PROMPT_RESUMEN.md)
  → output/epNN.resumen.md + inyección al job
  → extracción de lore (Codex/Claude a mano, sin API)
  → output/epNN.extraccion.json (valida con lib/schema.ts)
  → Joaquín revisa en /review o corre scripts/commit-manual.ts
  → commit al vault (Markdown editable desde Obsidian)
  → sitio público read-only
```

Sin Gemini, sin Ollama, sin API de pago: resumen y extracción los hace un
modelo grande a mano (Claude/Codex). El criterio narrativo del transcript es
demasiado alto para modelos chicos y la API quedó descartada por costo.

> El proyecto vive en `recuerdos-de-cobre/` y el vault local por defecto es
> `vault-recuerdos-de-cobre/`. **Campaña coral de 6 PJs: Mysha NO es la
> protagonista**, es una más del grupo; el nombre del personaje se conserva
> solo donde corresponde al lore.

## Personajes y facciones clave (cheat-sheet para normalizar nombres)

> Fuente completa: `vault-recuerdos-de-cobre/_glossary.md`. El glosario de normalización
> canónico vive dentro de `PROMPT_RESUMEN.md` — usalo siempre.

- **Mysha** (jugadora Kero) — PJ, una más del grupo, NO la protagonista. Bruja
  de sangre. Empieza en el Coven Rojo, después Coven Rosa. **3 personalidades**:
  Mysha (principal), Selenne, Veltra — la misma persona. *Whisper la transcribe
  como Milla/Misha/Mila → Mysha.*
- **Borok** (Mati), **Layra** (Layla), **Narcissa** (Mica),
  **David Ilcard** (Lucho), **Io Campbell** (Mile/Kuzu/Sis/Nico) — los otros
  5 PJs. "Io" es nombre propio, no el pronombre "yo".
- **Champi** — búho familiar de Mysha.
- **El DM** — narrador, lo llaman **Ra**, **Rammis**, **Haru** o **DM**. NO es
  personaje del mundo; nunca lo registres como NPC.
- **Coven Rojo / Rosa / Negro / Blanco / Verde** — 5 covens.
- **Hermandad de Cobre** — gremio en la Metrópolis de Cobre.

## Reglas generales

- Responder y escribir siempre en **español**.
- `PROMPT_RESUMEN.md` (resumen) y `lib/prompts.ts` (extracción) son la misma
  campaña: si se edita uno, alinear el otro.
- La persistencia es Markdown plano, compatible con Obsidian. El vault
  (`vault-recuerdos-de-cobre/`) es la fuente de verdad editable.
