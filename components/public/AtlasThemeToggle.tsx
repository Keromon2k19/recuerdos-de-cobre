"use client";

// components/public/AtlasThemeToggle.tsx — Toggle del sistema atlas (público).
// Glyph unicode ☾/☀, ícono solo, sin pill. Persiste en localStorage('atlas-mode').
// Contrato DOM: setea data-atlas-mode en <html>. Aislado del rdc (data-mode).

import { useEffect, useState } from "react";

type AtlasMode = "light" | "dark";

export default function AtlasThemeToggle() {
  const [mode, setMode] = useState<AtlasMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("atlas-mode");
    } catch {
      /* modo privado: caemos al default */
    }
    const initial: AtlasMode = stored === "light" ? "light" : "dark";
    setMode(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next: AtlasMode = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.setAttribute("data-atlas-mode", next);
    try {
      localStorage.setItem("atlas-mode", next);
    } catch {
      /* modo privado */
    }
  }

  const isLight = mounted ? mode === "light" : false;

  return (
    <button
      type="button"
      className="atlas-theme-toggle"
      role="switch"
      aria-checked={isLight}
      aria-label={
        isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"
      }
      onClick={toggle}
    >
      {/* Los dos glyphs viven como pseudo-elements ::before (☾) y ::after (☀)
          en el CSS: hace el crossfade-rotación entre estados sin re-render. */}
      <span className="sr-only">
        {isLight ? "Modo claro activo" : "Modo oscuro activo"}
      </span>
    </button>
  );
}
