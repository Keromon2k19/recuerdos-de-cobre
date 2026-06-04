"use client";

// AddLocationPanel — modal flotante para crear un lugar nuevo en el mapa.
// Recibe el punto (x%, y%) capturado al hacer click en modo "agregar" y
// expone un form con los campos mínimos para crear una V2Region.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addMapLocation, type AddLocationInput } from "@/app/actions/map";

const TONES = ["copper", "gold", "moss", "petrol", "wine"] as const;
const TONE_LABELS: Record<(typeof TONES)[number], string> = {
  copper: "Cobre",
  gold: "Oro",
  moss: "Musgo",
  petrol: "Petróleo",
  wine: "Vino",
};

type Props = {
  point: { x: number; y: number };
  onCancel: () => void;
  onCreated: (slug: string) => void;
};

export default function AddLocationPanel({ point, onCancel, onCreated }: Props) {
  const [nombre, setNombre] = useState("");
  const [category, setCategory] = useState("Lugar");
  const [tagline, setTagline] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("copper");
  const [descripcion, setDescripcion] = useState("");
  const [gobierno, setGobierno] = useState("");
  const [poblacion, setPoblacion] = useState("");
  const [industria, setIndustria] = useState("");
  const [influencia, setInfluencia] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const didAutofocusRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || didAutofocusRef.current) return;
    didAutofocusRef.current = true;
    requestAnimationFrame(() => firstFieldRef.current?.focus());
  }, [mounted]);

  // Esc cierra + body scroll lock
  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onCancel();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, isSubmitting, onCancel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setError(null);
    const input: AddLocationInput = {
      nombre,
      category,
      tagline,
      descripcion,
      tone,
      pin: point,
      meta: { gobierno, poblacion, industria, influencia },
    };

    let keepOpen = true;
    setIsSubmitting(true);
    try {
      const result = await addMapLocation(input);
      if (result.ok) {
        keepOpen = false;
        onCreated(result.slug);
        return;
      }
      setError(result.error);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el lugar";
      setError(message);
    } finally {
      if (keepOpen) setIsSubmitting(false);
    }
  }

  if (!mounted) return null;

  const node = (
    <div
      className="av2-add-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="av2-add-title"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        className="av2-add-backdrop"
        onClick={() => { if (!isSubmitting) onCancel(); }}
        aria-label="Cerrar"
      />
      <form className="av2-add-panel" onSubmit={handleSubmit}>
        <header className="av2-add-head">
          <div className="av2-add-head-copy">
            <p className="av2-add-eyebrow">Marca del atlas</p>
            <h2 id="av2-add-title" className="av2-add-title">Crear o ubicar lugar</h2>
          </div>
          <div className="av2-add-head-actions">
            <span className="av2-add-coords">x {point.x}% · y {point.y}%</span>
            <button
              type="button"
              className="av2-add-close"
              onClick={onCancel}
              disabled={isSubmitting}
              aria-label="Cerrar"
            >
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="av2-add-body">
          <div className="av2-add-main">
            <label className="av2-add-field av2-add-field--full">
              <span className="av2-add-label">Nombre <em>*</em></span>
              <input
                ref={firstFieldRef}
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej. Coven Rojo o La Torre de Cristal"
                maxLength={80}
              />
            </label>

            <div className="av2-add-inline">
              <label className="av2-add-field">
                <span className="av2-add-label">Categoría</span>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Capital, Refugio, Mar..."
                  maxLength={40}
                />
              </label>

              <div className="av2-add-field av2-add-field--tone">
                <span className="av2-add-label">Tono</span>
                <div className="av2-add-tones">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`av2-add-tone av2-add-tone--${t}`}
                      data-active={tone === t ? "true" : undefined}
                      onClick={() => setTone(t)}
                      aria-label={TONE_LABELS[t]}
                      title={TONE_LABELS[t]}
                    >
                      <span />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="av2-add-field av2-add-field--full">
              <span className="av2-add-label">Tagline</span>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Una frase corta que defina el lugar"
                maxLength={120}
              />
            </label>

            <label className="av2-add-field av2-add-field--full">
              <span className="av2-add-label">Descripción</span>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Texto que aparecerá en el drawer del lugar"
                rows={5}
                maxLength={600}
              />
            </label>
          </div>

          <aside className="av2-add-meta-card" aria-label="Ficha opcional del lugar">
            <p className="av2-add-section">Ficha opcional</p>

            <label className="av2-add-field">
              <span className="av2-add-label">Gobierno</span>
              <input type="text" value={gobierno} onChange={(e) => setGobierno(e.target.value)} maxLength={40} />
            </label>
            <label className="av2-add-field">
              <span className="av2-add-label">Población</span>
              <input type="text" value={poblacion} onChange={(e) => setPoblacion(e.target.value)} maxLength={40} />
            </label>
            <label className="av2-add-field">
              <span className="av2-add-label">Industria</span>
              <input type="text" value={industria} onChange={(e) => setIndustria(e.target.value)} maxLength={40} />
            </label>
            <label className="av2-add-field">
              <span className="av2-add-label">Influencia</span>
              <input type="text" value={influencia} onChange={(e) => setInfluencia(e.target.value)} maxLength={40} />
            </label>
          </aside>
        </div>

        {error && <p className="av2-add-error" role="alert">{error}</p>}

        <footer className="av2-add-foot">
          <button
            type="button"
            className="av2-add-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="av2-add-submit"
            disabled={isSubmitting || !nombre.trim()}
          >
            {isSubmitting ? "Guardando..." : "Guardar pin"}
          </button>
        </footer>
      </form>
    </div>
  );

  return createPortal(node, document.body);
}
