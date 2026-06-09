# Spec — Té de Media Noche (constelación del grupo)

> Diseño validado con Joaquín el 2026-06-09 vía mockups interactivos.
> **Referencia visual aprobada:** `docs/ui-v2/te-de-media-noche-reference.html`
> (abrir en navegador; requiere `npm run dev` en :3000 para los retratos).
> Esa referencia manda sobre cualquier descripción textual de este spec.

## Contexto

La página pública del atlas no tiene una vista del **grupo** de la campaña.
Joaquín quiere una sección donde estén los integrantes de **Té de Media
Noche** (el nombre del grupo) y que, al clickear un retrato, se abran sus
relaciones. Se exploraron 3 direcciones (grilla editorial, constelación,
master-detail); se eligió **constelación** con alcance **personas +
facciones**.

## Qué se construye

Página nueva `/te-de-media-noche` en el atlas público (read-only):

1. **Reposo** — los 10 integrantes en anillo, retratos cuadrados
   (border-radius 5px), unidos por líneas de vínculo. Título "Té de Media
   Noche". Animación de entrada escalonada + idle flotante.
2. **Foco** (click en un integrante) — se centra y agranda; los demás se
   atenúan al borde; sus vínculos cercanos (personas + facciones) aparecen
   en anillo medio con líneas que **se dibujan desde el centro**.
3. **Expediente** (segundo click sobre el centrado) — tarjeta grande con
   retrato vertical, alias, bio y stats (episodios · vínculos · rol), con
   link "Ver ficha completa →" a `/personajes/[slug]`. El fondo se vela.
4. **Click afuera** cierra por niveles: expediente → foco → reposo.
   Botón "← Té de Media Noche" y tecla Escape hacen lo mismo.

## Integrantes (curado, no derivable del vault)

El vault no registra membresía de grupo; se cura en un archivo nuevo
`data/atlas/te-de-media-noche.ts` (mismo patrón que
`lib/personajes-origen.ts` / `data/atlas/location-overrides.json`):

| slug | etiqueta visible | estado |
|---|---|---|
| mysha | PJ · Bruja de Sangre · Líder actual | activo |
| layra | PJ · Dracónica | activo |
| narcissa | PJ | activo |
| io-campbell | PJ · Druida, Retoño de Trent | activo |
| eryon | PJ | activo |
| david-ilcard | NPC · Compañero del grupo | activo |
| rylen | NPC · Compañero del grupo | activo |
| pilar | NPC · Compañera del grupo | activo |
| pat-pat | NPC · Compañera del grupo | activo |
| borok | Primer líder · se separó | `separado` |

Notas:
- La etiqueta visible **gana sobre `rol:` del vault** (el vault marca a
  David y Borok como PJ; Joaquín los clasifica distinto para esta vista).
- Lore del liderazgo: **la fundación fue grupal** (no de Borok). Borok fue
  el **primer líder**; el liderazgo fue rotando y hoy lidera **Mysha** (de
  ahí su etiqueta "Líder actual").
- **Borok** se renderiza desaturado, marco punteado, etiqueta
  "primer líder · se separó", y su vínculo con el grupo es una **línea cortada**:
  dos tramos punteados (dash 6/9, hasta t=0.42 de cada extremo) que no se
  tocan. Sin animación de dibujado; fade-in.
- **Familiares NO van** en el anillo (Champi aparece solo como satélite).
- **No se muestran nombres de jugadores** (no están en el vault; el mockup
  aprobado no los tiene). Posible mejora futura.

## Datos

- **Miembros**: config curada de arriba + retratos vía
  `ATLAS_V2_KNOWN_PORTRAITS` de `lib/atlas-portraits.ts` (los 10 ya están
  mapeados; fallback `ATLAS_V2_PORTRAIT_PLACEHOLDER`).
- **Edges del anillo (reposo)**: relaciones del vault entre pares de
  miembros — máx. 1 edge por par (dedupe), sin tipo visible. Borok queda
  excluido de edges normales; solo su línea cortada (curada: borok–mysha).
- **Satélites (foco)**: relaciones del miembro filtradas a tipos
  `personaje` y `faccion` (alcance decidido) + su familiar si tiene.
  Orden: recencia de episodio. Tope 8 visibles.
- **Expediente**: del frontmatter del vault vía la carga de entidad ya
  existente (la que usa `AtlasVaultEntityPage` / `cachedAtlasEntityDetail`
  en `lib/public-cache`): `nombre`, `alias`, descripción (primer párrafo),
  `apariciones.length`, etiqueta curada. Las bios del mockup eran de
  muestra; acá salen del vault.
