# GOAL.md - Reinicio canonico de Antologia Recuerdos de Cobre

Este documento es la fuente de verdad vigente para el reinicio del proyecto.
Si otro documento contradice este objetivo, este archivo tiene prioridad.

Los documentos anteriores (`PRODUCT.md`, `DESIGN.md`, `AGENTS.md` y
`CLAUDE.md`) describen el MVP y la iteracion visual previa. Sirven como
contexto historico y tecnico, pero no como direccion final de producto o
diseno. No reconstruir "Sala de Cobre" como identidad final.

> **Trabajo implementado (no parte de la visión base):** la **timeline de la
> campaña** (`/v2/timeline`) existe como página exploratoria de la campaña. Ver el
> plan y estado de aceptación en
> `docs/superpowers/plans/2026-06-05-timeline-de-la-campana.md`, y la referencia
> visual en `docs/ui-v2/timeline-reference.html`.

## Objetivo final

Convertir el proyecto en una antologia publica read-only de la campana
TTRPG **Recuerdos de Cobre**.

La app final debe ser:

- Linda, moderna y funcional.
- Facil de leer durante sesiones largas.
- Explorable por los companeros de campana y el DM.
- Visualmente rica, con imagenes de personajes, lugares, facciones y episodios.
- Preparada para un mapa interactivo y memoria conectada mas adelante.
- Separada del panel tecnico de procesamiento.

El procesamiento de episodios debe seguir siendo local, gratis y controlado por
Joaquin.

## Audiencia

### Usuario principal

Joaquin mantiene el archivo, procesa episodios, revisa extracciones y edita el
vault Markdown.

### Audiencia publica

Los jugadores y el DM acceden a una version read-only para consultar:

- Que paso en cada episodio.
- Quien es cada personaje.
- Donde aparecio cada lugar.
- Que facciones, misterios, objetos y eventos siguen activos.
- Como se conectan los elementos de la campana.

No hay comentarios, cuentas, roles, permisos ni edicion publica. Si alguien
tiene feedback, se lo comunica directamente a Joaquin.

## Principio de producto

La app publica responde esta pregunta:

> Quiero recordar que paso, quien era quien, donde aparecio, y como se conecta
> todo.

El panel local responde otra:

> Quiero procesar episodios y alimentar el archivo.

Son dos experiencias distintas aunque vivan en el mismo repositorio.

## Direccion visual

La direccion vigente es:

**archivo oscuro moderno + atlas narrativo + expedientes de campana + memoria
conectada**.

Debe sentirse como una antologia visual y explorable, no como dashboard, wiki
generica ni formulario administrativo.

### Referencias de estilo

- Archivo oscuro moderno.
- Dark academia funcional.
- Atlas narrativo.
- Expedientes y documentos de caso.
- Biblioteca oscura.
- Grimorio o pergamino solo como detalle visual si mejora la experiencia.
- Imagenes grandes y atmosfericas.
- Composicion editorial clara.

### Permitido

- Fondos oscuros modernos.
- Paneles de lectura claros tipo papel viejo o marfil si ayudan a leer.
- Imagenes de personajes, lugares, facciones y episodios.
- Notas marginales, metadata, relaciones y apariciones.
- Texturas sutiles.
- Animaciones suaves.
- Cobre oxidado, rojo vino, dorado viejo, verde musgo, azul petroleo y gris
  humo como acentos controlados.

### Evitar

- Dashboard generico tipo SaaS.
- Wiki fria.
- Sidebar dominante como experiencia principal.
- Home administrativa.
- Texto comprimido.
- Fantasia medieval barata.
- Pastiche de pergamino, cuero falso, sellos o remaches usados sin criterio.
- Neon, cyberpunk o efectos gamer.
- Animaciones que compitan con la lectura.

## Reglas de lectura y UX

- El texto largo debe ser comodo: medida de columna controlada, line-height
  amplio y contraste alto.
- La navegacion publica debe ser clara y predecible.
- La home debe invitar a explorar la campana, no a procesar episodios.
- La UI debe funcionar bien en desktop y mobile.
- Las animaciones deben usar `transform` y `opacity`, durar aprox. 150-300ms y
  respetar `prefers-reduced-motion`.
- Las imagenes deben reservar espacio para evitar saltos de layout.
- Cada imagen significativa debe tener `alt` descriptivo.

## Estructura publica deseada

```txt
/
  Home narrativa

/cronicas
  Lista de episodios como registros

/cronicas/[num]
  Expediente completo del episodio

/personajes
/lugares
/facciones
/objetos
/misterios
/worldbuilding
  Listados visuales con filtros

/personajes/[slug]
/lugares/[slug]
/facciones/[slug]
  Fichas individuales con imagen, apariciones y relaciones

/mapa
  Futuro mapa interactivo / memoria conectada

/buscar
  Busqueda global
```

