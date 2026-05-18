// components/QueueRow.tsx — Fila de cola del códice con pips de manuscrito.
// Fiel al QueueRow del diseño: .qr > .qr-head + .qr-error? + .qr-pips.
// Mapea el Job real del pipeline (download→transcribe→summarize→extract→commit)
// al modelo de 5 pasos del diseño.

import { Fragment } from "react";
import type { Job, JobEstado } from "@/lib/types";

const PASOS = [
  "Descarga",
  "Transcripción",
  "Resumen",
  "Extracción",
  "Vault",
] as const;

type BadgeState = "pendiente" | "procesando" | "listo" | "error";

const BADGE_LABEL: Record<BadgeState, string> = {
  pendiente: "En espera",
  procesando: "Procesando",
  listo: "Indexado",
  error: "Error",
};

function badgeState(estado: JobEstado): BadgeState {
  if (estado === "queued") return "pendiente";
  if (estado === "esperando_resumen") return "pendiente";
  if (estado === "done") return "listo";
  if (estado === "error" || estado === "cancelled") return "error";
  return "procesando";
}

// Índice del paso (0-4) según el estado del job.
function pasoIndex(job: Job): number {
  switch (job.estado) {
    case "queued":
    case "downloading":
      return 0;
    case "transcribing":
      return 1;
    case "esperando_resumen":
    case "summarizing":
      return 2;
    case "extracting":
      return 3;
    case "committing":
      return 4;
    case "done":
      return PASOS.length;
    case "error":
    case "cancelled": {
      const t = `${job.etapa_actual ?? ""} ${job.error ?? ""}`.toLowerCase();
      if (/(vault|commit|guard)/.test(t)) return 4;
      if (/(extra)/.test(t)) return 3;
      if (/(resum|summar)/.test(t)) return 2;
      if (/(transcri|whisper)/.test(t)) return 1;
      return 0;
    }
    default:
      return 0;
  }
}

type Props = {
  job: Job;
  onRetry: (job: Job) => void;
  onDiscard: (job: Job) => void;
};

export default function QueueRow({ job, onRetry, onDiscard }: Props) {
  const estado = badgeState(job.estado);
  const paso = pasoIndex(job);
  const isError = estado === "error";
  const isDone = estado === "listo";
  const isProcesando = estado === "procesando";

  // Fracción dentro del paso actual (la transcripción reporta progress 0-100).
  const withinStep =
    isProcesando && typeof job.progress === "number"
      ? Math.max(0, Math.min(1, job.progress / 100))
      : 0;

  function pipState(i: number): "done" | "current" | "error" | "pending" {
    if (isDone) return "done";
    if (isError && i === paso) return "error";
    if (i < paso) return "done";
    if (i === paso) return "current";
    return "pending";
  }

  function lineState(i: number): "filled" | "partial" | "empty" {
    if (isDone || i < paso) return "filled";
    if (i === paso && isProcesando) return "partial";
    return "empty";
  }

  const mensaje =
    isError && job.error
      ? job.error.slice(0, 240)
      : isProcesando && job.progress_detail
        ? job.progress_detail
        : null;

  return (
    <article className="qr">
      <header className="qr-head">
        <div className="qr-num">{String(job.numero).padStart(2, "0")}</div>
        <div className="qr-title">
          <a
            className="qr-link"
            href={job.url}
            target="_blank"
            rel="noreferrer"
          >
            <span>{job.titulo}</span>
            <svg
              className="qr-link-glyph"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              width="11"
              height="11"
            >
              <path d="M3.5 8.5L8.5 3.5M4.5 3.5H8.5V7.5" />
            </svg>
          </a>
        </div>
        <div className="qr-status">
          <span className="rdc-badge" data-state={estado}>
            {estado === "procesando" ? <span className="rdc-pulse" /> : null}
            {BADGE_LABEL[estado]}
          </span>
          {isError ? (
            <button
              type="button"
              className="qr-iconbtn"
              title="Reintentar"
              aria-label="Reintentar"
              onClick={() => onRetry(job)}
            >
              <svg
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                width="13"
                height="13"
              >
                <path d="M11.5 3.5A5 5 0 1 0 12 7" />
                <path d="M11.5 1.5V4H9" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="qr-x-slot">
          <button
            type="button"
            className="qr-iconbtn"
            title={isProcesando ? "Cancelar" : "Descartar"}
            aria-label={isProcesando ? "Cancelar" : "Descartar"}
            onClick={() => onDiscard(job)}
          >
            <svg
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
              width="12"
              height="12"
            >
              <path d="M3 3L11 11M11 3L3 11" />
            </svg>
          </button>
        </div>
      </header>

      {mensaje ? <div className="qr-error">{mensaje}</div> : null}

      <div
        className="qr-pips"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={PASOS.length}
        aria-valuenow={Math.min(paso + 1, PASOS.length)}
        aria-label={`Paso ${Math.min(paso + 1, PASOS.length)} de ${PASOS.length}: ${
          PASOS[Math.min(paso, PASOS.length - 1)]
        }`}
      >
        {PASOS.map((nombre, i) => (
          <Fragment key={nombre}>
            <div className="qr-pip" data-state={pipState(i)} title={nombre}>
              <span className="qr-pip-dot" />
              <span className="qr-pip-label">{nombre}</span>
            </div>
            {i < PASOS.length - 1 ? (
              <span
                className="qr-line"
                data-state={lineState(i)}
                style={
                  lineState(i) === "partial"
                    ? ({
                        "--qr-fill": `${withinStep * 100}%`,
                      } as React.CSSProperties)
                    : undefined
                }
              />
            ) : null}
          </Fragment>
        ))}
      </div>
    </article>
  );
}
