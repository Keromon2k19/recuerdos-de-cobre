# UI pública V2 de escritorio - Diseño consolidado

## Objetivo

Consolidar la experiencia pública de Recuerdos de Cobre en una única UI V2
para escritorio, usando el home actual de `/v2` como fuente de verdad visual y
retirando la UI pública anterior cuando exista paridad funcional.

La UI debe sentirse como un atlas narrativo dark fantasy steampunk. Cada
sección comparte el mismo sistema visual, pero se organiza alrededor de un
objeto o escenario narrativo propio.

## Alcance

Incluye:

- UI pública para escritorio.
- Páginas índice y detalle de la antología.
- Navegación, búsqueda y enlaces internos V2.
- Redirecciones desde las rutas públicas anteriores.
- Eliminación de la página y concepto funcional independiente de `Archivos`.
- Eliminación final de la implementación visual pública V1.

No incluye:

- Trabajo específico de responsive o mobile.
- Rediseño del home V2.
- Rediseño del panel operativo local.
- Eliminación de `/importar`, `/procesar` o `/review`.
- Nuevas funcionalidades de edición del vault.

## Fuente visual

El home actual de `/v2` es la constitución visual del sistema:

- Fondo cinematográfico con velo oscuro.
- Profundidad mediante imagen, título y paneles superpuestos.
- Marcos finos de cobre con líneas internas y ornamentos.
- Superficies negras translúcidas con blur y refracción interior.
- Cormorant Garamond para títulos ceremoniales.
- Spectral para narrativa.
- IBM Plex Mono para metadatos y controles.
- Cobre reservado para acciones, selección y estados activos.
- Movimiento sutil, mecánico y basado en `transform`/`opacity`.

No se copiará el layout del home en todas las páginas. Se reutiliza su gramática
visual y su nivel de detalle.

## Regla central de composición

Cada página debe tener:

1. Un fondo o escenario específico de la sección.
2. Un foco narrativo dominante.
3. Uno o dos paneles secundarios de navegación o contexto.
4. Una jerarquía clara entre exploración, selección y lectura.
5. Estados vacío, carga y error diseñados cuando apliquen.

Los índices y filtros nunca deben competir visualmente con el foco narrativo.

## Arquitectura pública final

### Inicio

- `/v2`
- Función: puerta narrativa y último capítulo.
- Estado: conservar visualmente; solo corregir enlaces cuando sea necesario.

### Crónicas

- `/v2/capitulos`
- `/v2/capitulos/[num]`
- `/v2/misterios`
- `/v2/misterios/[slug]`

Capítulos absorbe eventos, citas y decisiones como hitos narrativos. Misterios
se presenta como una mesa de investigación, no como una lista genérica.

### Atlas

- `/v2/personajes`
- `/v2/personajes/[slug]`
- `/v2/facciones`
- `/v2/facciones/[slug]`
- `/v2/lugares`
- `/v2/lugares/[slug]`
- `/v2/mapa`

Personajes usa un dossier/retrato como foco. Facciones usa un campo de
influencias y emblema. Lugares y Mapa conservan funciones diferentes:

- Lugares: galería y fichas narrativas.
- Mapa: exploración geográfica, rutas y regiones.

### Conocimiento

- `/v2/dioses`
- `/v2/objetos`
- `/v2/objetos/[slug]`
- `/v2/mundo`
- `/v2/mundo/[slug]`

Objetos funciona como gabinete de reliquias e incluye documentos físicos
reales del vault: cartas, diarios, libros, contratos, mapas y notas.

Mundo reemplaza el nombre técnico `worldbuilding` y presenta cosmología,
reglas, historia y conceptos.

### Descubrimiento

- `/v2/buscar`

Buscar debe explorar todo el atlas real y ofrecer contenido sugerido antes de
que el usuario escriba.

## Eliminación de Archivos

`/v2/archivos` no forma parte de la arquitectura final.

Motivos:

- No existe una fuente `archivos` en el vault.
- La página actual depende de documentos mock.
- Duplica Capítulos, Objetos, Mundo y Buscar.
- Mantenerla obligaría a inventar contenido o clasificaciones artificiales.

Destino del contenido:

