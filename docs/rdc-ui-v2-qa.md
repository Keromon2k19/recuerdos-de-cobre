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
