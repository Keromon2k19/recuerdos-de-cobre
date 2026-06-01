# Atlas V2 — QA Visual

Metodología para validar visualmente la UI V2 (`/v2`, `/v2/personajes`, etc.)
contra los viewports oficiales en CSS pixels.

## Por qué CSS pixels y no "2K" / "1080p"

Un mismo monitor físico puede reportar viewports CSS distintos según el device
pixel ratio (DPR) del sistema operativo o el escalado. Validamos contra **CSS
pixels** porque es lo que el navegador efectivamente le pasa a `@media (width)`.

- Monitor 2560×1440 físico, DPR=1   → viewport CSS = 2560×1440
- Monitor 2560×1440 físico, DPR=1.25 → viewport CSS ≈ 2048×1152
- iPhone 14 físico 1170×2532, DPR=3 → viewport CSS = 390×844

No asumas tamaños físicos. Probá en los viewports CSS definidos.

## Viewports oficiales

| Nombre                      | Width × Height | Uso                        | Prioridad |
| --------------------------- | -------------- | -------------------------- | --------- |
| `390x844_mobile`            | 390 × 844      | mobile portrait moderno    | **alta**  |
| `768x1024_tablet`           | 768 × 1024     | tablet portrait            | media     |
| `1440x900_laptop`           | 1440 × 900     | laptop estándar            | **alta**  |
| `2048x1152_desktop_2k`      | 2048 × 1152    | monitor 2K con DPR escalado | **alta** |
| `2560x1440_desktop_2k`      | 2560 × 1440    | monitor 2K físico DPR=1    | media     |

Orden de prioridad cuando hay que elegir dónde mirar primero:
1. `1440×900` — viewport más común de devs / users de laptop
2. `2048×1152` — pantallas grandes con escalado
3. `390×844` — mobile

## Breakpoints CSS en la UI V2

Para `/v2/personajes` (y página similares):

| Rango CSS              | Layout                                                    |
| ---------------------- | --------------------------------------------------------- |
| `≤ 560px`              | Stack vertical · grid 2 cols · filtros plegados arriba    |
| `561–820px`            | Filtros (200px) + grid 4 cols · detail abajo full-width   |
| `821–1100px`           | Filtros (200px) + grid 5 cols (3 con detail) + detail 320 |
| `1101–1799px`          | Filtros (220px) + grid 6 cols (4 con detail) + detail 360 |
| `≥ 1800px`             | max-width 1680, filtros (240px) + grid 6 cols (4 con det) + detail 400 |

Container principal (`.av2-personajes-layout`) tiene `max-width: 1440px`
(`1680px` en ≥1800), centrado con `margin-inline: auto`. Los gaps que se
ven a los costados en pantallas grandes son el fondo atmosférico, no error.

## Cómo correr el QA

### Setup (una vez)

```bash
npm install -D playwright
npx playwright install chromium
```

### Capturar screenshots

```bash
# Todas las rutas a todos los viewports
node scripts/v2-screenshot.mjs

# Solo viewports prioritarios (1440, 2048, 390)
node scripts/v2-screenshot.mjs --priority

# Rutas específicas
node scripts/v2-screenshot.mjs --routes=/v2,/v2/personajes

# Full page (no solo viewport visible)
node scripts/v2-screenshot.mjs --full-page
```

Pre-condición: dev server corriendo en `http://localhost:3000` (o seteá
`V2_BASE_URL` si está en otro puerto).

Salida: `artifacts/screenshots/ui-v2/<ruta>_<viewport>.png`.

### Verificar manualmente en DevTools

Cuando se inspecciona el viewport en DevTools responsive mode, **acordate del
DPR del sistema**: el viewport CSS reportado por DevTools puede no coincidir
con lo que tu monitor renderiza si tenés escalado Windows. Usá el script
Playwright como fuente de verdad — corre con DPR=1 explícito.

## Checklist de problemas a buscar

Por cada screenshot, validar:

- [ ] **Overflow horizontal**: ¿hay scrollbar horizontal indeseado?
- [ ] **Cards demasiado chicas o grandes**: ¿matchean el reference?
- [ ] **Cards cambiando de tamaño**: cuando se abre/cierra el detail panel,
      las cards NO deben cambiar de ancho perceptible (~190px @ 1440, ~225 @ 2K)
- [ ] **Paneles cortados**: ¿alguna columna se cortó porque la pantalla es chica?
- [ ] **Dock superpuesto al contenido**: el dock fijo no debe tapar texto
      o botones. Verificar `padding-bottom` en `.av2-shell`
- [ ] **Texto ilegible**: contraste, tamaño mínimo 11px en metadata, 14px+ en body
- [ ] **Columnas mal distribuidas**: gaps consistentes, no sobrar/faltar tracks
- [ ] **Espacio vacío sospechoso**: si hay >300px de empty space en una zona,
      verificar que sea intencional (atmósfera del bg) y no bug de layout
- [ ] **Elementos fuera del viewport**: nada importante debería requerir
      scroll horizontal o quedar oculto bajo el dock
- [ ] **Imágenes broken**: el ícono de imagen rota nunca debe aparecer.
      Los placeholders SVG (`_placeholder-1..4.svg`) cubren ese caso.
- [ ] **404 en consola**: revisar `browser_console_messages` por requests
      fallidos. Los 404 de `/portraits/{slug}.jpg` son esperados (cadena
      de fallback → SVG placeholder); cualquier otro 404 es bug.

## Workflow recomendado al iterar

1. Hacer un cambio de CSS o componente
2. Esperar al hot-reload de Next.js
3. Correr `node scripts/v2-screenshot.mjs --priority`
4. Mirar las 3 imágenes (una por viewport prioritario)
5. Si hay regresión visible → revertir o ajustar
6. Si está OK → confirmar con `node scripts/v2-screenshot.mjs` (todos los viewports)
7. Commit
