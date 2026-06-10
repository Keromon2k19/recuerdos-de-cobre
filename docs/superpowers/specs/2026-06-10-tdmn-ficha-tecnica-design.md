# Spec — Ficha técnica (Foundry) en el expediente de Té de Media Noche

> Diseño validado con Joaquín el 2026-06-10 vía mockups interactivos.
> **Referencia visual aprobada:** `docs/ui-v2/te-de-media-noche-ficha-reference.html`
> (abrir en navegador; los retratos requieren `npm run dev` en :3000).
> Esa referencia manda sobre cualquier descripción textual de este spec.
> Aplica solo a **desktop** (mobile fuera de alcance por decisión de Joaquín).

## Contexto

El expediente de un PJ en `/te-de-media-noche` muestra hoy solo lore
(alias, bio, stats narrativas). Joaquín quiere sumar la **ficha técnica**
de cada personaje sacada de su hoja de **FoundryVTT** (campaña hosteada en
The Forge, sistema **D&D 5e homebrew**, `dnd5e` 5.3.2, core v13). Foundry
no tiene API de datos accesible en Forge, así que el dato entra por
**export manual de actor → JSON** (click derecho sobre el actor → *Export
Data*), parseado localmente. Encaja con el pipeline local/gratis/manual del
proyecto (mismo espíritu que `scripts/commit-manual.ts`).

## Qué se construye

1. **Tarjeta del expediente con flip.** La tarjeta (`.av2-tdmn-card`) gana
   un reverso. **Frente** = lo actual (retrato + eyebrow + nombre + alias +
   bio + stats + "Ver ficha completa"). **Reverso** = la **ficha técnica**
   (nivel "Esencial"). Un control de giro (botón accesible + leyenda
   "↻ Click para girar") alterna las caras.
2. **Pipeline de import.** Script local `npx tsx scripts/foundry-stats.ts`
   que lee los exports crudos de una carpeta gitignoreada `foundry-export/`
   y genera `data/atlas/tdmn-stats.ts` (solo los campos Esencial, por slug).
   Solo el archivo generado se commitea; los crudos no (son enormes y
   ruidosos). Joaquín re-exporta y re-corre el script cuando cambia una hoja.
3. **Campos de identidad curados.** Raza, edad y altura **no** vienen de
   Foundry (en el export están vacíos: `race: null`, height/age en blanco).
   Se cargan a mano en la config del PJ.
4. **Degrada solo.** Un PJ sin entrada en `tdmn-stats` no muestra ni el
   control de giro ni el reverso — la tarjeta queda como hoy.

## Contenido de la ficha (nivel "Esencial")

Reverso, en este orden (ver referencia):

- **Cabecera:** nombre · `Clase · Nivel N` · línea de identidad
  `<edad> años · <altura>` · chip de **raza** arriba a la derecha.
- **Vitales** (3 cajas destacadas): **CA**, **HP máx**, **Velocidad**.
- **Atributos** (grilla 6): FUE/DES/CON/INT/SAB/CAR con valor y modificador;
  los más altos resaltados en cobre.
- **Rasgos** (etiquetados): **Resistencias**, **Inmune** (daño +
  condiciones), **Sentidos** (incluye los especiales, ej. "Blood Sense 60"),
  **Idiomas**.

Mysha (datos reales de referencia): Blood Witch · Nivel 17 · Humana ·
16 años · 1,65 m · CA 17 · HP 191 · 30 ft · FUE 9(−1) DES 12(+1) CON 18(+4)
INT 19(+4) SAB 15(+2) CAR 20(+5) · Resist. frío/fuego/necrótico · Inmune
dormir · V. oscuridad 60 + Blood Sense 60 · 7 idiomas.

## Datos / extracción (dnd5e 5.3.2)

`MemberStats` (shape generado, por slug):

```ts
type Ability = { value: number; mod: number };
type MemberStats = {
  clase: string;        // nombre de la clase principal
  nivel: number;        // suma de niveles de items type "class"
  ac: number | null;    // ver derivación
  hpMax: number;
  speed: string;        // "30 ft"
  abilities: { str: Ability; dex: Ability; con: Ability; int: Ability; wis: Ability; cha: Ability };
  resistances: string[];       // etiquetas español
  damageImmunities: string[];  // etiquetas español
  conditionImmunities: string[];
  senses: string[];            // ej. ["Visión en la oscuridad 60 ft", "Blood Sense 60 ft"]
  languages: string[];         // etiquetas español
};
```

Mapeo desde el actor JSON:

- **clase/nivel:** items con `type === "class"`. `nivel` = suma de
  `system.levels`. `clase` = nombre del item cuyo `_id === details.originalClass`,
  o el primer item class si no matchea.
- **ac:** `system.attributes.ac.flat` ?? `Number(system.attributes.ac.formula)`
  si es numérico ?? `null`. (Foundry no guarda el AC derivado; para `calc`
  basado en armadura sin flat, queda `null` y se omite la caja — el archivo
  generado es revisable/editable a mano si hace falta.)
