# PRODUCT.md — Antología · Recuerdos de Cobre

> Nota de reinicio: este documento refleja una iteracion anterior del producto.
> Para el objetivo actual del proyecto, leer primero `docs/GOAL.md`.
> No reconstruir "Sala de Cobre" como diseno final.

## Register

`product` — tool/dashboard UI. Design serves the work; it is not the product.

## What this is

Local-first lore extraction app for a single user (Joaquín, jugador de la campaña) que sigue **Recuerdos de Cobre**, una campaña TTRPG dirigida por Mates y Mazmorras (67 episodios de YouTube).

Pipeline: URL de YouTube → audio (yt-dlp) → transcript (Whisper batched, GPU local) → resumen (Gemini 2.5 Flash) → lore estructurado (Claude con tool use) → Markdown editable en disco (compatible con Obsidian).

La app es donde el usuario **navega ese lore acumulado** — episodios, personajes (~50), lugares (~13), facciones (~22), worldbuilding (~28), objetos, eventos, etc. — y dispara nuevas extracciones / encola noches de procesamiento.

## Users

**Solo Joaquín.** No hay autenticación, roles, equipos, permisos, colaboración. Es un "second brain" personal para una campaña que duró años y tiene mucho lore acumulado.

Características del usuario:
- Habla **español rioplatense**
- Es **jugador** de la campaña — usa la app para refrescar memoria entre sesiones, no para "vender" lore a terceros
- Quiere **leer y editar Markdown** rápido — la app vive sobre un vault `vault-recuerdos-de-cobre/` que también abre desde Obsidian
- Trabaja en **PC con GPU** (Whisper local) — sesiones largas, una pantalla principal grande
- Le importa la estética: pidió rediseño cuando la versión inicial le pareció "todo apretado a la izquierda"

## Brand & tono

**"Sala de Cobre" / archivista de campaña.** No SaaS. No Notion. No corporate dashboard.

La identidad es el escritorio de un archivista a medianoche: una sala honda y oscura donde la memoria acumulada de la campaña aflora bajo una sola luz cálida de cobre. Atmosférica, inmersiva, cartográfica, editorial, hecha para leer antes que para clickear. NO es pastiche medieval (sin pergamino, sin cuero falso, sin hederas ni rombos, sin mayúsculas talladas tipo Trajan o Cinzel) y NO es SaaS genérico.

- **Tono:** in-character con la campaña pero reflexivo, no entusiasta. Voz de archivista que repasa lo que el grupo vivió, no de vendedor. Frases como "menciones por episodio", "del DM". Se retira cualquier formulación medieval del tipo "registrado en el grimorio" o "códice"; se conserva la intención reflexiva de archivo.
- **Aesthetic family:** sala de archivo a medianoche. Lienzo oscuro canónico (neutros fríos, hue ~265) con una sola luz cálida de cobre (hue ~58) como único acento; variante clara secundaria, sobria, que no es papiro. Profundidad por grano OKLCH horneado + viñeta, no por ornamento. Lectura editorial en dos columnas.
- **Tipografía:** Fraunces (display) + Literata (cuerpo de lectura larga) + IBM Plex Mono (fechas, números, datos, eyebrows).

## Strategic principles

1. **Reading-first.** El 80% del tiempo el usuario está leyendo entradas largas de Markdown (canon del DM + menciones por episodio). Tipografía y comodidad de lectura > densidad de UI.
2. **Las entidades son muchas.** ~50 personajes, ~22 facciones, etc. **Navegación rápida con filtros agrupados** (no chips infinitos esparcidos) es crítica.
3. **El vault es la verdad.** La UI solo lee/escribe Markdown de disco. Ningún estado de UI debe perderse si se cierra Claude Code o se reinicia.
4. **Una sola tarea Whisper a la vez.** El pipeline es serial — la UI tiene que comunicar claramente "hay X en cola, Y procesando" sin angustiar al usuario.
5. **Idempotencia.** Todo es re-procesable. Editar/borrar entidades es seguro. Re-extraer un episodio mergea, no duplica.

## Anti-references

Cosas que **no** debería parecer la app:

- **Linear / Stripe / Vercel dashboard.** Cobalt + crema + sans serif geométrico = generic SaaS. Lo hemos rechazado explícitamente.
- **Notion clone.** Layout demasiado abierto, todo bloques arrastrables, sidebar de docs. Esta app **no es para escribir**, es para extraer y navegar.
- **Cyberpunk / neon / terminal verde.** No es D&D suficiente.
- **Whiteglove minimal Apple-esque.** El proyecto reclama textura, ornamento, atmósfera — no "menos es más" frío.
- **Material Design / "Healthcare clean".** Demasiado plano, demasiado azul.
- **Hero-metric template.** Cards grandes con números enormes ("47 personajes registrados"). La app no es métrica, es archivo.

## Reflex check — what would AI-slop look like for this?

**First-order (evitado):** "TTRPG / D&D app → UI de juego fantasy con texturas de pergamino y fuentes góticas." Pastiche barato (Papyrus, dragon clipart, botones de cuero falso). Descartado de raíz: la Sala de Cobre no usa pergamino ni ornamento medieval.

**Second-order:** "archivo de fantasía que NO es pergamino → editorial oscuro genérico con serif fina y mucho aire." El riesgo de huir del pastiche es caer en un dark mode editorial anónimo. La Sala de Cobre lo trasciende con decisiones concretas: ledgers tipográficos (no grillas de cards), una sola luz de cobre como único acento sobre neutros fríos, grano cartográfico horneado más viñeta para dar profundidad sin glassmorphism, y un layout de archivo en dos columnas con riel lateral. Disciplina tipográfica antes que decoración.

## Estado del diseño

El sistema **Sala de Cobre** está implementado y es la identidad final (estado post-impeccable):

- Tokens OKLCH completos: modo oscuro canónico + modo claro secundario, con anti-FOUC.
- Shell de archivo (barra lateral como sala honda, contenido un plano por encima) y las 7 pantallas migradas.
- Ledgers tipográficos en vez de grillas de cards; detalle en dos columnas con riel sticky; filtros en dropdowns colapsados; EmptyState propio con motivo de contorno; command palette (Cmd+K).
- Profundidad por grano OKLCH horneado + viñeta sobre `.rdc-paper`, una sola luz superior, sin glassmorphism.
- Auditoría 18/20, anti-patterns PASS.

Pendientes genuinos (nice-to-haves de bajo nivel, no bloqueantes): la capa PUENTE mapea clases reales de la app a las clases legacy `.rdc-*` por cascada en vez de renombrar los componentes; unificar esa nomenclatura sería una limpieza futura, no un defecto visual.
