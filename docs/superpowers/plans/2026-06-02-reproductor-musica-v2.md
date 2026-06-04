# Reproductor de música ambiente (UI V2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar a la UI V2 un reproductor global discreto de las 9 canciones de la campaña, con play/pausa, volumen, loop y selección manual, que persiste entre páginas y no autoarranca.

**Architecture:** Componente client `AtlasMusicPlayer` montado dentro de `AtlasTopNav` (que vive en el layout V2 y no se desmonta al navegar → el `<audio>` sigue sonando). Datos de pistas en `data/atlas-v2/music.ts`. Audio extraído de YouTube con yt-dlp+ffmpeg a `public/assets/atlas-v2/music/`. CSS bajo `av2-music-*` en `atlas-v2.css`.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript, CSS puro (sin Tailwind/shadcn en V2), `<audio>` HTML5, yt-dlp (`C:\Users\joaqu\yt-dlp.exe`) + ffmpeg (`C:\ffmpeg\ffmpeg.exe`), vitest, Playwright.

Spec de referencia: `docs/superpowers/specs/2026-06-02-reproductor-musica-v2-design.md`.

---

## File Structure

- **Create** `data/atlas-v2/music.ts` — tipo `MusicTrack` + array `MUSIC_TRACKS` (9 pistas). Fuente de verdad de slugs/títulos/urls.
- **Create** `scripts/v2-fetch-music.mjs` — script on-demand: descarga+normaliza los 9 mp3 a `public/assets/atlas-v2/music/`. Idempotente.
- **Create** `public/assets/atlas-v2/music/*.mp3` — output del script (9 archivos).
- **Create** `components/atlas-v2/AtlasMusicPlayer.tsx` — componente client del reproductor (audio + botón + popover).
- **Create** `tests/music-data.test.ts` — valida shape de `MUSIC_TRACKS` y que los mp3 existen en disco.
- **Modify** `components/atlas-v2/AtlasTopNav.tsx` — montar `<AtlasMusicPlayer />` a la derecha de Buscar.
- **Modify** `app/(v2)/v2/atlas-v2.css` — bloque `av2-music-*` (botón, popover, lista, slider, loop, ecualizador, responsive, reduced-motion).
- **Modify** `.gitignore` — excepción para versionar `public/assets/atlas-v2/music/` (hoy `*.mp3` está ignorado).

---

### Task 1: Datos de las pistas

**Files:**
- Create: `data/atlas-v2/music.ts`

- [ ] **Step 1: Crear el archivo de datos**

```ts
// data/atlas-v2/music.ts
// Fuente de verdad de las pistas de música de la campaña (UI V2).
// El slug es el id estable y el nombre del archivo en public/assets/atlas-v2/music/.

export type MusicTrack = {
  slug: string;
  title: string;
  context: string;
  src: string;
  sourceUrl: string;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  { slug: "apertura",         title: "Apertura de partida",     context: "Tema de inicio",     src: "/assets/atlas-v2/music/apertura.mp3",         sourceUrl: "https://www.youtube.com/watch?v=2N2EeZ3oWrw" },
  { slug: "santuario-libres", title: "Santuario de los Libres", context: "Lugar",              src: "/assets/atlas-v2/music/santuario-libres.mp3", sourceUrl: "https://www.youtube.com/watch?v=TJuPBBw-l-M" },
  { slug: "metropolis-cobre", title: "Metrópolis de Cobre",     context: "Lugar",              src: "/assets/atlas-v2/music/metropolis-cobre.mp3", sourceUrl: "https://www.youtube.com/watch?v=WAsFGJAmVHY" },
  { slug: "arco-io",          title: "Arco de Io",              context: "Personaje",          src: "/assets/atlas-v2/music/arco-io.mp3",          sourceUrl: "https://www.youtube.com/watch?v=scTUgxmvzW0" },
  { slug: "wendigo",          title: "Wendigo",                 context: "Criatura / arco",    src: "/assets/atlas-v2/music/wendigo.mp3",          sourceUrl: "https://www.youtube.com/watch?v=VrMK1w-qyhY" },
  { slug: "arco-narcissa",    title: "Arco de Narcissa",        context: "Personaje",          src: "/assets/atlas-v2/music/arco-narcissa.mp3",    sourceUrl: "https://www.youtube.com/watch?v=RuYC6U3LBRs" },
  { slug: "arco-borok",       title: "Arco de Borok",           context: "Personaje",          src: "/assets/atlas-v2/music/arco-borok.mp3",       sourceUrl: "https://www.youtube.com/watch?v=IehDebm--P0" },
  { slug: "underdark",        title: "Underdark",               context: "Lugar",              src: "/assets/atlas-v2/music/underdark.mp3",        sourceUrl: "https://www.youtube.com/watch?v=fA8j3wOVzcw" },
  { slug: "syltris",          title: "Syltris",                 context: "Lugar / personaje",  src: "/assets/atlas-v2/music/syltris.mp3",          sourceUrl: "https://www.youtube.com/watch?v=eU0aaq5pjnQ" },
];
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: sin errores.

---

### Task 2: Script de extracción de audio

**Files:**
- Create: `scripts/v2-fetch-music.mjs`

- [ ] **Step 1: Crear el script**

```js
// scripts/v2-fetch-music.mjs
// Descarga el audio de las pistas de la campaña desde YouTube y las normaliza
// a mp3 en public/assets/atlas-v2/music/. Idempotente: salta las que ya existen.
//
// Uso:
//   node scripts/v2-fetch-music.mjs            # baja las que falten
//   node scripts/v2-fetch-music.mjs --force    # rebaja todas
//
// Requisitos (ya presentes en este equipo):
//   yt-dlp:  C:\Users\joaqu\yt-dlp.exe   (override: YTDLP env var)
//   ffmpeg:  C:\ffmpeg\ffmpeg.exe        (override: FFMPEG env var)

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "public", "assets", "atlas-v2", "music");

