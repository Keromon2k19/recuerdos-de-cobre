# Recuerdos de Cobre - UI V2 Implementation Plan

> **For agentic workers:** implement this plan task-by-task. Do not delete the
> current UI. Keep the new UI isolated under `/v2`, `components/atlas-v2`, and
> `data/atlas-v2` until it is reviewed.

**Goal:** Build a new public UI version that feels like a dark fantasy
steampunk atlas/codex for Recuerdos de Cobre.

**Architecture:** Create a parallel V2 surface inside the existing Next.js App
Router project. Reuse stable data/helpers/assets where useful, but rebuild the
public visual/component layer instead of adapting old visual components that
conflict with the reference direction.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS puro, OKLCH tokens,
existing public fonts, optional Radix UI Primitives, optional Motion for React.

---

## Current Repo Facts

Observed package scripts:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run test`
- `npm run test:watch`
- `npm run typecheck`

There is no `npm run lint` script currently. If lint is added later, include it
in QA. Until then, validate with `npm run typecheck`, `npm test`, and
`npm run build`.

Current shell facts:

- Legacy public layout imports `app/(public)/public.css`.
- Active UI V2 lives under `app/(v2)/v2/` and imports `app/(v2)/v2/atlas-v2.css`.
- Public/UI V2 styles are scoped under `.atlas`.
- Fonts are loaded by the relevant route layout; verify the active route before editing.
- `app/layout.tsx` sets `data-mode` and `data-atlas-mode` before paint.
- `app/globals.css` belongs mainly to the local/admin/rdc surface.
- Tailwind exists as a dev dependency but is not the desired UI V2 styling layer.

## Strategy

Build the new UI in parallel.

Do not:

- delete the current UI
- rewrite the whole app
- migrate frameworks
- switch to Tailwind
- switch to shadcn
- connect all real lore data before the design works

Prefer:

- `/v2` routes
- `components/atlas-v2`
- `data/atlas-v2`
- mock data first
- real data integration later
- visual references stored locally under `public/assets/atlas-v2/references`

## Suggested File Structure

```txt
app/
  (public)/
    v2/
      page.tsx
      personajes/
        page.tsx
      capitulos/
        page.tsx
      mapa/
        page.tsx
      dioses/
        page.tsx
      archivos/
        page.tsx

components/
  atlas-v2/
    AtlasShell.tsx
    AtlasTopNav.tsx
    AtlasBottomDock.tsx
    AtlasPageTitle.tsx
    AtlasPanel.tsx
    AtlasFrame.tsx
    AtlasCard.tsx
    AtlasButton.tsx
    AtlasIconButton.tsx
    AtlasSearchBar.tsx
    AtlasFilterPanel.tsx
    AtlasDetailPanel.tsx
    AtlasOrnamentDivider.tsx
    AtlasEntityGrid.tsx
    AtlasChapterList.tsx
    AtlasMapViewer.tsx
    AtlasArchiveViewer.tsx

data/
  atlas-v2/
    characters.ts
    chapters.ts
    gods.ts
    locations.ts
    archives.ts

public/
  assets/
    atlas-v2/
      references/
      backgrounds/
      textures/
      ornaments/
      icons/
      portraits/
      maps/
      smoke/
      gears/
