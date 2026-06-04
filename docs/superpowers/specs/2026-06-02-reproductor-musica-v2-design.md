# Diseño — Reproductor de música ambiente (UI V2)

Fecha: 2026-06-02
Estado: aprobado (pendiente revisión final del usuario antes del plan)

## Objetivo

Incorporar a la antología pública (UI V2) las 9 canciones que el grupo usó en la
campaña, como **música de fondo discreta** que el usuario pueda **reproducir,
pausar, reanudar y regular en volumen**. El control no debe resaltar ni competir
con el contenido; nada debe autoarrancar ni cambiar solo.

## Decisiones tomadas (brainstorming)

1. **Fuente de audio: archivos locales.** Se extrae el audio de cada video de
   YouTube con yt-dlp + ffmpeg y se guarda como `.mp3` en
   `public/assets/atlas-v2/music/`. Reproducción con `<audio>` HTML5 nativo:
   control real de volumen/pausa, sin anuncios, sin saltos, sin dependencia de
   red. (El usuario asumió explícitamente la consideración de copyright para un
   sitio privado de la mesa.)
2. **Comportamiento: lista manual.** Un único reproductor global; el usuario
   elige qué pista suena. Se mantiene entre páginas. Loop opcional. No hay
   cambio automático de tema según la sección (descartado "contextual" e
   "híbrido" para no resaltar y ser predecible).
3. **Ubicación: ícono en el TopNav** junto a Buscar, que abre un popover.
4. **Sin autoplay:** restaura selección y volumen al recargar, pero arranca en
   pausa (política de browsers + pedido explícito).

## Alcance

Dentro de alcance:
- Componente reproductor global en UI V2.
- Data de las 9 pistas.
- Script de extracción de audio.
- CSS del control y popover, coherente con `atlas-v2.css`.

Fuera de alcance (YAGNI):
- Cambio de tema contextual por página/arco.
- Cola/playlist con reordenamiento, ecualizador real, letras, visualizaciones.
- Reproductor en la UI legacy (`(public)` / `(local)`); esto es solo V2.
- Streaming o embed de YouTube.

## Arquitectura

La UI V2 se monta así: `app/(v2)/v2/layout.tsx` → `AtlasShell` → `AtlasTopNav` +
`<main>`. El layout **no se desmonta** al navegar entre páginas de `/v2`, así que
un `<audio>` montado ahí persiste y sigue sonando sin cortes.

### Componentes / archivos

**1. `components/atlas-v2/AtlasMusicPlayer.tsx`** (client component, nuevo)
- Responsabilidad única: ser el reproductor global. Posee el elemento `<audio>`,
  el estado de reproducción y la UI de control (botón-ícono + popover).
- Se renderiza **dentro del TopNav**, en la fila de la barra, a la derecha de
  Buscar. Para eso `AtlasTopNav` lo importa y lo coloca al final de
  `.av2-nav-menu` (o en un contenedor de acciones a la derecha).
- Estructura interna:
  - `<audio ref preload="auto" />` (sin `controls`, oculto).
  - Botón-ícono (`aria-label="Música"`, `aria-expanded`, `aria-haspopup`). Ícono
    de nota/ondas monocromo (`--av2-ink-soft`), hover `--av2-copper-hi`. Cuando
    `isPlaying`, muestra 3 barras animadas (ecualizador) en `--av2-copper`.
  - Popover (`role="dialog"`/menú, `hidden` cuando cerrado): título "Música de la
    mesa", lista de pistas, y fila de controles.
- Estado (React `useState` + `useRef` al `<audio>`):
  - `currentSlug: string` (pista seleccionada).
  - `isPlaying: boolean`.
  - `volume: number` (0–1, default `0.35`).
  - `loop: boolean` (default `true`, loop de la pista actual = ambiente).
  - `open: boolean` (popover).
- Persistencia en `localStorage` (clave `rdc.v2.music`): `{ currentSlug, volume,
  loop }`. **No** se persiste `isPlaying=true` para autoarrancar: al montar se
  restaura selección + volumen + loop y queda en pausa.
- Efectos:
  - Al cambiar `currentSlug`: setear `audio.src` y, si `isPlaying`, `audio.play()`.
  - Al cambiar `volume`/`loop`: reflejar en el elemento `<audio>` y persistir.
  - Cierre del popover con `Escape` y click afuera (mismo patrón que
    `AtlasTopNav`: listener `pointerdown` + `keydown`).
  - `audio.play()` puede rechazar (gesto del usuario): se hace en respuesta a
    click, así que es seguro; igual se envuelve en `.catch()` para no romper.

**2. `data/atlas-v2/music.ts`** (nuevo)
```ts
export type MusicTrack = {
  slug: string;        // id estable, nombre de archivo
  title: string;       // título mostrado
  context: string;     // subtítulo (arco/lugar), en --av2-mono
  src: string;         // /assets/atlas-v2/music/<slug>.mp3
  sourceUrl: string;   // URL YouTube original (atribución)
};

export const MUSIC_TRACKS: MusicTrack[] = [ /* 9 entradas, ver tabla */ ];
```

