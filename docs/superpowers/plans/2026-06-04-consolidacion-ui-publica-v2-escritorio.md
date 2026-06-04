# Consolidación UI pública V2 de escritorio - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar toda la antología pública en UI V2 de escritorio, eliminar Archivos, crear las páginas V2 faltantes y retirar la UI pública V1 mediante redirecciones verificadas.

**Architecture:** Mantener `/v2` como superficie pública canónica y el home actual como fuente visual. Introducir adaptadores de contenido real del vault y componentes narrativos compartidos, pero conservar una composición propia para cada dominio. Retirar V1 únicamente después de alcanzar paridad funcional y corregir todos los enlaces.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS puro bajo `.av2`, Vitest, Playwright/screenshot script, vault Markdown local.

---

## Entregas

1. Contratos de rutas y datos V2.
2. Sistema visual compartido de escritorio.
3. Mockups y aprobación de páginas nuevas.
4. Páginas índice y detalle faltantes.
5. Retiro de Archivos y limpieza de navegación/búsqueda.
6. Redirecciones, eliminación de V1 y QA final.

## Archivos principales

**Crear:**

- `lib/atlas-v2-content.ts`: adaptadores de entidad y capítulo desde el vault.
- `lib/atlas-v2-routes.ts`: rutas públicas V2 y destinos legacy.
- `components/atlas-v2/AtlasPageScene.tsx`: fondo y encabezado compartidos.
- `components/atlas-v2/AtlasNarrativeFrame.tsx`: marco narrativo compartido.
- `components/atlas-v2/AtlasEntityReader.tsx`: lector V2 de secciones y menciones.
- `components/atlas-v2/AtlasEntityDetail.tsx`: composición base con variantes por dominio.
- `components/atlas-v2/AtlasEntityIndex.tsx`: índice seleccionable con variantes.
- `app/(v2)/v2/capitulos/[num]/page.tsx`
- `app/(v2)/v2/personajes/[slug]/page.tsx`
- `app/(v2)/v2/facciones/[slug]/page.tsx`
- `app/(v2)/v2/objetos/page.tsx`
- `app/(v2)/v2/objetos/[slug]/page.tsx`
- `app/(v2)/v2/misterios/page.tsx`
- `app/(v2)/v2/misterios/[slug]/page.tsx`
- `app/(v2)/v2/mundo/page.tsx`
- `app/(v2)/v2/mundo/[slug]/page.tsx`
- `tests/atlas-v2-routes.test.ts`
- `tests/atlas-v2-content.test.ts`
- `tests/atlas-v2-search.test.ts`

**Modificar:**

- `components/atlas-v2/AtlasTopNav.tsx`
- `components/atlas-v2/AtlasDetailPanel.tsx`
- `app/(v2)/v2/facciones/FaccionesClient.tsx`
- `app/(v2)/v2/dioses/DiosesClient.tsx`
- `app/(v2)/v2/buscar/BuscarClient.tsx`
- `lib/atlas-v2-search.ts`
- `app/(v2)/v2/atlas-v2.css`
- `next.config.ts`
- `scripts/v2-screenshot.mjs`

**Eliminar al alcanzar paridad:**

- `app/(v2)/v2/archivos/`
- `data/atlas-v2/archives.ts`
- `components/atlas-v2/AtlasCollectionList.tsx`
- `components/atlas-v2/AtlasDocumentViewer.tsx`
- `components/atlas-v2/AtlasDocumentInfo.tsx`
- `app/(public)/`
- Componentes `components/public/` que queden sin consumidores.

## Task 1: Contrato canónico de rutas V2

**Files:**

- Create: `lib/atlas-v2-routes.ts`
- Create: `tests/atlas-v2-routes.test.ts`

- [ ] **Step 1: Escribir pruebas fallidas para rutas finales y destinos legacy**

La prueba debe importar `V2_ROUTES`, `LEGACY_PUBLIC_REDIRECTS` y
`isV2PublicHref`, y comprobar:

```ts
expect(V2_ROUTES.archivos).toBeUndefined();
expect(V2_ROUTES.objetos).toBe("/v2/objetos");
expect(V2_ROUTES.mundo).toBe("/v2/mundo");
expect(LEGACY_PUBLIC_REDIRECTS["/worldbuilding/:slug"])
  .toBe("/v2/mundo/:slug");
expect(isV2PublicHref("/personajes/mysha")).toBe(false);
expect(isV2PublicHref("/v2/personajes/mysha")).toBe(true);
```

- [ ] **Step 2: Ejecutar la prueba y verificar RED**

Run: `npm test -- tests/atlas-v2-routes.test.ts`

