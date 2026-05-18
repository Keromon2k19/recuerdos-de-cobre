# DESIGN.md — Antología · Recuerdos de Cobre

> Nota de reinicio: este documento refleja una iteracion visual anterior.
> Para el objetivo actual del proyecto, leer primero `docs/GOAL.md`.
> No reconstruir "Sala de Cobre" como diseno final.

> Este documento refleja el estado final post-impeccable del sistema **Sala de Cobre**
> y reemplaza por completo al documento previo (pre-impeccable), que describía
> el diseño descartado "grimorio / Cuero Medianoche". Los valores acá
> transcritos se leyeron directamente de `app/globals.css` (bloques `:root`,
> `[data-mode="dark"]`, `[data-mode="light"]`). No aproximar: si se editan
> los tokens, actualizar también esta tabla.

## Concepto

**Sala de Cobre.** El escritorio de un archivista a medianoche: una sala honda
y oscura donde la memoria acumulada de la campaña aflora bajo una sola luz
cálida de cobre. Atmosférica, cartográfica, editorial, hecha para leer.

## Color (tokens OKLCH)

Estrategia: paleta restringida. Neutros de tinta en hue frío (~265) para todo el
lienzo y el texto, más **un único acento de cobre** en hue cálido (~58) como la
única luz de la sala. El modo oscuro es el canónico; el claro es secundario y
sobrio (no es papiro).

### Modo oscuro (canónico) — `:root, [data-mode="dark"]`

```
--rdc-paper:          oklch(0.16 0.012 265)
--rdc-paper-soft:     oklch(0.21 0.014 265)
--rdc-paper-deep:     oklch(0.255 0.015 265)
--rdc-ink:            oklch(0.93 0.012 75)
--rdc-ink-soft:       oklch(0.78 0.012 75)
--rdc-ink-faint:      oklch(0.66 0.012 75)
--rdc-rule:           oklch(0.34 0.014 265)
--rdc-rule-strong:    oklch(0.46 0.016 265)
--rdc-accent:         oklch(0.74 0.115 58)
--rdc-accent-soft:    oklch(0.80 0.12 60)
--rdc-accent-quiet:   oklch(0.30 0.045 58)
--rdc-accent-ink:     oklch(0.18 0.02 58)
--rdc-gold:           oklch(0.74 0.115 58)
--rdc-gold-soft:      oklch(0.62 0.07 58)
--rdc-card:           oklch(0.21 0.014 265)
--rdc-card-edge:      oklch(0.34 0.014 265)
--rdc-overlay:        oklch(0.10 0.01 265 / 0.66)
--rdc-success:        oklch(0.70 0.07 150)
--rdc-warn:           oklch(0.78 0.10 75)
--rdc-danger:         oklch(0.66 0.13 28)
--rdc-info:           oklch(0.70 0.05 240)
--rdc-shadow-sm:      0 1px 0 oklch(0.93 0.05 75 / 0.04) inset, 0 8px 18px -14px oklch(0.05 0.02 265 / 0.7)
--rdc-shadow-md:      0 1px 0 oklch(0.93 0.05 75 / 0.04) inset, 0 20px 45px -30px oklch(0.05 0.02 265 / 0.8)
--rdc-shadow-lg:      0 1px 0 oklch(0.93 0.05 75 / 0.05) inset, 0 36px 80px -36px oklch(0.04 0.02 265 / 0.85)
--rdc-shadow-card:    var(--rdc-shadow-md)
--rdc-shadow-page:    var(--rdc-shadow-lg)
--rdc-raise-highlight: inset 0 1px 0 oklch(0.93 0.05 75 / 0.05)
```

### Modo claro (secundario, no pergamino) — `[data-mode="light"]`