Pistas (títulos editables por el usuario más adelante):

| slug | title | context | sourceUrl (video id) |
|------|-------|---------|----------------------|
| apertura | Apertura de partida | Tema de inicio | 2N2EeZ3oWrw |
| santuario-libres | Santuario de los Libres | Lugar | TJuPBBw-l-M |
| metropolis-cobre | Metrópolis de Cobre | Lugar | WAsFGJAmVHY |
| arco-io | Arco de Io | Personaje | scTUgxmvzW0 |
| wendigo | Wendigo | Criatura / arco | VrMK1w-qyhY |
| arco-narcissa | Arco de Narcissa | Personaje | RuYC6U3LBRs |
| arco-borok | Arco de Borok | Personaje | IehDebm--P0 |
| underdark | Underdark | Lugar | fA8j3wOVzcw |
| syltris | Syltris | Lugar / personaje | eU0aaq5pjnQ |

**3. `scripts/v2-fetch-music.mjs`** (nuevo, on-demand, no corre en build)
- Toma la lista (slug + video id) desde el propio script o importando los datos.
- Por cada pista, si el `.mp3` no existe ya (idempotente), corre:
  `yt-dlp -x --audio-format mp3 --audio-quality 5 -o "<slug>.%(ext)s" <url>`
  y luego normaliza loudness con ffmpeg (`loudnorm`) para que todas suenen
  parejo y a volumen contenido. Salida a `public/assets/atlas-v2/music/`.
- Reusa `cookies.txt` del repo si hace falta para algún video.
- Total estimado ~30–45 MB. Decisión de versionado (commit vs gitignore + subir
  al deploy) se confirma en el plan; por defecto se versiona en `public/` para
  que el deploy los sirva.

**4. CSS — bloque `av2-music-*` en `app/(v2)/v2/atlas-v2.css`**
- Botón ícono, popover, lista de pistas (activa en `--av2-copper`, indicador
  "sonando"), slider de volumen estilizado, toggle de loop, y el ecualizador
  animado (`@keyframes`), todo con tokens existentes (`--av2-bg-panel`,
  `--av2-rule-copper`, `--av2-mono`, `--av2-ease`, `--av2-dur`, `--av2-r`).
- Responsive: en mobile el popover ocupa casi todo el ancho (o bottom sheet).

## Flujo de datos

1. Usuario abre el popover → ve `MUSIC_TRACKS`.
2. Click en una pista → `currentSlug` = esa, `audio.src` se setea, `audio.play()`,
   `isPlaying=true`. Persiste `currentSlug`.
3. Play/pausa → `audio.play()/pause()`, refleja `isPlaying`.
4. Volumen → `audio.volume`, persiste.
5. Loop → `audio.loop`, persiste.
6. Navegación entre páginas de `/v2` → el componente no se desmonta → sigue
   sonando.
7. Reload → restaura `currentSlug`/`volume`/`loop` desde `localStorage`, pausa.

## Manejo de errores / casos borde

- `localStorage` ausente o corrupto → defaults (volume 0.35, loop true, primera
  pista, pausa). Lectura envuelta en try/catch.
- `audio.play()` rechazado por el browser → `.catch()` silencioso; el botón
  vuelve a estado pausa.
- Archivo de audio faltante (`error` del `<audio>`) → marcar la pista como no
  disponible en la lista; no romper el resto.
- SSR: el componente es client (`"use client"`); el acceso a `localStorage` va en
  `useEffect`, no en render, para no romper hidratación.
- `prefers-reduced-motion: reduce` → ecualizador congelado en estado final;
  transiciones limitadas a opacidad.

## Accesibilidad

- Botón con `aria-label`, `aria-expanded`, `aria-haspopup`.
- Popover navegable por teclado; cierre con `Escape`; foco manejado de forma
  coherente con los dropdowns del TopNav.
- Slider de volumen con `<input type="range">` etiquetado (`aria-label`).
- Estado "sonando" comunicado también por texto, no solo por color.

## Testing / verificación

- TypeScript compila sin errores; no se rompen rutas existentes.
- Protocolo visual V2 (CLAUDE.md): screenshots Playwright desktop + mobile con
  `scripts/v2-screenshot.mjs`; confirmar que el control **no resalta** ni
  desacomoda el TopNav, antes y después.
- Prueba funcional en navegador real (Playwright): reproducir, pausar, cambiar
  volumen, cambiar de pista, navegar entre páginas y confirmar continuidad,
  recargar y confirmar que queda en pausa con la selección restaurada.
- Pasar skills `impeccable`/`frontend-design` y `code-reviewer` antes de declarar
  terminado (preferencia del usuario).

## Riesgos / notas

- Copyright de la música: asumido por el usuario para uso privado de la mesa.
- Peso de los `.mp3` en el repo/deploy: vigilar; bitrate moderado + loudnorm.
- Algún video podría requerir cookies o fallar en yt-dlp: el script debe loguear
  claramente qué pista falló sin abortar el resto.