Expected: FAIL porque `lib/atlas-v2-routes.ts` todavía no existe.

- [ ] **Step 3: Implementar el contrato de rutas**

Definir rutas para home, capítulos, personajes, facciones, lugares, mapa,
dioses, objetos, misterios, mundo y buscar. No definir `archivos`.

- [ ] **Step 4: Ejecutar prueba y verificar GREEN**

Run: `npm test -- tests/atlas-v2-routes.test.ts`

Expected: PASS.

## Task 2: Adaptador de contenido real del vault

**Files:**

- Create: `lib/atlas-v2-content.ts`
- Create: `tests/atlas-v2-content.test.ts`
- Modify: `lib/vault.ts`
- Modify: `lib/public-cache.ts`

- [ ] **Step 1: Escribir pruebas fallidas para el modelo de detalle V2**

Usar un vault temporal con una entidad Markdown que tenga frontmatter,
`Perfil`, `Menciones por episodio` y relaciones. Verificar:

```ts
expect(detail.slug).toBe("carta-de-nabish");
expect(detail.kind).toBe("objeto");
expect(detail.sections.map((section) => section.kind))
  .toContain("mentions");
expect(detail.appearances).toEqual([47, 50]);
```

- [ ] **Step 2: Ejecutar prueba y verificar RED**

Run: `npm test -- tests/atlas-v2-content.test.ts`

Expected: FAIL por helper inexistente.

- [ ] **Step 3: Implementar lectura y normalización**

Crear modelos:

```ts
export type AtlasV2EntityKind =
  | "personaje"
  | "faccion"
  | "objeto"
  | "misterio"
  | "worldbuilding";

export type AtlasV2EntityDetail = {
  kind: AtlasV2EntityKind;
  slug: string;
  name: string;
  description: string;
  imageSrc?: string;
  appearances: number[];
  meta: Array<{ label: string; value: string }>;
  relations: Array<{ name: string; detail: string; episode?: number }>;
  sections: Array<{
    id: string;
    title: string;
    kind: "profile" | "mentions" | "narrative";
    markdown: string;
  }>;
};
```

Agregar una lectura por `tipo + slug` que no dependa de componentes V1.

- [ ] **Step 4: Ejecutar prueba y verificar GREEN**

Run: `npm test -- tests/atlas-v2-content.test.ts`

Expected: PASS.

## Task 3: Retirar Archivos de navegación y búsqueda

**Files:**

- Modify: `components/atlas-v2/AtlasTopNav.tsx`
- Modify: `lib/atlas-v2-search.ts`
- Modify: `app/(v2)/v2/buscar/BuscarClient.tsx`
- Create/Modify: `tests/atlas-v2-search.test.ts`

- [ ] **Step 1: Escribir prueba fallida de búsqueda sin Archivos**

Verificar que los tipos buscables finales sean personaje, capítulo, facción,
lugar, dios, objeto, misterio y mundo; que no exista `archivo`; y que todos los
`href` empiecen con `/v2/`.

- [ ] **Step 2: Ejecutar prueba y verificar RED**

Run: `npm test -- tests/atlas-v2-search.test.ts`

Expected: FAIL porque búsqueda todavía importa `MOCK_DOCUMENTS`.

- [ ] **Step 3: Reorganizar navegación**

Actualizar `AtlasTopNav`:

```txt
Inicio
Crónicas: Capítulos, Misterios
Atlas: Personajes, Facciones, Lugares, Mapa
Conocimiento: Dioses, Objetos, Mundo
Buscar
Música
```

- [ ] **Step 4: Reemplazar índice mock por fuentes V2 finales**

Eliminar el tipo `archivo`, sus labels y sus resultados. Todos los resultados
deben usar rutas V2.

- [ ] **Step 5: Ejecutar prueba y verificar GREEN**

Run: `npm test -- tests/atlas-v2-search.test.ts`

Expected: PASS.

## Task 4: Primitivas visuales compartidas de escritorio

**Files:**

- Create: `components/atlas-v2/AtlasPageScene.tsx`
- Create: `components/atlas-v2/AtlasNarrativeFrame.tsx`
- Create: `components/atlas-v2/AtlasEntityReader.tsx`
- Create: `components/atlas-v2/AtlasEntityDetail.tsx`
- Create: `components/atlas-v2/AtlasEntityIndex.tsx`
- Modify: `app/(v2)/v2/atlas-v2.css`

- [ ] **Step 1: Definir APIs pequeñas y semánticas**

`AtlasPageScene` recibe título, eyebrow, fondo y variante. `AtlasEntityDetail`
recibe `detail` y una variante visual:

