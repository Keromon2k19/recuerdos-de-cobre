# Recuerdos de Cobre - UI V2 Agent Prompts

## How To Use

Use these prompts in order:

1. UX/UI Architect: refine the design strategy before code.
2. Frontend Developer: implement the parallel V2 UI.
3. Reviewer Final: audit the implementation against the references.

The essential project rules also live in:

- `docs/rdc-ui-v2-brief.md`
- `docs/rdc-ui-v2-implementation-plan.md`
- `docs/rdc-ui-v2-reference-index.md`
- `docs/rdc-ui-v2-qa-checklist.md`

## Mandatory Visual Reference Workflow

For UI V2 visual work, the agent must use the local references before editing.

1. Open the matching reference from `public/assets/atlas-v2/references/`.
2. Open or generate the current screenshot from `artifacts/screenshots/ui-v2/`
   using `scripts/v2-screenshot.mjs`.
3. Compare reference vs current screenshot and list P0/P1/P2 gaps.
4. Edit only after the comparison.
5. Generate fresh screenshots after the edit and compare again.

Do not use `.design-bundle*`, `PRODUCT.md`, `DESIGN.md`, screenshots from the
repo parent, or legacy public routes as visual direction for UI V2 unless
Joaquin explicitly asks. Those are historical context, not the current target.

Active implementation paths:

- routes and CSS: `app/(v2)/v2/`
- main V2 CSS: `app/(v2)/v2/atlas-v2.css`
- shared components: `components/atlas-v2/`
- mock data: `data/atlas-v2/`
- V2 assets and references: `public/assets/atlas-v2/`

## Prompt 1 - UX/UI Architect

