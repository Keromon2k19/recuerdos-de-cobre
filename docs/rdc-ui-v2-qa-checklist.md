# Recuerdos de Cobre - UI V2 QA Checklist

## Build

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] no TypeScript errors
- [ ] no missing imports
- [ ] no hydration errors
- [ ] if a lint script exists later, `npm run lint` passes

## Visual Fidelity

- [ ] correct page reference opened from `public/assets/atlas-v2/references/`
- [ ] current screenshot opened from `artifacts/screenshots/ui-v2/` or freshly generated
- [ ] reference vs current screenshot compared before editing
- [ ] P0/P1/P2 visual gaps written down before editing
- [ ] UI resembles the provided steampunk references
- [ ] dark fantasy copper/brass tone is consistent
- [ ] not a generic dashboard
- [ ] not a generic wiki
- [ ] typography hierarchy is strong
- [ ] panels/cards/buttons share one visual language
- [ ] ornaments are subtle, not noisy
- [ ] decorative smoke/gears/glow reinforce atmosphere without blocking content

## UX

- [ ] user can understand the current section
- [ ] top nav is clear
- [ ] bottom dock is useful or decorative without blocking
- [ ] filters are usable
- [ ] search is usable
- [ ] selected entities have clear active state
- [ ] content-heavy pages avoid excessive scroll
- [ ] long text is chunked into panels, tabs, accordions, previews, or drawers
- [ ] CTAs have clear destinations

## Accessibility

- [ ] semantic HTML
- [ ] buttons are buttons, links are links
- [ ] visible focus states
- [ ] keyboard navigation works
- [ ] contrast is readable
- [ ] reduced motion supported
- [ ] decorative images use empty `alt` and/or `aria-hidden`
- [ ] controls have accessible names
- [ ] dialogs/drawers trap focus only when appropriate

## Responsive

- [ ] desktop works at 1440px+
- [ ] laptop works at 1280px
- [ ] tablet works around 768px
- [ ] mobile works around 390px
- [ ] no horizontal overflow
- [ ] filters collapse on mobile
- [ ] detail panels become drawer/modal or stack properly
- [ ] bottom dock does not obscure primary actions
- [ ] long names wrap cleanly

## Performance

- [ ] images use suitable formats and dimensions
- [ ] no huge uncompressed assets in critical views
- [ ] decorative videos are optional, muted, and non-blocking
- [ ] animations do not cause layout thrashing
- [ ] no excessive JavaScript for purely decorative effects
- [ ] page loads remain usable without final decorative assets

## Content Architecture

- [ ] mock data is separated from components
- [ ] components are ready for real campaign data
- [ ] no long lore text hardcoded directly into layout components
- [ ] page structures can scale to many chapters, characters, gods, locations, and documents
- [ ] important text remains selectable/searchable HTML

## Code Maintainability

- [ ] `components/atlas-v2` components have clear responsibilities
- [ ] CSS is scoped under `.atlas`
- [ ] V2 styles do not leak into local/admin surfaces
- [ ] tokens are reused instead of repeating raw colors everywhere
- [ ] new dependencies are justified
- [ ] no unrelated refactors are bundled into UI V2

## Pre-Merge Checklist

- [ ] compare each V2 page against its reference image
- [ ] do not use `.design-bundle*`, `PRODUCT.md`, `DESIGN.md`, or legacy public UI as visual references for UI V2
- [ ] generate fresh screenshots after visual edits with `scripts/v2-screenshot.mjs`
- [ ] run the build commands
- [ ] inspect desktop and mobile manually
- [ ] test keyboard navigation
- [ ] test reduced motion
- [ ] list unresolved visual/content decisions