- Helper puro y testeable `lib/te-de-media-noche.ts`:
  `buildConstellation(entidades, config) → { members, edges, cutEdges, satsByMember }`.

## Arquitectura

```
app/(atlas)/te-de-media-noche/page.tsx     # server: carga vault + config, arma props
components/atlas/AtlasConstellation.tsx    # client: anillo, foco, expediente, animaciones
lib/te-de-media-noche.ts                   # helper puro (mapeo datos → props)
data/atlas/te-de-media-noche.ts            # config curada de miembros
app/(atlas)/atlas.css                      # estilos nuevos, prefijo .av2-tdmn-*
```

- **No** se reusa `AtlasRelationsGraph` (force-directed, pan/zoom): esta
  vista es coreografiada (anillo determinista, foco scripted). Sí se reusa
  su **shape de datos** (`GraphNode`/`GraphLink`) donde aplique.
- Nav: agregar item "Té de Media Noche" en
  `components/atlas/AtlasTopNav.tsx`. ⚠️ el indicador de nav usa offsets
  hardcodeados por item en `atlas.css` (`--av2-nav-ind-x/w`) — recalcular.
- Posicionamiento por **left/top + transform translate(-50%,-50%)** en un
  stage `position:fixed/relative`; las líneas en un `<svg>` absoluto.
  (El mockup ya implementa esta mecánica; portarla.)

## Animación (timings validados en la referencia)

- Entrada nodos: scale .55→1 + fade, `0.95s`, stagger `110ms`, ease
  `cubic-bezier(.22,1,.36,1)`.
- Líneas: se **dibujan desde la fuente** (stroke-dashoffset), `1.15s`,
  stagger `95ms`. Anclaje al centro del retrato (el nombre es `absolute`,
  no desplaza el ancla). Grosor `2`.
- Idle: flote vertical ±5px, `6s`, delay negativo por nodo (desfasado).
- Reorganización reposo↔foco: left/top `0.9s`.
- Expediente: fade + scale .93→1 + translateY, `0.5s`.
- `prefers-reduced-motion`: todo a opacidad 1, sin transforms ni idle.
- Cumple GOAL.md: solo `transform`/`opacity` (left/top del stage son
  reorganizaciones puntuales, no loops), 150–300ms en micro-interacciones,
  idle sutil que no compite con lectura.

## Tamaños / estética

- Anillo: retrato 104px · centrado 156px · satélite 64px (mobile: 72/112/50).
- `object-position: 50% 22%` por defecto (caras en tercio superior);
  override por slug si alguna foto lo necesita.
- Cuadrados `border-radius: 5px` en todo (nodos, botones, tarjeta 8px).
- Facciones: sello cuadrado con sigla serif dorada sobre gradiente cobre.
- Paleta/tipos: tokens `--av2-*` existentes de `atlas.css` (Cormorant +
  Spectral + IBM Plex Mono; cobre/oro/tinta).

## Accesibilidad / varios

- Nodos = `<button>` (focuseables); `alt` descriptivo en retratos; Escape
  cierra nivel; la página funciona server-rendered con el anillo visible
  (la interacción es progressive enhancement client-side).
- Read-only, sin deps de jobs/Whisper/escritura (regla de publicación).
- SEO: `<h1>` "Té de Media Noche", metadata propia.

## Fuera de alcance (este feature)

- Chatbot/Q&A de campaña (feature aparte, sin diseñar).
- Familiares como nodos del anillo.
- Edges históricos por episodio / timeline de relaciones.
- Nombres de jugadores reales.

## Testing / aceptación

- **Unit (vitest)**: `lib/te-de-media-noche.ts` — miembros completos y en
  orden, Borok excluido de edges normales y presente en `cutEdges`, dedupe
  de edges por par, filtrado de satélites a personaje/facción, tope 8,
  fallback de retrato.
- **Visual**: comparar contra `docs/ui-v2/te-de-media-noche-reference.html`
  (desktop y mobile, p. ej. con `scripts/v2-screenshot.mjs`). No declarar
  terminado solo por build/TS.
- **Aceptación**: los 10 con retrato y nombre; Borok visiblemente
  separado (línea cortada); click→foco con líneas dibujándose; segundo
  click→expediente con datos reales del vault; click afuera/Escape cierran
  por niveles; idle presente; reduced-motion lo apaga; mobile usable.
