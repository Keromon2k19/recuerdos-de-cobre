"use client";

// components/SearchPalette.tsx — Command palette de búsqueda semántica.
// Atajo: Cmd/Ctrl + K. Debounce 250ms. Navegación con flechas + Enter.

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchHit } from "@/app/actions/search";
import {
  substringSearchClient,
  type LiteIndex,
} from "@/lib/client-search";

// Cache modulo-level del indice lite: la primera vez que se abre el palette
// hacemos fetch, despues queda en memoria mientras viva la pestana.
let cachedLiteIndex: LiteIndex | null = null;
let inflightLiteIndex: Promise<LiteIndex | null> | null = null;

async function getLiteIndex(): Promise<LiteIndex | null> {
  if (cachedLiteIndex) return cachedLiteIndex;
  if (inflightLiteIndex) return inflightLiteIndex;
  inflightLiteIndex = (async () => {
    try {
      const res = await fetch("/search-index.json");
      if (!res.ok) return null;
      const idx = (await res.json()) as LiteIndex;
      cachedLiteIndex = idx;
      return idx;
    } catch {
      return null;
    } finally {
      inflightLiteIndex = null;
    }
  })();
  return inflightLiteIndex;
}

// Marcador breve (mono) por tipo. Sin emoji: tono de archivo, no de chat.
const TIPO_MARK: Record<string, string> = {
  personaje: "PJ",
  lugar: "LU",
  evento: "EV",
  objeto: "OB",
  faccion: "FA",
  worldbuilding: "WB",
  misterio: "MI",
  quote: "QT",
  decision: "DC",
};

export default function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"semantic" | "substring" | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  // Abrir/cerrar con Cmd/Ctrl+K, cerrar con Esc. En la primera apertura
  // prefetcheamos el indice lite — si ya esta cacheado es no-op.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) void getLiteIndex();
          return !o;
        });
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus al abrir, reset al cerrar. El foco se mueve al input en el
  // siguiente frame (tras montar el nodo), sin retardo perceptible y sin
  // bloquear el tipeo. Al cerrar el input se desmonta y el foco vuelve al body.
  useEffect(() => {
    if (open) {
      // Guardar el foco previo para devolverlo al cerrar.
      lastFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => {
        cancelAnimationFrame(id);
        // Al cerrar/desmontar, devolver el foco al elemento previo.
        const target = lastFocusRef.current ?? document.body;
        if (target && typeof target.focus === "function") target.focus();
        lastFocusRef.current = null;
      };
    } else {
      setQuery("");
      setHits([]);
      setError(null);
      setActive(0);
      setMode(null);
    }
  }, [open]);

  // Focus trap: Tab/Shift+Tab cicla solo dentro del panel del diálogo.
  useEffect(() => {
    if (!open) return;
    function onTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (activeEl === first || !panel.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeEl === last || !panel.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onTrap, true);
    return () => document.removeEventListener("keydown", onTrap, true);
  }, [open]);

  // Busqueda en cliente: substring sobre el indice lite (~50KB cacheado).
  // Sin debounce porque el match es <1ms; con debounce el palette se siente
  // perezoso. El roundtrip al server desaparecio: cero latencia de red.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      setError(null);
      return;
    }
    const myReq = ++reqIdRef.current;
    const idx = cachedLiteIndex;
    if (idx) {
      const hits = substringSearchClient(idx, q);
      setHits(hits);
      setMode("substring");
      setError(null);
      setActive(0);
      setLoading(false);
      return;
    }
    // Primer keystroke antes de que termine el fetch del indice: esperamos
    // a que llegue y reaplicamos.
    setLoading(true);
    void getLiteIndex().then((idx) => {
      if (myReq !== reqIdRef.current) return;
      setLoading(false);
      if (!idx) {
        setHits([]);
        setError(
          "No hay indice de busqueda. Corre: npx tsx scripts/build-lite-index.ts"
        );
        return;
      }
      setHits(substringSearchClient(idx, q));
      setMode("substring");
      setError(null);
      setActive(0);
    });
  }, [query]);

  const go = useCallback(
    (hit: SearchHit) => {
      setOpen(false);
      router.push(`/entidades/${hit.tipo}/${hit.slug}`);
    },
    [router]
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="palette-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        ref={panelRef}
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda"
      >
        <div className="palette-input-row">
          <svg
            className="palette-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Buscar en el archivo… (personajes, lugares, eventos, lore)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
          />
          {loading && <span className="spinner" />}
          <kbd className="palette-kbd">ESC</kbd>
        </div>

        <div className="palette-results" aria-live="polite">
          {error && <div className="palette-empty">{error}</div>}
          {!error && query.trim().length >= 2 && !loading && hits.length === 0 && (
            <div className="palette-empty">
              Nada coincide con “{query}”.
            </div>
          )}
          {!error && query.trim().length < 2 && (
            <div className="palette-empty">
              Escribí al menos 2 caracteres. Búsqueda por significado, no solo
              por nombre.
            </div>
          )}
          {hits.map((hit, i) => (
            <button
              key={`${hit.tipo}/${hit.slug}`}
              className={`palette-hit ${i === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(hit)}
            >
              <span className="palette-hit-emoji">
                {TIPO_MARK[hit.tipo] ?? "··"}
              </span>
              <span className="palette-hit-body">
                <span className="palette-hit-name">{hit.nombre}</span>
                <span className="palette-hit-snippet">{hit.snippet}</span>
              </span>
              <span className="palette-hit-tipo">{hit.tipo}</span>
            </button>
          ))}
        </div>

        {mode && hits.length > 0 && (
          <div className="palette-footer">
            <span>
              {mode === "semantic"
                ? "Búsqueda semántica (Gemini)"
                : "Búsqueda por texto"}
            </span>
            <span>↑↓ navegar · ↵ abrir · ESC cerrar</span>
          </div>
        )}
      </div>
    </div>
  );
}
