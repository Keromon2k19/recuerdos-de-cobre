#!/usr/bin/env node
/**
 * Mysha — Orquestador del pipeline de procesamiento.
 *
 * Pipeline: yt-dlp (audio) → transcribe.py (Whisper) → Gemini (resumen + extracción).
 *
 * Lee y va actualizando vault-mysha/_jobs/<numero>.json en cada etapa.
 * Diseñado para correr detached desde un server action.
 *
 * Uso: npx tsx scripts/process-episode.ts <numero>
 *
 * Precondición: el job <numero>.json debe existir (creado por la UI).
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

// ─── Helpers de .env.local (sin dotenv) ──────────────────────────────────

function loadEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const out: Record<string, string> = {};
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

// ─── Tipos (duplicados acá para evitar imports de Next.js/Webpack) ───────

type JobEstado =
  | "queued"
  | "downloading"
  | "transcribing"
  | "esperando_resumen"
  | "summarizing"
  | "extracting"
  | "committing"
  | "done"
  | "error"
  | "cancelled";

type Job = {
  numero: number;
  videoId: string;
  url: string;
  titulo: string;
  publicado_en?: string;
  estado: JobEstado;
  etapa_actual: string;
  iniciado_en: string;
  actualizado_en: string;
  pid?: number;
  audio_path?: string;
  transcript_path?: string;
  resumen?: string;
  error?: string;
  auto_commit?: boolean;
  committed_entities?: number;
  progress?: number;
  progress_detail?: string;
};

// ─── Helpers de job file ──────────────────────────────────────────────────

function jobFile(vaultPath: string, numero: number): string {
  return path.join(vaultPath, "_jobs", `${String(numero).padStart(3, "0")}.json`);
}

function readJob(vaultPath: string, numero: number): Job {
  const content = fs.readFileSync(jobFile(vaultPath, numero), "utf-8");
  return JSON.parse(content) as Job;
}

function writeJob(vaultPath: string, job: Job): void {
  const filePath = jobFile(vaultPath, job.numero);
  const updated: Job = { ...job, actualizado_en: new Date().toISOString() };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
}

function updateJob(
  vaultPath: string,
  numero: number,
  patch: Partial<Job>
): Job {
  const current = readJob(vaultPath, numero);
  const next = { ...current, ...patch };
  writeJob(vaultPath, next);
  return next;
}

// ─── Detección de yt-dlp y ffmpeg ─────────────────────────────────────────

function findExecutable(candidates: string[]): string | null {
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function findYtdlp(): string | null {
  const home = os.homedir();
  return findExecutable([
    path.join(home, "yt-dlp.exe"),
    "C:\\tools\\yt-dlp.exe",
    "C:\\Program Files\\yt-dlp\\yt-dlp.exe",
  ]) || "yt-dlp"; // último recurso: confiar en PATH
}

function findFfmpeg(): string | null {
  const home = os.homedir();
  // Buscar en WinGet
  const wingetBase = path.join(home, "AppData", "Local", "Microsoft", "WinGet", "Packages");
  if (fs.existsSync(wingetBase)) {
    for (const pkg of fs.readdirSync(wingetBase)) {
      if (pkg.includes("Gyan.FFmpeg") || pkg.toLowerCase().includes("ffmpeg")) {
        const pkgDir = path.join(wingetBase, pkg);
        const found = walkForFile(pkgDir, "ffmpeg.exe", 6);
        if (found) return found;
      }
    }
  }
  return findExecutable([
    "C:\\ffmpeg\\ffmpeg.exe",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\tools\\ffmpeg.exe",
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
  ]);
}

function walkForFile(root: string, name: string, maxDepth: number): string | null {
  if (maxDepth < 0) return null;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (e.isFile() && e.name.toLowerCase() === name.toLowerCase()) return full;
    if (e.isDirectory()) {
      const found = walkForFile(full, name, maxDepth - 1);
      if (found) return found;
    }
  }
  return null;
}

// ─── Spawn con logging a job ──────────────────────────────────────────────

function spawnAndWait(
  cmd: string,
  args: string[],
  options: {
    env?: NodeJS.ProcessEnv;
    /** Callback por cada línea completa de stdout (para parsear progreso). */
    onStdoutLine?: (line: string) => void;
  } = {}
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      env: options.env,
      shell: false,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let lineBuf = "";
    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (options.onStdoutLine) {
        lineBuf += text;
        let idx: number;
        while ((idx = lineBuf.indexOf("\n")) >= 0) {
          const line = lineBuf.slice(0, idx);
          lineBuf = lineBuf.slice(idx + 1);
          try {
            options.onStdoutLine(line);
          } catch {
            // un error en el callback no debe matar el spawn
          }
        }
      }
    });
    child.stderr?.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    child.on("error", (err) =>
      resolve({ code: 1, stdout, stderr: stderr + String(err) })
    );
  });
}