const YTDLP = process.env.YTDLP || "C:\\Users\\joaqu\\yt-dlp.exe";
const FFMPEG = process.env.FFMPEG || "C:\\ffmpeg\\ffmpeg.exe";
const COOKIES = join(REPO_ROOT, "cookies.txt");
const FORCE = process.argv.includes("--force");

// slug -> video URL. Debe coincidir con data/atlas-v2/music.ts.
const TRACKS = [
  ["apertura",         "https://www.youtube.com/watch?v=2N2EeZ3oWrw"],
  ["santuario-libres", "https://www.youtube.com/watch?v=TJuPBBw-l-M"],
  ["metropolis-cobre", "https://www.youtube.com/watch?v=WAsFGJAmVHY"],
  ["arco-io",          "https://www.youtube.com/watch?v=scTUgxmvzW0"],
  ["wendigo",          "https://www.youtube.com/watch?v=VrMK1w-qyhY"],
  ["arco-narcissa",    "https://www.youtube.com/watch?v=RuYC6U3LBRs"],
  ["arco-borok",       "https://www.youtube.com/watch?v=IehDebm--P0"],
  ["underdark",        "https://www.youtube.com/watch?v=fA8j3wOVzcw"],
  ["syltris",          "https://www.youtube.com/watch?v=eU0aaq5pjnQ"],
];

mkdirSync(OUT_DIR, { recursive: true });

const results = { ok: [], skip: [], fail: [] };

for (const [slug, url] of TRACKS) {
  const finalPath = join(OUT_DIR, `${slug}.mp3`);
  if (existsSync(finalPath) && !FORCE) {
    console.log(`skip  ${slug} (ya existe)`);
    results.skip.push(slug);
    continue;
  }
  // archivo temporal de audio crudo
  const rawTemplate = join(OUT_DIR, `${slug}.raw.%(ext)s`);
  try {
    console.log(`fetch ${slug}  <- ${url}`);
    const ytArgs = [
      "-f", "bestaudio",
      "--ffmpeg-location", FFMPEG,
      "-o", rawTemplate,
      "--no-playlist",
    ];
    if (existsSync(COOKIES)) ytArgs.push("--cookies", COOKIES);
    ytArgs.push(url);
    execFileSync(YTDLP, ytArgs, { stdio: "inherit" });

    // localizar el .raw.* descargado
    const raw = readdirSync(OUT_DIR).find((f) => f.startsWith(`${slug}.raw.`));
    if (!raw) throw new Error("no se encontró el audio crudo descargado");
    const rawPath = join(OUT_DIR, raw);

    // normalizar loudness y convertir a mp3 (volumen parejo y contenido)
    console.log(`norm  ${slug}`);
    execFileSync(FFMPEG, [
      "-y",
      "-i", rawPath,
      "-af", "loudnorm=I=-20:TP=-2:LRA=11",
      "-codec:a", "libmp3lame",
      "-qscale:a", "5",
      finalPath,
    ], { stdio: "inherit" });

    rmSync(rawPath, { force: true });
    results.ok.push(slug);
  } catch (err) {
    console.error(`FAIL  ${slug}: ${err.message}`);
    results.fail.push(slug);
    // limpiar restos
    for (const f of readdirSync(OUT_DIR).filter((f) => f.startsWith(`${slug}.raw.`))) {
      rmSync(join(OUT_DIR, f), { force: true });
    }
  }
}

