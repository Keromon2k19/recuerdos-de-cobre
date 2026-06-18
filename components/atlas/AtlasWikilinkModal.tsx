"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getEntityPreviewAction, type EntityPreviewData } from "@/app/actions/preview";

export default function AtlasWikilinkModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<EntityPreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleGlobalClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Si hace click dentro de la tarjeta de previsualización, no hacer nada especial
      if (target.closest(".av2-preview-outer-shell")) {
        return;
      }

      const link = target.closest("a.wikilink") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Parsear la ruta para verificar si corresponde a una entidad del atlas
      const cleanPath = href.replace(/^\/+|\/+$/g, "");
      const parts = cleanPath.split("/");
      const allowedSegments = ["personajes", "lugares", "facciones", "objetos", "misterios", "mundo"];

      if (parts.length >= 2 && allowedSegments.includes(parts[0])) {
        // Detener la navegación nativa
        e.preventDefault();
        e.stopPropagation();

        setIsOpen(true);
        setLoading(true);
        setError(null);
        setPreviewData(null);

        try {
          const res = await getEntityPreviewAction(href);
          if (res.success) {
            setPreviewData(res);
          } else {
            setError(res.error || "No se pudo cargar la información.");
          }
        } catch (err) {
          setError("Error de comunicación con el grimorio.");
        } finally {
          setLoading(false);
        }
      }
    };

    document.addEventListener("click", handleGlobalClick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted]);

  // Bloquear el scroll en el body cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleClose = () => setIsOpen(false);

  const node = (
    <div className="av2-preview-root" role="dialog" aria-modal="true" onClick={handleClose}>
      <button
        type="button"
        className="av2-preview-backdrop"
        onClick={handleClose}
        aria-label="Cerrar modal"
      />

      <div className="av2-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Double Bezel: Outer Shell */}
        <div className="av2-preview-outer-shell">
          {/* Double Bezel: Inner Core */}
          <div className="av2-preview-card">
            
            {/* Botón de cerrar */}
            <button
              type="button"
              className="av2-preview-close"
              onClick={handleClose}
              aria-label="Cerrar previsualización"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {loading ? (
              <div className="av2-preview-loading">
                <div className="av2-preview-spinner" />
                <p>Abriendo registro del archivo...</p>
              </div>
            ) : error ? (
              <div className="av2-preview-error">
                <p className="av2-preview-error-title">No se pudo cargar</p>
                <p className="av2-preview-error-desc">{error}</p>
                <div className="av2-preview-actions">
                  <button type="button" className="av2-btn-secondary" onClick={handleClose}>
                    Cerrar
                  </button>
                </div>
              </div>
            ) : previewData ? (
              <>
                {/* Imagen de la entidad */}
                {previewData.imageSrc ? (
                  <div className="av2-preview-media" data-kind={previewData.kind}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewData.imageSrc} alt="" />
                    <div className="av2-preview-media-overlay" />
                  </div>
                ) : (
                  <div className="av2-preview-media-placeholder">
                    <span className="av2-preview-glyph">
                      {previewData.kind === "personaje" ? "☉" :
                       previewData.kind === "lugar" ? "△" :
                       previewData.kind === "faccion" ? "❖" :
                       previewData.kind === "objeto" ? "◇" :
                       previewData.kind === "misterio" ? "?" : "✦"}
                    </span>
                    <div className="av2-preview-media-overlay" />
                  </div>
                )}

                {/* Contenido del modal simplificado */}
                <div className="av2-preview-content">
                  <div className="av2-preview-text-block">
                    <h3 className="av2-preview-title">{previewData.name}</h3>
                    <p className="av2-preview-description">
                      {previewData.description || "Este registro todavía no tiene una descripción desarrollada."}
                    </p>
                  </div>
                  
                  {/* Botón circular de acceso al expediente */}
                  <a href={previewData.href} className="av2-preview-go-btn" onClick={handleClose} aria-label="Ver expediente completo">
                    <svg viewBox="0 0 16 16" width="14" height="14">
                      <path
                        d="M3 13L13 3M5 3h8v8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </div>
              </>
            ) : null}

          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