- **hpMax:** `system.attributes.hp.max`. (NO usar `hp.value`/`temp`: son
  estado en vivo del momento del export.)
- **speed:** `system.attributes.movement.walk` + `movement.units`.
- **abilities:** `system.abilities.<k>.value`; `mod = Math.floor((value-10)/2)`,
  con signo ("+4", "−1"). Resaltar (clase CSS) los atributos con
  **modificador ≥ +4** (en Mysha: CON, INT, CAR). Es presentación pura, lo
  decide el render, no el dato.
- **resistances/immunities:** `system.traits.dr.value` / `di.value` /
  `ci.value` (+ sus `.custom` separados por coma). Traducir vía tabla
  dnd5e→español (frío, fuego, necrótico, dormir, …).
- **senses:** de `system.attributes.senses.ranges` (darkvision, blindsight,
  truesight, tremorsense > 0) + `senses.special` (texto libre tal cual).
- **languages:** `system.traits.languages.value` (+ `.custom`), traducidas.

La **traducción dnd5e→español** (tipos de daño, condiciones, idiomas) y la
extracción viven en un módulo **puro y testeable** `lib/foundry-stats.ts`
(`parseFoundryActor(json) → MemberStats`, sin I/O). El script
`scripts/foundry-stats.ts` es el wrapper de I/O (lee `foundry-export/*.json`,
llama al puro, escribe `data/atlas/tdmn-stats.ts`).

## Identidad curada

Extender `TdmnMemberConfig` (en `data/atlas/te-de-media-noche.ts`) con
opcionales: `raza?: string`, `edad?: string`, `altura?: string`. Cargar al
menos Mysha (`Humana`, `16`, `1,65 m`). Ausentes → se omiten en el render.

## Arquitectura

```
foundry-export/                    # crudos, GITIGNORED (no commitear)
scripts/foundry-stats.ts           # I/O: lee crudos → escribe tdmn-stats.ts
lib/foundry-stats.ts               # puro: parseFoundryActor + tablas de traducción
data/atlas/tdmn-stats.ts           # GENERADO: Record<slug, MemberStats>
data/atlas/te-de-media-noche.ts    # + campos raza/edad/altura
lib/te-de-media-noche.ts           # ConstellationMember gana stats? + identidad
components/atlas/AtlasConstellation.tsx   # tarjeta con flip + reverso
app/(atlas)/atlas-te-de-media-noche.css   # estilos flip + .av2-tdmn-sheet-*
.gitignore                         # + foundry-export/
```

- `buildConstellation` (en `lib/te-de-media-noche.ts`) recibe además
  `TDMN_STATS` y, para cada miembro, adjunta `stats` (si existe) y la
  identidad curada (`raza/edad/altura`) a `ConstellationMember`. El page
  (`app/(atlas)/te-de-media-noche/page.tsx`) importa `TDMN_STATS` y lo pasa.
- **Reverso flip** en el componente: la card pasa a tener `.front` /
  `.back` con `transform: rotateY(180deg)` ( port del mockup). El giro es
  estado local (`flippedSlug` o un bool junto a `expanded`). Al cerrar el
  expediente, vuelve al frente.
- **Control de giro:** botón focuseable (no "click en toda la card", para
  no chocar con el link "Ver ficha completa" ni el botón cerrar). Solo se
  renderiza si el miembro tiene `stats`.
- **prefers-reduced-motion:** sin rotación 3D — intercambio instantáneo de
  caras (o cross-fade), consistente con el resto de la página.
- **Altura de la card:** ambas caras comparten `min-height` (la cara más
  alta manda), como en la referencia (~368px), para que el flip no salte.

## Fuera de alcance

- Cálculo completo de AC para `calc` no-custom (best-effort; se omite o se
  edita a mano).
- Conjuros/slots, objetos, pericias, salvaciones (eran "Hoja compacta", no
  "Esencial").
- Stats de eventos (veces que cayó en combate, etc.) — no están en el actor.
- Sincronización automática con Forge / API en vivo.
- Mobile.

## Testing / aceptación

- **Unit (vitest) sobre `lib/foundry-stats.ts`** con un fixture de actor
  (recortado de Mysha): clase+nivel correctos, suma de niveles multiclase,
  modificadores con signo, `hpMax` (no el value en vivo), AC desde
  flat/formula y `null` cuando no deriva, traducción de
  daños/condiciones/idiomas, sentidos especiales preservados, degradación
  (actor sin un campo → array vacío, no crash).
- **Visual** contra `docs/ui-v2/te-de-media-noche-ficha-reference.html`
  (desktop): orden del reverso, vitales destacados, atributos resaltados,
  rasgos etiquetados, leyenda de giro debajo sin pisar texto.
- **Aceptación:** Mysha muestra el flip con su ficha real; el giro va y
  vuelve; cerrar el expediente resetea al frente; un PJ sin export no
  muestra control ni reverso; `prefers-reduced-motion` desactiva la
  rotación; `npx vitest run` y `npx tsc --noEmit` en verde.
