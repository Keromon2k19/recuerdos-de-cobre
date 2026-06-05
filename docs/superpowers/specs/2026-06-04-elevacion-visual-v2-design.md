# Elevación visual de UI V2 — sistema unificado desde el home — Design Spec

Fecha: 2026-06-04
Estado: aprobado para pasar a plan de implementación

## Objetivo

Tomar la estética de **Home V2** (colores, bordes, decoraciones, materialidad
atlas/códice steampunk) como **sistema base canónico** y **elevar cada página
pública de `/v2`** a ese mismo nivel premium, empezando por las páginas
consolidadas que quedaron a medias. El resultado: todas las páginas se sienten
parte del mismo archivo narrativo, no un dashboard ni una wiki.

## Decisiones tomadas (con Joaquín)

- **Profundidad**: *elevar cada página al nivel del home* — no solo unificar
  tokens, sino rediseñar la composición de cada página (heroes/escenas, imágenes
  o materialidad, layout editorial con foco narrativo).
- **Alcance y orden**: *primero las rotas, después el resto*. Rotas =
  consolidadas sin referencia aprobada (objetos, misterios, mundo) + fichas de
  detalle `[slug]`/`[num]`. Resto = las que ya tenían referencia (personajes,
  capítulos, facciones, dioses, lugares, mapa, buscar).
- **Enfoque de ejecución (C + B)**: construir y validar el **kit de primitivas
  compartidas en aislamiento** (catálogo interno) y probarlo **de punta a punta
  en una página piloto (Objetos)** antes de replicar al resto.
- **Referencias (B)**: las páginas rotas no tienen referencia visual aprobada;
  para cada dominio se generan **mockups HTML (2-3 variantes toggleables)**, se
  aprueba el layout, y recién ahí se implementa.
- **Mobile fuera de alcance**: foco 100% escritorio (1440), consistente con la
  fase anterior. No se rediseña responsive en esta fase.

## Fuente de verdad

- **Home V2** es la referencia de materialidad: `app/(v2)/v2/page.tsx`,
  `components/atlas-v2/AtlasHomeFeature.tsx`, `app/(v2)/v2/atlas-v2.css`.
- Tokens canónicos: bloque `.av2` en `atlas-v2.css` (oklch de cobre/bronce/oro/
  ámbar, fondos en 4 niveles, texto en 3, reglas en 3, tipografía serif
  Cormorant/Spectral/IBM Plex Mono, radios, sombras + glow cobre, motion).
- Dirección de producto: `docs/GOAL.md` (archivo oscuro + atlas narrativo +
  expedientes; imágenes grandes atmosféricas; composición editorial; evitar
  dashboard/wiki).
- Protocolo visual obligatorio: sección "Protocolo obligatorio de referencia
  visual" de `CLAUDE.md`.

## Realidad de imágenes por dominio

Condiciona la estrategia de "imágenes grandes": no todos los dominios tienen
foto propia.

| Dominio | Imágenes disponibles | Estrategia de elevación |
|---|---|---|
| Lugares | ~174 webp + `location-images.ts` | Image-led (foto real grande) |
| Dioses | 8 medallones/imágenes | Image-led (medallón + escena) |
| Personajes | ~3 retratos | Híbrido (foto donde hay, retrato atmosférico/placeholder donde no) |
| Facciones | 2 imágenes | Mayormente material/emblema |
| Objetos / Misterios / Mundo | 0 propias | Material/tipográfico/atmosférico (escenas compartidas, ornamentos, medallones) |
| Capítulos | escena compartida (`scenes/`) | Expediente con escena atmosférica |

## Sistema canónico — "materialidad atlas"

La firma visual del home, formalizada como lenguaje compartido:

1. **Escena de página**: fondo atmosférico full-bleed (imagen donde hay; gradiente
   material donde no) + capas de gradiente + **capa de gears fija** detrás del
   contenido. Contenedor a `--av2-maxw`.
2. **Encabezado de página**: eyebrow en mono (ej. "Conocimiento · Objetos") +
   **título display Cormorant** con acento cobre + ornamento (rombo) + bajada en
   Spectral. Misma gramática que el hero, en escala "sección".
3. **Superficies**: paneles `--av2-bg-panel`/`-raised` con **regla/marco de
   cobre** (`--av2-rule-copper`), blur sutil, sombras profundas
   (`--av2-shadow-deep`) y glow cobre (`--av2-glow-copper`) en focos.
4. **Tipografía editorial**: medida de columna controlada, line-height amplio,
   jerarquía display/body/mono consistente.
5. **Motion**: solo `transform`/`opacity`, ~`--av2-dur` (260ms), curva
   `--av2-ease`, `prefers-reduced-motion` respetado.

No se introduce ningún token nuevo salvo que el sistema lo exija de forma
estricta; se reutilizan los `--av2-*` existentes.

## Kit de primitivas compartidas

Formalizar/pulir lo que existe a medias y crear lo que falta. Cada primitiva
tiene un único propósito y una API chica.

