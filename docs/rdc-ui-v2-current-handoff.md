# Recuerdos de Cobre - UI V2 Current Handoff

## Estado actual

Claude se quedo sin tokens durante la fase de QA visual. Codex continua desde
el workspace local.

La UI V2 vive en:

- `app/(v2)/v2/`
- `components/atlas-v2/`
- `data/atlas-v2/`
- `public/assets/atlas-v2/`
- `artifacts/screenshots/ui-v2/`

## Decisiones aceptadas

- Para UI V2 visual, no usar `.design-bundle*`, `PRODUCT.md`, `DESIGN.md` ni
  screenshots legacy como referencia. Usar primero
  `public/assets/atlas-v2/references/` y despues screenshots actuales en
  `artifacts/screenshots/ui-v2/`.
- `/v2` Home queda cerrada por ahora.
- No se reintroduce top nav en Home: la navegacion primaria es el bottom dock.
- El titulo de Home en tres niveles (`Recuerdos` / `de` / `Cobre`) queda aceptado.
- Home no busca copiar pixel-perfect la referencia; debe mantener el tono dark fantasy steampunk.
- No conectar datos reales del vault todavia salvo que se pida expresamente.
- No agregar motion todavia; primero QA visual pagina por pagina.

## Home

Estado: cerrado por ahora.

Capturas relevantes:

- `artifacts/screenshots/ui-v2/qa_home_iter3_1440x900.png`
- `artifacts/screenshots/ui-v2/qa_home_iter3_390x844.png`

Archivos tocados por la ultima iteracion de Home:

- `app/(v2)/v2/page.tsx`
- `app/(v2)/v2/atlas-v2.css`

Notas:

- El hero tiene titulo metalico, eyebrow narrativo `Antologia - Tomo I`, panel de ultimo capitulo y shortcuts.
- El bottom dock es la navegacion principal.
- Ajuste posterior 2026-05-27: el dock debe mantener iconos respirados, con separacion amplia entre medallones. No volver al gap compacto.
- Ajuste posterior 2026-05-27: el panel de ultimo capitulo usa la imagen panoramica como capa visual dominante del lado derecho, con fade oscuro hacia la izquierda para sostener la lectura del texto.
- Quedan polish menores para mas adelante, pero no bloquean pasar a otra pagina.

## Playwright / screenshots

Se instalo Playwright local:

- `npm install -D playwright`

Tambien se instalo el navegador Chromium gestionado por Playwright:

- `npx playwright install chromium`

El script `scripts/v2-screenshot.mjs` fue actualizado para permitir usar Edge o Chrome instalado:

```powershell
$env:V2_BROWSER_CHANNEL="msedge"; node scripts/v2-screenshot.mjs --priority
$env:V2_BROWSER_CHANNEL="chrome"; node scripts/v2-screenshot.mjs --priority
```

El script espera rutas con `=`:

```powershell
node scripts/v2-screenshot.mjs --priority --routes=/v2/personajes
```

## Capturas frescas de Personajes

Comando usado:

```powershell
$env:V2_BROWSER_CHANNEL='msedge'; node scripts/v2-screenshot.mjs --priority --routes /v2/personajes
```

Nota: por usar `--routes /v2/personajes` sin `=`, el script capturo todas las rutas prioritarias. Los archivos utiles para Personajes son:

- `artifacts/screenshots/ui-v2/v2_personajes_390x844_mobile.png`
- `artifacts/screenshots/ui-v2/v2_personajes_1440x900_laptop.png`
- `artifacts/screenshots/ui-v2/v2_personajes_2048x1152_desktop_2k.png`

Referencia:

- `public/assets/atlas-v2/references/personajes-reference.png`

## QA visual inicial de Personajes

P0:

- Mobile queda bloqueado visualmente por el panel de filtros: en 390x844 no se ve la grilla de personajes en el primer viewport y el bottom dock reduce aun mas el espacio util.

P1:

- Desktop esta demasiado limpio y generico comparado con la referencia: falta panel de detalle visible por defecto o una ficha protagonista que complete la composicion.
- Las cards usan placeholders planos; no tienen retrato/marco mecanico suficiente y se ven como prototipos.
- Los filtros ocupan demasiado protagonismo en mobile; deben colapsar o transformarse en una barra compacta.
- El page title se ve menos metalico/ornamental que la referencia.
- La composicion desktop tiene mucho vacio central y poco peso de codex mecanico.

