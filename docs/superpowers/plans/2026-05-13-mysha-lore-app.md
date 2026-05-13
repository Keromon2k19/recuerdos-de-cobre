# Plan de Implementación — App de lore Mysha (MVP)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una app Next.js 15 local-first que extrae lore TTRPG de resúmenes de Gemini con Claude API y lo persiste como Markdown navegable desde Obsidian.

**Architecture:** Next.js 15 (App Router) con server actions para filesystem y LLM. Funciones puras en `lib/` (markdown, slugify, schema, vault) cubiertas por unit tests. UI con React 19 + Tailwind, estética grimorio. El vault Markdown es la única fuente de verdad.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, `@anthropic-ai/sdk`, `gray-matter`, `zod`, `zod-to-json-schema`, `vitest`.

**Spec:** `docs/superpowers/specs/2026-05-13-mysha-lore-app-design.md`

---

## Estructura de archivos

Archivos que este plan crea (en orden de tareas):

### Configuración y scaffold
- `package.json`, `tsconfig.json`, `next.config.ts`
- `tailwind.config.ts`, `postcss.config.mjs`
- `vitest.config.ts`, `tests/setup.ts`
- `.env.example`

### Librería pura (`lib/`)
- `lib/config.ts` — validación de env
- `lib/types.ts` — tipos compartidos
- `lib/slugify.ts` — nombre → filename
- `lib/markdown.ts` — parse/serialize `.md`
- `lib/schema.ts` — zod schema del output del LLM
- `lib/vault.ts` — I/O del filesystem (read/write entidades + episodios)
- `lib/prompts.ts` — carga del prompt
- `lib/claude.ts` — cliente Anthropic con caching
- `prompts/extract-lore.md` — prompt versionado

### Tests (`tests/`)
- `tests/config.test.ts`
- `tests/slugify.test.ts`
- `tests/markdown.test.ts`
- `tests/schema.test.ts`
- `tests/vault.test.ts`
- `tests/claude.test.ts`

### Server actions (`app/actions/`)
- `app/actions/extract.ts`
- `app/actions/commit.ts`

### UI (`app/`, `components/`)
- `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- `app/review/page.tsx`
- `app/episodios/page.tsx`, `app/episodios/[num]/page.tsx`
- `app/entidades/[tipo]/page.tsx`, `app/entidades/[tipo]/[slug]/page.tsx`
- `components/Sidebar.tsx`, `components/LoadEpisodeForm.tsx`
- `components/ReviewCard.tsx`

---

## Task 1: Scaffold del proyecto

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `tests/setup.ts`, `.env.example`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

- [ ] **Step 1: Crear `package.json`**

```json
{
  "name": "mysha",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "gray-matter": "^4.0.3",
    "zod": "^3.23.0",
    "zod-to-json-schema": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^2.1.0",
    "@vitest/ui": "^2.1.0"
  }
}
```

- [ ] **Step 2: Instalar dependencias**

Run: `npm install`
Expected: `node_modules/` creado, sin errores fatales (warnings de peer deps son OK).

- [ ] **Step 3: Crear `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Crear `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
```

- [ ] **Step 5: Crear `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0202",
          900: "#1a0505",
          800: "#2a0a0a",
          700: "#3a1010",
        },
        crimson: {
          DEFAULT: "#c8302a",
          dark: "#6a1010",
          glow: "#8a2020",
        },
        gold: {
          DEFAULT: "#d4a070",
          dim: "#8a6040",
          bright: "#f0d090",
        },
      },
      fontFamily: {
        title: ["Cinzel", "Georgia", "serif"],
        body: ["'Crimson Text'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 6: Crear `postcss.config.mjs`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Crear `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 8: Crear `tests/setup.ts`** (vacío por ahora, lugar futuro para mocks globales)

```ts
// Vitest global setup. Mocks globales y matchers van acá.
```

- [ ] **Step 9: Crear `.env.example`**

```bash
# Clave de la API de Anthropic. Obtenela en https://console.anthropic.com/
ANTHROPIC_API_KEY=

# Ruta absoluta al vault Markdown. Puede apuntar a un vault Obsidian existente.
# Ejemplo Windows: C:/Users/joaqu/Obsidian/MyshaVault
# Ejemplo macOS/Linux: /Users/joaqu/Documents/MyshaVault
VAULT_PATH=
```

- [ ] **Step 10: Crear `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap");

:root {
  color-scheme: dark;
}

html, body {
  background: #0a0202;
  color: #d4c4a8;
  font-family: var(--font-body, "Crimson Text", Georgia, serif);
  min-height: 100vh;
}

h1, h2, h3, h4 {
  font-family: "Cinzel", Georgia, serif;
  color: #d4a070;
  letter-spacing: 0.05em;
}

a {
  color: #c8302a;
  text-decoration: none;
}
a:hover { text-decoration: underline; }
```

- [ ] **Step 11: Crear `app/layout.tsx`** (placeholder mínimo, se reemplaza en Task 13)

```tsx
import "./globals.css";

export const metadata = {
  title: "Mysha — Grimorio de lore",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 12: Crear `app/page.tsx`** (placeholder)

```tsx
export default function Home() {
  return (
    <main className="p-12">
      <h1 className="text-4xl">⛧ Mysha ⛧</h1>
      <p className="mt-4 italic text-gold-dim">El grimorio se está despertando...</p>
    </main>
  );
}
```

- [ ] **Step 13: Verificar que el build arranca**

Run: `npm run dev`
Expected: server arranca en `http://localhost:3000`. Abrís el browser y ves "⛧ Mysha ⛧" con paleta oscura. Matalo con Ctrl+C.

- [ ] **Step 14: Verificar typecheck**

Run: `npm run typecheck`
Expected: salida vacía, exit code 0.

- [ ] **Step 15: Commit**

```bash
git add package.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs vitest.config.ts tests/setup.ts .env.example app/
git commit -m "Scaffold Next.js 15 + Tailwind + vitest"
```

---

## Task 2: Validación de entorno (`lib/config.ts`)

**Files:**
- Create: `lib/config.ts`, `tests/config.test.ts`

- [ ] **Step 1: Escribir test de validación de env**

`tests/config.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadConfig } from "@/lib/config";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

describe("loadConfig", () => {
  it("rechaza ANTHROPIC_API_KEY ausente", () => {
    expect(() =>
      loadConfig({ ANTHROPIC_API_KEY: "", VAULT_PATH: "/tmp" })
    ).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("rechaza VAULT_PATH ausente", () => {
    expect(() =>
      loadConfig({ ANTHROPIC_API_KEY: "sk-x", VAULT_PATH: "" })
    ).toThrow(/VAULT_PATH/);
  });

  it("acepta valores válidos y resuelve a ruta absoluta", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mysha-cfg-"));
    const cfg = loadConfig({ ANTHROPIC_API_KEY: "sk-x", VAULT_PATH: dir });
    expect(cfg.anthropicApiKey).toBe("sk-x");
    expect(path.isAbsolute(cfg.vaultPath)).toBe(true);
    fs.rmSync(dir, { recursive: true });
  });

  it("rechaza VAULT_PATH inexistente", () => {
    expect(() =>
      loadConfig({
        ANTHROPIC_API_KEY: "sk-x",
        VAULT_PATH: "/ruta/que/no/existe/123abc",
      })
    ).toThrow(/no existe/);
  });
});
```

- [ ] **Step 2: Ejecutar test, verificar fallo esperado**

Run: `npm test -- tests/config.test.ts`
Expected: FAIL — `Cannot find module '@/lib/config'`.

- [ ] **Step 3: Implementar `lib/config.ts`**

```ts
import path from "node:path";
import fs from "node:fs";

export type AppConfig = {
  anthropicApiKey: string;
  vaultPath: string; // absoluto
};

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const key = env.ANTHROPIC_API_KEY?.trim();
  const vaultRaw = env.VAULT_PATH?.trim();

  if (!key) {
    throw new Error("ANTHROPIC_API_KEY no está definida en .env.local");
  }
  if (!vaultRaw) {
    throw new Error("VAULT_PATH no está definida en .env.local");
  }

  const vaultPath = path.resolve(vaultRaw);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`VAULT_PATH no existe en disco: ${vaultPath}`);
  }

  return { anthropicApiKey: key, vaultPath };
}
```

- [ ] **Step 4: Ejecutar test, verificar que pasa**

Run: `npm test -- tests/config.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/config.ts tests/config.test.ts
git commit -m "Validación de entorno (ANTHROPIC_API_KEY + VAULT_PATH)"
```

---

## Task 3: Tipos compartidos (`lib/types.ts`)

**Files:**
- Create: `lib/types.ts`

Sin TDD: son solo tipos. Si compilan, ya está.

- [ ] **Step 1: Crear `lib/types.ts`**

```ts
export type EntityType =
  | "personaje"
  | "lugar"
  | "evento"
  | "objeto"
  | "faccion"
  | "worldbuilding"
  | "mistero"
  | "quote"
  | "decision";

export const ENTITY_TYPES: EntityType[] = [
  "personaje",
  "lugar",
  "evento",
  "objeto",
  "faccion",
  "worldbuilding",
  "mistero",
  "quote",
  "decision",
];

/** Una mención individual: un bullet bajo la sección de un episodio en la ficha de la entidad. */
export type Mention = {
  episodio: number;
  texto: string;
};

/** Una entidad cualquiera (personaje, lugar, etc.) leída desde su .md. */
export type Entity = {
  tipo: EntityType;
  nombre: string;
  alias: string[];
  apariciones: number[];
  menciones: Mention[];
  // Solo para personajes:
  subTipo?: "PJ" | "PNJ";
  relaciones?: RelacionEnFicha[];
  ultimaActualizacion?: string; // ISO
};

export type RelacionEnFicha = {
  con: string; // wikilink target, ej. "[[Selenne]]" o "Selenne"
  tipo: string;
  episodio: number;
};

/** Una relación tal como la extrae la IA (de un episodio a otro). */
export type RelacionExtraida = {
  de: string;
  a: string;
  tipo: string;
};

/** Payload completo que devuelve la IA después de extraer un episodio. */
export type LoreExtraido = {
  personajes: Array<{ nombre: string; descripcion: string; alias?: string[] }>;
  lugares: Array<{ nombre: string; descripcion: string }>;
  eventos: Array<{ nombre: string; descripcion: string }>;
  objetos: Array<{ nombre: string; descripcion: string }>;
  facciones: Array<{ nombre: string; descripcion: string }>;
  worldbuilding: Array<{ tema: string; descripcion: string }>;
  relaciones: RelacionExtraida[];
  misterios: string[];
  quotes: Array<{ texto: string; autor?: string }>;
  decisiones: Array<{ descripcion: string; protagonistas: string[] }>;
};

export type Episodio = {
  numero: number;
  titulo: string;
  fechaGrabacion?: string;
  procesado: string; // ISO timestamp
  resumenOriginal: string;
  extraido: LoreExtraido;
};

/** Mapeo de tipo de entidad al nombre de carpeta. */
export const TYPE_TO_FOLDER: Record<EntityType, string> = {
  personaje: "personajes",
  lugar: "lugares",
  evento: "eventos",
  objeto: "objetos",
  faccion: "facciones",
  worldbuilding: "worldbuilding",
  mistero: "misterios",
  quote: "quotes",
  decision: "decisiones",
};

export const VAULT_FOLDERS = [
  "episodios",
  ...Object.values(TYPE_TO_FOLDER),
] as const;
```

