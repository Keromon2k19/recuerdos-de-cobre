# Recuerdos de Cobre - UI V2 Reference Index

## Purpose

These images define the target visual direction for UI V2. They are not assets
to copy blindly into the interface; they are references for composition,
atmosphere, hierarchy, density, color, and interaction patterns.

## Non-Sources For UI V2

Do not use these as visual direction for UI V2 unless Joaquin explicitly asks:

- `.design-bundle/`, `.design-bundle2/`, `.design-bundle3/`
- `PRODUCT.md`
- `DESIGN.md`
- screenshots outside `public/assets/atlas-v2/references/` and
  `artifacts/screenshots/ui-v2/`
- legacy public routes under `app/(public)/`

Those files can be historical context, but the current UI V2 visual target is
the local reference set listed below.

## Local Reference Files

### Home

Path:

`public/assets/atlas-v2/references/home-reference.png`

Use for:

- oversized ceremonial title
- layered mechanical background
- smoke and large gears
- latest chapter panel
- section shortcuts
- bottom dock
- cinematic first screen

![Home reference](../public/assets/atlas-v2/references/home-reference.png)

### Personajes

Path:

`public/assets/atlas-v2/references/personajes-reference.png`

Use for:

- left filters
- character card grid
- selected character detail panel
- portrait frame
- active card state
- pagination/control treatment

![Personajes reference](../public/assets/atlas-v2/references/personajes-reference.png)

### Capitulos

Path:

`public/assets/atlas-v2/references/capitulos-reference.png`

Use for:

- chapter list
- selected chapter preview
- metadata grouping
- large media panel
- rewards/summary card style
- continue-reading CTA

![Capitulos reference](../public/assets/atlas-v2/references/capitulos-reference.png)

### Mapa

Path:

`public/assets/atlas-v2/references/mapa-reference.png`

Use for:

- framed map viewer
- region list
- map pins/labels
- bottom region detail panel
- zoom controls
- map composition and scale

![Mapa reference](../public/assets/atlas-v2/references/mapa-reference.png)

### Dioses

Path:

`public/assets/atlas-v2/references/dioses-reference.png`

Use for:

- god list
- selected deity profile
- domains
- principles panel
- sacred symbol
- sacred places
- lore quote treatment

![Dioses reference](../public/assets/atlas-v2/references/dioses-reference.png)

### Archivos

Path:

`public/assets/atlas-v2/references/archivos-reference.png`

Use for:

- archive collections
- search/filter bar
- document viewer
- metadata panel
- highlighted fragment
- pagination/reader controls

![Archivos reference](../public/assets/atlas-v2/references/archivos-reference.png)

## Asset Rules

Use assets as:

- backgrounds
- texture overlays
- smoke overlays
- gears
- ornaments
- icons
- portraits
- maps
- document previews

Do not use assets for:

- important readable text
- navigation labels
- buttons
- filters
- metadata
- form labels
- selected states

All important text must be real HTML.

## Required Asset Folders

```txt
public/assets/atlas-v2/backgrounds
public/assets/atlas-v2/textures
public/assets/atlas-v2/ornaments
public/assets/atlas-v2/icons
public/assets/atlas-v2/portraits
public/assets/atlas-v2/maps
public/assets/atlas-v2/smoke
public/assets/atlas-v2/gears
```

## Priority Assets

Minimum useful set for first implementation:

- hero background
- interior background
- copper/metal texture
- vignette overlay
- smoke overlay or smoke video
- left gear PNG
- right machinery PNG
- ornamental divider
- panel/card texture
- map without labels

## Visual Translation Notes

- The references are very dense. In production, keep the atmosphere but protect
  readability with real spacing, contrast, and responsive stacking.
- The bottom dock should help navigation or reinforce atmosphere without
  covering content.
- Map labels should be HTML/SVG overlays when possible, not baked into the map
  image, so they can be made accessible and responsive.
- Large serif titles are part of the identity, but compact panels need smaller,
  tighter headings.
- Smoke/gears/glow should be atmospheric. They should never make the UI feel
  noisy or slow.