```text
Actua como un Senior UX/UI Designer y Design Systems Architect especializado en interfaces narrativas, sitios inmersivos, atlas interactivos, dark fantasy UI y estetica steampunk.

GOAL:
Disenar la estrategia UX/UI completa para una nueva version visual del sitio publico "Recuerdos de Cobre", una campana de rol con mucho texto, lore, capitulos, personajes, mapas, dioses y archivos.

El sitio debe sentirse como un atlas/codice interactivo dark fantasy steampunk, no como una wiki generica ni como un dashboard moderno.

STACK EXISTENTE:
- Next.js 15 App Router
- React 19
- TypeScript
- CSS puro
- No Tailwind
- No shadcn
- No migrar framework
- Tokens OKLCH
- Tipografias: Cormorant Garamond, Spectral, IBM Plex Mono
- app/(v2)/v2/atlas-v2.css para UI V2 bajo scope .atlas
- app/globals.css para estilos globales/panel local/rdc
- Modo claro/oscuro con data-atlas-mode y data-mode en html
- Anti-FOUC existente

ESTRATEGIA:
Crear una nueva UI publica desde cero a nivel visual/componentes, pero dentro del proyecto existente.
No borrar el proyecto actual.
No romper rutas existentes.
Preferir una ruta temporal /v2 o componentes nuevos bajo components/atlas-v2.
Usar mock data primero y conectar datos reales despues.

TECNOLOGIAS VISUALES:
Mantener CSS puro como capa principal de identidad visual.
Puede proponerse Radix UI Primitives para componentes accesibles sin estilos.
Puede proponerse Motion for React para animaciones complejas y transiciones.
CSS keyframes debe usarse para animaciones decorativas simples.
No usar Tailwind ni shadcn.

REFERENCIAS VISUALES:
Usar las imagenes provistas como referencia:
- Home
- Personajes
- Capitulos
- Mapa
- Dioses
- Archivos

DIRECCION VISUAL:
- dark fantasy steampunk
- cobre envejecido
- bronce
- metal oxidado
- humo
- engranajes
- arquitectura gotica industrial
- paneles oscuros
- marcos ornamentales
- navegacion inmersiva
- tipografia serif elegante
- detalles mecanicos
- brillo ambar sutil

REGLAS:
- No usar sidebar tradicional tipo wiki.
- No quemar texto importante dentro de imagenes.
- Todo contenido importante debe ser HTML real.
- Reducir scroll excesivo con filtros, cards, tabs, accordions, drawers, detail panels y previews.
- Mantener responsive.
- Mantener legibilidad.
- Considerar accesibilidad y prefers-reduced-motion.

TAREA:
Inspecciona el proyecto si tenes acceso. Si no tenes acceso, trabaja como arquitecto a partir de este brief.

Entregar:

1. AUDITORIA UX/UI
- Que conviene conservar del stack.
- Que conviene reconstruir desde cero.
- Que riesgos hay.
- Que senales indicarian que una parte vieja no debe reutilizarse.

2. SISTEMA VISUAL
- Paleta OKLCH recomendada.
- Jerarquia tipografica.
- Reglas para paneles, bordes, cards, botones, iconos y fondos.
- Reglas de textura, humo, engranajes y ornamentos.
- Reglas para mantener legibilidad.

3. ARQUITECTURA DE COMPONENTES
Proponer componentes:
- AtlasShell
- AtlasTopNav
- AtlasBottomDock
- AtlasPageTitle
- AtlasPanel
- AtlasFrame
- AtlasCard
- AtlasButton
- AtlasIconButton
- AtlasSearchBar
- AtlasFilterPanel
- AtlasDetailPanel
- AtlasOrnamentDivider
- AtlasEntityGrid
- AtlasChapterList
- AtlasMapViewer
- AtlasArchiveViewer

Para cada componente explicar:
- proposito
- props sugeridas
- comportamiento
- uso en paginas

4. LAYOUTS POR PAGINA
Disenar:
- Home
- Personajes
- Capitulos
- Mapa/Lugares
- Dioses
- Archivos

Para cada pagina indicar:
- estructura visual
- interaccion principal
- componentes usados
- contenido principal
- contenido secundario
- comportamiento desktop
- comportamiento mobile
- manejo de texto largo

5. ESTRATEGIA DE DATOS
Proponer estructura de mock data y tipos TypeScript para:
- characters
- chapters
- gods
- locations
- archives

6. PLAN DE IMPLEMENTACION
Dividir en fases:
- repo audit
- tokens
- shell
- componentes core
- home
- personajes
- capitulos
- archivos
- dioses
- mapa
- responsive
- motion
- QA

7. DEFINITION OF DONE
Checklist final de calidad.

OUTPUT:
Responder en espanol.
Ser especifico y accionable.
No implementar codigo completo todavia.
No dar consejos genericos.
```

## Prompt 2 - Frontend Developer