- [ ] **Step 2: Verificar typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "Tipos compartidos (EntityType, Entity, LoreExtraido, Episodio)"
```

---

## Task 4: Slugify (`lib/slugify.ts`)

**Files:**
- Create: `lib/slugify.ts`, `tests/slugify.test.ts`

- [ ] **Step 1: Escribir test**

`tests/slugify.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("convierte espacios a guiones", () => {
    expect(slugify("Bosque de Espinas")).toBe("bosque-de-espinas");
  });

  it("remueve acentos manteniendo legibilidad", () => {
    expect(slugify("Té de Medianoche")).toBe("te-de-medianoche");
    expect(slugify("Versión")).toBe("version");
  });

  it("elimina caracteres no alfanuméricos", () => {
    expect(slugify("¡Mysha!")).toBe("mysha");
    expect(slugify("Coven (Rosa)")).toBe("coven-rosa");
  });

  it("colapsa múltiples guiones", () => {
    expect(slugify("a -- b -- c")).toBe("a-b-c");
  });

  it("recorta guiones al inicio/final", () => {
    expect(slugify(" --hola-- ")).toBe("hola");
  });

  it("preserva la ñ como n", () => {
    expect(slugify("España")).toBe("espana");
  });

  it("acepta números", () => {
    expect(slugify("Episodio 67")).toBe("episodio-67");
  });
});
```

- [ ] **Step 2: Ejecutar test, verificar fallo**

Run: `npm test -- tests/slugify.test.ts`
Expected: FAIL — módulo no encontrado.

- [ ] **Step 3: Implementar `lib/slugify.ts`**

```ts
/**
 * Convierte un nombre humano a un slug seguro para filename.
 * "Té de Medianoche" → "te-de-medianoche"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // solo alfanum + espacio + guión
    .trim()
    .replace(/[\s-]+/g, "-") // espacios y guiones múltiples → uno
    .replace(/^-+|-+$/g, ""); // trim guiones
}

/**
 * Slug para episodio con padding numérico: 67 + "La hoguera" → "067-la-hoguera"
 */
export function episodeFilename(numero: number, titulo: string): string {
  const padded = String(numero).padStart(3, "0");
  return `${padded}-${slugify(titulo)}.md`;
}
```

- [ ] **Step 4: Agregar test para `episodeFilename`**

Agregar al final de `tests/slugify.test.ts`:
```ts
import { episodeFilename } from "@/lib/slugify";

describe("episodeFilename", () => {
  it("padea el número a 3 dígitos", () => {
    expect(episodeFilename(7, "El altar")).toBe("007-el-altar.md");
  });
  it("usa el título slugificado", () => {
    expect(episodeFilename(67, "La hoguera")).toBe("067-la-hoguera.md");
  });
  it("maneja números grandes sin truncar", () => {
    expect(episodeFilename(1234, "X")).toBe("1234-x.md");
  });
});
```

- [ ] **Step 5: Ejecutar tests, todos pasan**

Run: `npm test -- tests/slugify.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/slugify.ts tests/slugify.test.ts
git commit -m "Slugify nombres y filenames de episodios"
```

---

## Task 5: Markdown parse/serialize (`lib/markdown.ts`)

Maneja la conversión entre objetos TS (Entity, Episodio) y archivos `.md` con frontmatter YAML + cuerpo estructurado.

**Files:**
- Create: `lib/markdown.ts`, `tests/markdown.test.ts`

- [ ] **Step 1: Escribir test de serialización de episodio**

`tests/markdown.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  serializeEpisodio,
  parseEpisodio,
  serializeEntity,
  parseEntity,
  upsertMentionSection,
} from "@/lib/markdown";
import type { Episodio, Entity } from "@/lib/types";

const ep: Episodio = {
  numero: 67,
  titulo: "La hoguera",
  fechaGrabacion: "2025-08-12",
  procesado: "2026-05-13T14:22:00.000Z",
  resumenOriginal: "Texto crudo del resumen.",
  extraido: {
    personajes: [
      { nombre: "Mysha", descripcion: "recita el conjuro" },
      { nombre: "Selenne", descripcion: "interrumpe a Mysha" },
    ],
    lugares: [{ nombre: "Bosque de Espinas", descripcion: "escenario" }],
    eventos: [{ nombre: "Ritual del Té", descripcion: "primera aparición" }],
    objetos: [],
    facciones: [],
    worldbuilding: [],
    relaciones: [],
    misterios: ["¿Quién dejó la nota?"],
    quotes: [{ texto: "Que el humo recuerde", autor: "Mysha" }],
    decisiones: [],
  },
};

describe("serializeEpisodio / parseEpisodio", () => {
  it("roundtrip preserva todos los campos", () => {
    const md = serializeEpisodio(ep);
    const parsed = parseEpisodio(md);
    expect(parsed).toEqual(ep);
  });

  it("escribe el frontmatter con tipo episodio", () => {
    const md = serializeEpisodio(ep);
    expect(md).toMatch(/^---\n/);
    expect(md).toMatch(/tipo: episodio/);
    expect(md).toMatch(/numero: 67/);
    expect(md).toMatch(/titulo: La hoguera/);
  });

  it("incluye el resumen original en el cuerpo", () => {
    const md = serializeEpisodio(ep);
    expect(md).toContain("## Resumen original (Gemini)");
    expect(md).toContain("Texto crudo del resumen.");
  });

  it("incluye secciones por categoría con bullets wikilink", () => {
    const md = serializeEpisodio(ep);
    expect(md).toContain("### Personajes");
    expect(md).toContain("- **[[Mysha]]** — recita el conjuro");
    expect(md).toContain("### Misterios");
    expect(md).toContain("- ¿Quién dejó la nota?");
    expect(md).toContain("### Quotes");
    expect(md).toContain("> \"Que el humo recuerde\" — Mysha");
  });

  it("omite secciones vacías", () => {
    const md = serializeEpisodio(ep);
    expect(md).not.toContain("### Objetos");
    expect(md).not.toContain("### Facciones");
  });
});

describe("serializeEntity / parseEntity", () => {
  const entity: Entity = {
    tipo: "personaje",
    nombre: "Mysha",
    alias: ["la bruja roja"],
    apariciones: [3, 7, 67],
    menciones: [
      { episodio: 3, texto: "Aparece por primera vez." },
      { episodio: 7, texto: "Conoce a Io." },
      { episodio: 67, texto: "Mysha es maga." },
      { episodio: 67, texto: "Recita el conjuro del té." },
    ],
    subTipo: "PJ",
    relaciones: [
      { con: "[[Selenne]]", tipo: "personalidad-compartida", episodio: 3 },
    ],
    ultimaActualizacion: "2026-05-13T14:22:00.000Z",
  };

  it("roundtrip preserva campos", () => {
    const md = serializeEntity(entity);
    const parsed = parseEntity(md);
    expect(parsed).toEqual(entity);
  });

  it("agrupa menciones del mismo episodio bajo un solo header", () => {
    const md = serializeEntity(entity);
    const ep67Section = md.match(/### \[\[067-[\s\S]*?(?=\n### |\n*$)/);
    expect(ep67Section).toBeTruthy();
    expect(ep67Section![0]).toContain("- Mysha es maga.");
    expect(ep67Section![0]).toContain("- Recita el conjuro del té.");
  });

  it("escribe frontmatter con relaciones", () => {
    const md = serializeEntity(entity);
    expect(md).toMatch(/relaciones:/);
    expect(md).toContain('con: "[[Selenne]]"');
  });
});

describe("upsertMentionSection", () => {
  const baseMd = `---
tipo: personaje
nombre: "Mysha"
alias: []
apariciones: [3]
---

## Menciones por episodio

### [[003-prologo|Ep. 3 — Prólogo]]
- Aparece.
`;

  it("agrega un nuevo episodio cuando no existe", () => {
    const result = upsertMentionSection(baseMd, {
      episodio: 67,
      tituloEpisodio: "La hoguera",
      bullets: ["Mysha es maga.", "Recita el conjuro."],
    });
    expect(result).toContain("### [[003-prologo|Ep. 3 — Prólogo]]");
    expect(result).toContain("### [[067-la-hoguera|Ep. 67 — La hoguera]]");
    expect(result).toContain("- Mysha es maga.");
  });

  it("reemplaza la sección de un episodio existente sin tocar otras", () => {
    const withEp67 = upsertMentionSection(baseMd, {
      episodio: 67,
      tituloEpisodio: "La hoguera",
      bullets: ["Versión vieja"],
    });
    const replaced = upsertMentionSection(withEp67, {
      episodio: 67,
      tituloEpisodio: "La hoguera",
      bullets: ["Versión nueva"],
    });
    expect(replaced).toContain("- Versión nueva");
    expect(replaced).not.toContain("Versión vieja");
    expect(replaced).toContain("### [[003-prologo|Ep. 3 — Prólogo]]");
    expect(replaced).toContain("- Aparece.");
  });
});
```

- [ ] **Step 2: Ejecutar tests, verificar fallo**

Run: `npm test -- tests/markdown.test.ts`
Expected: FAIL — módulo no encontrado.

- [ ] **Step 3: Implementar `lib/markdown.ts`**

```ts
import matter from "gray-matter";
import { episodeFilename, slugify } from "./slugify";
import type { Episodio, Entity, Mention, LoreExtraido, RelacionEnFicha } from "./types";

// =========================================================================
// EPISODIO
// =========================================================================

export function serializeEpisodio(ep: Episodio): string {
  const menciones: Record<string, string[]> = {};
  const categoriasParaIndice: Array<[keyof LoreExtraido, string]> = [
    ["personajes", "personajes"],
    ["lugares", "lugares"],
    ["facciones", "facciones"],
    ["eventos", "eventos"],
    ["objetos", "objetos"],
  ];
  for (const [key, label] of categoriasParaIndice) {
    const items = ep.extraido[key] as Array<{ nombre: string }>;
    if (items.length) menciones[label] = items.map((i) => `[[${i.nombre}]]`);
  }

  const fm: Record<string, unknown> = {
    tipo: "episodio",
    numero: ep.numero,
    titulo: ep.titulo,
    ...(ep.fechaGrabacion ? { fecha_grabacion: ep.fechaGrabacion } : {}),
    procesado: ep.procesado,
    menciones,
    contadores: {
      misterios: ep.extraido.misterios.length,
      quotes: ep.extraido.quotes.length,
      decisiones: ep.extraido.decisiones.length,
      worldbuilding: ep.extraido.worldbuilding.length,
      relaciones: ep.extraido.relaciones.length,
    },
  };

  const body = renderEpisodioBody(ep);
  return matter.stringify(body, fm);
}

function renderEpisodioBody(ep: Episodio): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("## Resumen original (Gemini)");
  lines.push("");
  lines.push(ep.resumenOriginal);
  lines.push("");
  lines.push("## Lore extraído");

  const ex = ep.extraido;
  const sectionWithNombre = (titulo: string, items: Array<{ nombre: string; descripcion: string }>) => {
    if (!items.length) return;
    lines.push("");
    lines.push(`### ${titulo}`);
    for (const it of items) lines.push(`- **[[${it.nombre}]]** — ${it.descripcion}`);
  };

  sectionWithNombre("Personajes", ex.personajes);
  sectionWithNombre("Lugares", ex.lugares);
  sectionWithNombre("Eventos", ex.eventos);
  sectionWithNombre("Objetos", ex.objetos);
  sectionWithNombre("Facciones", ex.facciones);

  if (ex.worldbuilding.length) {
    lines.push("", "### Worldbuilding");
    for (const w of ex.worldbuilding) lines.push(`- **${w.tema}** — ${w.descripcion}`);
  }

  if (ex.relaciones.length) {
    lines.push("", "### Relaciones");
    for (const r of ex.relaciones) lines.push(`- [[${r.de}]] → [[${r.a}]] — ${r.tipo}`);
  }

  if (ex.misterios.length) {
    lines.push("", "### Misterios");
    for (const m of ex.misterios) lines.push(`- ${m}`);
  }

  if (ex.quotes.length) {
    lines.push("", "### Quotes");
    for (const q of ex.quotes) lines.push(`> "${q.texto}"${q.autor ? ` — ${q.autor}` : ""}`);
  }

  if (ex.decisiones.length) {
    lines.push("", "### Decisiones");
    for (const d of ex.decisiones)
      lines.push(`- ${d.descripcion} (${d.protagonistas.join(", ")})`);
  }

  lines.push("");
  return lines.join("\n");
}

