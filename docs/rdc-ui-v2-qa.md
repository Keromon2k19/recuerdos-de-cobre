# QA de la UI publica V2 de escritorio

Fecha: 2026-06-04

## Contrato validado

- `/v2` es la unica superficie publica canonica.
- El home conserva su lenguaje visual como referencia del resto de secciones.
- La pagina `Archivos` y la UI publica V1 fueron retiradas.
- `/importar`, `/procesar` y `/review` permanecen disponibles.
- En escritorio no existe scroll del documento. El contenido extenso usa scroll
  interno dentro de listas, paneles y lectores.
- Mobile queda fuera del alcance de esta fase.

## Verificacion automatizada

- `npm run typecheck`: correcto.
- `npm test`: 17 archivos y 81 pruebas correctas.
- `npm run build`: correcto.
- Auditoria de implementacion V1 y Archivos: sin consumidores restantes; solo
  se conserva la redireccion de compatibilidad `/v2/archivos -> /v2/objetos`.

## Verificacion de escritorio

`scripts/measure-scroll.mjs` midio 16 rutas representativas:

- `1440x900`: todas con `overflowPx = 0`.
- `2048x1152`: todas con `overflowPx = 0`.

Las rutas V2 representativas y las rutas locales respondieron HTTP 200. Las
rutas publicas anteriores verificadas redirigieron a V2 en un unico salto.

Las capturas de QA estan en `artifacts/screenshots/ui-v2/`.

## Nota operativa

Dos servidores `next dev` antiguos sobre el mismo repositorio competian por la
carpeta `.next` y provocaron un fallo intermitente durante `next build`. Se
detuvieron antes de la compilacion final; la build paso sin cambios adicionales
ni limpieza manual de cache.

## Piloto de elevacion visual — Objetos (2026-06-04)

Primer entregable del plan
`docs/superpowers/plans/2026-06-04-elevacion-visual-v2-fundacion-piloto.md`:
sistema/kit compartido extraido del home + Objetos elevado de punta a punta como
estandar de referencia. Rama `feat/ui-v2-elevacion`.

### Kit de primitivas

- `AtlasPageHeader`: encabezado display centrado con ornamento, gramatica del
  hero del home.
- `AtlasPageScene`: ahora compone el header y usa fondo material calido cuando no
  hay foto (`data-bg="material"`).
- `AtlasSectionHero`: variantes image/material, layout stack/inline, caption
  opcional; foco/relic iluminado.
- Catalogo de desarrollo en `/v2/kit` (no enlazado).

### Objetos (piloto)

- Mockup aprobado: variante B, expediente lateral
  (`docs/mockups/2026-06-04-objetos-*.html`).
- Indice: expediente con indice + foco del artefacto + ficha/meta + CTA.
- Ficha: relic sin caption duplicada, subtitulo corto, dossier on-system.
- Polish (impeccable): relic iluminado (glow + glifo oro), entrada del
  expediente, `prefers-reduced-motion` respetado.

### Verificacion

- `npm run typecheck`, `npm test` (17 archivos / 81 pruebas) y `npm run build`
  (23 rutas) en verde.
- Capturas a 1440/2048/2560 en `artifacts/screenshots/ui-v2/` (baseline y despues).

### Pendiente no bloqueante (P2)

- La ficha de detalle es algo densa (3 columnas); candidata a recomposicion.
- La descripcion derivada arrastra el prefijo "Ep. NN — ..." cuando no hay
  seccion "Perfil"; mejorar en `lib/atlas-v2-content.ts` (afecta a todos los
  dominios).
- Resto de dominios (Misterios, Mundo, fichas, y los que ya tenian referencia)
  en el plan siguiente, reusando el kit ya validado.

## Rollout de elevacion — avance (2026-06-05)

Casi todo el rollout completado (commits `967b941..34c4a42`):

- Expediente generalizado a **Misterios** y **Mundo** (`AtlasDomainExplorer`
  ahora sirve las 3 variantes con copy por dominio).
- **Personajes**, **Capitulos** y **Facciones** migrados a `AtlasPageScene`
  (header del sistema + fondo inmersivo); se elimino el patron `av2-p-wrap` con
  header que chocaba contra la nav.
- **Dioses** y **Buscar** ya estaban on-system (header + fondo + cuerpo propio).
- **Mapa** y **Lugares** son el visor full-bleed (`MapaClient`); se dejan como
  experiencia distinta a proposito (no se redisena el visor).

Verificacion: `typecheck`, 81 tests y `build` (24 rutas) en verde. Handoff vivo
en `docs/HANDOFF-rollout-ui-v2.md` (seccion 8 = estado actual).

## Auditoria de regresiones de layout (2026-06-05, impeccable)

Reportadas por Joaquin; medidas con `scripts/measure-scroll.mjs` (overflowPx=0 en
todas = pagina sin scroll pero listas clippeadas) y verificadas con un check de
scrollHeight/clientHeight por contenedor.

- **[P0] Listas inalcanzables** en paginas con layout propio bajo `AtlasPageScene`
  (personajes, capitulos, facciones) y en el indice del expediente
  (misterios/objetos/mundo). Causa: `AtlasPageScene` era `min-height:100dvh` sin
  ser flex column, asi que el `flex:1` de los layouts internos no resolvia y la
  lista se clippaba sin scroll. **Fix** (commit `1d2a07d`): `.av2-page-scene` =
  flex column de `height:100dvh`; `.av2-page-scene-content` = `flex:1; min-height:0;
  overflow-y:auto`; `.av2-domain-explorer` = `flex:1`. Verificado: cada lista
  larga ahora scrollea internamente (p.ej. personajes grid 18685>587, misterios
  indice 7937>536) con `pageScroll=0`.
- **[P1] Header demasiado alto** (`av2-page-header` padding `clamp(48..96px)` +
  padding-top `7.5rem` del page-scene = ~216px antes del titulo). **Fix**: header
  compacto (padding `clamp(10..20px)`, titulo `clamp(1.9..2.9rem)`, intro mas
  chica) y page-scene padding-top solo despeja la nav.
- **[P1] `/v2/lugares` y `/v2/mapa` duplicados** (ambos `MapaClient`). PENDIENTE
  de decision (galeria image-led vs. dedupe).

Verificacion: typecheck + 82 tests + build verde se mantienen.