```
--rdc-paper:          oklch(0.965 0.006 75)
--rdc-paper-soft:     oklch(0.99 0.004 75)
--rdc-paper-deep:     oklch(0.94 0.007 75)
--rdc-ink:            oklch(0.24 0.015 265)
--rdc-ink-soft:       oklch(0.40 0.014 265)
--rdc-ink-faint:      oklch(0.50 0.012 265)
--rdc-rule:           oklch(0.86 0.008 75)
--rdc-rule-strong:    oklch(0.70 0.01 75)
--rdc-accent:         oklch(0.52 0.13 52)
--rdc-accent-soft:    oklch(0.46 0.135 50)
--rdc-accent-quiet:   oklch(0.93 0.04 60)
--rdc-accent-ink:     oklch(0.99 0.004 75)
--rdc-gold:           oklch(0.52 0.13 52)
--rdc-gold-soft:      oklch(0.58 0.09 52)
--rdc-card:           oklch(0.99 0.004 75)
--rdc-card-edge:      oklch(0.86 0.008 75)
--rdc-overlay:        oklch(0.24 0.015 265 / 0.45)
--rdc-success:        oklch(0.52 0.10 150)
--rdc-warn:           oklch(0.55 0.12 70)
--rdc-danger:         oklch(0.52 0.16 28)
--rdc-info:           oklch(0.50 0.09 240)
--rdc-shadow-sm:      0 1px 2px oklch(0.40 0.03 265 / 0.06), 0 6px 14px -10px oklch(0.40 0.03 265 / 0.12)
--rdc-shadow-md:      0 1px 2px oklch(0.40 0.03 265 / 0.06), 0 16px 36px -24px oklch(0.40 0.03 265 / 0.20)
--rdc-shadow-lg:      0 2px 6px oklch(0.40 0.03 265 / 0.08), 0 30px 70px -34px oklch(0.40 0.03 265 / 0.26)
--rdc-shadow-card:    var(--rdc-shadow-md)
--rdc-shadow-page:    var(--rdc-shadow-lg)
--rdc-raise-highlight: inset 0 1px 0 oklch(1 0 0 / 0.7)
```

Nota sobre `--rdc-ink-faint` (valor corregido en el pase impeccable): oscuro
`oklch(0.66 0.012 75)`, claro `oklch(0.50 0.012 265)`.

## Tipografía

Familias:

```
--rdc-display: "Fraunces", Georgia, "Times New Roman", serif
--rdc-serif:   "Literata", Georgia, serif
--rdc-mono:    "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace
--rdc-display-tracking: -0.01em
--rdc-display-weight:   600
```

Escala de tamaños:

```
--text-xs: 13px   --text-sm: 15px   --text-base: 18px  --text-lg: 22px
--text-xl: 28px   --text-2xl: 36px  --text-3xl: 48px   --text-4xl: 64px
```

Line-heights: `--lh-tight: 1.15`, `--lh-snug: 1.35`, `--lh-body: 1.7`.

Cuerpo de lectura: `--rdc-body: 18px`, `--rdc-lh: 1.7`, medida de columna
`max-width: 68ch` (texto largo, markdown body, detalle).

Eyebrow (contrato único, alineado en `.rdc-eyebrow` / `.page-eyebrow` /
`.rdc-nav-label` / `.rdc-brand .rdc-mark`): `--rdc-mono`, `--text-xs` (13px),
weight 500, `text-transform: uppercase`, `letter-spacing: 0.08em`. El glyph del
eyebrow va en `--rdc-ink-faint`, el texto en `--rdc-accent`.

## Espaciado, radios, sombras

```
--sp-1: 4px   --sp-2: 8px   --sp-3: 12px  --sp-4: 16px  --sp-6: 24px
--sp-8: 32px  --sp-12: 48px --sp-16: 64px --sp-24: 96px
```

Radios: `--rdc-radius: 8px`, `--rdc-radius-sm: 5px`, `--rdc-radius-lg: 14px`
(suaves, discretos).

Sombras tintadas de tinta (no negro puro): los tres niveles `sm/md/lg` usan
oklch frío con alpha; `--rdc-shadow-card = md`, `--rdc-shadow-page = lg`.
`--rdc-raise-highlight` es el filo de luz superior que separa el contenido del
fondo (oscuro: `inset 0 1px 0 oklch(0.93 0.05 75 / 0.05)`; claro:
`inset 0 1px 0 oklch(1 0 0 / 0.7)`).