export function parseEpisodio(md: string): Episodio {
  const parsed = matter(md);
  const fm = parsed.data as Record<string, unknown>;
  const body = parsed.content;

  if (fm.tipo !== "episodio") throw new Error("No es un .md de episodio");

  const resumenOriginal = extractSection(body, "Resumen original (Gemini)") ?? "";
  const extraido = parseLoreExtraidoFromBody(body);

  return {
    numero: Number(fm.numero),
    titulo: String(fm.titulo),
    fechaGrabacion: fm.fecha_grabacion ? String(fm.fecha_grabacion) : undefined,
    procesado: String(fm.procesado),
    resumenOriginal: resumenOriginal.trim(),
    extraido,
  };
}

function parseLoreExtraidoFromBody(body: string): LoreExtraido {
  const result: LoreExtraido = {
    personajes: [],
    lugares: [],
    eventos: [],
    objetos: [],
    facciones: [],
    worldbuilding: [],
    relaciones: [],
    misterios: [],
    quotes: [],
    decisiones: [],
  };

  const sectionNombreDescr = (s: string) =>
    matchBullets(s, /^- \*\*\[\[([^\]]+)\]\]\*\* — (.+)$/).map(([nombre, descripcion]) => ({
      nombre,
      descripcion,
    }));

  const personajes = extractSection(body, "Personajes");
  if (personajes) result.personajes = sectionNombreDescr(personajes);
  const lugares = extractSection(body, "Lugares");
  if (lugares) result.lugares = sectionNombreDescr(lugares);
  const eventos = extractSection(body, "Eventos");
  if (eventos) result.eventos = sectionNombreDescr(eventos);
  const objetos = extractSection(body, "Objetos");
  if (objetos) result.objetos = sectionNombreDescr(objetos);
  const facciones = extractSection(body, "Facciones");
  if (facciones) result.facciones = sectionNombreDescr(facciones);

  const worldbuilding = extractSection(body, "Worldbuilding");
  if (worldbuilding) {
    result.worldbuilding = matchBullets(worldbuilding, /^- \*\*(.+?)\*\* — (.+)$/).map(
      ([tema, descripcion]) => ({ tema, descripcion })
    );
  }

  const relaciones = extractSection(body, "Relaciones");
  if (relaciones) {
    result.relaciones = matchBullets(relaciones, /^- \[\[(.+?)\]\] → \[\[(.+?)\]\] — (.+)$/).map(
      ([de, a, tipo]) => ({ de, a, tipo })
    );
  }

  const misterios = extractSection(body, "Misterios");
  if (misterios) {
    result.misterios = matchBullets(misterios, /^- (.+)$/).map(([t]) => t);
  }

  const quotes = extractSection(body, "Quotes");
  if (quotes) {
    const rx = /^> "([^"]+)"(?: — (.+))?$/gm;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(quotes))) {
      result.quotes.push({ texto: m[1], ...(m[2] ? { autor: m[2] } : {}) });
    }
  }

  const decisiones = extractSection(body, "Decisiones");
  if (decisiones) {
    result.decisiones = matchBullets(decisiones, /^- (.+?) \(([^)]+)\)$/).map(
      ([descripcion, prots]) => ({
        descripcion,
        protagonistas: prots.split(",").map((s) => s.trim()),
      })
    );
  }

  return result;
}

// =========================================================================
// ENTITY
// =========================================================================

export function serializeEntity(entity: Entity): string {
  const fm: Record<string, unknown> = {
    tipo: entity.tipo,
    ...(entity.subTipo ? { sub_tipo: entity.subTipo } : {}),
    nombre: entity.nombre,
    alias: entity.alias,
    ...(entity.relaciones && entity.relaciones.length
      ? {
          relaciones: entity.relaciones.map((r) => ({
            con: r.con,
            tipo: r.tipo,
            episodio: r.episodio,
          })),
        }
      : {}),
    apariciones: entity.apariciones,
    ...(entity.ultimaActualizacion ? { ultima_actualizacion: entity.ultimaActualizacion } : {}),
  };

  const groups = groupMentionsByEpisode(entity.menciones);
  const lines: string[] = ["", "## Menciones por episodio"];
  for (const num of [...groups.keys()].sort((a, b) => a - b)) {
    const bullets = groups.get(num)!;
    lines.push("", `### [[${episodeRefHeader(num)}|Ep. ${num}]]`);
    for (const b of bullets) lines.push(`- ${b}`);
  }
  lines.push("");
  return matter.stringify(lines.join("\n"), fm);
}

function episodeRefHeader(num: number): string {
  // Cuando serializamos por primera vez no sabemos el slug del título.
  // Usamos número padeado solo. upsertMentionSection lo corrige cuando se
  // conoce el título real.
  return String(num).padStart(3, "0");
}

function groupMentionsByEpisode(menciones: Mention[]): Map<number, string[]> {
  const m = new Map<number, string[]>();
  for (const x of menciones) {
    if (!m.has(x.episodio)) m.set(x.episodio, []);
    m.get(x.episodio)!.push(x.texto);
  }
  return m;
}

export function parseEntity(md: string): Entity {
  const parsed = matter(md);
  const fm = parsed.data as Record<string, unknown>;
  const body = parsed.content;

  const tipo = String(fm.tipo) as Entity["tipo"];
  const menciones = parseMenciones(body);

  const relacionesRaw = (fm.relaciones as Array<Record<string, unknown>> | undefined) ?? [];
  const relaciones: RelacionEnFicha[] = relacionesRaw.map((r) => ({
    con: String(r.con),
    tipo: String(r.tipo),
    episodio: Number(r.episodio),
  }));

  const result: Entity = {
    tipo,
    nombre: String(fm.nombre),
    alias: (fm.alias as string[] | undefined) ?? [],
    apariciones: (fm.apariciones as number[] | undefined) ?? [],
    menciones,
  };
  if (fm.sub_tipo) result.subTipo = fm.sub_tipo as "PJ" | "PNJ";
  if (relaciones.length) result.relaciones = relaciones;
  if (fm.ultima_actualizacion) result.ultimaActualizacion = String(fm.ultima_actualizacion);

  return result;
}

function parseMenciones(body: string): Mention[] {
  const result: Mention[] = [];
  const re = /^### \[\[(\d+)[^\]]*\]\][^\n]*\n((?:- [^\n]+\n?)*)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const episodio = Number(m[1]);
    const bullets = matchBullets(m[2], /^- (.+)$/);
    for (const [t] of bullets) result.push({ episodio, texto: t });
  }
  return result;
}

// =========================================================================
// upsertMentionSection — utilidad clave para idempotencia
// =========================================================================

export type MentionSectionUpdate = {
  episodio: number;
  tituloEpisodio: string;
  bullets: string[];
};

export function upsertMentionSection(md: string, update: MentionSectionUpdate): string {
  const parsed = matter(md);
  const fm = parsed.data;
  let body = parsed.content;

  const padded = String(update.episodio).padStart(3, "0");
  const refTarget = `${padded}-${slugify(update.tituloEpisodio)}`;
  const header = `### [[${refTarget}|Ep. ${update.episodio} — ${update.tituloEpisodio}]]`;
  const newSection =
    header + "\n" + update.bullets.map((b) => `- ${b}`).join("\n") + "\n";

  // Buscar sección existente del mismo número (independiente del título)
  const headerRx = new RegExp(`^### \\[\\[${padded}[^\\]]*\\]\\][^\\n]*\\n((?:- [^\\n]+\\n?)*)`, "m");
  if (headerRx.test(body)) {
    body = body.replace(headerRx, newSection);
  } else {
    // Insertar al final, manteniendo "## Menciones por episodio"
    if (!/^##\s+Menciones por episodio/m.test(body)) {
      body = body.trimEnd() + "\n\n## Menciones por episodio\n\n";
    }
    body = body.trimEnd() + "\n\n" + newSection;
  }

  return matter.stringify(body, fm);
}

// =========================================================================
// helpers
// =========================================================================

function extractSection(body: string, heading: string): string | null {
  const rx = new RegExp(`(?:^|\\n)#{2,3} ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n#{2,3} |$)`, "m");
  const m = body.match(rx);
  return m ? m[1].trim() : null;
}

function matchBullets(s: string, pattern: RegExp): string[][] {
  const result: string[][] = [];
  for (const line of s.split("\n")) {
    const m = line.match(pattern);
    if (m) result.push(m.slice(1));
  }
  return result;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

- [ ] **Step 4: Ejecutar tests, verificar que pasan**

Run: `npm test -- tests/markdown.test.ts`
Expected: PASS (todos los grupos describe verdes).

Si alguno falla (por ej. roundtrip exacto con campos opcionales), ajustar serialización para emitir solo campos presentes — el test debe matchear lo que serialize produce y parse devuelve, omitiendo `undefined`.

- [ ] **Step 5: Commit**

```bash
git add lib/markdown.ts tests/markdown.test.ts
git commit -m "Markdown parse/serialize con upsertMentionSection"
```

---

## Task 6: Schema zod del LLM (`lib/schema.ts`)

Define el shape exacto que la IA debe devolver. Se usa para validar la respuesta y para generar el JSON Schema de la tool.

**Files:**
- Create: `lib/schema.ts`, `tests/schema.test.ts`

- [ ] **Step 1: Escribir test**

`tests/schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loreExtraidoSchema, loreToolJsonSchema } from "@/lib/schema";

describe("loreExtraidoSchema", () => {
  it("acepta un payload mínimo con todas las categorías vacías", () => {
    const empty = {
      personajes: [], lugares: [], eventos: [], objetos: [], facciones: [],
      worldbuilding: [], relaciones: [], misterios: [], quotes: [], decisiones: [],
    };
    expect(() => loreExtraidoSchema.parse(empty)).not.toThrow();
  });

  it("acepta un payload válido completo", () => {
    const payload = {
      personajes: [{ nombre: "Mysha", descripcion: "bruja", alias: ["roja"] }],
      lugares: [{ nombre: "Bosque", descripcion: "lúgubre" }],
      eventos: [], objetos: [], facciones: [], worldbuilding: [],
      relaciones: [{ de: "Mysha", a: "Selenne", tipo: "hermana" }],
      misterios: ["¿Quién es X?"],
      quotes: [{ texto: "hola" }],
      decisiones: [{ descripcion: "huyeron", protagonistas: ["Mysha"] }],
    };
    expect(() => loreExtraidoSchema.parse(payload)).not.toThrow();
  });

  it("rechaza si falta una categoría", () => {
    const incomplete = {
      personajes: [], lugares: [], eventos: [], objetos: [], facciones: [],
      worldbuilding: [], relaciones: [], misterios: [], quotes: [],
      // falta decisiones
    };
    expect(() => loreExtraidoSchema.parse(incomplete)).toThrow();
  });

  it("rechaza un personaje sin nombre", () => {
    const bad = {
      personajes: [{ descripcion: "x" }],
      lugares: [], eventos: [], objetos: [], facciones: [],
      worldbuilding: [], relaciones: [], misterios: [], quotes: [], decisiones: [],
    };
    expect(() => loreExtraidoSchema.parse(bad)).toThrow();
  });
});

describe("loreToolJsonSchema", () => {
  it("expone un JSON Schema con todas las categorías como required", () => {
    const schema = loreToolJsonSchema();
    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(
      expect.arrayContaining([
        "personajes", "lugares", "eventos", "objetos", "facciones",
        "worldbuilding", "relaciones", "misterios", "quotes", "decisiones",
      ])
    );
  });
});
```

- [ ] **Step 2: Ejecutar test, verificar fallo**

Run: `npm test -- tests/schema.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `lib/schema.ts`**

```ts
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const nombreDescr = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
});

