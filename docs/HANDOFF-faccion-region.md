# Handoff — Backfill de `facciones` y `region` en personajes

> Tarea puntual para Codex. La pidió Joaquín explícitamente: el sitio público
> ya tiene filtros en `/personajes` y faltan los datos para dos ejes.
> Una vez hecha, la tarea no se repite (salvo personajes nuevos).

## Por qué

`/personajes` ahora tiene filtros facetados en dropdowns (componente
`components/public/ListFilter.tsx`). Funcionan ya **Rol** y **Apariciones**
porque ese dato existe. Faltan dos ejes:

- **Facción** — a qué coven / gremio / casa pertenece o sirve el personaje.
- **Región** — el lugar con el que el personaje está más asociado.

Esos campos **no existen** en el frontmatter de los personajes. Hay que
sembrarlos. El listado (`lib/vault.ts` → `listByType`) ya los lee:
`facciones?: string[]` y `region?: string`. En cuanto los archivos los
tengan, los dropdowns "Facción" y "Región" aparecen solos (la UI muestra un
eje solo si hay 2+ valores distintos — no hay que tocar código).

## Qué hacés

Por cada archivo `vault-recuerdos-de-cobre/personajes/*.md` (354 archivos al
2026-05-31; puede crecer con nuevos commits de episodios),
agregás al **frontmatter** dos claves:

```yaml
facciones:
  - Coven Rojo
region: Metrópolis de Cobre
```

- `facciones`: **lista** de strings. Un personaje puede pertenecer a varias
  (p. ej. Mysha pasó del Coven Rojo al Coven Rosa → `[Coven Rojo, Coven Rosa]`).
  Lista vacía `[]` si no se puede determinar ninguna.
- `region`: **un** string, el lugar principal del personaje. Omitir la clave
  (no ponerla, o `region: ""`) si no se puede determinar.

No agregues otras claves. No toques `tipo`, `nombre`, `alias`, `apariciones`,
`rol`, `tags`, `relaciones`, `ultima_actualizacion` ni el cuerpo del archivo.

## Reglas de criterio

1. **Facción = pertenencia o lealtad**, no "apareció al lado de". Si el
   personaje es enemigo de un coven, ese coven NO va en `facciones`.
2. **Nombres canónicos.** El valor de `facciones` debe coincidir con el
   `nombre` de una ficha real en `vault-recuerdos-de-cobre/facciones/`.
   El valor de `region` debe coincidir con el `nombre` de una ficha en
   `vault-recuerdos-de-cobre/lugares/`. Listá esas carpetas para tener el
   vocabulario válido. Si dudás entre dos grafías, abrí la ficha y usá su
   campo `nombre`.
3. **Fuentes de evidencia, en orden de prioridad:**
   - `vault-recuerdos-de-cobre/_glossary.md` — lore canónico del DM. Tiene
     la facción de los 6 PJs y las facciones políticas mayores. Es la
     verdad: si el glosario lo dice, va.
   - El campo `relaciones` del propio frontmatter del personaje: cada
     entrada `con: '[[X]]'` apunta a otra entidad. Si `X` es una facción o
     un lugar, es señal fuerte (pero leé el `tipo:` de la relación para
     descartar enemistades).
   - El cuerpo del archivo (`## Menciones por episodio`): describe qué hizo
     el personaje. Suele decir de dónde es o a quién sirve.
4. **No inventes.** Si la evidencia no alcanza, `facciones: []` y omití
   `region`. Es preferible un eje con menos datos pero correctos. Joaquín
   completará el resto a mano en Obsidian.
5. **PJs (los 6):** el glosario los cubre. Referencia rápida —
   - Mysha → `facciones: [Coven Rojo, Coven Rosa]`
   - Borok, Layra, Narcissa, David Ilcard, Io Campbell → asignar según el
     glosario y sus fichas.
   - Champi (familiar) → la facción/región de Mysha si corresponde, o vacío.

## Idempotencia

- Si el archivo ya tiene `facciones`/`region` con valores razonables, dejalo.
- Si está vacío o falta, completalo.
- Es seguro correr la tarea más de una vez.
- **Importante:** estos campos sobreviven a re-commits del pipeline.
  `lib/markdown.ts` (`updateEntityMarkdown`) hace `{ ...parsed.frontmatter }`
  al actualizar una entidad existente: preserva claves desconocidas. O sea,
  cuando se procese un episodio nuevo que mencione a este personaje, tu
  `facciones`/`region` no se pierden.

## Cómo editar (no romper el YAML)

No edites el frontmatter a ojo: usá un script Node temporal con `gray-matter`
(ya es dependencia del proyecto), igual que el patrón de `scripts/backfill-rol.ts`.
Ese script es el precedente exacto de esta tarea: lee cada `.md`, parsea con
`matter()`, modifica `fm`, y reescribe con `matter.stringify()`. Copiá ese
patrón. Node preserva UTF-8 con acentos e indentación de 2 espacios.

Si preferís editar a mano archivo por archivo (sos un modelo grande, podés),
respetá: indentación de 2 espacios, listas con `  - `, sin comillas salvo que
el valor tenga `:` o caracteres especiales.

## Verificación

Estado tras las limpiezas conservadoras de Codex (2026-05-31):

- Personajes detectados: 354.
- `facciones` existe como lista en todos los personajes.
- Valores inválidos de `facciones` contra `vault-recuerdos-de-cobre/facciones/`: 0.
- Valores inválidos de `region` contra `vault-recuerdos-de-cobre/lugares/`: 0.
- Personajes con `facciones` no vacío: 60.
- Regiones completas: 52.
- Regiones pendientes/sin evidencia suficiente: 302.
- Personajes sin facción ni región todavía: 287.

Cuando termines, Joaquín abre `http://localhost:3000/personajes`:
- Deben aparecer los dropdowns **Facción** y **Región** además de Rol y
  Apariciones.
- Cada opción muestra su conteo. Filtrar por una facción debe achicar la
  grilla a los personajes correctos.

No hace falta `git`, `npm`, ni build. Solo editar los `.md` del vault.

## Límite de dominio

Esta tarea te hace tocar `vault-recuerdos-de-cobre/personajes/*.md`, que
normalmente está fuera de tu dominio (`AGENTS.md`). Es una excepción puntual
autorizada por Joaquín **solo para esta tarea**. No toques nada más del vault
ni del repo. `output/`, `_jobs/`, resúmenes y extracciones siguen igual.