```ts
type AtlasEntityDetailVariant =
  | "character"
  | "faction"
  | "relic"
  | "mystery"
  | "world";
```

- [ ] **Step 2: Implementar materialidad compartida**

Agregar marcos de cobre, borde interior, superficies con blur, foco visible,
estados activos y composición wide-screen. No cambiar el home salvo reglas
compartidas estrictamente necesarias.

- [ ] **Step 3: Verificar TypeScript**

Run: `npm run typecheck`

Expected: PASS.

## Task 5: Mockups comparables de las páginas nuevas

**Files:**

- Create: `.superpowers/brainstorm/.../content/objetos-layout.html`
- Create: `.superpowers/brainstorm/.../content/misterios-layout.html`
- Create: `.superpowers/brainstorm/.../content/mundo-layout.html`

- [ ] **Step 1: Mostrar tres composiciones estructuralmente distintas para Objetos**

Recomendación inicial: gabinete de reliquias con artefacto seleccionado como
foco, índice horizontal/vertical secundario y ficha contextual.

- [ ] **Step 2: Obtener aprobación visual de Objetos**

Registrar la elección antes de implementar su layout definitivo.

- [ ] **Step 3: Repetir para Misterios**

Recomendación inicial: tablero de investigación con misterio seleccionado,
evidencias y episodios relacionados.

- [ ] **Step 4: Repetir para Mundo**

Recomendación inicial: cosmología navegable con concepto seleccionado,
relaciones y extracto de lore.

## Task 6: Páginas índice de Objetos, Misterios y Mundo

**Files:**

- Create: `app/(v2)/v2/objetos/page.tsx`
- Create: `app/(v2)/v2/objetos/ObjetosClient.tsx`
- Create: `app/(v2)/v2/misterios/page.tsx`
- Create: `app/(v2)/v2/misterios/MisteriosClient.tsx`
- Create: `app/(v2)/v2/mundo/page.tsx`
- Create: `app/(v2)/v2/mundo/MundoClient.tsx`
- Modify: `app/(v2)/v2/atlas-v2.css`

- [ ] **Step 1: Implementar Objetos con datos reales**

Priorizar objetos con imagen y apariciones. Las cartas, diarios, libros,
contratos y mapas permanecen como objetos, no documentos de Archivos.

- [ ] **Step 2: Capturar y corregir Objetos en 1440x900**

Run:

```powershell
$env:V2_BASE_URL='http://localhost:<puerto>'; node scripts/v2-screenshot.mjs --routes=/v2/objetos
```

Expected: foco narrativo visible, índice secundario y ausencia de aspecto
dashboard.

- [ ] **Step 3: Implementar y verificar Misterios**

Mostrar preguntas abiertas, apariciones y pistas narrativas sin inventar estado
canónico.

- [ ] **Step 4: Implementar y verificar Mundo**

Usar `worldbuilding` como fuente de datos, pero exponer el nombre público
`Mundo`.

- [ ] **Step 5: Ejecutar verificación de entrega**

Run: `npm run typecheck && npm test`

Expected: PASS.

## Task 7: Páginas de detalle V2

**Files:**

- Create: `app/(v2)/v2/capitulos/[num]/page.tsx`
- Create: `app/(v2)/v2/personajes/[slug]/page.tsx`
- Create: `app/(v2)/v2/facciones/[slug]/page.tsx`
- Create: `app/(v2)/v2/objetos/[slug]/page.tsx`
- Create: `app/(v2)/v2/misterios/[slug]/page.tsx`
- Create: `app/(v2)/v2/mundo/[slug]/page.tsx`
- Modify: `components/atlas-v2/AtlasDetailPanel.tsx`
- Modify: `app/(v2)/v2/facciones/FaccionesClient.tsx`
- Modify: `app/(v2)/v2/dioses/DiosesClient.tsx`

- [ ] **Step 1: Crear detalle de capítulo V2**

Reutilizar datos y parsing estables de la crónica V1, pero renderizar con
componentes V2. Integrar eventos, citas y decisiones como secciones del
capítulo.

- [ ] **Step 2: Crear detalles con variantes por dominio**

- Personaje: dossier/retrato.
- Facción: emblema/campo político.
- Objeto: reliquia física.
- Misterio: investigación/pistas.
- Mundo: concepto/cosmología.

- [ ] **Step 3: Corregir CTAs y enlaces**

Todos los enlaces desde tarjetas, detalles y Dioses deben apuntar a `/v2/*`.

- [ ] **Step 4: Capturar rutas representativas**

Capturar al menos un detalle por dominio en 1440x900 y corregir P0/P1.

- [ ] **Step 5: Verificar entrega**