- Crónicas reconstruidas: Capítulos.
- Cartas, diarios, libros, contratos y documentos: Objetos.
- Mapas y planos: Mapa u Objetos, según su función.
- Cosmología y textos conceptuales: Mundo.
- Descubrimiento transversal: Buscar.

La palabra “archivo” puede conservarse como lenguaje narrativo, pero no como
sección ni tipo de búsqueda.

## Componentes compartidos

La implementación debe crear primitivas pequeñas y reutilizables:

- `AtlasPageScene`: fondo, velo y encabezado ceremonial.
- `AtlasNarrativeFrame`: marco principal con variantes de material.
- `AtlasIndexRail`: navegación secundaria para índices.
- `AtlasEntityStage`: foco narrativo de una entidad seleccionada.
- `AtlasEntityReader`: lectura de perfil, menciones y relaciones.
- `AtlasEntityMeta`: metadatos consistentes.
- `AtlasEmptyState`: estado vacío contextual.

Las páginas pueden compartir lectores y adaptadores de datos, pero no deben
terminar con el mismo layout genérico.

## Contrato de datos

La UI V2 leerá el vault real usando helpers compartidos. Los adaptadores deben
normalizar:

- Identidad: tipo, slug, nombre, descripción e imagen.
- Apariciones y referencias a episodios.
- Frontmatter específico: rol, jugador, facciones, región, categoría y origen.
- Secciones Markdown.
- Relaciones.

Los índices usan `cachedListByType`. Los detalles leen el Markdown real y lo
transforman a un modelo V2 sin reutilizar la presentación visual V1.

Los datos mock de `Archivos` deben eliminarse. Buscar debe indexar datos reales
de las secciones finales.

## Navegación final

La navegación superior conserva su tratamiento visual actual y se reorganiza:

- Inicio.
- Crónicas: Capítulos, Misterios.
- Atlas: Personajes, Facciones, Lugares, Mapa.
- Conocimiento: Dioses, Objetos, Mundo.
- Buscar.
- Reproductor musical.

No habrá enlace a Archivos.

## Retiro de V1

La UI pública anterior solo se elimina después de completar:

1. Paridad de rutas públicas.
2. Corrección de enlaces internos.
3. Búsqueda V2 sin dependencias mock ni enlaces V1.
4. Redirecciones directas verificadas.
5. Build y QA visual de escritorio.

Redirecciones finales:

- `/` a `/v2`.
- `/cronicas` a `/v2/capitulos`.
- `/cronicas/:num` a `/v2/capitulos/:num`.
- `/personajes` y detalles a `/v2/personajes`.
- `/facciones` y detalles a `/v2/facciones`.
- `/lugares` y detalles a `/v2/lugares`.
- `/mapa` a `/v2/mapa`.
- `/objetos` y detalles a `/v2/objetos`.
- `/misterios` y detalles a `/v2/misterios`.
- `/worldbuilding` y detalles a `/v2/mundo`.
- `/buscar` a `/v2/buscar`.
- Rutas antiguas `/episodios` y `/entidades/*` directamente a V2, sin cadenas.

El panel local conserva `/importar`, `/procesar` y `/review`.

## Flujo de diseño y aprobación

Antes de implementar una página nueva o una reconstrucción estructural:

1. Generar una comparación visual o mockup navegable.
2. Elegir una composición.
3. Implementar con datos reales.
4. Capturar la página en escritorio.
5. Comparar contra el home y la composición aprobada.
6. Corregir diferencias P0/P1 antes de avanzar.

## Criterios de aceptación

- Todas las rutas públicas finales existen bajo `/v2`.
- Ningún enlace V2 conduce a una página pública V1.
- No existe navegación, búsqueda ni contenido dependiente de `Archivos`.
- Objetos incluye los documentos físicos reales del vault.
- Eventos, citas y decisiones son visibles dentro de Capítulos.
- Cada sección tiene un foco narrativo propio.
- El home mantiene su diseño actual.
- Las rutas públicas V1 redirigen directamente a V2.
- El panel local sigue accesible.
- `npm run typecheck`, `npm test` y `npm run build` pasan.
- Todas las páginas finales fueron verificadas visualmente en escritorio.