## Profundidad y textura

`.rdc-paper` (plano de fondo, nunca detrás de texto) combina, horneado en CSS:
dos gradientes radiales OKLCH (una luz superior `at 50% -10%` y una sombra
inferior `at 50% 115%`, la viñeta de la sala) más un grano fino vía
`feTurbulence` SVG embebido (baseFrequency 0.82, tintado frío, alpha ~0.03),
sobre `var(--rdc-paper)`. El modo claro repite la receta con valores claros. Una
sola luz superior, **sin glassmorphism**: superficies sólidas, una sombra
tintada y una viñeta interior muy tenue. La barra lateral es la sala más honda;
`.rdc-main` flota un plano por encima con `--rdc-raise-highlight`.

## Movimiento

Easing (solo ease-out, sin rebote ni elasticidad):

```
--ease-out-quint:  cubic-bezier(0.22, 1, 0.36, 1)
--ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1)
--rdc-ease-out:    cubic-bezier(0.22, 1, 0.36, 1)
--rdc-ease-inout:  cubic-bezier(0.16, 1, 0.3, 1)
--rdc-ease-drawer: cubic-bezier(0.16, 1, 0.3, 1)
```

Duraciones: `--dur-micro: 120ms`, `--dur-base: 220ms`, `--dur-atmos: 420ms`.

- `.rdc-rise`: entrada "emerge de la oscuridad", solo `opacity` + `translateY(8px)`
  (GPU), `--dur-base` con `--ease-out-quint`, stagger por índice
  `calc(var(--rdc-rise-i, 0) * 30ms)`.
- Cruce de luminancia al cambiar de modo: `html, body` transiciona
  `background-color` y `color` en `--dur-atmos` con `--ease-out-quint` (atenuar
  o encender la lámpara); no pelea con la primera pintura porque el script
  anti-FOUC fija `data-mode` antes de pintar.
- `prefers-reduced-motion: reduce`: sin keyframes ni loops, transforms
  neutralizados, transiciones limitadas a `opacity` y 120ms; `.rdc-rise` y
  `.rdc-page-frame` se fuerzan a estado final (`opacity:1`, `transform:none`).

## Estructura y componentes

- **Ledgers tipográficos**, no grillas de cards: las listas son registros
  alineados; jerarquía por tipografía y reglas, no por tarjetas.
- **Detalle en dos columnas**: cuerpo a `68ch` + riel lateral sticky
  (`grid-template-columns: minmax(0, 68ch) minmax(0, 280px)`) que colapsa
  por debajo de 1100px.
- **Filtros**: dropdowns colapsados (popovers al click), no chips esparcidos.
- **EmptyState** propio (`.rdc-empty-contour`): contorno SVG tenue + una frase
  en voz de archivista, con próximo paso útil.
- **Command palette** Cmd+K.
- **Capa PUENTE**: el bloque marcado `PUENTE` en `globals.css` mapea las clases
  reales de la app Next.js (Sidebar, páginas, filtros, cola, editor, búsqueda)
  al lenguaje legacy `.rdc-*` por cascada, en vez de renombrar cada componente.
  Importante para futuros devs: las clases `.rdc-*` son el destino del puente y
  no se conmutan por edición; eliminar el puente renombrando componentes sería
  una limpieza futura, no un defecto.

## Prohibiciones absolutas (honradas)

- Sin emoji en la UI (principio del sistema).
- Sin pergamino, cuero falso ni texturas medievales.
- Sin ornamentos medievales (hederas, rombos) en separadores.
- Sin mayúsculas talladas tipo Trajan / Cinzel para display.
- Sin glassmorphism ni blur de superficies.
- Sin SaaS genérico (cobalto + crema + sans geométrico).
- Sin hero-metric (cards con números enormes).
- Sin gradientes decorativos fuera del grano y la viñeta horneados en `.rdc-paper`.
- Sin em dash ni "--" como guion en el copy del sistema.

## Auditoría

Resultado: **18/20**. Anti-patterns: **PASS**.
