# Recuerdos de Cobre - UI V2 Brief

## Goal

Build a new immersive public UI for **Recuerdos de Cobre**.

The website should feel like a dark fantasy steampunk atlas/codex for a
tabletop roleplaying campaign: a place to explore chapters, characters,
factions, locations, gods, maps, and archive documents.

This is a visual/component reset inside the existing Next.js project, not a
framework migration and not a rewrite of the whole app.

## Visual Identity

Keywords:

- dark fantasy
- steampunk
- gothic industrial
- antique copper
- aged brass
- oxidized metal
- smoke
- gears
- machinery
- memory
- mystery
- cinematic shadows
- warm amber highlights
- elegant serif typography
- mechanical ornamentation

Avoid:

- modern SaaS dashboard
- flat minimal UI
- bright colors
- neon cyberpunk
- sci-fi holograms
- generic wiki layout
- excessive sidebars
- cartoon/anime tone

## Reference Screens

The current visual references live in:

- `public/assets/atlas-v2/references/home-reference.png`
- `public/assets/atlas-v2/references/personajes-reference.png`
- `public/assets/atlas-v2/references/capitulos-reference.png`
- `public/assets/atlas-v2/references/mapa-reference.png`
- `public/assets/atlas-v2/references/dioses-reference.png`
- `public/assets/atlas-v2/references/archivos-reference.png`

They define the target atmosphere: dark framed panels, copper/brass UI,
ornamental navigation, bottom dock, smoke, machinery, large serif titles, and
content presented as an explorable mechanical atlas.

## Layout Principles

Use:

- top ornamental navigation
- bottom dock navigation or symbolic shortcuts
- central large serif page titles
- dark framed panels
- mechanical card frames
- image previews
- contextual detail panels
- filters/search where useful
- overlays/drawers for detail
- tabs/accordions to reduce scroll
- subtle motion

Avoid:

- long uninterrupted text columns
- too many separate pages for small details
- heavy scroll dependency
- documentation-style sidebars
- decoration that blocks readability

## Typography

Use existing public fonts:

- **Cormorant Garamond**: large titles, section headings, ornamental labels.
- **Spectral**: body copy, summaries, prose.
- **IBM Plex Mono**: metadata, filters, counters, mechanical UI labels.

Titles should feel engraved and ceremonial, but all important text must remain
real HTML. Do not burn navigation labels, titles, body copy, metadata, filters,
or buttons into images.

## Color Direction

Use OKLCH CSS tokens scoped under `.atlas`.

Recommended semantic tokens:

- `--atlas-bg`
- `--atlas-bg-deep`
- `--atlas-surface`
- `--atlas-surface-strong`
- `--atlas-surface-soft`
- `--atlas-copper`
- `--atlas-copper-muted`
- `--atlas-brass`
- `--atlas-gold-muted`
- `--atlas-amber-glow`
- `--atlas-border`
- `--atlas-border-strong`
- `--atlas-text`
- `--atlas-text-muted`
- `--atlas-text-faint`
- `--atlas-danger`
- `--atlas-success`
- `--atlas-focus`

The palette should read as blackened metal, antique copper, aged brass, amber
light, parchment fragments, and smoke. Keep the UI dark without turning body
text muddy.

## Motion Direction

Motion should be subtle and atmospheric.

Use CSS keyframes for:

- slow gear rotation
- smoke drift
- glow pulse
- background drift
- hover highlights

Use Motion for React (`motion` / `motion/react`) only for:

- route or section transitions
- layout transitions
- detail panel open/close
- modal/drawer animations
- scroll reveals
- selected-card transitions

Support reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .atlas *,
  .atlas *::before,
  .atlas *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Pages

### Home

Purpose: introduce the campaign and act as the gateway to the atlas.

Must include:

- layered hero
- real HTML title `Recuerdos de Cobre`
- latest chapter panel
- shortcuts to main sections
- atmospheric background
- subtle gears/smoke/glow
- CTA buttons

### Personajes

Purpose: explore campaign characters without forcing the user into many pages.

Must include:

- page title
- filters
- search
- character grid
- active character card
- detail panel
- CTA to full profile

### Capitulos

Purpose: navigate campaign sessions/chapters.

Must include:

- chapter list
- selected chapter preview
- chapter title
- summary
- metadata
- important characters
- CTA to continue reading
- optional pagination/arcs

### Mapa / Lugares

Purpose: explore geography and regions.

Must include:

- large map viewer
- region selector
- selected location detail panel
- pins/labels as HTML/SVG overlay where practical
- map image without burned-in UI text when possible

### Dioses

Purpose: explore gods and divine lore.

Must include:

- list of gods
- selected god profile
- domains
- principles
- sacred symbol
- sacred places
- lore quote

### Archivos

Purpose: explore documents, chronicles, letters, notes, maps, relic records.

Must include:

- collections
- search
- filters
- document viewer
- metadata panel
- tags
- highlighted fragment

## Responsive Rules

Desktop:

- immersive wide layouts
- multi-panel composition
- bottom dock visible
- high-density UI acceptable if readable

Tablet:

- reduce panel count
- keep primary content central
- stack detail panels when needed

Mobile:

- compact top nav
- bottom dock optional or scrollable
- filters collapsible
- detail panel as drawer/modal or stacked section
- cards stacked
- no horizontal overflow

## Non-Negotiables

- Keep the existing project.
- Do not break existing routes.
- Do not migrate to Astro or another framework.
- Do not use Tailwind or shadcn for this UI V2.
- Use `app/(v2)/v2/atlas-v2.css` as the active UI V2 visual layer scoped under `.atlas`.
- Treat `app/(public)/public.css` as the legacy public visual layer unless a task explicitly targets it.
- Keep `app/globals.css` focused on local/admin/global app styles.
- Preserve the existing anti-FOUC pre-paint script.
- Build first with representative mock data; connect real content after the UI is approved.
