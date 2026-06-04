"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export type CarouselSlide = {
  src: string;
  caption: string;
  sub?: string;
  alt: string;
  lightboxId?: string;
};

export type HeroStat = { label: string; value: string };

type Props = {
  eyebrow?: string;
  title: string;
  tagline?: string;
  slides: CarouselSlide[];
  intervalMs?: number;
  stats?: HeroStat[];
  cta?: ReactNode;
};

export default function HeroCarousel({
  eyebrow,
  title,
  tagline,
  slides,
  intervalMs = 7500,
  stats,
  cta,
}: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const thumbsRef = useRef<HTMLUListElement | null>(null);

  // prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // autoplay
  useEffect(() => {
    if (paused || reducedMotion || slides.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, slides.length, intervalMs]);

  // scroll active thumb into view
  useEffect(() => {
    const el = thumbsRef.current?.querySelector<HTMLLIElement>(
      `[data-idx="${active}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  // keyboard nav (left/right)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % slides.length);
      else if (e.key === "ArrowLeft") setActive((i) => (i - 1 + slides.length) % slides.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  const current = slides[active];

  return (
    <div
      className="av2-hc"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={title}
    >
      {/* Stack de imagenes con crossfade */}
      <div className="av2-hc-stage">
        {slides.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.src}
            src={s.src}
            alt={i === active ? s.alt : ""}
            aria-hidden={i !== active}
            className={`av2-hc-img ${i === active ? "is-active" : ""}`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}

        <div className="av2-hc-veil" aria-hidden="true" />

        {/* Atlas Card overlay: BL textos, BR ficha (eyebrow ahora dentro del BL) */}
        <div className="av2-hc-overlay">
          <div className="av2-hc-bl">
            {eyebrow && <p className="av2-hc-eyebrow">{eyebrow}</p>}
            <h1 className="av2-hc-title">{title}</h1>
            {tagline && <p className="av2-hc-tagline">{tagline}</p>}
            <div className="av2-hc-caption" key={active}>
              <span className="av2-hc-caption-marker" aria-hidden="true">»</span>
              <div className="av2-hc-caption-text">
                <p className="av2-hc-caption-name">{current.caption}</p>
                {current.sub && <p className="av2-hc-caption-sub">{current.sub}</p>}
              </div>
            </div>
            {cta && <div className="av2-hc-cta">{cta}</div>}
          </div>

          {stats && stats.length > 0 && (
            <dl className="av2-hc-stats">
              {stats.map((s) => (
                <div className="av2-hc-stat" key={s.label}>
                  <dt>
                    <span className="av2-hc-stat-bullet" aria-hidden="true">›</span>
                    {s.label}
                  </dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Barra inferior: progress + counter + zoom */}
        <div className="av2-hc-bottombar">
          {!reducedMotion && slides.length > 1 && (
            <div className="av2-hc-progress" aria-hidden="true">
              <div
                className={`av2-hc-progress-bar ${paused ? "is-paused" : ""}`}
                key={`${active}-${paused ? "p" : "r"}`}
                style={{ animationDuration: `${intervalMs}ms` }}
              />
            </div>
          )}
          <p className="av2-hc-counter" aria-live="polite">
            <span className="av2-hc-counter-curr">
              {String(active + 1).padStart(2, "0")}
            </span>
            <span className="av2-hc-counter-sep">/</span>
            <span className="av2-hc-counter-total">
              {String(slides.length).padStart(2, "0")}
            </span>
          </p>
          {current.lightboxId && (
            <a
              href={`#${current.lightboxId}`}
              className="av2-hc-zoom"
              aria-label={`Ver ${current.caption} en grande`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM21 21l-4.35-4.35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Thumbnails — clickeables, marca activa, con fade lateral */}
      <div className="av2-hc-thumbs-wrap">
        <ul ref={thumbsRef} className="av2-hc-thumbs" role="tablist">
          {slides.map((s, i) => (
            <li key={s.src} data-idx={i} className="av2-hc-thumb">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`av2-hc-thumb-btn ${i === active ? "is-active" : ""}`}
                role="tab"
                aria-selected={i === active}
                aria-label={s.caption}
                title={s.caption}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt="" loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