export const loreExtraidoSchema = z.object({
  personajes: z.array(
    nombreDescr.extend({ alias: z.array(z.string()).optional() })
  ),
  lugares: z.array(nombreDescr),
  eventos: z.array(nombreDescr),
  objetos: z.array(nombreDescr),
  facciones: z.array(nombreDescr),
  worldbuilding: z.array(
    z.object({ tema: z.string().min(1), descripcion: z.string().min(1) })
  ),
  relaciones: z.array(
    z.object({
      de: z.string().min(1),
      a: z.string().min(1),
      tipo: z.string().min(1),
    })
  ),
  misterios: z.array(z.string().min(1)),
  quotes: z.array(
    z.object({ texto: z.string().min(1), autor: z.string().optional() })
  ),
  decisiones: z.array(
    z.object({
      descripcion: z.string().min(1),
      protagonistas: z.array(z.string()).min(1),
    })
  ),
});

export type LoreExtraidoT = z.infer<typeof loreExtraidoSchema>;

/** Devuelve el JSON Schema (sin $schema/$ref) para usar como tool input_schema. */
export function loreToolJsonSchema(): Record<string, unknown> {
  const full = zodToJsonSchema(loreExtraidoSchema, {
    name: "LoreExtraido",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  // zodToJsonSchema envuelve en { $ref, definitions } cuando se le da name.
  // Resolver al objeto directo para que Anthropic lo acepte como input_schema.
  if (full.definitions) {
    const defs = full.definitions as Record<string, unknown>;
    const inner = defs.LoreExtraido as Record<string, unknown>;
    return { ...inner };
  }
  return full;
}
```

- [ ] **Step 4: Ejecutar test, todos pasan**

Run: `npm test -- tests/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/schema.ts tests/schema.test.ts
git commit -m "Schema zod + JSON Schema para tool de Claude"
```

---

## Task 7: Vault I/O — bootstrap + writeEpisode (`lib/vault.ts` parte 1)

**Files:**
- Create: `lib/vault.ts`, `tests/vault.test.ts`

- [ ] **Step 1: Escribir test de bootstrap y writeEpisode**

`tests/vault.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createVault } from "@/lib/vault";
import type { Episodio } from "@/lib/types";

function tmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "mysha-vault-"));
}

const ep: Episodio = {
  numero: 67,
  titulo: "La hoguera",
  procesado: "2026-05-13T14:22:00.000Z",
  resumenOriginal: "Mysha hace algo.",
  extraido: {
    personajes: [{ nombre: "Mysha", descripcion: "recita el conjuro" }],
    lugares: [{ nombre: "Bosque de Espinas", descripcion: "escenario" }],
    eventos: [], objetos: [], facciones: [], worldbuilding: [],
    relaciones: [], misterios: ["¿Quién dejó la nota?"],
    quotes: [], decisiones: [],
  },
};

describe("vault bootstrap", () => {
  it("crea las 10 carpetas del vault si no existen", async () => {
    const root = tmp();
    const vault = createVault(root);
    await vault.bootstrap();
    for (const folder of [
      "episodios","personajes","lugares","eventos","objetos","facciones",
      "worldbuilding","misterios","quotes","decisiones",
    ]) {
      expect(fs.existsSync(path.join(root, folder))).toBe(true);
    }
  });

  it("es idempotente (no falla si ya existen)", async () => {
    const root = tmp();
    const vault = createVault(root);
    await vault.bootstrap();
    await expect(vault.bootstrap()).resolves.not.toThrow();
  });
});

describe("writeEpisode", () => {
  it("escribe el .md del episodio en episodios/", async () => {
    const root = tmp();
    const vault = createVault(root);
    await vault.bootstrap();
    await vault.writeEpisode(ep);
    const file = path.join(root, "episodios", "067-la-hoguera.md");
    expect(fs.existsSync(file)).toBe(true);
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("tipo: episodio");
    expect(content).toContain("numero: 67");
    expect(content).toContain("- **[[Mysha]]** — recita el conjuro");
  });

  it("sobreescribe si se re-procesa el mismo número aunque cambie el título", async () => {
    const root = tmp();
    const vault = createVault(root);
    await vault.bootstrap();
    await vault.writeEpisode(ep);
    await vault.writeEpisode({ ...ep, titulo: "La hoguera renombrada" });
    const files = fs.readdirSync(path.join(root, "episodios"));
    expect(files.filter((f) => f.startsWith("067-"))).toHaveLength(1);
    expect(files[0]).toBe("067-la-hoguera-renombrada.md");
  });
});
```

- [ ] **Step 2: Ejecutar test, verificar fallo**

Run: `npm test -- tests/vault.test.ts`
Expected: FAIL — módulo no encontrado.

- [ ] **Step 3: Implementar `lib/vault.ts` (parte 1: bootstrap + writeEpisode)**

```ts
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import {
  serializeEpisodio,
  parseEpisodio,
  serializeEntity,
  parseEntity,
  upsertMentionSection,
} from "./markdown";
import { episodeFilename, slugify } from "./slugify";
import {
  TYPE_TO_FOLDER,
  VAULT_FOLDERS,
  type Entity,
  type EntityType,
  type Episodio,
} from "./types";

export interface Vault {
  bootstrap(): Promise<void>;
  writeEpisode(ep: Episodio): Promise<void>;
  readEpisode(numero: number): Promise<Episodio | null>;
  readEntity(tipo: EntityType, nombre: string): Promise<Entity | null>;
  appendOrReplaceMention(
    tipo: EntityType,
    nombre: string,
    update: { episodio: number; tituloEpisodio: string; bullets: string[] }
  ): Promise<void>;
  listByType(tipo: EntityType): Promise<Array<{ nombre: string; slug: string; apariciones: number[] }>>;
  listEpisodes(): Promise<Array<{ numero: number; titulo: string; slug: string }>>;
}

export function createVault(rootPath: string): Vault {
  const root = path.resolve(rootPath);

  async function bootstrap() {
    for (const folder of VAULT_FOLDERS) {
      await fs.mkdir(path.join(root, folder), { recursive: true });
    }
  }

  async function writeEpisode(ep: Episodio) {
    const folder = path.join(root, "episodios");
    await fs.mkdir(folder, { recursive: true });

    // Borrar archivos viejos con el mismo número pero distinto título
    const padded = String(ep.numero).padStart(3, "0");
    const existing = (await fs.readdir(folder)).filter(
      (f) => f.startsWith(`${padded}-`) && f.endsWith(".md")
    );
    for (const f of existing) await fs.unlink(path.join(folder, f));

    const filename = episodeFilename(ep.numero, ep.titulo);
    const content = serializeEpisodio(ep);
    await writeAtomic(path.join(folder, filename), content);
  }

  async function readEpisode(numero: number): Promise<Episodio | null> {
    const folder = path.join(root, "episodios");
    if (!fsSync.existsSync(folder)) return null;
    const padded = String(numero).padStart(3, "0");
    const match = (await fs.readdir(folder)).find(
      (f) => f.startsWith(`${padded}-`) && f.endsWith(".md")
    );
    if (!match) return null;
    const md = await fs.readFile(path.join(folder, match), "utf-8");
    return parseEpisodio(md);
  }

  async function readEntity(tipo: EntityType, nombre: string): Promise<Entity | null> {
    const folder = path.join(root, TYPE_TO_FOLDER[tipo]);
    if (!fsSync.existsSync(folder)) return null;
    const file = path.join(folder, `${slugify(nombre)}.md`);
    if (!fsSync.existsSync(file)) return null;
    const md = await fs.readFile(file, "utf-8");
    return parseEntity(md);
  }

  async function appendOrReplaceMention(
    tipo: EntityType,
    nombre: string,
    update: { episodio: number; tituloEpisodio: string; bullets: string[] }
  ) {
    const folder = path.join(root, TYPE_TO_FOLDER[tipo]);
    await fs.mkdir(folder, { recursive: true });
    const file = path.join(folder, `${slugify(nombre)}.md`);

    let entity: Entity;
    if (fsSync.existsSync(file)) {
      const md = await fs.readFile(file, "utf-8");
      entity = parseEntity(md);
    } else {
      entity = {
        tipo,
        nombre,
        alias: [],
        apariciones: [],
        menciones: [],
      };
    }

    // Append/replace via merge:
    const newMd = upsertMentionSection(
      serializeEntity(entity),
      update
    );

    // Recalcular apariciones desde el body actualizado
    const reparsed = parseEntity(newMd);
    reparsed.apariciones = [...new Set(reparsed.menciones.map((m) => m.episodio))].sort(
      (a, b) => a - b
    );
    reparsed.ultimaActualizacion = new Date().toISOString();

    await writeAtomic(file, serializeEntity(reparsed));
  }

  async function listByType(tipo: EntityType) {
    const folder = path.join(root, TYPE_TO_FOLDER[tipo]);
    if (!fsSync.existsSync(folder)) return [];
    const files = (await fs.readdir(folder)).filter((f) => f.endsWith(".md"));
    const out: Array<{ nombre: string; slug: string; apariciones: number[] }> = [];
    for (const f of files) {
      const md = await fs.readFile(path.join(folder, f), "utf-8");
      const entity = parseEntity(md);
      out.push({
        nombre: entity.nombre,
        slug: f.replace(/\.md$/, ""),
        apariciones: entity.apariciones,
      });
    }
    return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  async function listEpisodes() {
    const folder = path.join(root, "episodios");
    if (!fsSync.existsSync(folder)) return [];
    const files = (await fs.readdir(folder)).filter((f) => f.endsWith(".md"));
    const out = [];
    for (const f of files) {
      const md = await fs.readFile(path.join(folder, f), "utf-8");
      const ep = parseEpisodio(md);
      out.push({
        numero: ep.numero,
        titulo: ep.titulo,
        slug: f.replace(/\.md$/, ""),
      });
    }
    return out.sort((a, b) => a.numero - b.numero);
  }

  return {
    bootstrap,
    writeEpisode,
    readEpisode,
    readEntity,
    appendOrReplaceMention,
    listByType,
    listEpisodes,
  };
}

// =========================================================================
// helpers
// =========================================================================

async function writeAtomic(filePath: string, content: string) {
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpPath, content, "utf-8");
  await fs.rename(tmpPath, filePath);
}
```

- [ ] **Step 4: Ejecutar tests de bootstrap + writeEpisode, todos pasan**

Run: `npm test -- tests/vault.test.ts`
Expected: PASS (los 4 tests escritos hasta ahora).

- [ ] **Step 5: Commit**

```bash
git add lib/vault.ts tests/vault.test.ts
git commit -m "Vault: bootstrap + writeEpisode con escritura atómica"
```

---

## Task 8: Vault I/O — appendOrReplaceMention + listByType

**Files:**
- Modify: `tests/vault.test.ts` (agregar describes)

- [ ] **Step 1: Agregar tests para appendOrReplaceMention y listByType**

Agregar al final de `tests/vault.test.ts`:
```ts
describe("appendOrReplaceMention", () => {
  it("crea la ficha si no existe", async () => {
    const root = tmp();
    const vault = createVault(root);
    await vault.bootstrap();
    await vault.appendOrReplaceMention("personaje", "Mysha", {
      episodio: 67,
      tituloEpisodio: "La hoguera",
      bullets: ["recita el conjuro"],
    });
    const file = path.join(root, "personajes", "mysha.md");
    expect(fs.existsSync(file)).toBe(true);
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("nombre: Mysha");
    expect(content).toContain("### [[067-la-hoguera|Ep. 67 — La hoguera]]");
    expect(content).toContain("- recita el conjuro");
  });

  it("agrega un episodio nuevo a una ficha existente", async () => {
    const root = tmp();
    const vault = createVault(root);
    await vault.bootstrap();
    await vault.appendOrReplaceMention("personaje", "Mysha", {
      episodio: 3, tituloEpisodio: "Prólogo", bullets: ["aparece"],
    });
    await vault.appendOrReplaceMention("personaje", "Mysha", {
      episodio: 67, tituloEpisodio: "La hoguera", bullets: ["recita el conjuro"],
    });
    const content = fs.readFileSync(path.join(root, "personajes", "mysha.md"), "utf-8");
    expect(content).toContain("- aparece");
    expect(content).toContain("- recita el conjuro");
    expect(content).toMatch(/apariciones: \[3, *67\]/);
  });

  it("reemplaza un episodio existente sin tocar los otros", async () => {
    const root = tmp();
    const vault = createVault(root);
    await vault.bootstrap();
    await vault.appendOrReplaceMention("personaje", "Mysha", {
      episodio: 3, tituloEpisodio: "Prólogo", bullets: ["aparece"],
    });
    await vault.appendOrReplaceMention("personaje", "Mysha", {
      episodio: 67, tituloEpisodio: "La hoguera", bullets: ["viejo"],
    });
    await vault.appendOrReplaceMention("personaje", "Mysha", {
      episodio: 67, tituloEpisodio: "La hoguera", bullets: ["nuevo"],
    });
    const content = fs.readFileSync(path.join(root, "personajes", "mysha.md"), "utf-8");
    expect(content).toContain("- nuevo");
    expect(content).not.toContain("- viejo");
    expect(content).toContain("- aparece");
  });
});

