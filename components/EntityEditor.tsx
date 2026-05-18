"use client";

// components/EntityEditor.tsx — Edita o elimina una entidad existente del vault

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateEntityAction, deleteEntityAction } from "@/app/actions/entity";
import type { EntityType } from "@/lib/types";

type Props = {
  tipo: EntityType;
  slug: string;
  initialNombre: string;
  initialAlias: string[];
  initialBody: string;
};

export default function EntityEditor({
  tipo,
  slug,
  initialNombre,
  initialAlias,
  initialBody,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(initialNombre);
  const [alias, setAlias] = useState(initialAlias.join(", "));
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const editorRef = useRef<HTMLDivElement>(null);

  // Scroll suave al editor cuando se abre (evita que aparezca fuera del viewport)
  useEffect(() => {
    if (editing && editorRef.current) {
      const rm = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      editorRef.current.scrollIntoView({
        behavior: rm ? "auto" : "smooth",
        block: "center",
      });
    }
  }, [editing]);

  // Limpiar el indicador "guardado" después de 2.5s
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const aliasArray = alias
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      const result = await updateEntityAction(tipo, slug, {
        nombre,
        alias: aliasArray,
        body,
      });
      if (result.success) {
        setSaved(true);
        setEditing(false);
        if (result.newSlug) {
          router.push(`/entidades/${tipo}/${result.newSlug}`);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error);
      }
    });
  }

  function handleCancel() {
    setEditing(false);
    setNombre(initialNombre);
    setAlias(initialAlias.join(", "));
    setBody(initialBody);
    setError(null);
  }

  function handleDelete() {
    if (
      !confirm(
        `¿Eliminar definitivamente "${initialNombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteEntityAction(tipo, slug);
      if (result.success) {
        router.push(`/entidades/${tipo}`);
      } else {
        setError(result.error);
      }
    });
  }

  if (!editing) {
    return (
      <div className="entity-edit-controls" ref={editorRef}>
        <button onClick={() => setEditing(true)} className="btn-primary">
          Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="btn-danger"
        >
          Eliminar
        </button>
        {saved && (
          <span className="save-toast" role="status" aria-live="polite">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8.5l3.5 3.5L13 5" />
            </svg>
            Guardado
          </span>
        )}
        {error && (
          <div className="error-box" role="alert">
            <p className="error-title">Error</p>
            <pre className="error-detail">{error}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="entity-editor" ref={editorRef}>
      <h3>Editar entidad</h3>

      <label className="editor-field">
        <span className="editor-label">Nombre</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="editor-input"
        />
        <span className="editor-hint">
          Si cambiás el nombre, el archivo se renombra (slug nuevo).
        </span>
      </label>

      <label className="editor-field">
        <span className="editor-label">Alias (separados por coma)</span>
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Milla, Misha"
          className="editor-input"
        />
      </label>

      <label className="editor-field">
        <span className="editor-label">Cuerpo (Markdown)</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={20}
          className="editor-textarea"
        />
        <span className="editor-hint">
          Acá viven las menciones por episodio. Conservá el formato{" "}
          <code>### [[slug-episodio|Ep. N — Título]]</code> para que el linking siga funcionando.
        </span>
      </label>

      {error && (
        <div className="error-box" role="alert">
          <p className="error-title">Error</p>
          <pre className="error-detail">{error}</pre>
        </div>
      )}

      <div className="editor-actions">
        <button onClick={handleSave} disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button
          onClick={handleCancel}
          disabled={pending}
          className="btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
