"use client";

// components/atlas-v2/AtlasMusicPlayer.tsx
// Reproductor global discreto de la música de la campaña (UI V2).
// Vive dentro del TopNav (que está en el layout y no se desmonta al navegar),
// así que el <audio> sigue sonando sin cortes entre páginas de /v2.
//
// El control se renderiza dos veces compartiendo estado:
//  - inline en la barra (desktop), y
//  - flotante vía portal a <body> (mobile), porque el TopNav V2 no entra a
//    anchos chicos y su backdrop-filter rompería un position:fixed interno.
// CSS muestra una u otra según el viewport.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MUSIC_TRACKS } from "@/data/atlas-v2/music";

const STORAGE_KEY = "rdc.v2.music";
const DEFAULT_VOLUME = 0.35;

type Persisted = { currentSlug?: string; volume?: number; loop?: boolean };

function readPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Persisted) : {};
  } catch {
    return {};
  }
}

export default function AtlasMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(MUSIC_TRACKS[0].slug);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [loop, setLoop] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const current = MUSIC_TRACKS.find((t) => t.slug === currentSlug) ?? MUSIC_TRACKS[0];

  // Portal disponible recién en cliente.
  useEffect(() => setMounted(true), []);

  // Hidratar desde localStorage (solo cliente, no autoplay).
  useEffect(() => {
    const p = readPersisted();
    if (p.currentSlug && MUSIC_TRACKS.some((t) => t.slug === p.currentSlug)) {
      setCurrentSlug(p.currentSlug);
    }
    if (typeof p.volume === "number") setVolume(Math.min(1, Math.max(0, p.volume)));
    if (typeof p.loop === "boolean") setLoop(p.loop);
    setHydrated(true);
  }, []);

  // Persistir preferencias (nunca el estado de reproducción).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentSlug, volume, loop }));
    } catch {
      /* ignore */
    }
  }, [hydrated, currentSlug, volume, loop]);

  // Reflejar volumen y loop en el elemento <audio>.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  // Autoplay al entrar: intenta reproducir la pista al montar. Los navegadores
  // bloquean el audio con sonido sin un gesto previo; si pasa eso, arranca en la
  // primera interacción del usuario en la página (click o tecla).
  useEffect(() => {
    if (!hydrated) return;
    const audio = audioRef.current;
    if (!audio) return;

    const begin = () => {
      if (!audio.src) audio.src = current.src;
      audio.volume = volume;
      audio.loop = loop;
      return audio.play();
    };
    const cleanup = () => {
      document.removeEventListener("pointerdown", onFirstGesture);
      document.removeEventListener("keydown", onFirstGesture);
    };
    function onFirstGesture() {
      begin().then(() => setIsPlaying(true)).catch(() => {});
      cleanup();
    }

    begin()
      .then(() => setIsPlaying(true))
      .catch(() => {
        document.addEventListener("pointerdown", onFirstGesture);
        document.addEventListener("keydown", onFirstGesture);
      });

    return cleanup;
    // Solo al hidratar; usa los valores ya restaurados de localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Cerrar popover con Escape / click afuera. Usa closest para soportar las dos
  // instancias del control (barra inline + flotante portaleada).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element | null;
      if (!target || !target.closest("[data-av2-music]")) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const playSlug = useCallback(
    (slug: string) => {
      const audio = audioRef.current;
      if (!audio) return;
      const track = MUSIC_TRACKS.find((t) => t.slug === slug);
      if (!track) return;
      if (slug !== currentSlug) setCurrentSlug(slug);
      // Setear src imperativamente: el click es el gesto que habilita play().
      if (!audio.src.endsWith(track.src)) audio.src = track.src;
      audio.volume = volume;
      audio.loop = loop;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    },
    [currentSlug, volume, loop],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (!audio.src) audio.src = current.src;
      audio.volume = volume;
      audio.loop = loop;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [current, volume, loop]);

  // Markup del control (botón + popover). Se reutiliza en barra y flotante.
  const control = (variant: "bar" | "float") => (
    <div className={`av2-music av2-music--${variant}`} data-av2-music>
      <button
        type="button"
        className="av2-music-btn"
        aria-label={isPlaying ? `Música: sonando ${current.title}` : "Música de la mesa"}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-playing={isPlaying ? "true" : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="av2-music-eq" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
      </button>

      <div className="av2-music-pop" role="dialog" aria-label="Música de la mesa" hidden={!open}>
        <p className="av2-music-title">Música de la mesa</p>

        <ul className="av2-music-list">
          {MUSIC_TRACKS.map((t) => {
            const active = t.slug === currentSlug;
            return (
              <li key={t.slug}>
                <button
                  type="button"
                  className="av2-music-track"
                  data-active={active ? "true" : undefined}
                  data-playing={active && isPlaying ? "true" : undefined}
                  onClick={() => playSlug(t.slug)}
                >
                  <span className="av2-music-track-name">{t.title}</span>
                  <span className="av2-music-track-context">{t.context}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="av2-music-controls">
          <button
            type="button"
            className="av2-music-play"
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                <rect x="14" y="5" width="4" height="14" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M7 5l12 7-12 7V5z" fill="currentColor" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="av2-music-loop"
            aria-label="Repetir pista"
            aria-pressed={loop}
            data-on={loop ? "true" : undefined}
            onClick={() => setLoop((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <label className="av2-music-vol" aria-label="Volumen">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              aria-label="Volumen"
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (!loop) setIsPlaying(false);
        }}
      />
      {control("bar")}
      {mounted
        ? createPortal(
            // Reestablece el scope .av2 (variables --av2-*) fuera del shell;
            // av2-music-portal neutraliza el layout/fondo de .av2.
            <div className="av2 av2-music-portal">{control("float")}</div>,
            document.body,
          )
        : null}
    </>
  );
}
