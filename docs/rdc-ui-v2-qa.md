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