P2:

- El brand `RdC` del header es utilitario y no tiene la presencia del monograma de referencia.
- La referencia usa paginacion/estado activo mas ceremonial; la pagina actual no lo comunica.

## Siguiente tarea exacta

Actualizacion 2026-05-27:

Personajes primera pasada P0/P1 completada.

Cambios realizados:

- `PersonajesClient` selecciona el primer personaje por defecto para abrir el panel de detalle en desktop.
- Mobile ordena el contenido como grilla -> detalle -> filtros, evitando que filtros bloqueen el primer viewport.
- Se agrego subtitulo de pagina en `app/(v2)/v2/personajes/page.tsx`.
- `av2-page-title--personajes` aplica tratamiento metalico al titulo de Personajes.
- Cards de personaje recibieron marco doble, esquinas mecanicas, overlay mas profundo y filtro de grabado.
- Placeholders SVG fueron reemplazados por siluetas abstractas de codice con textura y maquinaria, sin inventar retratos concretos.
- Mysha, Io Campbell y Annora usan assets reales disponibles en `public/assets/atlas-v2/portraits/`.
- `scripts/v2-screenshot.mjs` permite usar Edge/Chrome instalado con `V2_BROWSER_CHANNEL`.

Capturas after:

- `artifacts/screenshots/ui-v2/v2_personajes_390x844_mobile.png`
- `artifacts/screenshots/ui-v2/v2_personajes_1440x900_laptop.png`
- `artifacts/screenshots/ui-v2/v2_personajes_2048x1152_desktop_2k.png`

Verificacion:

- `npm run typecheck` paso.
- `npm test` paso: 57 tests.

Estado:

- `/v2/personajes` puede considerarse cerrado para primera pasada visual.
- Queda como polish futuro reemplazar mas placeholders por retratos reales cuando existan assets confirmados.
- `/v2/capitulos` fue la siguiente pagina trabajada.

## Capitulos

Actualizacion 2026-05-27:

Capitulos primera pasada P0/P1 completada.

Incidente resuelto:

- Las primeras capturas mostraban un engranaje negro gigante porque el dev server tenia CSS/JS de `/_next/static` en 404 despues de quedar `.next` corrupto. Se reinicio `next dev`, se limpio `.next` y se verifico la ruta real en `http://localhost:3000/v2/capitulos`.

Cambios realizados:

- `app/(v2)/v2/capitulos/page.tsx` usa `av2-page-title--capitulos` y subtitulo narrativo.
- `data/atlas-v2/chapters.ts` usa el asset atmosferico `public/assets/atlas-v2/backgrounds/hero.png` como escena temporal.
- `app/(v2)/v2/atlas-v2.css` recibio tratamiento metalico para el titulo de Capitulos.
- El preview de capitulo paso a composicion desktop de dos columnas: texto/meta/CTA a la izquierda, escena y recompensas a la derecha.
- La lista lateral recibio numeros circulares, estado activo mas mecanico, marco e iluminacion cobre.
- La CTA y recompensas quedaron dentro del viewport de 1440 sin ser cortadas por el dock.
- Responsive: debajo de 1100px el preview vuelve a stack; mobile mantiene lista y preview apilados sin overflow horizontal.

Capturas after:

- `artifacts/screenshots/ui-v2/qa_capitulos_after_390x844.png`
- `artifacts/screenshots/ui-v2/qa_capitulos_after_1440x900.png`
- `artifacts/screenshots/ui-v2/qa_capitulos_after_2048x1152.png`

Verificacion:

- `npm run typecheck` paso.
- `npm test` paso: 57 tests.
- `npm run build` paso.
- `npm run lint` no existe en `package.json`; `next build` completo paso.

Estado:

- `/v2/capitulos` puede considerarse cerrado para primera pasada visual.
- La escena usa un asset temporal reutilizado; queda como polish futuro reemplazarla por una imagen especifica de ciudad/capitulo si aparece un asset mejor.
- Siguiente pagina recomendada: `/v2/archivos`, siguiendo el mismo proceso screenshots before -> P0/P1/P2 -> implementar P0/P1 -> screenshots after.

## No tocar todavia

- No rehacer Home.
- No conectar datos reales del vault.
- No agregar Motion for React.
- No trabajar en Archivos, Mapa, Dioses, Facciones o Buscar hasta que se pida la siguiente pagina.
