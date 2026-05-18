"use server";

// app/actions/process.ts — Server actions del pipeline de procesamiento.
// Modelo de cola: múltiples jobs en "queued"; un worker corre uno a la vez
// y se auto-encadena al siguiente al terminar (ver scripts/process-episode.ts).

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadConfig } from "@/lib/config";
import {
  readJob,
  writeJob,
  listJobs,
  deleteJob,
  hasActiveJob,
} from "@/lib/vault";
import type { Job } from "@/lib/types";

export type StartProcessingArgs = {
  numero: number;
  videoId: string;
  url: string;
  titulo: string;
  publicado_en?: string;
};

export type EnqueueArgs = StartProcessingArgs & {
  /** Si true (default), el pipeline corre extracción+commit tras el resumen. */
  auto_commit?: boolean;
};

export type StartResult =
  | { success: true; job: Job }
  | { success: false; error: string };

export type StartQueueResult =
  | { success: true; started: number | null; pendingCount: number }
  | { success: false; error: string };

/**
 * Encola un episodio para procesamiento. NO spawnea el worker — eso lo hace
 * startQueueAction() o el auto-encadenamiento del worker en curso.
 *
 * Si ya hay un job para ese número (estado terminal), lo limpia primero.
 */
export async function enqueueAction(args: EnqueueArgs): Promise<StartResult> {
  try {
    const config = loadConfig();

    const existing = await readJob(config.vaultPath, args.numero);
    if (existing) {
      if (
        existing.estado === "queued" ||
        existing.estado === "downloading" ||
        existing.estado === "transcribing" ||
        existing.estado === "summarizing" ||
        existing.estado === "extracting" ||
        existing.estado === "committing"
      ) {
        return {
          success: false,
          error: `El episodio ${args.numero} ya está en cola o procesándose.`,
        };
      }
      // Terminal: borrar para arrancar limpio
      await deleteJob(config.vaultPath, args.numero);
    }

    const now = new Date().toISOString();
    const job: Job = {
      numero: args.numero,
      videoId: args.videoId,
      url: args.url,
      titulo: args.titulo,
      publicado_en: args.publicado_en,
      estado: "queued",
      etapa_actual: "En cola...",
      iniciado_en: now,
      actualizado_en: now,
      auto_commit: args.auto_commit ?? true,
    };
    await writeJob(config.vaultPath, job);
    return { success: true, job };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Arranca el worker si no hay uno activo. Toma el job "queued" más antiguo
 * (FIFO por iniciado_en) y spawnea process-episode.ts detached.
 *
 * Si ya hay un worker activo, es un no-op (devuelve started:null).
 */
export async function startQueueAction(): Promise<StartQueueResult> {
  try {
    const config = loadConfig();

    const jobs = await listJobs(config.vaultPath);
    const queued = jobs
      .filter((j) => j.estado === "queued")
      .sort((a, b) => a.iniciado_en.localeCompare(b.iniciado_en));

    // Si ya hay un job activo (cualquier estado no-terminal y no-queued),
    // el worker ya está corriendo. No-op.
    if (await hasActiveJob(config.vaultPath)) {
      const stillActive = jobs.some((j) =>
        ["downloading", "transcribing", "summarizing", "extracting", "committing"].includes(
          j.estado
        )
      );
      if (stillActive) {
        return { success: true, started: null, pendingCount: queued.length };
      }
    }

    if (queued.length === 0) {
      return {
        success: false,
        error: "No hay episodios en cola para procesar.",
      };
    }

    const first = queued[0];
    spawnWorker(config.vaultPath, first.numero);
    return {
      success: true,
      started: first.numero,
      pendingCount: queued.length - 1,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Backward-compat: encola + arranca el worker. Mantenido para que el botón
 * "Procesar" original siga funcionando si se usa.
 */
export async function startProcessingAction(
  args: StartProcessingArgs
): Promise<StartResult> {
  const enq = await enqueueAction({ ...args, auto_commit: true });
  if (!enq.success) return enq;
  await startQueueAction();
  return enq;
}

function spawnWorker(vaultPath: string, numero: number): void {
  const logsDir = path.join(vaultPath, "_jobs", "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  const padded = String(numero).padStart(3, "0");
  const logPath = path.join(logsDir, `${padded}.log`);
  const logFd = fs.openSync(logPath, "a");
  fs.writeSync(
    logFd,
    `\n──── ${new Date().toISOString()} arrancando worker para job ${numero} ────\n`
  );

  const scriptPath = path.join("scripts", "process-episode.ts");
  const child = spawn("npx", ["tsx", scriptPath, String(numero)], {
    cwd: process.cwd(),
    detached: true,
    stdio: ["ignore", logFd, logFd],
    shell: true,
    windowsHide: true,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  child.unref();
}

/**
 * Lee el estado actual de un job. Usado por la UI para polling.
 */
export async function getJobAction(numero: number): Promise<Job | null> {
  try {
    const config = loadConfig();
    return await readJob(config.vaultPath, numero);
  } catch {
    return null;
  }
}

/**
 * Lista todos los jobs (cualquier estado).
 */
export async function listJobsAction(): Promise<Job[]> {
  try {
    const config = loadConfig();
    return await listJobs(config.vaultPath);
  } catch {
    return [];
  }
}

/**
 * Cancela un job: mata el proceso (si activo) y lo marca como cancelled.
 * Si el job era el worker activo y hay más en cola, el usuario debe
 * volver a clickear "Procesar cola" — la cadena no continúa sola al cancelar.
 */
export async function cancelJobAction(
  numero: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = loadConfig();
    const job = await readJob(config.vaultPath, numero);
    if (!job) return { success: false, error: "Job no existe" };

    if (job.pid) {
      try {
        process.kill(job.pid);
      } catch {
        // ya no existe el proceso
      }
    }

    await writeJob(config.vaultPath, {
      ...job,
      estado: "cancelled",
      etapa_actual: "Cancelado por el usuario",
      pid: undefined,
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Cancela todos los jobs en estado "queued" (limpia la cola pendiente).
 * No toca el job que está procesándose activamente.
 */
export async function cancelQueueAction(): Promise<{
  success: boolean;
  cancelled: number;
}> {
  try {
    const config = loadConfig();
    const jobs = await listJobs(config.vaultPath);
    const queued = jobs.filter((j) => j.estado === "queued");
    for (const j of queued) {
      await writeJob(config.vaultPath, {
        ...j,
        estado: "cancelled",
        etapa_actual: "Cola cancelada por el usuario",
      });
    }
    return { success: true, cancelled: queued.length };
  } catch {
    return { success: false, cancelled: 0 };
  }
}

/**
 * Elimina el registro de un job. Solo si ya está en estado terminal.
 */
export async function clearJobAction(
  numero: number
): Promise<{ success: boolean }> {
  try {
    const config = loadConfig();
    await deleteJob(config.vaultPath, numero);
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Reintenta un job que tiene transcript guardado pero falló (o quedó
 * a medias) en pasos posteriores. NO re-descarga ni re-transcribe: solo
 * lo vuelve a poner en "esperando_resumen" para que Claude Code haga el
 * resumen a mano. Si no hay transcript, devolvé error (el caller re-encola).
 */
export async function resumeJobAction(
  numero: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = loadConfig();
    const job = await readJob(config.vaultPath, numero);
    if (!job) return { success: false, error: "Job no existe" };
    if (!job.transcript_path) {
      return { success: false, error: "El job no tiene transcript guardado" };
    }

    await writeJob(config.vaultPath, {
      ...job,
      estado: "esperando_resumen",
      etapa_actual: "Transcripción lista — esperando resumen (Claude Code)",
      error: undefined,
      pid: undefined,
      progress: undefined,
      progress_detail: undefined,
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
