"use client";

// components/LoadEpisodeForm.tsx — Formulario de carga de episodio
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { extractLoreAction } from "@/app/actions/extract";

const LOCALSTORAGE_KEY = "mysha-draft-resumen";

export default function LoadEpisodeForm() {
  const router = useRouter();
  const [resumen, setResumen] = useState("");
  const [numero, setNumero] = useState<number | "">("");
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Restaurar borrador de localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.resumen) {
          setHasDraft(true);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  function restoreDraft() {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) {
      const draft = JSON.parse(saved);
      setResumen(draft.resumen || "");
      setNumero(draft.numero || "");
      setTitulo(draft.titulo || "");
      setFecha(draft.fecha || "");
      setHasDraft(false);
    }
  }

  function saveDraft() {
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({ resumen, numero, titulo, fecha })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumen.trim() || !numero) return;

    setLoading(true);
    setError(null);
    saveDraft();

    try {
      const result = await extractLoreAction(
        resumen.trim(),
        Number(numero),
        titulo.trim() || undefined
      );

      if (result.success) {
        // Guardar resultado en sessionStorage para /review
        sessionStorage.setItem(
          "mysha-extraction",
          JSON.stringify({
            numero: Number(numero),
            titulo: titulo.trim(),
            fecha: fecha.trim(),
            resumen: resumen.trim(),
            data: result.data,
          })
        );
        router.push("/review");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="load-form">
      {hasDraft && (
        <div className="draft-banner">
          <p>📝 Tenés un borrador guardado.</p>
          <button type="button" onClick={restoreDraft} className="btn-ghost">
            Restaurar
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(LOCALSTORAGE_KEY);
              setHasDraft(false);
            }}
            className="btn-ghost btn-ghost-danger"
          >
            Descartar
          </button>
        </div>
      )}

      <div className="form-row">
        <div className="form-group form-group-sm">
          <label htmlFor="ep-numero">Episodio Nº</label>
          <input
            id="ep-numero"
            type="number"
            min={1}
            max={999}
            value={numero}
            onChange={(e) => setNumero(e.target.value ? Number(e.target.value) : "")}
            placeholder="67"
            required
            className="input"
          />
        </div>

        <div className="form-group form-group-md">
          <label htmlFor="ep-titulo">Título</label>
          <input
            id="ep-titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="La hoguera"
            className="input"
          />
        </div>

        <div className="form-group form-group-sm">
          <label htmlFor="ep-fecha">Fecha (opcional)</label>
          <input
            id="ep-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="ep-resumen">Resumen (de Gemini / YouTube)</label>
        <textarea
          id="ep-resumen"
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
          placeholder="Pegá acá el resumen automático del episodio..."
          rows={12}
          required
          className="textarea"
        />
        <p className="form-hint">
          {resumen.length > 0 ? `${resumen.length} caracteres` : ""}
        </p>
      </div>

      {error && (
        <div className="error-box">
          <p className="error-title">⚠️ Error de extracción</p>
          <pre className="error-detail">{error}</pre>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !resumen.trim() || !numero}
        className="btn-primary"
      >
        {loading ? (
          <span className="btn-loading">
            <span className="spinner" /> Extrayendo lore con Claude...
          </span>
        ) : (
          "⛧ Extraer Lore"
        )}
      </button>
    </form>
  );
}
