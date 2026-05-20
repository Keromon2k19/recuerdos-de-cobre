"use client";

// components/LoadEpisodeForm.tsx — Formulario de carga de episodio
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { extractLoreAction } from "@/app/actions/extract";

const LOCALSTORAGE_KEY = "recuerdos-de-cobre-draft-resumen";
const PREFILL_KEY = "recuerdos-de-cobre-prefill-from-job";

export type PlaylistOption = {
  numero: number;
  titulo: string;
  url: string;
  publicado_en?: string;
  procesado: boolean;
};

type Props = {
  playlistOptions?: PlaylistOption[];
};

export default function LoadEpisodeForm({ playlistOptions = [] }: Props) {
  const router = useRouter();
  const [resumen, setResumen] = useState("");
  const [numero, setNumero] = useState<number | "">("");
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  function handlePlaylistPick(value: string) {
    if (!value) return;
    const num = Number(value);
    const opt = playlistOptions.find((o) => o.numero === num);
    if (!opt) return;
    setNumero(opt.numero);
    setTitulo(opt.titulo);
    if (opt.publicado_en) {
      setFecha(opt.publicado_en.slice(0, 10));
    }
  }

  // Pre-fill desde un job procesado (sessionStorage) tiene prioridad sobre el borrador
  useEffect(() => {
    const prefillRaw = sessionStorage.getItem(PREFILL_KEY);
    if (prefillRaw) {
      try {
        const prefill = JSON.parse(prefillRaw);
        if (prefill.resumen) {
          setResumen(prefill.resumen);
          setNumero(prefill.numero ?? "");
          setTitulo(prefill.titulo ?? "");
          setFecha(prefill.fecha ?? "");
          sessionStorage.removeItem(PREFILL_KEY);
          return; // no mostrar banner de borrador
        }
      } catch {
        // ignore
      }
    }

    // Restaurar borrador de localStorage
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
          "recuerdos-de-cobre-extraction",
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
    <form onSubmit={handleSubmit} className="load-form rdc-rise">
      {hasDraft && (
        <div className="draft-banner">
          <p>Tenés un borrador guardado de una carga anterior.</p>
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

      {playlistOptions.length > 0 && (
        <div className="form-group">
          <label htmlFor="ep-playlist">Elegir de la playlist</label>
          <select
            id="ep-playlist"
            className="input"
            value={numero || ""}
            onChange={(e) => handlePlaylistPick(e.target.value)}
          >
            <option value="">— seleccionar episodio —</option>
            {playlistOptions.map((opt) => (
              <option key={opt.numero} value={opt.numero}>
                {opt.procesado ? "[procesado] " : ""}
                Ep {String(opt.numero).padStart(2, "0")} · {opt.titulo}
              </option>
            ))}
          </select>
          <p className="form-hint">
            Se autocompleta número y título. Los marcados como procesado ya están en el archivo.
          </p>
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
        <div className="error-box" role="alert">
          <p className="error-title">Error de extracción</p>
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
            <span className="spinner" /> Extrayendo lore...
          </span>
        ) : (
          "Extraer Lore"
        )}
      </button>
    </form>
  );
}
