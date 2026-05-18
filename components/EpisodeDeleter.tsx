"use client";

// components/EpisodeDeleter.tsx — Botón para eliminar un episodio + limpieza
// en cascada de menciones en entidades. Doble confirmación.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEpisodeAction } from "@/app/actions/episode";

type Props = {
  numero: number;
  titulo: string;
};

export default function EpisodeDeleter({ numero, titulo }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    cleanedEntities: number;
    deletedEntities: number;
  } | null>(null);

  function handleDelete() {
    if (
      !confirm(
        `Confirmá una vez más: eliminar episodio ${numero} "${titulo}" y limpiar todas sus menciones del resto del vault. Esta acción es irreversible.`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteEpisodeAction(numero);
      if (res.success) {
        setResult({
          cleanedEntities: res.cleanedEntities,
          deletedEntities: res.deletedEntities,
        });
        // Esperar 2s para que el usuario vea el resumen, después redirigir
        setTimeout(() => router.push("/episodios"), 2000);
      } else {
        setError(res.error);
      }
    });
  }

  if (result) {
    return (
      <div className="success-box">
        <p className="success-title">Episodio {numero} eliminado</p>
        <p className="success-detail">
          {result.cleanedEntities} entidades limpiadas
          {result.deletedEntities > 0 &&
            `, ${result.deletedEntities} entidades borradas (sin más apariciones)`}
          .
        </p>
        <p className="success-detail">Redirigiendo a /episodios…</p>
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="btn-danger"
        title="Elimina el episodio y limpia todas sus menciones en las entidades"
      >
        Eliminar episodio
      </button>
    );
  }

  return (
    <div className="delete-confirm-box">
      <p className="warning-text">
        <strong>Acción destructiva.</strong> Esto va a:
      </p>
      <ul className="warning-list">
        <li>Borrar el archivo del episodio</li>
        <li>Borrar el job en <code>_jobs/</code> (si existe)</li>
        <li>
          Quitar este episodio de <code>apariciones</code> y <code>relaciones</code> en cada entidad que lo tenía
        </li>
        <li>Borrar la sección de menciones de este episodio dentro de cada entidad</li>
        <li>
          <strong>Eliminar entidades que queden sin más apariciones</strong>
        </li>
      </ul>
      <div className="editor-actions">
        <button
          onClick={handleDelete}
          disabled={pending}
          className="btn-danger"
        >
          {pending ? "Eliminando…" : "Sí, eliminar permanentemente"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="btn-secondary"
        >
          Cancelar
        </button>
      </div>
      {error && (
        <div className="error-box" role="alert">
          <p className="error-title">Error</p>
          <pre className="error-detail">{error}</pre>
        </div>
      )}
    </div>
  );
}