Run: `npm run typecheck && npm test`

Expected: PASS.

## Task 8: Mejorar páginas V2 existentes al sistema aprobado

**Files:**

- Modify: `app/(v2)/v2/personajes/PersonajesClient.tsx`
- Modify: `app/(v2)/v2/capitulos/CapitulosClient.tsx`
- Modify: `app/(v2)/v2/facciones/FaccionesClient.tsx`
- Modify: `app/(v2)/v2/buscar/BuscarClient.tsx`
- Modify: `app/(v2)/v2/atlas-v2.css`

- [ ] **Step 1: Personajes**

Hacer que el dossier seleccionado sea el foco y que el catálogo sea
secundario, sin perder filtros.

- [ ] **Step 2: Capítulos**

Hacer que la crónica seleccionada domine la composición y que el índice sea
secundario.

- [ ] **Step 3: Facciones**

Convertir el centro en un campo de influencias legible, con emblema y
relaciones como foco.

- [ ] **Step 4: Buscar**

Diseñar un estado inicial con sugerencias y categorías reales; evitar el gran
vacío actual.

- [ ] **Step 5: Verificar cada página con captura 1440x900**

Comparar contra el home como fuente visual.

## Task 9: Eliminar Archivos

**Files:**

- Delete: `app/(v2)/v2/archivos/`
- Delete: `data/atlas-v2/archives.ts`
- Delete: `components/atlas-v2/AtlasCollectionList.tsx`
- Delete: `components/atlas-v2/AtlasDocumentViewer.tsx`
- Delete: `components/atlas-v2/AtlasDocumentInfo.tsx`
- Modify: `app/(v2)/v2/atlas-v2.css`
- Modify: `scripts/v2-screenshot.mjs`

- [ ] **Step 1: Confirmar que no quedan imports ni enlaces**

Run:

```powershell
rg -n "MOCK_DOCUMENTS|MOCK_COLLECTIONS|V2Document|V2Collection|/v2/archivos" app components data lib scripts
```

Expected: sin consumidores de producción.

- [ ] **Step 2: Eliminar implementación y CSS exclusivo**

Eliminar únicamente archivos y bloques sin consumidores.

- [ ] **Step 3: Verificar**

Run: `npm run typecheck && npm test && npm run build`

Expected: PASS.

## Task 10: Redirecciones y retiro de UI pública V1

**Files:**

- Modify: `next.config.ts`
- Delete: `app/(public)/`
- Delete: componentes `components/public/` sin consumidores
- Modify: cualquier enlace V1 restante detectado por auditoría
- Modify: `tests/atlas-v2-routes.test.ts`

- [ ] **Step 1: Ampliar prueba de redirecciones finales**

Verificar que todas las rutas públicas V1 y antiguas `/entidades/*` tengan
destino V2 directo y que `/importar`, `/procesar`, `/review` no aparezcan como
redirecciones.

- [ ] **Step 2: Ejecutar prueba y verificar RED**

Run: `npm test -- tests/atlas-v2-routes.test.ts`

Expected: FAIL hasta actualizar `next.config.ts`.

- [ ] **Step 3: Implementar redirecciones directas**

Evitar cadenas como `/episodios -> /cronicas -> /v2/capitulos`.

- [ ] **Step 4: Auditar consumidores antes de eliminar V1**

Run:

```powershell
rg -n "@/components/public|app/\\(public\\)|public.css|palette.css" app components lib
```

Eliminar solo archivos V1 que queden sin consumidores.

- [ ] **Step 5: Verificar rutas locales**

Confirmar que `/importar`, `/procesar` y `/review` continúan respondiendo.

## Task 11: QA final de escritorio

**Files:**

- Modify: `docs/rdc-ui-v2-qa.md`
- Modify: `scripts/v2-screenshot.mjs`

- [ ] **Step 1: Ejecutar suite completa**

Run:

```powershell
npm run typecheck
npm test
npm run build
```

Expected: los tres comandos terminan con código 0.

- [ ] **Step 2: Capturar todas las rutas finales en escritorio**

Capturar índices y detalles representativos en 1440x900 y 2048x1152.

- [ ] **Step 3: Verificar redirecciones**

Comprobar códigos y destinos de todas las rutas V1 y antiguas.

- [ ] **Step 4: Auditar requisitos**

Confirmar:

- Home visualmente intacto.
- No existe Archivos.
- No hay enlaces V1 desde V2.
- Cada sección tiene foco narrativo.
- Panel local preservado.
- Sin P0/P1 visuales de escritorio.

- [ ] **Step 5: Documentar resultado**

Registrar rutas, capturas, comandos y cualquier polish futuro no bloqueante.