La home publica no debe ser el formulario de carga. Debe funcionar como portada
del archivo y punto de entrada a la lectura.

## Estructura local privada

```txt
/procesar
  Playlist, descarga, Whisper y estado de jobs

/review
  Revision de extraccion

/importar
  Sincronizacion de playlist

/admin
  Opcional: acceso central al backstage local
```

Esta zona no debe publicarse o debe quedar protegida/local. Puede tener un
diseno mas funcional que la parte publica, porque su tarea es operar el
pipeline.

## Pantallas base del reinicio

Antes de migrar toda la app, disenar y validar estas pantallas:

1. Home publica.
2. Lista de cronicas.
3. Expediente de episodio.
4. Ficha de personaje.

Si estas cuatro pantallas no se sienten como la nueva direccion, no avanzar con
el resto.

## Home publica

La home debe ser narrativa y visual.

Debe incluir:

- Hero con imagen atmosferica grande.
- Titulo "Recuerdos de Cobre".
- Bajada corta de antologia.
- Acceso al ultimo registro procesado.
- Entradas a cronicas, personajes, lugares, facciones, misterios y mapa.
- Bloques de entidades destacadas o hilos recientes.

No debe incluir como foco principal:

- Formulario de carga.
- Estado de jobs.
- Campos de resumen.
- Botones de extraccion.

## Expediente de episodio

Cada episodio debe sentirse como un registro o expediente.

Debe incluir:

- Numero y titulo del registro.
- Imagen atmosferica o placeholder.
- Resumen cronologico.
- Cast del episodio.
- Lugares y facciones mencionadas.
- Decisiones clave.
- Misterios abiertos.
- Objetos o lore relevante.
- Relaciones nuevas o importantes.
- Navegacion al episodio anterior/siguiente.

## Ficha de entidad

Una ficha de personaje, lugar o faccion debe incluir:

- Imagen o placeholder.
- Nombre, tipo y aliases.
- Resumen canonico o descripcion principal.
- Apariciones por episodio.
- Relaciones.
- Momentos importantes.
- Misterios o notas asociadas.

## Imagenes

Desde el inicio, la estructura debe soportar imagenes aunque sean genericas.

Campos recomendados en frontmatter:

```yaml
image: "/images/placeholders/personajes/personaje-oscuro-01.webp"
imageAlt: "Retrato atmosferico de personaje"
imageCredit: "Placeholder"
imageCaption: ""
```

Carpetas recomendadas:

```txt
public/images/
  placeholders/
    personajes/
    lugares/
    facciones/
    episodios/
  personajes/
  lugares/
  facciones/
  episodios/
```

Las imagenes iniciales pueden ser genericas. Joaquin las reemplazara despues.

## Pipeline local y gratis

El pipeline deseado es:

```txt
Whisper local
  -> transcripcion cruda
  -> Codex o Claude resumen manual siguiendo PROMPT_RESUMEN.md
  -> resumen limpio
  -> Codex/Claude extrae lore estructurado a mano (sin API)
  -> revision manual
  -> commit al vault
  -> sitio publico read-only
```

### Resumen narrativo

- Provider: Codex o Claude, elegido manualmente segun disponibilidad.
- Entrada: transcript Whisper.
- Instruccion obligatoria: `PROMPT_RESUMEN.md`.
- Salida: `output/epNN.resumen.md`.
- Motivo: evitar bloqueos, mala interpretacion de contenido oscuro y perdida de
  criterio narrativo.

El resumen no debe depender de Gemini/Ollama por defecto.

### Extraccion estructurada

- Provider: Codex/Claude a mano (sin API), validado con Zod (`lib/schema.ts`).
- Entrada: resumen ya curado.
- Salida: JSON validado con Zod.
- Ollama y Gemini fueron retirados del pipeline.
- El vault Markdown sigue siendo la fuente de verdad editable.

## Publicacion

Cuando los capitulos esten cargados, publicar una version read-only para los
companeros y el DM.

Reglas:

- El sitio publico no debe depender de Ollama, Gemini, Whisper, jobs ni escritura
  en disco.
- La generacion y el procesamiento ocurren localmente.
- El deploy consume datos ya procesados.
- No exponer claves, rutas internas, endpoints de procesamiento ni panel admin.
- El vault sigue siendo editable localmente.

## Criterios de aceptacion

Una implementacion del reinicio se considera alineada si:

- La home publica no es administrativa.
- La navegacion separa claramente lectura publica y procesamiento local.
- Las pantallas principales usan imagenes o placeholders visuales.
- La lectura de resumenes largos es comoda.
- El sitio funciona en desktop y mobile.
- La parte publica es read-only.
- El panel local puede seguir operando gratis.
- La extraccion la hacen Codex/Claude a mano, sin API (Ollama y Gemini retirados).
- El diseno ya no reproduce "Sala de Cobre" como resultado final.
