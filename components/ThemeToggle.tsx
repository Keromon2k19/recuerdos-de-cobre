"use client";

// components/ThemeToggle.tsx — Pill animado sol ↔ luna (claro/oscuro).
// Edición fija III. Binario: sin "Auto". Default: noche.
// Persiste en localStorage("rdc-mode"); aplica data-mode en <html>.

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("rdc-mode");
    } catch {
      /* modo privado */
    }
    const initial: Mode = stored === "light" ? "light" : "dark";
    setMode(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.setAttribute("data-mode", next);
    try {
      localStorage.setItem("rdc-mode", next);
    } catch {
      /* modo privado */
    }
  }

  const isDark = mounted ? mode === "dark" : true;

  return (
    <button
      type="button"
      className="rdc-theme-toggle"
      data-mode={isDark ? "dark" : "light"}
      role="switch"
      aria-checked={isDark}
      aria-label={`Cambiar a modo ${isDark ? "día" : "noche"}`}
      onClick={toggle}
    >
      <span className="rdc-theme-track" aria-hidden="true">
        <span className="rdc-theme-thumb" />
      </span>
      <span className="rdc-theme-label" aria-hidden="true">
        {isDark ? "OSCURO" : "CLARO"}
      </span>
    </button>
  );
}