```text
Actua como un Senior Frontend Developer especializado en Next.js 15, React 19, TypeScript, CSS architecture, design systems, accessibility, performance web y UI inmersiva dark fantasy/steampunk.

GOAL:
Implementar una nueva version visual del sitio publico "Recuerdos de Cobre" desde cero a nivel de UI/componentes, dentro del proyecto existente.

La nueva UI debe parecer un atlas/codice steampunk inmersivo, siguiendo las referencias visuales provistas:
- home
- personajes
- capitulos
- mapa
- dioses
- archivos

NO hacer una wiki generica.
NO hacer un dashboard moderno.
NO migrar el framework.
NO usar Tailwind.
NO usar shadcn.

STACK:
- Next.js 15 App Router
- React 19
- TypeScript
- CSS puro
- Tokens OKLCH
- Tipografias: Cormorant Garamond, Spectral, IBM Plex Mono
- app/(v2)/v2/atlas-v2.css para UI V2 bajo scope .atlas
- app/globals.css para global/admin/local styles
- Modo claro/oscuro con data-atlas-mode y data-mode en html
- Anti-FOUC existente

NUEVAS HERRAMIENTAS PERMITIDAS:
Puedes agregar Radix UI Primitives si necesitas comportamiento accesible sin estilos:
- Dialog
- Tabs
- Accordion
- Popover
- Tooltip
- Select
- Dropdown Menu
- Scroll Area

Puedes agregar Motion for React si necesitas:
- transiciones
- layout animations
- drawers
- modals
- scroll reveals
- cambios de seleccion animados

Usar CSS keyframes para:
- engranajes girando
- humo moviendose
- glow pulse
- background drift
- hover simple

No agregues dependencias pesadas sin justificar.

ESTRATEGIA:
No borres el sitio actual.
No rompas rutas existentes.
Crear nueva UI en paralelo, preferentemente:
- app/(v2)/v2/page.tsx
- app/(v2)/v2/personajes/page.tsx
- app/(v2)/v2/capitulos/page.tsx
- app/(v2)/v2/mapa/page.tsx
- app/(v2)/v2/dioses/page.tsx
- app/(v2)/v2/archivos/page.tsx

Crear componentes nuevos bajo:
- components/atlas-v2/

Crear mock data bajo:
- data/atlas-v2/

Crear assets bajo:
- public/assets/atlas-v2/

REGLAS DE DISENO:
- Texto importante siempre en HTML real.
- No quemar botones, labels, titulos o metadata en imagenes.
- Usar imagenes solo como fondo, textura, retratos, mapas, humo, engranajes y ornamentacion.
- Evitar sidebar tradicional.
- Mantener navegacion superior ornamental y/o dock inferior.
- Reducir scroll excesivo con cards, filtros, tabs, accordions, detail panels y previews.
- UI responsive.
- Accesible.
- Soportar prefers-reduced-motion.

FASE 1 - AUDITAR ANTES DE EDITAR:
Inspecciona:
- package.json
- app/
- app/(public)/
- app/(v2)/v2/atlas-v2.css
- app/globals.css
- components/
- data/ o content/
- public/assets/

Antes de modificar, responde con:
- rutas actuales encontradas
- componentes relevantes
- CSS relevante
- datos relevantes
- assets disponibles
- dependencias actuales
- riesgos
- plan de archivos a crear/modificar

FASE 2 - CREAR ESTRUCTURA:
Crear, si no existen:

components/atlas-v2/
- AtlasShell.tsx
- AtlasTopNav.tsx
- AtlasBottomDock.tsx
- AtlasPageTitle.tsx
- AtlasPanel.tsx
- AtlasFrame.tsx
- AtlasCard.tsx
- AtlasButton.tsx
- AtlasIconButton.tsx
- AtlasSearchBar.tsx
- AtlasFilterPanel.tsx
- AtlasDetailPanel.tsx
- AtlasOrnamentDivider.tsx
- AtlasEntityGrid.tsx
- AtlasChapterList.tsx
- AtlasMapViewer.tsx
- AtlasArchiveViewer.tsx

data/atlas-v2/
- characters.ts
- chapters.ts
- gods.ts
- locations.ts
- archives.ts

app/(v2)/v2/
- page.tsx
- personajes/page.tsx
- capitulos/page.tsx
- mapa/page.tsx
- dioses/page.tsx
- archivos/page.tsx

FASE 3 - CSS/TOKENS:
En app/(v2)/v2/atlas-v2.css, bajo scope .atlas:
- crear/refinar tokens OKLCH
- fondo profundo
- surfaces
- copper/brass accents
- text colors
- borders
- glow
- shadows
- focus states
- motion durations
- panel styles
- buttons
- cards
- page titles
- nav
- bottom dock
- responsive
- reduced motion

FASE 4 - MOCK DATA:
Crear datos representativos para:
- 8 personajes
- 8 capitulos
- 5 lugares/regiones
- 6 dioses
- 6 documentos de archivo

Deben tener tipos TypeScript exportados.

FASE 5 - HOME:
Implementar /v2:
- AtlasShell
- hero por capas
- titulo real "Recuerdos de Cobre"
- subtitulo
- CTA a ultimo capitulo
- CTA a explorar archivo
- panel ultimo capitulo
- grid de accesos principales
- atmosfera steampunk con assets si existen; si no, usar CSS gradients/textures como fallback

FASE 6 - PERSONAJES:
Implementar /v2/personajes:
- titulo central
- filtros por rol/faccion/origen/estado
- busqueda
- grilla de personajes
- card activa
- detail panel
- CTA a ficha completa
- responsive mobile con detail panel apilado o drawer/modal

FASE 7 - CAPITULOS:
Implementar /v2/capitulos:
- lista de capitulos
- capitulo activo destacado
- imagen/preview
- metadata
- resumen
- personajes principales
- CTA continuar lectura
- paginacion o selector de arco si aplica

FASE 8 - ARCHIVOS:
Implementar /v2/archivos:
- colecciones
- busqueda
- filtros
- viewer de documento
- metadata
- tags
- fragmento destacado

FASE 9 - DIOSES:
Implementar /v2/dioses:
- lista de dioses
- perfil seleccionado
- dominios
- principios
- simbolo sagrado
- lugares sagrados
- cita/lore

FASE 10 - MAPA:
Implementar /v2/mapa:
- mapa central
- si hay mapa sin nombres, usarlo como imagen base
- pins/labels como overlay HTML/SVG si es practico
- lista de regiones
- panel contextual de region seleccionada
- controles simples visuales de zoom/pan solo si no complican demasiado
- responsive

FASE 11 - MOTION:
Agregar motion sutil:
- background drift
- smoke drift
- slow gear rotation
- glow pulse
- hover/active transitions
- detail panel transition

Respetar:
- prefers-reduced-motion

FASE 12 - QA:
Ejecutar:
- npm run typecheck
- npm test
- npm run build

Si existe script de lint, ejecutar tambien:
- npm run lint

Verificar:
- no TypeScript errors
- no hydration errors
- no overflow horizontal
- focus states visibles
- responsive
- contraste
- performance razonable

OUTPUT FINAL:
Entregar:
- resumen de implementacion
- archivos creados/modificados
- dependencias agregadas y por que
- como probar localmente
- que queda pendiente
- riesgos o decisiones abiertas
```