```

## Phase 1 - Repository Audit

Inspect before editing:

- `package.json`
- `app/`
- `app/(public)/`
- `app/(public)/layout.tsx`
- `app/(public)/public.css`
- `app/(v2)/v2/`
- `app/(v2)/v2/layout.tsx`
- `app/(v2)/v2/atlas-v2.css`
- `app/globals.css`
- `components/`
- `components/public/`
- `lib/`
- `data/` or `content/` if present
- `public/`
- `public/images/`
- `public/assets/`

Report:

- existing public routes
- existing data sources
- existing asset structure
- current styling architecture
- reusable helpers/components
- build/test commands
- risks

## Phase 2 - Dependencies

Recommended additions only if useful:

- Radix UI Primitives for unstyled accessible behavior:
  - Dialog
  - Tabs
  - Accordion
  - Popover
  - Tooltip
  - Select
  - Dropdown Menu
  - Scroll Area
- Motion for React for advanced animation:
  - transitions
  - layout animations
  - drawers
  - modals
  - scroll reveals
  - selected-card animation
- Fuse.js for local search, only if simple filtering is not enough.
- cmdk for command palette, only if a command palette is actually implemented.

Do not add all dependencies automatically. Add only what the implemented scope
needs and explain why.

## Phase 3 - Design Tokens

Add/refine `.atlas` scoped tokens in `app/(v2)/v2/atlas-v2.css`.

Do not edit `app/(public)/public.css` for UI V2 unless the user explicitly asks
to modify the legacy public site.

Create tokens for:

- backgrounds
- surfaces
- text
- copper/brass accents
- borders
- glow
- shadows
- spacing
- radii
- z-index
- motion durations
- focus states

The UI should have one cohesive mechanical visual language: panels, cards,
buttons, filters, navigation, and detail drawers should feel like parts of the
same atlas machine.

## Phase 4 - Core Shell

Implement:

- `AtlasShell`
- `AtlasTopNav`
- `AtlasBottomDock`
- shared background layers
- smoke/gear decorative layers
- responsive container rules

The shell must keep the current section clear and must not trap content behind
fixed navigation on mobile.

## Phase 5 - Core Components

Implement reusable components:

- panels
- frames
- cards
- buttons
- icon buttons
- search bar
- filter panel
- detail panel
- page title
- ornament divider
- entity grid
- chapter list
- map viewer
- archive viewer

Use real buttons for actions and real links for navigation. Add visible focus
states. Do not hide important text inside background images.

## Phase 6 - Mock Data

Create representative data for:

- 8 characters
- 8 chapters
- 5 locations/regions
- 6 gods
- 6 archive documents

Export TypeScript types from the mock data files. Keep long text out of layout
components.

## Phase 7 - Home

Implement `/v2`:

- cinematic layered hero
- real HTML title `Recuerdos de Cobre`
- subtitle
- CTA to latest chapter
- CTA to explore archive
- latest chapter panel
- grid of main section shortcuts
- atmospheric fallback using CSS if final assets are not ready

## Phase 8 - Main Pages

Implement in this order:

1. Personajes
2. Capitulos
3. Archivos
4. Dioses
5. Mapa/Lugares

Reason:

- Personajes validates grid/detail/filter patterns.
- Capitulos validates long text previews and metadata.
- Archivos validates document viewer UI.
- Dioses validates lore profile layout.
- Mapa is visually complex and should come after core patterns are stable.

## Phase 9 - Responsive

Validate:

- desktop at 1440px+
- laptop at 1280px
- tablet around 768px
- mobile around 390px
- no horizontal overflow
- readable text
- usable filters
- usable navigation
- detail panels that stack or become drawer/modal on small screens

## Phase 10 - Motion and Polish

Add:

- smoke drift
- glow pulse
- slow gear rotation
- panel reveals
- hover states
- active states
- selected-card transitions

Use CSS for simple decorative motion. Use Motion for React only when stateful
layout animation would otherwise become brittle.

Respect `prefers-reduced-motion`.

## Phase 11 - QA

Run:

```powershell
npm run typecheck
npm test
npm run build
```

If a lint script is added later:

```powershell
npm run lint
```

Also verify:

- keyboard navigation
- focus states
- contrast
- responsive layout
- image sizes
- no hydration errors
- no broken routes
- no horizontal overflow

## Implementation Order

- [ ] Audit current project structure and public UI files.
- [ ] Confirm dependencies and decide whether Radix/Motion are needed for the first slice.
- [ ] Copy or create minimum assets under `public/assets/atlas-v2`.
- [ ] Add `.atlas` V2 tokens and base utility classes in `app/(v2)/v2/atlas-v2.css`.
- [ ] Create mock data in `data/atlas-v2`.
- [ ] Create `components/atlas-v2` shell and core components.
- [ ] Build `/v2` home.
- [ ] Build `/v2/personajes`.
- [ ] Build `/v2/capitulos`.
- [ ] Build `/v2/archivos`.
- [ ] Build `/v2/dioses`.
- [ ] Build `/v2/mapa`.
- [ ] Run responsive and accessibility pass.
- [ ] Run typecheck, tests, and build.
- [ ] Review against the visual references before connecting real content.

## Definition of Done

- UI resembles the dark fantasy steampunk references.
- It does not look like a generic wiki or modern SaaS dashboard.
- All important content is real HTML.
- Components are reusable.
- Mock data is separated from presentation.
- Public UI rules stay scoped under `.atlas`.
- Existing routes still work.
- Reduced motion is supported.
- Typecheck, tests, and build pass.