console.log("\n--- resumen ---");
console.log(`ok:   ${results.ok.join(", ") || "-"}`);
console.log(`skip: ${results.skip.join(", ") || "-"}`);
console.log(`fail: ${results.fail.join(", ") || "-"}`);
if (results.fail.length) process.exit(1);
```

- [ ] **Step 2: Correr el script**

Run (PowerShell): `node scripts/v2-fetch-music.mjs`
Expected: 9 líneas `fetch/norm` y un resumen con `ok: apertura, santuario-libres, ...` y `fail: -`. Si alguna falla, reintentar solo esa (volver a correr; las ok se saltan).

- [ ] **Step 3: Verificar los archivos**

Run (PowerShell): `Get-ChildItem public\assets\atlas-v2\music\*.mp3 | Select-Object Name, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}`
Expected: 9 archivos `.mp3`, cada uno > 0.5 MB.

---

### Task 3: Versionar el directorio de música

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Agregar excepción (el patrón `*.mp3` los ignora hoy)**

Agregar al final de `.gitignore`:

```gitignore
# Música de la campaña usada por la UI V2 (excepción al *.mp3 de arriba)
!public/assets/atlas-v2/music/
!public/assets/atlas-v2/music/*.mp3
```

- [ ] **Step 2: Confirmar que git los ve**

Run: `git status --short public/assets/atlas-v2/music/`
Expected: lista los 9 `.mp3` como nuevos (`??` o `A`), no ignorados.

---

### Task 4: Test de datos + presencia de archivos

**Files:**
- Create: `tests/music-data.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// tests/music-data.test.ts
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { MUSIC_TRACKS } from "../data/atlas-v2/music";

describe("MUSIC_TRACKS", () => {
  it("tiene 9 pistas con slugs únicos", () => {
    expect(MUSIC_TRACKS).toHaveLength(9);
    const slugs = new Set(MUSIC_TRACKS.map((t) => t.slug));
    expect(slugs.size).toBe(9);
  });

  it("cada pista tiene title, context, src bajo /assets/atlas-v2/music/ y sourceUrl de youtube", () => {
    for (const t of MUSIC_TRACKS) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.context.length).toBeGreaterThan(0);
      expect(t.src).toBe(`/assets/atlas-v2/music/${t.slug}.mp3`);
      expect(t.sourceUrl).toMatch(/youtube\.com\/watch\?v=/);
    }
  });

  it("el mp3 de cada pista existe en public/", () => {
    for (const t of MUSIC_TRACKS) {
      const file = join(process.cwd(), "public", t.src.replace(/^\//, ""));
      expect(existsSync(file), `falta ${t.src}`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Correr el test**

Run: `npx vitest run tests/music-data.test.ts`
Expected: PASS (3 tests). Si el tercero falla, faltan mp3 → volver a Task 2.

- [ ] **Step 3: Commit (datos + script + audio + test)**

```bash
git add data/atlas-v2/music.ts scripts/v2-fetch-music.mjs tests/music-data.test.ts .gitignore public/assets/atlas-v2/music/
git commit -m "feat(v2): pistas de música de la campaña + script de extracción"
```

---

### Task 5: Componente AtlasMusicPlayer

**Files:**
- Create: `components/atlas-v2/AtlasMusicPlayer.tsx`

- [ ] **Step 1: Escribir el componente**

```tsx
"use client";

// components/atlas-v2/AtlasMusicPlayer.tsx
// Reproductor global discreto de la música de la campaña (UI V2).
// Vive dentro del TopNav (que está en el layout y no se desmonta al navegar),
// así que el <audio> sigue sonando sin cortes entre páginas de /v2.

import { useCallback, useEffect, useRef, useState } from "react";
import { MUSIC_TRACKS } from "@/data/atlas-v2/music";

const STORAGE_KEY = "rdc.v2.music";
const DEFAULT_VOLUME = 0.35;

type Persisted = { currentSlug?: string; volume?: number; loop?: boolean };

function readPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Persisted) : {};
  } catch {
    return {};
  }
}

export default function AtlasMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(MUSIC_TRACKS[0].slug);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [loop, setLoop] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const current = MUSIC_TRACKS.find((t) => t.slug === currentSlug) ?? MUSIC_TRACKS[0];

  // Hidratar desde localStorage (solo cliente, no autoplay).
  useEffect(() => {
    const p = readPersisted();
    if (p.currentSlug && MUSIC_TRACKS.some((t) => t.slug === p.currentSlug)) {
      setCurrentSlug(p.currentSlug);
    }
    if (typeof p.volume === "number") setVolume(Math.min(1, Math.max(0, p.volume)));
    if (typeof p.loop === "boolean") setLoop(p.loop);
    setHydrated(true);
  }, []);

  // Persistir preferencias (nunca el estado de reproducción).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentSlug, volume, loop }));
    } catch {
      /* ignore */
    }
  }, [hydrated, currentSlug, volume, loop]);

  // Reflejar volumen y loop en el elemento <audio>.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  // Cerrar popover con Escape / click afuera (mismo patrón que AtlasTopNav).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const playSlug = useCallback(
    (slug: string) => {
      const audio = audioRef.current;
      if (!audio) return;
      const track = MUSIC_TRACKS.find((t) => t.slug === slug);
      if (!track) return;
      if (slug !== currentSlug) setCurrentSlug(slug);
      // Setear src imperativamente: el click es el gesto que habilita play().
      if (!audio.src.endsWith(track.src)) audio.src = track.src;
      audio.volume = volume;
      audio.loop = loop;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    },
    [currentSlug, volume, loop],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (!audio.src) audio.src = current.src;
      audio.volume = volume;
      audio.loop = loop;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [current, volume, loop]);

  return (
    <div className="av2-music" ref={rootRef}>
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (!loop) setIsPlaying(false);
        }}
      />

      <button
        type="button"
        className="av2-music-btn"
        aria-label={isPlaying ? `Música: sonando ${current.title}` : "Música de la mesa"}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-playing={isPlaying ? "true" : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="av2-music-eq" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div
        className="av2-music-pop"
        role="dialog"
        aria-label="Música de la mesa"
        hidden={!open}
      >
        <p className="av2-music-title">Música de la mesa</p>

        <ul className="av2-music-list">
          {MUSIC_TRACKS.map((t) => {
            const active = t.slug === currentSlug;
            return (
              <li key={t.slug}>
                <button
                  type="button"
                  className="av2-music-track"
                  data-active={active ? "true" : undefined}
                  data-playing={active && isPlaying ? "true" : undefined}
                  onClick={() => playSlug(t.slug)}
                >
                  <span className="av2-music-track-name">{t.title}</span>
                  <span className="av2-music-track-context">{t.context}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="av2-music-controls">
          <button
            type="button"
            className="av2-music-play"
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                <rect x="14" y="5" width="4" height="14" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M7 5l12 7-12 7V5z" fill="currentColor" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="av2-music-loop"
            aria-label="Repetir pista"
            aria-pressed={loop}
            data-on={loop ? "true" : undefined}
            onClick={() => setLoop((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <label className="av2-music-vol" aria-label="Volumen">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              aria-label="Volumen"
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: sin errores.

---

### Task 6: Montar en el TopNav

**Files:**
- Modify: `components/atlas-v2/AtlasTopNav.tsx`

- [ ] **Step 1: Importar el componente**

Después de los imports existentes (debajo de `import { useEffect, useRef, useState } from "react";`), agregar:

```tsx
import AtlasMusicPlayer from "@/components/atlas-v2/AtlasMusicPlayer";
```

- [ ] **Step 2: Renderizarlo a la derecha de Buscar**

En el JSX, justo **después** del `<Link ... className="av2-nav-search">...</Link>` de Buscar y **antes** de cerrar `</nav>`, agregar:

```tsx
        <AtlasMusicPlayer />
```

El resultado debe quedar: `... <Link className="av2-nav-search">…</Link> <AtlasMusicPlayer /> </nav>`.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sin errores.

---

### Task 7: Estilos (CSS)

**Files:**
- Modify: `app/(v2)/v2/atlas-v2.css`

- [ ] **Step 1: Agregar el bloque al final del archivo**

```css
/* ============================================================
   Reproductor de música (av2-music) — control discreto del TopNav
   ============================================================ */

.av2-music {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.av2-music-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--av2-r-sm);
  background: transparent;
  color: var(--av2-ink-soft);
  cursor: pointer;
  transition:
    color var(--av2-dur) var(--av2-ease),
    border-color var(--av2-dur) var(--av2-ease),
    background var(--av2-dur) var(--av2-ease);
}
.av2-music-btn:hover,
.av2-music-btn[aria-expanded="true"] { color: var(--av2-copper-hi); }
.av2-music-btn[data-playing="true"] { color: var(--av2-copper); }

/* Ecualizador: 3 barras. Estáticas (cortas) en reposo, animadas al sonar. */
.av2-music-eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
}
.av2-music-eq > span {
  width: 3px;
  height: 5px;
  border-radius: 1px;
  background: currentColor;
  transform-origin: bottom;
}
.av2-music-btn[data-playing="true"] .av2-music-eq > span {
  animation: av2-eq 900ms var(--av2-ease) infinite;
}
.av2-music-btn[data-playing="true"] .av2-music-eq > span:nth-child(1) { animation-delay: 0ms; }
.av2-music-btn[data-playing="true"] .av2-music-eq > span:nth-child(2) { animation-delay: 150ms; }
.av2-music-btn[data-playing="true"] .av2-music-eq > span:nth-child(3) { animation-delay: 300ms; }

@keyframes av2-eq {
  0%, 100% { height: 5px; }
  50%      { height: 15px; }
}

/* Popover */
.av2-music-pop {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 60;
  width: 280px;
  max-height: min(70vh, 480px);
  overflow-y: auto;
  padding: 10px;
  border: 1px solid var(--av2-rule-copper);
  border-radius: var(--av2-r);
  background: var(--av2-bg-panel);
  box-shadow: var(--av2-shadow-deep);
  backdrop-filter: blur(12px) saturate(1.1);
  -webkit-backdrop-filter: blur(12px) saturate(1.1);
}
.av2-music-pop[hidden] { display: none; }

.av2-music-title {
  margin: 2px 4px 8px;
  font-family: var(--av2-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--av2-ink-faint);
}

.av2-music-list {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  border-bottom: 1px solid var(--av2-rule);
  padding-bottom: 8px;
}
.av2-music-track {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: var(--av2-r-sm);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--av2-ink-soft);
  transition: background var(--av2-dur) var(--av2-ease), color var(--av2-dur) var(--av2-ease);
}
.av2-music-track:hover { background: var(--av2-bg-panel-up); color: var(--av2-ink); }
.av2-music-track[data-active="true"] { color: var(--av2-copper); }
.av2-music-track-name {
  font-family: var(--av2-body);
  font-size: 15px;
  line-height: 1.25;
}
.av2-music-track-context {
  font-family: var(--av2-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--av2-ink-faint);
}
/* Marca de "sonando" sin depender solo del color */
.av2-music-track[data-playing="true"] .av2-music-track-name::after {
  content: " ‹sonando›";
  font-family: var(--av2-mono);
  font-size: 10px;
  color: var(--av2-copper);
}

.av2-music-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px;
}
.av2-music-play,
.av2-music-loop {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--av2-rule-up);
  border-radius: var(--av2-r-sm);
  background: var(--av2-bg-raised);
  color: var(--av2-ink);
  cursor: pointer;
  transition: color var(--av2-dur) var(--av2-ease), border-color var(--av2-dur) var(--av2-ease);
}
.av2-music-play:hover,
.av2-music-loop:hover { color: var(--av2-copper-hi); border-color: var(--av2-rule-copper); }
.av2-music-loop[data-on="true"] { color: var(--av2-copper); border-color: var(--av2-rule-copper); }

.av2-music-vol {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  color: var(--av2-ink-faint);
}
.av2-music-vol input[type="range"] {
  flex: 1;
  height: 3px;
  accent-color: var(--av2-copper);
  cursor: pointer;
}

/* Mobile: popover casi full-width, anclado al borde derecho del viewport */
@media (max-width: 560px) {
  .av2-music-pop {
    position: fixed;
    top: calc(var(--av2-nav-h) + 6px);
    right: 8px;
    left: 8px;
    width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .av2-music-btn[data-playing="true"] .av2-music-eq > span {
    animation: none;
    height: 11px;
  }
}
```

- [ ] **Step 2: Commit (componente + wiring + CSS)**

```bash
git add components/atlas-v2/AtlasMusicPlayer.tsx components/atlas-v2/AtlasTopNav.tsx "app/(v2)/v2/atlas-v2.css"
git commit -m "feat(v2): reproductor de música discreto en el TopNav"
```

---

### Task 8: Verificación funcional y visual

**Files:** ninguno (verificación).

- [ ] **Step 1: Typecheck + tests**

Run: `npm run typecheck; npx vitest run tests/music-data.test.ts`
Expected: typecheck limpio; 3 tests PASS.

- [ ] **Step 2: Levantar dev server**

Run (background): `npm run dev`
Expected: server en `http://localhost:3000` (o el puerto que reporte). Anotar BASE_URL.

- [ ] **Step 3: Prueba funcional en navegador (Playwright MCP)**

Navegar a `/v2`. Verificar manualmente:
- El ícono `av2-music-btn` aparece a la derecha del de Buscar, discreto.
- Click abre el popover con las 9 pistas + controles.
- Click en una pista la reproduce (el ecualizador del botón se anima, marca "‹sonando›").
- Play/pausa funciona; el slider de volumen cambia el volumen; el toggle de loop alterna.
- Navegar a otra página de `/v2` (ej. `/v2/personajes`) **sin** que se corte el audio.
- Recargar: el audio queda en pausa, pero la pista seleccionada y el volumen se conservan.

- [ ] **Step 4: Screenshots desktop + mobile**

Run (PowerShell, con dev server arriba):
`$env:V2_BROWSER_CHANNEL="msedge"; node scripts/v2-screenshot.mjs --routes /v2 --priority`
Expected: capturas en `artifacts/screenshots/ui-v2/`. Abrirlas y confirmar que el control **no resalta** ni desacomoda el TopNav, en desktop (1440) y mobile (390).

- [ ] **Step 5: Revisión con skills de UI**

Pasar el componente y el CSS por `impeccable` / `frontend-design` y `code-reviewer` (preferencia del usuario). Aplicar ajustes si surgen. No declarar terminado solo por que compila.

- [ ] **Step 6: Commit final (si hubo ajustes de la revisión)**

```bash
git add -A
git commit -m "polish(v2): ajustes de revisión del reproductor de música"
```

---

## Self-Review

**Spec coverage:**
- Fuente local / extracción → Task 2, 3. ✅
- Lista manual / selección → Task 5 (`playSlug`, lista). ✅
- Play/pausa/volumen/loop → Task 5 (controles) + CSS Task 7. ✅
- Persistencia sin autoplay → Task 5 (`readPersisted`, hidratación, no persiste isPlaying). ✅
- Ubicación TopNav + popover → Task 6 + CSS. ✅
- Audio persistente entre páginas → montado en TopNav (en layout) → Task 6. ✅
- Accesibilidad (aria, Esc/click afuera, range etiquetado, "sonando" textual) → Task 5 + CSS `::after`. ✅
- Reduced-motion / responsive → Task 7. ✅
- Verificación (typecheck, Playwright, screenshots, skills) → Task 8. ✅

**Placeholder scan:** sin TBD/TODO; todo el código está completo.

**Type consistency:** `MusicTrack`/`MUSIC_TRACKS` consistentes entre Task 1, 4, 5. `slug` usado igual en script (Task 2) y datos (Task 1). Clases CSS `av2-music-*` consistentes entre Task 5 (JSX) y Task 7 (CSS): `av2-music`, `-btn`, `-eq`, `-pop`, `-title`, `-list`, `-track`, `-track-name`, `-track-context`, `-controls`, `-play`, `-loop`, `-vol`. ✅
