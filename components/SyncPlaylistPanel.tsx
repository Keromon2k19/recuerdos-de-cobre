"use client";

// components/SyncPlaylistPanel.tsx — Panel cliente para sincronizar y procesar la playlist.
// Soporta cola: encolar múltiples → procesar todos en serie con auto-extract+commit.

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncPlaylistAction } from "@/app/actions/sync-playlist";
import {
  enqueueAction,
  startQueueAction,
  listJobsAction,
  cancelJobAction,
  cancelQueueAction,
  clearJobAction,
  resumeJobAction,
} from "@/app/actions/process";
import type { PlaylistCache, Job, JobEstado } from "@/lib/types";
import Accordion from "@/components/Accordion";
import SectionHead from "@/components/SectionHead";
import EmptyState from "@/components/EmptyState";
import QueueRow from "@/components/QueueRow";

type Props = {
  initialCache: PlaylistCache | null;
  procesados: number[];
  initialJobs: Job[];
};

const ACTIVE_STATES: JobEstado[] = [
  "queued",
  "downloading",
  "transcribing",
  "esperando_resumen",
  "summarizing",
  "extracting",
  "committing",
];

const WORKING_STATES: JobEstado[] = [
  "downloading",
  "transcribing",
  "summarizing",
  "extracting",
  "committing",
];

const ESTADO_LABEL: Record<JobEstado, string> = {
  queued: "En cola",
  downloading: "Descargando",
  transcribing: "Transcribiendo",
  esperando_resumen: "Esperando resumen",
  summarizing: "Resumiendo",
  extracting: "Extrayendo lore",
  committing: "Guardando vault",
  done: "Listo",
  error: "Error",
  cancelled: "Cancelado",
};

const ESTADO_CLASS: Record<JobEstado, string> = {
  queued: "badge-pending",
  downloading: "badge-active",
  transcribing: "badge-active",
  esperando_resumen: "badge-active",
  summarizing: "badge-active",
  extracting: "badge-active",
  committing: "badge-active",
  done: "badge-ok",
  error: "badge-error",
  cancelled: "badge-pending",
};

const PREFILL_KEY = "mysha-prefill-from-job";
const MODE_LS_KEY = "mysha-queue-mode";

