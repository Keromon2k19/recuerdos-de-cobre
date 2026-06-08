// scripts/v2-fetch-music.mjs
// Descarga el audio de las pistas de la campaña desde YouTube y las normaliza
// a mp3 en public/assets/atlas/music/. Idempotente: salta las que ya existen.
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
import os from "node:os";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "public", "assets", "atlas", "music");

// Localiza un ffmpeg que funcione. El C:\ffmpeg\ffmpeg.exe de este equipo está
// roto (falta un DLL), así que se prefiere el build full de Gyan instalado por
// WinGet (tiene libmp3lame). Override con la env var FFMPEG.
function findFfmpeg() {
  if (process.env.FFMPEG && existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  const wingetBase = join(os.homedir(), "AppData", "Local", "Microsoft", "WinGet", "Packages");
  if (existsSync(wingetBase)) {
    for (const pkg of readdirSync(wingetBase)) {
      if (!pkg.toLowerCase().includes("ffmpeg")) continue;
      const pkgDir = join(wingetBase, pkg);
      for (const sub of readdirSync(pkgDir)) {
        const candidate = join(pkgDir, sub, "bin", "ffmpeg.exe");
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  for (const c of ["C:\\ffmpeg\\bin\\ffmpeg.exe", "C:\\ffmpeg\\ffmpeg.exe"]) {
    if (existsSync(c)) return c;
  }
  throw new Error("no se encontró un ffmpeg que funcione (probá setear la env var FFMPEG)");
}

const YTDLP = process.env.YTDLP || "C:\\Users\\joaqu\\yt-dlp.exe";
const FFMPEG = findFfmpeg();
// Videos públicos: por defecto SIN cookies. El cookies.txt del repo es JSON
// (yt-dlp pide formato Netscape). Si algún video pide login/edad, pasar un
// archivo Netscape válido vía la env var COOKIES.
const COOKIES = process.env.COOKIES && existsSync(process.env.COOKIES) ? process.env.COOKIES : "";
const FORCE = process.argv.includes("--force");

// slug -> video URL. Debe coincidir con data/atlas/music.ts.
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

console.log(`yt-dlp: ${YTDLP}`);
console.log(`ffmpeg: ${FFMPEG}\n`);

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
    if (COOKIES) ytArgs.push("--cookies", COOKIES);
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