// ─── Etapas del pipeline ──────────────────────────────────────────────────

async function downloadAudio(
  job: Job,
  outputDir: string,
  vaultPath: string
): Promise<string> {
  const ytdlp = findYtdlp();
  if (!ytdlp) throw new Error("No se encontró yt-dlp. Instalalo o ponelo en C:\\Users\\<usuario>\\yt-dlp.exe");
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) throw new Error("No se encontró ffmpeg. Instalá con: winget install Gyan.FFmpeg");

  updateJob(vaultPath, job.numero, {
    estado: "downloading",
    etapa_actual: "Descargando audio desde YouTube...",
  });

  const audioPath = path.join(outputDir, `ep${String(job.numero).padStart(2, "0")}.mp3`);
  const args = [
    "-x",
    "--audio-format",
    "mp3",
    "--ffmpeg-location",
    path.dirname(ffmpeg),
    "-o",
    audioPath,
    job.url,
  ];

  const result = await spawnAndWait(ytdlp, args);
  if (result.code !== 0 || !fs.existsSync(audioPath)) {
    throw new Error(
      `yt-dlp falló (exit ${result.code}):\n${result.stderr.slice(-500) || result.stdout.slice(-500)}`
    );
  }
  return audioPath;
}

async function transcribeAudio(
  audioPath: string,
  job: Job,
  outputDir: string,
  vaultPath: string
): Promise<string> {
  updateJob(vaultPath, job.numero, {
    estado: "transcribing",
    etapa_actual: "Transcribiendo con Whisper large-v3...",
    audio_path: audioPath,
    progress: 0,
    progress_detail: "Cargando modelo...",
  });

  const transcribeScript = path.join(process.cwd(), "scripts", "transcribe.py");
  if (!fs.existsSync(transcribeScript)) {
    throw new Error(`No se encontró ${transcribeScript}`);
  }

  // Throttle de escritura del job: solo escribimos si el % cambió ≥1
  // o pasaron ≥8s desde la última escritura (evita spamear el FS).
  let lastPct = -1;
  let lastWrite = 0;

  const fmtMin = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}m ${String(s).padStart(2, "0")}s`;
  };

  const onStdoutLine = (line: string) => {
    const m = line.match(/^@@PROGRESS@@\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
    if (!m) return;
    const done = parseFloat(m[1]);
    const total = parseFloat(m[2]);
    if (!(total > 0)) return;
    const pct = Math.min(100, Math.round((done / total) * 100));
    const now = Date.now();
    if (pct === lastPct && now - lastWrite < 8000) return;
    lastPct = pct;
    lastWrite = now;
    try {
      updateJob(vaultPath, job.numero, {
        estado: "transcribing",
        progress: pct,
        progress_detail: `${fmtMin(done)} / ${fmtMin(total)} de audio`,
        etapa_actual: `Transcribiendo con Whisper... ${pct}%`,
      });
    } catch {
      // si falla la escritura del job, no rompemos la transcripción
    }
  };

  // transcribe.py genera <audio>.txt en la misma carpeta del audio.
  // PYTHONIOENCODING=utf-8 fuerza stdout/stderr en UTF-8 (sin esto Python
  // crashea en Windows al imprimir emojis con codepage cp1252).
  const result = await spawnAndWait("python", [transcribeScript, audioPath, "es"], {
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    onStdoutLine,
  });
  if (result.code !== 0) {
    throw new Error(
      `Whisper falló (exit ${result.code}):\n${result.stderr.slice(-800) || result.stdout.slice(-800)}`
    );
  }

  const transcriptPath = audioPath.replace(/\.mp3$/, ".txt");
  if (!fs.existsSync(transcriptPath)) {
    throw new Error(`No se generó el transcript: ${transcriptPath}`);
  }

  // Mover el transcript al outputDir con nombre limpio
  const finalTranscript = path.join(outputDir, `ep${String(job.numero).padStart(2, "0")}.transcript.txt`);
  if (transcriptPath !== finalTranscript) {
    fs.renameSync(transcriptPath, finalTranscript);
  }
  return finalTranscript;
}

// ─── Cola: encadenar al siguiente job pendiente ──────────────────────────

/**
 * Busca el job en estado "queued" más antiguo (por iniciado_en) y spawnea
 * process-episode.ts para él. Si no hay más, no hace nada.
 *
 * IMPORTANTE: el spawn es detached para que este proceso pueda salir limpio.
 */
function chainNextQueued(vaultPath: string, currentNumero: number): void {
  const jobsDir = path.join(vaultPath, "_jobs");
  let files: string[];
  try {
    files = fs.readdirSync(jobsDir).filter((f) => f.endsWith(".json"));
  } catch {
    return;
  }

  const queued: Job[] = [];
  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(jobsDir, f), "utf-8");
      const j = JSON.parse(content) as Job;
      if (j.estado === "queued" && j.numero !== currentNumero) {
        queued.push(j);
      }
    } catch {
      // ignore
    }
  }

  if (queued.length === 0) {
    console.log("[chain] no hay más jobs en cola — fin de la cadena");
    return;
  }

  // FIFO por iniciado_en
  queued.sort((a, b) => a.iniciado_en.localeCompare(b.iniciado_en));
  const next = queued[0];
  console.log(`[chain] spawneando siguiente job: ${next.numero} — "${next.titulo}"`);

  const logsDir = path.join(jobsDir, "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  const padded = String(next.numero).padStart(3, "0");
  const logPath = path.join(logsDir, `${padded}.log`);
  const logFd = fs.openSync(logPath, "a");
  fs.writeSync(
    logFd,
    `\n──── ${new Date().toISOString()} arrancando proceso (encadenado desde ${currentNumero}) ────\n`
  );

  const scriptPath = path.join(process.cwd(), "scripts", "process-episode.ts");
  const child = spawn("npx", ["tsx", scriptPath, String(next.numero)], {
    cwd: process.cwd(),
    detached: true,
    stdio: ["ignore", logFd, logFd],
    shell: true,
    windowsHide: true,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  child.unref();
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const numeroArg = process.argv[2];
  if (!numeroArg) {
    console.error("Uso: npx tsx scripts/process-episode.ts <numero>");
    process.exit(1);
  }
  const numero = parseInt(numeroArg, 10);
  if (!Number.isFinite(numero)) {
    console.error("Número inválido");
    process.exit(1);
  }
  const env = { ...process.env, ...loadEnv() } as Record<string, string>;
  const vaultPath = path.resolve(env.VAULT_PATH || "vault-mysha");
  const outputDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outputDir, { recursive: true });

  const initial = readJob(vaultPath, numero);
  updateJob(vaultPath, numero, { pid: process.pid });

  let audioPathToCleanup: string | null = null;

  try {
    const audioPath = await downloadAudio(initial, outputDir, vaultPath);
    audioPathToCleanup = audioPath;
    const transcriptPath = await transcribeAudio(
      audioPath,
      initial,
      outputDir,
      vaultPath
    );

    // El pipeline se DETIENE acá. El resumen lo hace Claude Code a mano
    // siguiendo PROMPT_RESUMEN.md (Gemini bloquea el contenido oscuro de la
    // campaña). Una vez inyectado el resumen en el job, el formulario corre
    // extracción con Gemini + revisión manual + commit al vault.
    updateJob(vaultPath, numero, {
      estado: "esperando_resumen",
      etapa_actual: "Transcripción lista — esperando resumen (Claude Code)",
      transcript_path: transcriptPath,
      pid: undefined,
      progress: undefined,
      progress_detail: undefined,
    });

    // Borrar audio temporal (el mp3 puede ser grande)
    if (audioPathToCleanup) {
      try {
        fs.unlinkSync(audioPathToCleanup);
      } catch {
        // ignore
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    try {
      updateJob(vaultPath, numero, {
        estado: "error",
        etapa_actual: "Error en el pipeline",
        error: msg,
        pid: undefined,
      });
    } catch {
      console.error("[process-episode] error fatal:", msg);
    }
    // No exit todavía — queremos encadenar al siguiente queued igual.
  }

  // Encadenar al siguiente queued (success o error, da igual — la cola sigue
  // descargando + transcribiendo mientras se hacen los resúmenes a mano).
  try {
    chainNextQueued(vaultPath, numero);
  } catch (err) {
    console.error("[chain] error encadenando siguiente:", err);
  }
}

main().catch((err) => {
  console.error("[process-episode] fallo inesperado:", err);
  process.exit(1);
});