export default function SyncPlaylistPanel({
  initialCache,
  procesados,
  initialJobs,
}: Props) {
  const router = useRouter();
  const [cache, setCache] = useState<PlaylistCache | null>(initialCache);
  const [jobs, setJobs] = useState<Map<number, Job>>(
    new Map(initialJobs.map((j) => [j.numero, j]))
  );
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [autoCommit, setAutoCommit] = useState(true);
  const [queueStarting, setQueueStarting] = useState(false);
  const procesadosSet = new Set(procesados);

  // Restore mode preference
  useEffect(() => {
    const stored = localStorage.getItem(MODE_LS_KEY);
    if (stored === "manual") setAutoCommit(false);
  }, []);
  useEffect(() => {
    localStorage.setItem(MODE_LS_KEY, autoCommit ? "auto" : "manual");
  }, [autoCommit]);

  const jobsArray = Array.from(jobs.values());
  const queuedJobs = jobsArray.filter((j) => j.estado === "queued");
  const workingJob = jobsArray.find((j) => WORKING_STATES.includes(j.estado));
  const hasActiveJob = jobsArray.some((j) => ACTIVE_STATES.includes(j.estado));

  // ─── Polling de jobs activos ───
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!hasActiveJob) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      // Si terminó la cola, refresh para actualizar procesados
      router.refresh();
      return;
    }
    pollRef.current = setInterval(async () => {
      const fresh = await listJobsAction();
      setJobs(new Map(fresh.map((j) => [j.numero, j])));
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hasActiveJob, router]);

  // ─── Acciones ───

  async function handleSync() {
    setSyncLoading(true);
    setSyncError(null);
    try {
      const result = await syncPlaylistAction();
      if (result.success) {
        setCache(result.cache);
        router.refresh();
      } else {
        setSyncError(result.error);
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleEnqueue(item: {
    numero: number;
    videoId: string;
    url: string;
    titulo: string;
    publicado_en?: string;
  }) {
    setActionError(null);
    const result = await enqueueAction({ ...item, auto_commit: autoCommit });
    if (result.success) {
      const next = new Map(jobs);
      next.set(result.job.numero, result.job);
      setJobs(next);
    } else {
      setActionError(result.error);
    }
  }

  async function handleStartQueue() {
    setActionError(null);
    setQueueStarting(true);
    try {
      const result = await startQueueAction();
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      // Refresh job list para arrancar el polling
      const fresh = await listJobsAction();
      setJobs(new Map(fresh.map((j) => [j.numero, j])));
    } finally {
      setQueueStarting(false);
    }
  }

  async function handleCancelQueue() {
    if (
      !confirm(
        `Cancelar ${queuedJobs.length} ${queuedJobs.length === 1 ? "episodio en cola" : "episodios en cola"}? (no afecta el que se está procesando)`
      )
    ) {
      return;
    }
    await cancelQueueAction();
    const fresh = await listJobsAction();
    setJobs(new Map(fresh.map((j) => [j.numero, j])));
  }

  async function handleCancel(numero: number) {
    await cancelJobAction(numero);
    const fresh = await listJobsAction();
    setJobs(new Map(fresh.map((j) => [j.numero, j])));
  }

  async function handleClear(numero: number) {
    await clearJobAction(numero);
    const fresh = await listJobsAction();
    setJobs(new Map(fresh.map((j) => [j.numero, j])));
  }

  function handleLoadIntoForm(job: Job) {
    if (!job.resumen) return;
    sessionStorage.setItem(
      PREFILL_KEY,
      JSON.stringify({
        numero: job.numero,
        titulo: job.titulo,
        fecha: job.publicado_en?.slice(0, 10) ?? "",
        resumen: job.resumen,
      })
    );
    router.push("/");
  }

  // Reintentar un job en error:
  // - Si tiene transcript guardado → resume desde ahí (sin re-descargar ni re-transcribir)
  // - Si no → re-encolar desde cero y arrancar la cola
  async function retryJob(job: Job) {
    setActionError(null);
    if (job.transcript_path) {
      const result = await resumeJobAction(job.numero);
      if (!result.success) {
        setActionError(result.error ?? "Error al reanudar");
        return;
      }
    } else {
      const item = cache?.items.find((i) => i.numero === job.numero);
      if (!item) return;
      await handleEnqueue(item);
      await startQueueAction();
    }
    // Refrescar lista para que el polling arranque
    const fresh = await listJobsAction();
    setJobs(new Map(fresh.map((j) => [j.numero, j])));
  }
  // Descartar = cancelar si está activo, limpiar si terminó/erró.
  function discardJob(job: Job) {
    if (ACTIVE_STATES.includes(job.estado)) handleCancel(job.numero);
    else handleClear(job.numero);
  }

  function renderRow(item: PlaylistCache["items"][number]) {
    const job = jobs.get(item.numero);
    const procesado = procesadosSet.has(item.numero);
    return (
      <tr key={item.videoId}>
        <td className="playlist-num">{item.numero}</td>
        <td className="playlist-title">{item.titulo}</td>
        <td className="playlist-date">
          {item.publicado_en
            ? new Date(item.publicado_en).toLocaleDateString("es-AR")
            : "—"}
        </td>
        <td>
          {procesado ? (
            <span className="badge badge-ok">Procesado</span>
          ) : job ? (
            <div className="status-cell">
              <span
                className={`badge ${ESTADO_CLASS[job.estado]}`}
                title={job.etapa_actual}
              >
                {ESTADO_LABEL[job.estado]}
              </span>
              {job.estado === "transcribing" &&
                typeof job.progress === "number" && (
                  <div className="progress-wrap">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {job.progress}%
                      {job.progress_detail
                        ? ` · ${job.progress_detail}`
                        : ""}
                    </span>
                  </div>
                )}
            </div>
          ) : (
            <span className="badge badge-pending">Pendiente</span>
          )}
        </td>
        <td className="playlist-actions">
          <ActionCell
            item={item}
            job={job}
            procesado={procesado}
            onEnqueue={handleEnqueue}
            onCancel={handleCancel}
            onClear={handleClear}
            onLoad={handleLoadIntoForm}
          />
        </td>
      </tr>
    );
  }

  const itemsPendientes =
    cache?.items.filter((i) => !procesadosSet.has(i.numero)) ?? [];
  const itemsProcesados =
    cache?.items.filter((i) => procesadosSet.has(i.numero)) ?? [];

  const colaJobs = jobsArray
    .filter((j) => ACTIVE_STATES.includes(j.estado) || j.estado === "error")
    .sort((a, b) => a.numero - b.numero);

  return (
    <div>
      <SectionHead
        eyebrow="Apéndice · Ingesta"
        title="Importar episodios"
        sub="Sincronizá la playlist y procesá cada sesión: descarga, transcripción, resumen, extracción y vault."
        meta={
          cache ? (
            <>
              <b>{cache.items.length}</b> episodios en la playlist ·{" "}
              {colaJobs.length} en proceso · {itemsProcesados.length} archivados
            </>
          ) : null
        }
      />

      <div className="rdc-ingest-card">
        <div className="rdc-eyebrow" style={{ margin: 0 }}>
          <span>Sincronización</span>
        </div>
        <div
          style={{
            fontStyle: "italic",
            color: "var(--rdc-ink-soft)",
            fontSize: 15,
            marginTop: -4,
          }}
        >
          El amanuense baja el audio de YouTube, lo transcribe y extrae
          personajes, lugares y eventos.
        </div>
        <div className="rdc-ingest-row">
          <button
            type="button"
            className="rdc-btn"
            data-variant="primary"
            onClick={handleSync}
            disabled={syncLoading}
          >
            {syncLoading ? (
              <>
                <span className="spinner" /> Sincronizando…
              </>
            ) : cache ? (
              "Re-sincronizar"
            ) : (
              "Sincronizar playlist"
            )}
          </button>
          <div
            className="rdc-segmented"
            role="group"
            aria-label="Modo de procesamiento"
          >
            <button
              type="button"
              data-on={autoCommit}
              onClick={() => setAutoCommit(true)}
              title="Pipeline completo: transcribe → resume → extrae → guarda en el vault"
            >
              Nocturno
            </button>
            <button
              type="button"
              data-on={!autoCommit}
              onClick={() => setAutoCommit(false)}
              title="Se detiene tras el resumen para revisión manual"
            >
              Solo resumen
            </button>
          </div>
        </div>
        {cache && (
          <div
            style={{
              fontFamily: "var(--rdc-mono)",
              fontSize: 11,
              color: "var(--rdc-ink-faint)",
              letterSpacing: ".06em",
            }}
          >
            PIPELINE · DESCARGA → TRANSCRIPCIÓN → RESUMEN → EXTRACCIÓN → VAULT ·
            última sync{" "}
            {new Date(cache.sincronizado_en).toLocaleString("es-AR")}
          </div>
        )}
      </div>

      {syncError && (
        <div className="error-box" role="alert">
          <p className="error-title">Error de sincronización</p>
          <pre className="error-detail">{syncError}</pre>
        </div>
      )}

      {actionError && (
        <div className="error-box" role="alert">
          <p className="error-title">{actionError}</p>
        </div>
      )}

      {!cache && !syncError && (
        <EmptyState
          message="Todavia no sincronizaste la playlist. Conecta YouTube y el archivo va a empezar a llenar su cola de sesiones por procesar."
          action={
            <p className="form-hint">
              Asegurate de tener <code>YOUTUBE_API_KEY</code> y{" "}
              <code>YOUTUBE_PLAYLIST_ID</code> en tu <code>.env.local</code>.
            </p>
          }
        />
      )}

      {cache && (
        <div style={{ marginTop: 32 }}>
          <div className="rdc-eyebrow" style={{ marginBottom: 12 }}>
            <span>Cola activa</span>
          </div>

          {(workingJob || queuedJobs.length > 0) && (
            <div className="queue-controls" style={{ marginBottom: 16 }}>
              <div className="queue-status">
                {workingJob && (
                  <span className="queue-working">
                    <span className="spinner" /> Procesando ep.{" "}
                    {workingJob.numero}: {ESTADO_LABEL[workingJob.estado]}
                  </span>
                )}
                {queuedJobs.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="rdc-btn"
                      data-variant="primary"
                      onClick={handleStartQueue}
                      disabled={queueStarting || !!workingJob}
                      title={
                        workingJob
                          ? "Ya hay un worker activo — los queued se procesarán solos"
                          : "Arrancar el worker"
                      }
                    >
                      {queueStarting
                        ? "Arrancando…"
                        : workingJob
                          ? `${queuedJobs.length} en cola`
                          : `Procesar cola (${queuedJobs.length})`}
                    </button>
                    <button
                      type="button"
                      className="rdc-btn"
                      data-variant="danger"
                      onClick={handleCancelQueue}
                    >
                      Cancelar cola
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="rdc-queue">
            {colaJobs.length === 0 ? (
              <EmptyState message="No hay sesiones en cola. El archivo descansa hasta que encoles el proximo episodio." />
            ) : (
              colaJobs.map((job) => (
                <QueueRow
                  key={job.numero}
                  job={job}
                  onRetry={retryJob}
                  onDiscard={discardJob}
                />
              ))
            )}
          </div>
        </div>
      )}

      {cache && cache.items.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div className="rdc-eyebrow" style={{ marginBottom: 12 }}>
            <span>Playlist · sin procesar</span>
          </div>
          <table className="playlist-table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Título</th>
                <th>Publicado</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {itemsPendientes.length > 0 ? (
                itemsPendientes.map(renderRow)
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 28,
                      textAlign: "center",
                      color: "var(--rdc-ink-faint)",
                      fontStyle: "italic",
                    }}
                  >
                    Todos los episodios sincronizados ya fueron procesados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {itemsProcesados.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Accordion
                title="Episodios ya transcritos"
                count={itemsProcesados.length}
                defaultOpen={false}
              >
                <table className="playlist-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Nº</th>
                      <th>Título</th>
                      <th>Publicado</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>{itemsProcesados.map(renderRow)}</tbody>
                </table>
              </Accordion>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Subcomponente: celda de acciones por fila ────────────────────────────

type ActionCellProps = {
  item: {
    numero: number;
    videoId: string;
    url: string;
    titulo: string;
    publicado_en?: string;
  };
  job: Job | undefined;
  procesado: boolean;
  onEnqueue: (item: ActionCellProps["item"]) => void;
  onCancel: (numero: number) => void;
  onClear: (numero: number) => void;
  onLoad: (job: Job) => void;
};

function ActionCell({
  item,
  job,
  procesado,
  onEnqueue,
  onCancel,
  onClear,
  onLoad,
}: ActionCellProps) {
  if (procesado) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="playlist-link"
      >
        Ver en YouTube
      </a>
    );
  }

  if (!job) {
    return (
      <button
        type="button"
        className="btn-action"
        onClick={() => onEnqueue(item)}
      >
        A la cola
      </button>
    );
  }

  if (job.estado === "done") {
    // Auto-commit: ya está en vault, ofrecer ver
    if (job.committed_entities) {
      return (
        <div className="action-group">
          <span
            className="badge-mini"
            title={`${job.committed_entities} entidades en el vault`}
          >
            {job.committed_entities} en vault
          </span>
          <button
            type="button"
            className="btn-action-ghost"
            title="Limpiar este job"
            onClick={() => onClear(item.numero)}
          >
            Limpiar
          </button>
        </div>
      );
    }
    // Solo-resumen: cargar al form para revisión manual
    return (
      <div className="action-group">
        <button
          type="button"
          className="btn-action btn-action-primary"
          onClick={() => onLoad(job)}
        >
          Cargar
        </button>
        <button
          type="button"
          className="btn-action-ghost"
          title="Descartar resumen"
          onClick={() => onClear(item.numero)}
        >
          Descartar
        </button>
      </div>
    );
  }

  if (job.estado === "error" || job.estado === "cancelled") {
    return (
      <div className="action-group">
        <button
          type="button"
          className="btn-action"
          onClick={() => onEnqueue(item)}
        >
          Reencolar
        </button>
        <button
          type="button"
          className="btn-action-ghost"
          title="Limpiar"
          onClick={() => onClear(item.numero)}
        >
          Limpiar
        </button>
      </div>
    );
  }

  // Estados activos: queued / downloading / transcribing / summarizing / extracting / committing
  return (
    <button
      type="button"
      className="btn-action-ghost"
      onClick={() => onCancel(item.numero)}
    >
      Cancelar
    </button>
  );
}