## Prompt 3 - Reviewer Final

```text
Actua como Senior UX/UI Reviewer, Frontend QA Engineer y Design Systems Auditor.

GOAL:
Revisar la implementacion de UI V2 para "Recuerdos de Cobre" comparandola con las referencias visuales dark fantasy steampunk.

Revisa:

1. Fidelidad visual
- Se parece a las referencias?
- Mantiene estetica cobre/bronce/oscura?
- Evita verse como dashboard moderno?
- Evita verse como wiki generica?
- Los ornamentos ayudan o ensucian?

2. UX
- La navegacion es clara?
- El usuario entiende donde esta?
- Las paginas reducen scroll innecesario?
- Los filtros y paneles realmente ayudan?
- El contenido largo esta bien fragmentado?

3. UI
- jerarquia visual
- espaciado
- contraste
- legibilidad
- consistencia de cards/panels/buttons
- estados hover/active/focus
- consistencia tipografica

4. Responsive
- desktop
- laptop
- tablet
- mobile
- no overflow horizontal

5. Accesibilidad
- HTML semantico
- foco visible
- navegacion por teclado
- aria cuando corresponde
- decorative images con alt vacio/aria-hidden
- prefers-reduced-motion

6. Performance
- tamano de assets
- uso de imagenes
- videos decorativos
- animaciones
- posibles layout shifts
- posibles hydration errors

7. Codigo
- componentes reutilizables
- CSS mantenible
- tokens consistentes
- datos separados de presentacion
- no hardcode innecesario de texto largo

Entregar:
- problemas criticos
- mejoras importantes
- mejoras opcionales
- archivos/componentes especificos a tocar
- checklist antes de mergear
```

## Skills Rule For Claude Code

```text
If Claude Code skills are available, inspect them and use only the relevant ones.
Do not assume they exist.
Do not rely on skills if the work can be completed directly.
If a skill conflicts with this project brief, follow this project brief.
```

## Skills Rule For Codex

```text
If Codex skills are available, inspect them with the available skill mechanism and use only relevant skills.
Do not assume Claude Code skills are available in Codex.
Treat Claude Code skills and Codex skills as tool-specific unless the repository explicitly contains shared instructions.
If a skill conflicts with this project brief, follow this project brief for UI V2 work.
```