describe("listByType + listEpisodes", () => {
  it("lista entidades del tipo dado ordenadas alfabéticamente", async () => {
    const root = tmp();
    const vault = createVault(root);
    await vault.bootstrap();
    await vault.appendOrReplaceMention("personaje", "Veltra", {
      episodio: 1, tituloEpisodio: "x", bullets: ["x"],
    });
    await vault.appendOrReplaceMention("personaje", "Mysha", {
      episodio: 1, tituloEpisodio: "x", bullets: ["x"],
    });
    const list = await vault.listByType("personaje");
    expect(list.map((e) => e.nombre)).toEqual(["Mysha", "Veltra"]);
    expect(list[0].apariciones).toEqual([1]);
  });

  it("lista episodios ordenados por número", async () => {
    const root = tmp();
    const vault = createVault(root);
    await vault.bootstrap();
    await vault.writeEpisode({ ...ep, numero: 7, titulo: "Siete" });
    await vault.writeEpisode({ ...ep, numero: 3, titulo: "Tres" });
    const list = await vault.listEpisodes();
    expect(list.map((e) => e.numero)).toEqual([3, 7]);
  });
});
```

- [ ] **Step 2: Ejecutar tests, todos pasan**

Run: `npm test -- tests/vault.test.ts`
Expected: PASS (todos los describes verdes).

Si algún test de "apariciones se recalcula" falla por formato YAML (`[3, 67]` vs `[3,67]` vs multilinea), ajustar el regex del test al formato real que produce `gray-matter.stringify`. Ejecutar `console.log(content)` puntual si hace falta para descubrirlo.

- [ ] **Step 3: Commit**

```bash
git add tests/vault.test.ts
git commit -m "Vault: tests de appendOrReplaceMention y listado"
```

---

## Task 9: Prompt de extracción + `lib/prompts.ts`

**Files:**
- Create: `prompts/extract-lore.md`, `lib/prompts.ts`

- [ ] **Step 1: Escribir el prompt en `prompts/extract-lore.md`**

```markdown
Sos un asistente que extrae lore estructurado de resúmenes de episodios de una campaña de rol (TTRPG) en español. Cada resumen viene de la transcripción automática de Gemini sobre un video de YouTube.

Tu única salida es una llamada a la tool `registrar_lore` con un objeto JSON que cumple el schema dado. NUNCA respondas en texto suelto.

## Reglas

1. **Idioma:** el resumen está en español; todo lo que devuelvas está en español.
2. **Categorías obligatorias:** SIEMPRE incluí todas las 10 categorías en el JSON, aunque la mayoría estén vacías (`[]`). No omitas claves.
3. **Personajes:** humanos, no humanos, entidades con nombre propio. Si el resumen menciona "el bardo" sin nombre, no lo crees como personaje (poné lo relevante en `worldbuilding` o ignoralo). Si tiene nombre o apodo recurrente, sí.
4. **Selenne y Veltra:** son personalidades que viven en el cuerpo de Mysha. Tratá a las tres como personajes separados.
5. **Lugares:** ciudades, bosques, ruinas, edificios concretos. No "el bosque" genérico.
6. **Eventos:** sucesos con identidad propia ("Ritual del Té", "Caída del Coven"). No "pelearon" como evento.
7. **Objetos:** artefactos, armas, libros con nombre.
8. **Facciones:** grupos organizados ("Coven Rosa", "Té de Medianoche").
9. **Worldbuilding:** información del mundo que no es entidad concreta (cosmología, magia, historia general). Cada item tiene `tema` corto + `descripcion`.
10. **Relaciones:** SOLO si el resumen establece o revela una relación entre personajes ya mencionados en este mismo resumen. Usá nombres exactos.
11. **Misterios:** preguntas abiertas, cosas que quedaron sin respuesta. Una frase por mistero.
12. **Quotes:** frases textuales memorables del resumen, con autor si se identifica.
13. **Decisiones:** decisiones importantes que tomó el grupo de PJs, con sus protagonistas.
14. **Descripciones:** una frase corta (10–25 palabras), foco en lo que se reveló en ESTE episodio puntual. No repitas info general que ya se sabría.
15. **No inventes:** si algo no está en el resumen, no lo agregues. Mejor un array vacío que datos fabricados.
16. **Nombres:** preservá la grafía exacta del resumen, incluyendo tildes y mayúsculas.

## Input

Vas a recibir el resumen como:

```
Episodio {N}:

{texto del resumen}
```

Llamá a `registrar_lore` con el JSON resultante.
```

- [ ] **Step 2: Crear `lib/prompts.ts`**

```ts
import fs from "node:fs";
import path from "node:path";

let cachedPrompt: string | null = null;

export function getExtractLorePrompt(): string {
  if (cachedPrompt) return cachedPrompt;
  const promptPath = path.join(process.cwd(), "prompts", "extract-lore.md");
  cachedPrompt = fs.readFileSync(promptPath, "utf-8");
  return cachedPrompt;
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add prompts/extract-lore.md lib/prompts.ts
git commit -m "Prompt de extracción + loader"
```

---

## Task 10: Cliente Claude (`lib/claude.ts`)

Wrapper sobre el SDK con prompt caching y tool use forzado.

**Files:**
- Create: `lib/claude.ts`, `tests/claude.test.ts`

- [ ] **Step 1: Escribir test con mock del SDK**

`tests/claude.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: createMock };
      constructor(_: unknown) {}
    },
  };
});

import { extractLore } from "@/lib/claude";

