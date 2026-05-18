// components/EmptyState.tsx — Estado vacío a medida del archivo.
// Motivo cartográfico tenue (curvas de nivel) + una frase reflexiva en
// rioplatense + la acción más útil como botón real. Sin emoji decorativo.

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  /** Frase reflexiva en voz de archivista. Una sola, sin guiones largos. */
  message: string;
  /** Acción primaria opcional (botón real). */
  actionLabel?: string;
  actionHref?: string;
  /** Acción alternativa (no navegación) si se necesita un handler. */
  action?: ReactNode;
};

/** Curvas de nivel finas, reutilizables, a baja opacidad. Decorativo. */
function ContourMotif() {
  return (
    <svg
      className="rdc-empty-contour"
      viewBox="0 0 240 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M-10 78 C 40 60, 70 96, 120 74 S 210 52, 250 70" />
      <path d="M-10 60 C 44 44, 78 76, 122 56 S 206 38, 250 52" />
      <path d="M-10 44 C 50 32, 84 58, 124 40 S 200 26, 250 36" />
      <path d="M-10 94 C 38 80, 74 110, 126 92 S 210 74, 250 88" />
      <path d="M30 30 C 60 22, 96 40, 120 30" opacity="0.7" />
    </svg>
  );
}

export default function EmptyState({
  message,
  actionLabel,
  actionHref,
  action,
}: Props) {
  return (
    <div className="rdc-empty" role="status">
      <ContourMotif />
      <p className="rdc-empty-line">{message}</p>
      {action
        ? action
        : actionLabel && actionHref && (
            <Link href={actionHref} className="btn-primary rdc-empty-action">
              {actionLabel}
            </Link>
          )}
    </div>
  );
}