| Primitiva | Rol | Estado |
|---|---|---|
| `AtlasPageScene` | fondo + gears + contenedor; envuelve cualquier página | existe, pulir |
| `AtlasPageHeader` | eyebrow + título display + ornamento + bajada | **nuevo** |
| `AtlasSectionHero` | hero de sección con variantes `image` y `material` | **nuevo** |
| `AtlasEntityIndex` + `AtlasEntityCard` + `AtlasEntityGrid` | listado visual con filtros y foco narrativo | existen, pulir |
| `AtlasEntityDetail` (dossier) | ficha/expediente: imagen/placeholder, meta, apariciones, relaciones | existe a medias |
| `AtlasEntityReader` + `AtlasNarrativeFrame` | lectura cómoda de secciones y menciones | existen a medias |

- **APIs semánticas y pequeñas**: `AtlasPageHeader` recibe `{ eyebrow, title,
  titleAccent?, intro? }`. `AtlasSectionHero` recibe `{ variant: "image" |
  "material", imageSrc?, ... }`. `AtlasEntityDetail` recibe el `detail` (modelo
  de `lib/atlas-v2-content.ts`) + una `variant` por dominio.
- **Catálogo de desarrollo**: ruta navegable pero **no enlazada** (ej.
  `app/(v2)/v2/kit/` — no usar prefijo `_`, que en Next App Router excluye la
  carpeta del routing) que renderiza cada primitiva en sus variantes, para fijar
  el sistema en aislamiento antes de tocar páginas reales. No se enlaza desde la
  nav ni se incluye en búsqueda; es herramienta de desarrollo. Contenido inocuo
  (solo componentes), así que puede quedar en el build; opcionalmente gatearse a
  `NODE_ENV !== "production"`.

## Elevación por dominio (composición objetivo)

- **Objetos (piloto)** → *gabinete de reliquias*: artefacto destacado material-led
  + índice secundario + ficha contextual.
- **Misterios** → *tablero de investigación*: pregunta abierta destacada +
  evidencias/apariciones + pistas narrativas, sin inventar estado canónico.
- **Mundo** → *cosmología navegable*: concepto seleccionado + relaciones +
  extracto de lore (fuente de datos `worldbuilding`, nombre público "Mundo").
- **Lugares / Dioses** → image-led: foto/medallón grandes como foco.
- **Personajes / Facciones** → híbrido: dossier/retrato donde hay foto, emblema/
  retrato atmosférico donde no.
- **Capítulos** → expediente de episodio con escena atmosférica; índice
  secundario.
- **Buscar** → estado inicial rico con sugerencias y categorías reales (evitar el
  vacío actual).
- **Mapa** → escena dentro del mismo sistema (sin rediseño funcional del visor).

## Workflow por página + verificación

Para cada dominio, en este orden:

1. **Mockup**: 2-3 variantes HTML toggleables del layout → Joaquín aprueba una.
2. **Implementar** sobre el kit de primitivas (no estilos ad-hoc por página).
3. **Screenshot** a 1440 con `scripts/v2-screenshot.mjs` y **comparar contra el
   home**; listar y corregir P0/P1/P2.
4. **Review `impeccable`** (y `frontend-design`/`code-reviewer` según haga falta).
5. **Verificación técnica**: `npm run typecheck` + `npm test` + `npm run build`.
6. **Commit** de la página terminada.

## Orden de ejecución

1. Sistema canónico documentado + **kit de primitivas** + catálogo interno.
2. **Piloto: Objetos** de punta a punta → aprobado como estándar de referencia.
3. **Misterios** → **Mundo**.
4. Fichas de detalle `[slug]`/`[num]` de los dominios anteriores.
5. Resto con referencia previa: Personajes, Capítulos, Facciones, Dioses,
   Lugares, Mapa, Buscar.

## Criterios de aceptación

- Cada página comparte la materialidad del home (escena, gears, encabezado,
  marcos de cobre, tipografía) sin parecer un dashboard.
- Cada página tiene un foco narrativo claro y composición editorial.
- Las páginas con imágenes las usan en grande; las que no tienen, resuelven con
  materialidad/tipografía/atmósfera coherente.
- Sin P0/P1 visuales de escritorio a 1440 contra el home.
- `typecheck`, `test` y `build` en verde tras cada página.
- El home queda visualmente intacto (solo se tocan reglas compartidas si es
  estrictamente necesario).

## Fuera de alcance

- Responsive/mobile (fase posterior).
- Rediseño funcional del visor de mapa y del panel local (`/importar`,
  `/procesar`, `/review`).
- Nuevos tokens de color salvo necesidad estricta del sistema.
- Generación de nuevas imágenes por entidad (se usan las existentes +
  placeholders/atmósfera).

## Riesgos y consideraciones

- **CSS grande** (`atlas-v2.css` ~9000 líneas): el kit debe consolidar estilos
  compartidos y evitar duplicación; señalar bloques muertos al pasar, sin
  refactor no relacionado.
- **Divergencia**: todo estilo nuevo vive en el kit/sistema, no inline por
  página, para que "el resto" herede el trabajo del piloto.
- **Datos reales del vault**: las composiciones no deben inventar estado canónico
  (misterios/relaciones); se renderiza lo que hay, con vacíos elegantes.