describe("extractLore", () => {
  it("llama al modelo con cache_control en system y tools, y forza la tool", async () => {
    createMock.mockResolvedValueOnce({
      stop_reason: "tool_use",
      content: [
        {
          type: "tool_use",
          name: "registrar_lore",
          input: {
            personajes: [{ nombre: "Mysha", descripcion: "x" }],
            lugares: [], eventos: [], objetos: [], facciones: [],
            worldbuilding: [], relaciones: [],
            misterios: [], quotes: [], decisiones: [],
          },
        },
      ],
    });

    const result = await extractLore({
      apiKey: "sk-test",
      episodioNumero: 67,
      resumen: "Mysha hizo X",
    });

    expect(createMock).toHaveBeenCalledOnce();
    const callArgs = createMock.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-4-6");
    expect(callArgs.temperature).toBe(0.2);
    expect(callArgs.max_tokens).toBeGreaterThanOrEqual(4096);
    expect(callArgs.tool_choice).toEqual({ type: "tool", name: "registrar_lore" });

    // system es array con cache_control
    expect(Array.isArray(callArgs.system)).toBe(true);
    expect(callArgs.system[0].cache_control).toEqual({ type: "ephemeral" });

    // tools incluye registrar_lore con cache_control
    expect(callArgs.tools[0].name).toBe("registrar_lore");
    expect(callArgs.tools[0].cache_control).toEqual({ type: "ephemeral" });

    expect(result.personajes[0].nombre).toBe("Mysha");
  });

  it("lanza error si el modelo no llama a la tool", async () => {
    createMock.mockResolvedValueOnce({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "se olvidó la tool" }],
    });

    await expect(
      extractLore({ apiKey: "sk-test", episodioNumero: 1, resumen: "x" })
    ).rejects.toThrow(/tool_use|registrar_lore/i);
  });

  it("reintenta con temperature=0 si el primer intento no pasa validación", async () => {
    // Primer intento: malformado
    createMock.mockResolvedValueOnce({
      stop_reason: "tool_use",
      content: [
        { type: "tool_use", name: "registrar_lore", input: { personajes: "no es array" } },
      ],
    });
    // Segundo intento: válido
    createMock.mockResolvedValueOnce({
      stop_reason: "tool_use",
      content: [
        {
          type: "tool_use",
          name: "registrar_lore",
          input: {
            personajes: [], lugares: [], eventos: [], objetos: [], facciones: [],
            worldbuilding: [], relaciones: [],
            misterios: [], quotes: [], decisiones: [],
          },
        },
      ],
    });

    const result = await extractLore({
      apiKey: "sk-test",
      episodioNumero: 1,
      resumen: "x",
    });
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(createMock.mock.calls[1][0].temperature).toBe(0);
    expect(result.personajes).toEqual([]);
  });

  it("falla si los dos intentos vuelven malformados", async () => {
    createMock.mockResolvedValue({
      stop_reason: "tool_use",
      content: [
        { type: "tool_use", name: "registrar_lore", input: { personajes: "x" } },
      ],
    });

    await expect(
      extractLore({ apiKey: "sk-test", episodioNumero: 1, resumen: "x" })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Ejecutar test, verificar fallo**

Run: `npm test -- tests/claude.test.ts`
Expected: FAIL — módulo no encontrado.

- [ ] **Step 3: Implementar `lib/claude.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { getExtractLorePrompt } from "./prompts";
import { loreExtraidoSchema, loreToolJsonSchema } from "./schema";
import type { LoreExtraido } from "./types";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8000;

export type ExtractLoreInput = {
  apiKey: string;
  episodioNumero: number;
  resumen: string;
};

export async function extractLore(input: ExtractLoreInput): Promise<LoreExtraido> {
  const client = new Anthropic({ apiKey: input.apiKey });
  const systemPrompt = getExtractLorePrompt();

  // Primer intento con temperature=0.2
  const first = await callModel(client, systemPrompt, input, 0.2);
  const parsedFirst = loreExtraidoSchema.safeParse(first);
  if (parsedFirst.success) return parsedFirst.data;

  // Reintento con temperature=0 y mensaje explícito al modelo (spec §8)
  const retryUserMessage =
    `Episodio ${input.episodioNumero}:\n\n${input.resumen}\n\n` +
    `IMPORTANTE: el intento anterior falló validación. Asegurate de incluir TODAS ` +
    `las categorías como arrays (aunque estén vacías): personajes, lugares, eventos, ` +
    `objetos, facciones, worldbuilding, relaciones, misterios, quotes, decisiones.`;
  const retry = await callModel(
    client,
    systemPrompt,
    { ...input, resumen: retryUserMessage },
    0
  );
  return loreExtraidoSchema.parse(retry);
}

async function callModel(
  client: Anthropic,
  systemPrompt: string,
  input: ExtractLoreInput,
  temperature: number
): Promise<unknown> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: "registrar_lore",
        description:
          "Registra el lore extraído de un episodio en formato estructurado.",
        input_schema: loreToolJsonSchema() as Anthropic.Tool.InputSchema,
        cache_control: { type: "ephemeral" },
      },
    ],
    tool_choice: { type: "tool", name: "registrar_lore" },
    messages: [
      {
        role: "user",
        content: `Episodio ${input.episodioNumero}:\n\n${input.resumen}`,
      },
    ],
  });

  const toolUse = response.content.find(
    (block) => block.type === "tool_use" && block.name === "registrar_lore"
  ) as { type: "tool_use"; name: string; input: unknown } | undefined;

  if (!toolUse) {
    throw new Error(
      `El modelo no llamó a la tool registrar_lore. stop_reason=${response.stop_reason}`
    );
  }

  return toolUse.input;
}
```

- [ ] **Step 4: Ejecutar tests, todos pasan**

Run: `npm test -- tests/claude.test.ts`
Expected: PASS (3 tests).

Si el test del cache_control falla por la forma exacta del objeto (algunas versiones del SDK pasan `cache_control` como prop separado), ajustar el wrapper para que cumpla con la API actual del SDK.

- [ ] **Step 5: Commit**

```bash
git add lib/claude.ts tests/claude.test.ts
git commit -m "Cliente Claude con prompt caching y tool use forzado"
```

---

## Task 11: Server action `extract`

Server action que invoca `claude.extractLore` con la API key del entorno.

**Files:**
- Create: `app/actions/extract.ts`

- [ ] **Step 1: Crear `app/actions/extract.ts`**

```ts
"use server";

import { extractLore } from "@/lib/claude";
import { loadConfig } from "@/lib/config";
import type { LoreExtraido } from "@/lib/types";

export type ExtractInput = {
  numero: number;
  titulo: string;
  resumen: string;
  fechaGrabacion?: string;
};

export type ExtractResult =
  | { ok: true; data: { input: ExtractInput; lore: LoreExtraido } }
  | { ok: false; error: string };

export async function extractEpisodioAction(input: ExtractInput): Promise<ExtractResult> {
  try {
    const cfg = loadConfig();
    const lore = await extractLore({
      apiKey: cfg.anthropicApiKey,
      episodioNumero: input.numero,
      resumen: input.resumen,
    });
    return { ok: true, data: { input, lore } };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/actions/extract.ts
git commit -m "Server action: extract — llama Claude con la API key del entorno"
```

---

## Task 12: Server action `commit` (idempotente)

Escribe el episodio y actualiza las fichas de entidad mencionadas.

**Files:**
- Create: `app/actions/commit.ts`

- [ ] **Step 1: Crear `app/actions/commit.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { loadConfig } from "@/lib/config";
import { createVault } from "@/lib/vault";
import { episodeFilename } from "@/lib/slugify";
import type { Episodio, EntityType, LoreExtraido } from "@/lib/types";

export type CommitInput = {
  numero: number;
  titulo: string;
  fechaGrabacion?: string;
  resumenOriginal: string;
  lore: LoreExtraido;
};

export type CommitResult =
  | { ok: true; episodeSlug: string }
  | { ok: false; error: string };

export async function commitEpisodioAction(input: CommitInput): Promise<CommitResult> {
  try {
    const cfg = loadConfig();
    const vault = createVault(cfg.vaultPath);
    await vault.bootstrap();

    const ep: Episodio = {
      numero: input.numero,
      titulo: input.titulo,
      fechaGrabacion: input.fechaGrabacion,
      procesado: new Date().toISOString(),
      resumenOriginal: input.resumenOriginal,
      extraido: input.lore,
    };

    // 1) Escribir el episodio
    await vault.writeEpisode(ep);

    // 2) Para cada entidad mencionada, upsert su sección de menciones
    const tasks: Array<{
      tipo: EntityType;
      nombre: string;
      bullets: string[];
    }> = [];

    const pushBullets = (
      tipo: EntityType,
      items: Array<{ nombre: string; descripcion: string }>
    ) => {
      for (const it of items) tasks.push({ tipo, nombre: it.nombre, bullets: [it.descripcion] });
    };
    pushBullets("personaje", input.lore.personajes);
    pushBullets("lugar", input.lore.lugares);
    pushBullets("evento", input.lore.eventos);
    pushBullets("objeto", input.lore.objetos);
    pushBullets("faccion", input.lore.facciones);

    for (const w of input.lore.worldbuilding) {
      tasks.push({ tipo: "worldbuilding", nombre: w.tema, bullets: [w.descripcion] });
    }
    for (const m of input.lore.misterios) {
      tasks.push({ tipo: "mistero", nombre: m.slice(0, 60), bullets: [m] });
    }
    for (const q of input.lore.quotes) {
      const nombre = `${q.texto.slice(0, 40)}${q.autor ? ` — ${q.autor}` : ""}`;
      tasks.push({ tipo: "quote", nombre, bullets: [`"${q.texto}"${q.autor ? ` — ${q.autor}` : ""}`] });
    }
    for (const d of input.lore.decisiones) {
      tasks.push({
        tipo: "decision",
        nombre: d.descripcion.slice(0, 60),
        bullets: [`${d.descripcion} (${d.protagonistas.join(", ")})`],
      });
    }

    // Mergear bullets del mismo (tipo, nombre)
    const merged = new Map<string, { tipo: EntityType; nombre: string; bullets: string[] }>();
    for (const t of tasks) {
      const key = `${t.tipo}::${t.nombre}`;
      if (!merged.has(key)) merged.set(key, { ...t });
      else merged.get(key)!.bullets.push(...t.bullets);
    }

    for (const { tipo, nombre, bullets } of merged.values()) {
      await vault.appendOrReplaceMention(tipo, nombre, {
        episodio: input.numero,
        tituloEpisodio: input.titulo,
        bullets,
      });
    }

    // Las relaciones se guardan SOLO en personajes (ya están en menciones de personaje
    // via la descripción si la IA las dejó ahí). Las relaciones explícitas se persisten
    // como sección "Relaciones" en el .md del episodio (no en frontmatter de personajes
    // por ahora — feature futura).

    const slug = episodeFilename(input.numero, input.titulo).replace(/\.md$/, "");

    revalidatePath("/", "layout");

    return { ok: true, episodeSlug: slug };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/actions/commit.ts
git commit -m "Server action: commit — escribe episodio + upsert de menciones"
```

---

## Task 13: Layout + Sidebar (estética grimorio)

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/Sidebar.tsx`

- [ ] **Step 1: Reescribir `app/layout.tsx`**

```tsx
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata = {
  title: "Mysha — Grimorio de lore",
  description: "Base de datos de lore de la campaña Mysha",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-ink-950 text-gold-dim min-h-screen">
        <div className="grid grid-cols-[240px_1fr] min-h-screen">
          <Sidebar />
          <main className="px-10 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Crear `components/Sidebar.tsx`**

```tsx
import Link from "next/link";

const tipos = [
  { label: "Personajes", href: "/entidades/personaje" },
  { label: "Lugares", href: "/entidades/lugar" },
  { label: "Eventos", href: "/entidades/evento" },
  { label: "Facciones", href: "/entidades/faccion" },
  { label: "Objetos", href: "/entidades/objeto" },
  { label: "Worldbuilding", href: "/entidades/worldbuilding" },
  { label: "Misterios", href: "/entidades/mistero" },
  { label: "Quotes", href: "/entidades/quote" },
  { label: "Decisiones", href: "/entidades/decision" },
];

export function Sidebar() {
  return (
    <aside className="bg-ink-900 border-r border-crimson-dark/40 px-6 py-8">
      <Link href="/" className="block">
        <h1 className="text-2xl text-crimson tracking-widest text-center mb-2">⛧ MYSHA ⛧</h1>
        <p className="text-xs italic text-gold-dim text-center mb-8">grimorio de lore</p>
      </Link>

      <Link
        href="/"
        className="block bg-crimson-dark text-gold-bright text-center py-2 mb-6 hover:bg-crimson transition-colors"
      >
        + Cargar episodio
      </Link>

      <nav className="space-y-1">
        <Link href="/episodios" className="block py-1 text-sm hover:text-gold">
          Episodios
        </Link>
        <div className="border-t border-crimson-dark/30 my-2" />
        {tipos.map((t) => (
          <Link key={t.href} href={t.href} className="block py-1 text-sm hover:text-gold">
            {t.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Verificar visualmente**

Run: `npm run dev`
Expected: abre `http://localhost:3000`, ves sidebar con paleta grimorio (rojo crimson + dorado mate) y navegación. Matar con Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/Sidebar.tsx
git commit -m "Layout con Sidebar grimorio"
```

---

## Task 14: Home — LoadEpisodeForm

**Files:**
- Create: `components/LoadEpisodeForm.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Crear `components/LoadEpisodeForm.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { extractEpisodioAction, type ExtractInput } from "@/app/actions/extract";

const DRAFT_KEY = "mysha:draft";

export function LoadEpisodeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [numero, setNumero] = useState("");
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [resumen, setResumen] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numeroN = Number(numero);
    if (!numeroN || Number.isNaN(numeroN)) {
      setError("Número de episodio inválido");
      return;
    }
    if (!titulo.trim()) {
      setError("Título requerido");
      return;
    }
    if (!resumen.trim()) {
      setError("Resumen vacío");
      return;
    }

    const input: ExtractInput = {
      numero: numeroN,
      titulo: titulo.trim(),
      resumen: resumen.trim(),
      ...(fecha ? { fechaGrabacion: fecha } : {}),
    };

    // Guardar draft por si el usuario cierra la pestaña
    localStorage.setItem(DRAFT_KEY, JSON.stringify(input));

    startTransition(async () => {
      const res = await extractEpisodioAction(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Guardar el resultado para la página de review
      sessionStorage.setItem("mysha:review", JSON.stringify(res.data));
      router.push("/review");
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl">
      <h2 className="text-3xl mb-2 text-crimson tracking-wider">⛧ Cargar episodio ⛧</h2>
      <p className="text-sm italic text-gold-dim mb-6">
        Pegá el resumen automático de Gemini y la IA va a extraer el lore.
      </p>

      <textarea
        value={resumen}
        onChange={(e) => setResumen(e.target.value)}
        rows={14}
        placeholder="— Pegá el resumen del episodio aquí —"
        className="w-full bg-ink-900 border border-crimson-dark text-gold-dim italic p-4 mb-3 resize-y focus:outline-none focus:border-crimson focus:shadow-[0_0_12px_#6a1010]"
      />

      <div className="grid grid-cols-3 gap-3 mb-3">
        <input
          type="number"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Nº episodio"
          className="bg-ink-900 border border-crimson-dark text-gold-dim p-2 focus:outline-none focus:border-crimson"
        />
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título"
          className="bg-ink-900 border border-crimson-dark text-gold-dim p-2 focus:outline-none focus:border-crimson"
        />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="bg-ink-900 border border-crimson-dark text-gold-dim p-2 focus:outline-none focus:border-crimson"
        />
      </div>

      {error && (
        <div className="border border-crimson text-crimson p-3 mb-3 bg-ink-900">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-crimson-dark hover:bg-crimson text-gold-bright tracking-widest py-3 border border-crimson-glow disabled:opacity-50"
      >
        {isPending ? "⚗ extrayendo... ⚗" : "⚗ EXTRAER LORE ⚗"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Reescribir `app/page.tsx`**

```tsx
import { LoadEpisodeForm } from "@/components/LoadEpisodeForm";

export default function Home() {
  return <LoadEpisodeForm />;
}
```

- [ ] **Step 3: Verificar visualmente**

Run: `npm run dev`
Expected: home muestra el formulario con paleta grimorio. (No probamos el submit aún — eso requiere config válida.)

- [ ] **Step 4: Commit**

```bash
git add components/LoadEpisodeForm.tsx app/page.tsx
git commit -m "Home: LoadEpisodeForm con server action de extracción"
```

---

## Task 15: Review page — ReviewCard

Después de extraer, mostrar el output editable agrupado por categoría.

**Nota sobre detección de duplicados (spec §5.3):**
La detección visual con badge "Ya existe" se difiere a post-MVP. En este MVP, la deduplicación está implícita: `appendOrReplaceMention` resuelve por `slugify(nombre)`, así que si la IA propone "Mysha" cuando ya hay `personajes/mysha.md`, automáticamente se agrega una mención al archivo existente (no se duplica). Los casos edge — typos de la IA ("Myhsa") o alias no registrados — sí crearían duplicados, pero se pueden mergear manualmente en Obsidian después.

**Files:**
- Create: `app/review/page.tsx`, `components/ReviewCard.tsx`

- [ ] **Step 1: Crear `components/ReviewCard.tsx`**

```tsx
"use client";

import { useState } from "react";

export type ReviewCardItem = {
  id: string;
  primary: string;       // nombre o tema o texto
  secondary: string;     // descripción
  alias?: string[];
};

export function ReviewCard({
  title,
  items,
  onChange,
}: {
  title: string;
  items: ReviewCardItem[];
  onChange: (items: ReviewCardItem[]) => void;
}) {
  if (items.length === 0) {
    return (
      <section className="mb-6">
        <h3 className="text-xl text-gold mb-2">{title} <span className="text-xs italic text-gold-dim">(0)</span></h3>
        <p className="text-sm italic text-gold-dim">— nada extraído en esta categoría —</p>
      </section>
    );
  }

  function update(i: number, patch: Partial<ReviewCardItem>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(items.filter((_, j) => j !== i));
  }

  return (
    <section className="mb-6">
      <h3 className="text-xl text-gold mb-2">
        {title} <span className="text-xs italic text-gold-dim">({items.length})</span>
      </h3>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={it.id} className="bg-ink-900 border border-crimson-dark/50 p-3">
            <div className="flex gap-2 items-start">
              <input
                value={it.primary}
                onChange={(e) => update(i, { primary: e.target.value })}
                className="bg-ink-950 border border-crimson-dark/40 text-gold font-bold p-1 flex-1"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-crimson hover:text-crimson-glow text-sm px-2"
                title="Descartar"
              >
                ✕
              </button>
            </div>
            <textarea
              value={it.secondary}
              onChange={(e) => update(i, { secondary: e.target.value })}
              rows={2}
              className="w-full bg-ink-950 border border-crimson-dark/40 text-gold-dim p-1 mt-2 text-sm"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Crear `app/review/page.tsx`**

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReviewCard, type ReviewCardItem } from "@/components/ReviewCard";
import { commitEpisodioAction, type CommitInput } from "@/app/actions/commit";
import type { LoreExtraido } from "@/lib/types";

type DraftBundle = {
  input: { numero: number; titulo: string; resumen: string; fechaGrabacion?: string };
  lore: LoreExtraido;
};

function makeItems<T>(
  arr: T[],
  primaryKey: keyof T,
  secondaryKey: keyof T
): ReviewCardItem[] {
  return arr.map((x, i) => ({
    id: `${String(primaryKey)}-${i}`,
    primary: String(x[primaryKey]),
    secondary: String(x[secondaryKey]),
  }));
}

export default function ReviewPage() {
  const router = useRouter();
  const [bundle, setBundle] = useState<DraftBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estado editable por categoría
  const [personajes, setPersonajes] = useState<ReviewCardItem[]>([]);
  const [lugares, setLugares] = useState<ReviewCardItem[]>([]);
  const [eventos, setEventos] = useState<ReviewCardItem[]>([]);
  const [objetos, setObjetos] = useState<ReviewCardItem[]>([]);
  const [facciones, setFacciones] = useState<ReviewCardItem[]>([]);
  const [worldbuilding, setWorldbuilding] = useState<ReviewCardItem[]>([]);
  const [misterios, setMisterios] = useState<ReviewCardItem[]>([]);
  const [quotes, setQuotes] = useState<ReviewCardItem[]>([]);
  const [decisiones, setDecisiones] = useState<ReviewCardItem[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("mysha:review");
    if (!raw) {
      router.replace("/");
      return;
    }
    const b: DraftBundle = JSON.parse(raw);
    setBundle(b);
    setPersonajes(makeItems(b.lore.personajes, "nombre", "descripcion"));
    setLugares(makeItems(b.lore.lugares, "nombre", "descripcion"));
    setEventos(makeItems(b.lore.eventos, "nombre", "descripcion"));
    setObjetos(makeItems(b.lore.objetos, "nombre", "descripcion"));
    setFacciones(makeItems(b.lore.facciones, "nombre", "descripcion"));
    setWorldbuilding(makeItems(b.lore.worldbuilding, "tema", "descripcion"));
    setMisterios(b.lore.misterios.map((m, i) => ({ id: `m-${i}`, primary: m, secondary: "" })));
    setQuotes(
      b.lore.quotes.map((q, i) => ({
        id: `q-${i}`,
        primary: q.texto,
        secondary: q.autor ?? "",
      }))
    );
    setDecisiones(
      b.lore.decisiones.map((d, i) => ({
        id: `d-${i}`,
        primary: d.descripcion,
        secondary: d.protagonistas.join(", "),
      }))
    );
  }, [router]);

  function onConfirm() {
    if (!bundle) return;
    setError(null);

    const lore: LoreExtraido = {
      personajes: personajes.map((it) => ({ nombre: it.primary, descripcion: it.secondary })),
      lugares: lugares.map((it) => ({ nombre: it.primary, descripcion: it.secondary })),
      eventos: eventos.map((it) => ({ nombre: it.primary, descripcion: it.secondary })),
      objetos: objetos.map((it) => ({ nombre: it.primary, descripcion: it.secondary })),
      facciones: facciones.map((it) => ({ nombre: it.primary, descripcion: it.secondary })),
      worldbuilding: worldbuilding.map((it) => ({ tema: it.primary, descripcion: it.secondary })),
      relaciones: bundle.lore.relaciones,
      misterios: misterios.map((it) => it.primary),
      quotes: quotes.map((it) => ({
        texto: it.primary,
        ...(it.secondary.trim() ? { autor: it.secondary.trim() } : {}),
      })),
      decisiones: decisiones.map((it) => ({
        descripcion: it.primary,
        protagonistas: it.secondary
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      })),
    };

    const input: CommitInput = {
      numero: bundle.input.numero,
      titulo: bundle.input.titulo,
      fechaGrabacion: bundle.input.fechaGrabacion,
      resumenOriginal: bundle.input.resumen,
      lore,
    };

    startTransition(async () => {
      const res = await commitEpisodioAction(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      sessionStorage.removeItem("mysha:review");
      localStorage.removeItem("mysha:draft");
      router.push(`/episodios/${bundle.input.numero}`);
    });
  }

  if (!bundle) return <p className="italic text-gold-dim">Cargando draft...</p>;

  return (
    <div className="max-w-4xl">
      <h2 className="text-3xl mb-2 text-crimson tracking-wider">
        ⛧ Revisión — Ep. {bundle.input.numero}: {bundle.input.titulo} ⛧
      </h2>
      <p className="text-sm italic text-gold-dim mb-6">
        Editá, descartá o ajustá lo que extrajo la IA antes de guardar al vault.
      </p>

      <ReviewCard title="Personajes" items={personajes} onChange={setPersonajes} />
      <ReviewCard title="Lugares" items={lugares} onChange={setLugares} />
      <ReviewCard title="Eventos" items={eventos} onChange={setEventos} />
      <ReviewCard title="Objetos" items={objetos} onChange={setObjetos} />
      <ReviewCard title="Facciones" items={facciones} onChange={setFacciones} />
      <ReviewCard title="Worldbuilding" items={worldbuilding} onChange={setWorldbuilding} />
      <ReviewCard title="Misterios" items={misterios} onChange={setMisterios} />
      <ReviewCard title="Quotes (autor en la línea 2)" items={quotes} onChange={setQuotes} />
      <ReviewCard
        title="Decisiones (protagonistas separados por coma)"
        items={decisiones}
        onChange={setDecisiones}
      />

      {error && (
        <div className="border border-crimson text-crimson p-3 my-4 bg-ink-900">{error}</div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 border border-crimson-dark text-gold-dim hover:text-gold"
          type="button"
        >
          ← Volver
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 bg-crimson-dark hover:bg-crimson text-gold-bright tracking-widest py-3 border border-crimson-glow disabled:opacity-50"
          type="button"
        >
          {isPending ? "⚗ guardando... ⚗" : "⚗ CONFIRMAR Y GUARDAR ⚗"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2.5: Verificar typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/review/page.tsx components/ReviewCard.tsx
git commit -m "Review page con cards editables y commit al vault"
```

---

## Task 16: Páginas de lectura (episodio + entidad)

**Files:**
- Create: `app/episodios/page.tsx`, `app/episodios/[num]/page.tsx`
- Create: `app/entidades/[tipo]/page.tsx`, `app/entidades/[tipo]/[slug]/page.tsx`

- [ ] **Step 1: `app/episodios/page.tsx` — lista de episodios**

```tsx
import Link from "next/link";
import { loadConfig } from "@/lib/config";
import { createVault } from "@/lib/vault";

export default async function EpisodiosPage() {
  const cfg = loadConfig();
  const vault = createVault(cfg.vaultPath);
  await vault.bootstrap();
  const eps = await vault.listEpisodes();

  return (
    <div>
      <h2 className="text-3xl mb-6 text-crimson tracking-wider">Episodios</h2>
      {eps.length === 0 && (
        <p className="italic text-gold-dim">Todavía no cargaste ningún episodio.</p>
      )}
      <ul className="space-y-2">
        {eps.map((ep) => (
          <li key={ep.numero}>
            <Link
              href={`/episodios/${ep.numero}`}
              className="block border border-crimson-dark/40 bg-ink-900 p-3 hover:bg-ink-800"
            >
              <span className="text-gold font-bold">Ep. {ep.numero}</span>
              <span className="text-gold-dim ml-3">{ep.titulo}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: `app/episodios/[num]/page.tsx` — detalle de episodio**

```tsx
import { notFound } from "next/navigation";
import { loadConfig } from "@/lib/config";
import { createVault } from "@/lib/vault";

export default async function EpisodioPage({
  params,
}: {
  params: Promise<{ num: string }>;
}) {
  const { num } = await params;
  const numero = Number(num);
  if (Number.isNaN(numero)) notFound();

  const cfg = loadConfig();
  const vault = createVault(cfg.vaultPath);
  const ep = await vault.readEpisode(numero);
  if (!ep) notFound();

  const ex = ep.extraido;

  return (
    <article className="max-w-3xl">
      <h2 className="text-3xl mb-1 text-crimson tracking-wider">
        Ep. {ep.numero} — {ep.titulo}
      </h2>
      <p className="text-xs italic text-gold-dim mb-6">
        Procesado: {new Date(ep.procesado).toLocaleString("es-AR")}
        {ep.fechaGrabacion ? ` • Grabado: ${ep.fechaGrabacion}` : ""}
      </p>

      <section className="mb-6">
        <h3 className="text-xl text-gold mb-2">Resumen original</h3>
        <p className="whitespace-pre-line text-gold-dim text-sm">{ep.resumenOriginal}</p>
      </section>

      {renderList("Personajes", ex.personajes, "personaje")}
      {renderList("Lugares", ex.lugares, "lugar")}
      {renderList("Eventos", ex.eventos, "evento")}
      {renderList("Objetos", ex.objetos, "objeto")}
      {renderList("Facciones", ex.facciones, "faccion")}

      {ex.worldbuilding.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xl text-gold mb-2">Worldbuilding</h3>
          <ul className="list-disc list-inside text-sm">
            {ex.worldbuilding.map((w, i) => (
              <li key={i}>
                <strong className="text-gold">{w.tema}</strong> — {w.descripcion}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ex.misterios.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xl text-gold mb-2">Misterios</h3>
          <ul className="list-disc list-inside text-sm">
            {ex.misterios.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </section>
      )}

      {ex.quotes.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xl text-gold mb-2">Quotes</h3>
          {ex.quotes.map((q, i) => (
            <blockquote key={i} className="border-l-2 border-crimson pl-3 my-2 italic text-gold-dim">
              "{q.texto}"{q.autor ? <span className="ml-2 text-crimson">— {q.autor}</span> : null}
            </blockquote>
          ))}
        </section>
      )}

      {ex.decisiones.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xl text-gold mb-2">Decisiones</h3>
          <ul className="list-disc list-inside text-sm">
            {ex.decisiones.map((d, i) => (
              <li key={i}>
                {d.descripcion} <span className="text-gold-dim">({d.protagonistas.join(", ")})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

import Link from "next/link";
import { slugify } from "@/lib/slugify";

function renderList(
  title: string,
  items: Array<{ nombre: string; descripcion: string }>,
  tipo: string
) {
  if (!items.length) return null;
  return (
    <section className="mb-6">
      <h3 className="text-xl text-gold mb-2">{title}</h3>
      <ul className="list-disc list-inside text-sm space-y-1">
        {items.map((it, i) => (
          <li key={i}>
            <Link href={`/entidades/${tipo}/${slugify(it.nombre)}`} className="text-crimson hover:underline">
              {it.nombre}
            </Link>{" "}
            — {it.descripcion}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: `app/entidades/[tipo]/page.tsx` — lista por tipo**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadConfig } from "@/lib/config";
import { createVault } from "@/lib/vault";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";

const PLURALS: Record<EntityType, string> = {
  personaje: "Personajes",
  lugar: "Lugares",
  evento: "Eventos",
  objeto: "Objetos",
  faccion: "Facciones",
  worldbuilding: "Worldbuilding",
  mistero: "Misterios",
  quote: "Quotes",
  decision: "Decisiones",
};

export default async function EntidadesPorTipo({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const { tipo } = await params;
  if (!ENTITY_TYPES.includes(tipo as EntityType)) notFound();

  const cfg = loadConfig();
  const vault = createVault(cfg.vaultPath);
  await vault.bootstrap();
  const items = await vault.listByType(tipo as EntityType);

  return (
    <div>
      <h2 className="text-3xl mb-6 text-crimson tracking-wider">{PLURALS[tipo as EntityType]}</h2>
      {items.length === 0 && (
        <p className="italic text-gold-dim">— sin entradas todavía —</p>
      )}
      <ul className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <li key={it.slug}>
            <Link
              href={`/entidades/${tipo}/${it.slug}`}
              className="block border border-crimson-dark/40 bg-ink-900 p-3 hover:bg-ink-800"
            >
              <span className="text-gold font-bold">{it.nombre}</span>
              <span className="text-xs text-gold-dim ml-2">
                ({it.apariciones.length} {it.apariciones.length === 1 ? "ep." : "eps."})
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: `app/entidades/[tipo]/[slug]/page.tsx` — detalle de entidad**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadConfig } from "@/lib/config";
import { createVault } from "@/lib/vault";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";

export default async function EntidadDetalle({
  params,
}: {
  params: Promise<{ tipo: string; slug: string }>;
}) {
  const { tipo, slug } = await params;
  if (!ENTITY_TYPES.includes(tipo as EntityType)) notFound();

  const cfg = loadConfig();
  const vault = createVault(cfg.vaultPath);

  // Buscar por slug, no por nombre
  const all = await vault.listByType(tipo as EntityType);
  const match = all.find((x) => x.slug === slug);
  if (!match) notFound();

  const entity = await vault.readEntity(tipo as EntityType, match.nombre);
  if (!entity) notFound();

  const byEpisode = new Map<number, string[]>();
  for (const m of entity.menciones) {
    if (!byEpisode.has(m.episodio)) byEpisode.set(m.episodio, []);
    byEpisode.get(m.episodio)!.push(m.texto);
  }
  const orderedEpisodes = [...byEpisode.keys()].sort((a, b) => a - b);

  return (
    <article className="max-w-3xl">
      <h2 className="text-3xl mb-1 text-crimson tracking-wider">{entity.nombre}</h2>
      <p className="text-xs italic text-gold-dim mb-1">
        {tipo} {entity.subTipo ? `• ${entity.subTipo}` : ""}{" "}
        • Apariciones: {entity.apariciones.join(", ") || "—"}
      </p>
      {entity.alias.length > 0 && (
        <p className="text-xs text-gold-dim mb-4">
          Alias: <em>{entity.alias.join(", ")}</em>
        </p>
      )}

      {entity.relaciones && entity.relaciones.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xl text-gold mb-2">Relaciones</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {entity.relaciones.map((r, i) => (
              <li key={i}>
                {r.con} — <span className="text-gold-dim">{r.tipo}</span>{" "}
                <span className="text-xs text-gold-dim">(ep. {r.episodio})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-xl text-gold mb-2">Menciones por episodio</h3>
        {orderedEpisodes.length === 0 && (
          <p className="italic text-gold-dim">— sin menciones —</p>
        )}
        {orderedEpisodes.map((num) => (
          <div key={num} className="mb-4">
            <Link href={`/episodios/${num}`} className="text-crimson hover:underline">
              Ep. {num}
            </Link>
            <ul className="list-disc list-inside text-sm mt-1">
              {byEpisode.get(num)!.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        ))}
      </section>
    </article>
  );
}
```

- [ ] **Step 5: Verificar typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/episodios/ app/entidades/
git commit -m "Páginas de lectura: episodios + entidades"
```

---

## Task 17: Smoke test end-to-end + setup local

Probar la app contra Claude API real con un resumen pequeño.

- [ ] **Step 1: Crear `.env.local`** (NO se commitea — está en `.gitignore`)

Pedir al usuario que ejecute manualmente:

```bash
# Windows PowerShell
@"
ANTHROPIC_API_KEY=sk-ant-tu-clave-aqui
VAULT_PATH=C:/Users/joaqu/OneDrive/Documentos/claudeprojects/Mysha/vault-mysha
"@ | Out-File -FilePath .env.local -Encoding utf8
```

- [ ] **Step 2: Crear la carpeta del vault (si no existe)**

```bash
mkdir -p vault-mysha
```

(La app crea las subcarpetas con `bootstrap()` al primer acceso.)

- [ ] **Step 3: Levantar dev server**

Run: `npm run dev`
Expected: arranca en `http://localhost:3000`.

- [ ] **Step 4: Probar carga de un episodio real**

En el browser:
1. Pegar un resumen de Gemini de un episodio cualquiera de la campaña.
2. Completar Nº (ej. 1) y título.
3. Click **EXTRAER LORE**.
4. Verificar que llega a `/review` con cards llenas.
5. Editar/descartar lo que haga falta.
6. Click **CONFIRMAR Y GUARDAR**.
7. Verificar que redirige a `/episodios/1` y muestra el episodio.

- [ ] **Step 5: Verificar archivos en disco**

```bash
ls vault-mysha/episodios/
ls vault-mysha/personajes/
```

Expected: el `.md` del episodio existe + al menos algunos `.md` de personajes mencionados.

- [ ] **Step 6: Abrir Obsidian apuntando al vault**

En Obsidian → Open another vault → `vault-mysha/`.
Verificar que ve las carpetas, los archivos `.md`, y que los wikilinks `[[Mysha]]` resuelven.

- [ ] **Step 7: Correr toda la suite de tests**

Run: `npm test`
Expected: PASS en todos los archivos.

- [ ] **Step 8: Commit final del MVP**

```bash
git add -A
git status   # verificar que .env.local NO aparece
git commit -m "MVP funcional end-to-end" --allow-empty
```

---

## Verificación final (criterios del spec §1)

- [ ] Pegás un resumen de Gemini + número de episodio → la IA extrae lore en las 10 categorías.
- [ ] Pantalla de revisión permite corregir, descartar y editar antes de guardar.
- [ ] Al confirmar, los `.md` se escriben en el vault y Obsidian los lee.
- [ ] Navegación dual funciona: `/episodios/[num]` y `/entidades/[tipo]/[slug]`.
- [ ] Re-procesar un episodio reemplaza solo su sección en cada ficha de entidad (manual: probar cargar dos veces el ep 1 con bullets distintos y verificar que las otras menciones quedan intactas).

---

## Notas de evolución (post-MVP)

Cuando estos tasks estén verdes, las siguientes mejoras son lo que el spec §11 anticipa — no van en este plan:

- Detección automática "home vacío" → mostrar dashboard tipo grimorio en lugar del form.
- Resolución de duplicados en review (badge "Ya existe" + autocomplete).
- Iteración de estética (la inicial es provisional).
- Migración a Supabase cuando entren multi-user/spells/notas colaborativas — implementar `SupabaseRepository` con la misma forma de `Vault`.
