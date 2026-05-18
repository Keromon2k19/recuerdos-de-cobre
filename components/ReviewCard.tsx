"use client";

// components/ReviewCard.tsx — Card editable por categoría para la pantalla de revisión
import { useState } from "react";

export type ReviewItemStatus = "accepted" | "edited" | "discarded";

type ReviewCardProps = {
  id: string;
  category: string;
  nombre: string;
  descripcion: string;
  alias?: string[];
  existsInVault?: boolean;
  onUpdate: (id: string, data: { nombre: string; descripcion: string; alias?: string[] }) => void;
  onDiscard: (id: string) => void;
  onRestore: (id: string) => void;
  status: ReviewItemStatus;
};

export default function ReviewCard({
  id,
  category,
  nombre,
  descripcion,
  alias,
  existsInVault,
  onUpdate,
  onDiscard,
  onRestore,
  status,
}: ReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [editNombre, setEditNombre] = useState(nombre);
  const [editDescripcion, setEditDescripcion] = useState(descripcion);
  const [editAlias, setEditAlias] = useState(alias?.join(", ") ?? "");

  function handleSave() {
    onUpdate(id, {
      nombre: editNombre.trim(),
      descripcion: editDescripcion.trim(),
      alias: editAlias
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    });
    setEditing(false);
  }

  function handleCancel() {
    setEditNombre(nombre);
    setEditDescripcion(descripcion);
    setEditAlias(alias?.join(", ") ?? "");
    setEditing(false);
  }

  if (status === "discarded") {
    return (
      <div className="review-card review-card-discarded">
        <div className="review-card-header">
          <span className="review-card-name discarded">{nombre}</span>
          <span className="badge-discarded">Descartado</span>
        </div>
        <button
          onClick={() => onRestore(id)}
          className="btn-ghost btn-sm"
        >
          Restaurar
        </button>
      </div>
    );
  }

  return (
    <div className={`review-card ${status === "edited" ? "review-card-edited" : ""}`}>
      <div className="review-card-header">
        {editing ? (
          <input
            type="text"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            className="input input-inline"
          />
        ) : (
          <span className="review-card-name">{nombre}</span>
        )}
        {existsInVault && (
          <span className="badge-exists" title="Ya existe en el vault, se agrega una mención">
            Ya existe
          </span>
        )}
        {status === "edited" && (
          <span className="badge-edited">Editado</span>
        )}
      </div>

      {editing ? (
        <div className="review-card-edit">
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={editDescripcion}
              onChange={(e) => setEditDescripcion(e.target.value)}
              rows={3}
              className="textarea textarea-sm"
            />
          </div>
          {alias !== undefined && (
            <div className="form-group">
              <label>Alias (separados por coma)</label>
              <input
                type="text"
                value={editAlias}
                onChange={(e) => setEditAlias(e.target.value)}
                className="input"
                placeholder="la bruja roja, la roja"
              />
            </div>
          )}
          <div className="review-card-actions">
            <button onClick={handleSave} className="btn-sm btn-confirm">
              Guardar
            </button>
            <button onClick={handleCancel} className="btn-sm btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="review-card-desc">{descripcion}</p>
          {alias && alias.length > 0 && (
            <p className="review-card-alias">
              Alias: {alias.join(", ")}
            </p>
          )}
          <div className="review-card-actions">
            <button
              onClick={() => setEditing(true)}
              className="btn-sm btn-ghost"
            >
              Editar
            </button>
            <button
              onClick={() => onDiscard(id)}
              className="btn-sm btn-ghost btn-ghost-danger"
            >
              Descartar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
