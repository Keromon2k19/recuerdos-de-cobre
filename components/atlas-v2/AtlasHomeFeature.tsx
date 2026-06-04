"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { HomeCastSlide, HomeChapterSlide } from "@/lib/atlas-v2-home";

type Props = {
  slides: HomeChapterSlide[];
};

const CHAPTER_INTERVAL_MS = 9000;
const CAST_INTERVAL_MS = 11000;
const FALLBACK_SCENE = "/assets/atlas-v2/scenes/metropolis.webp";
const FALLBACK_PORTRAIT = "/assets/atlas-v2/portraits/_placeholder-1.svg";

export default function AtlasHomeFeature({ slides }: Props) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [castIndex, setCastIndex] = useState(0);
  const [sceneSrc, setSceneSrc] = useState(FALLBACK_SCENE);
  const [portraitSrc, setPortraitSrc] = useState(FALLBACK_PORTRAIT);

  const chapter = slides[chapterIndex] ?? null;
  const cast = useMemo(() => chapter?.cast ?? [], [chapter]);
  const castMember = cast[castIndex] ?? null;

  useEffect(() => {
    if (slides.length <= 1 || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setChapterIndex((current) => (current + 1) % slides.length);
    }, CHAPTER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    setCastIndex(0);
  }, [chapterIndex]);

  useEffect(() => {
    if (cast.length <= 1 || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setCastIndex((current) => (current + 1) % cast.length);
    }, CAST_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [cast.length, chapterIndex]);

  useEffect(() => {
    setSceneSrc(chapter?.imageSrc ?? FALLBACK_SCENE);
  }, [chapter?.imageSrc]);

  useEffect(() => {
    setPortraitSrc(castMember?.imageSrc ?? FALLBACK_PORTRAIT);
  }, [castMember?.imageSrc]);

  if (!chapter) {
    return (
      <div className="av2-hero-bottom">
        <div className="av2-latest">
          <div className="av2-latest-text">
            <p className="av2-latest-label">Archivo pendiente</p>
            <p className="av2-latest-num">Sin registros aún</p>
            <h2 className="av2-latest-title" style={{ color: "var(--av2-ink-faint)" }}>
              El archivo está vacío
            </h2>
            <p className="av2-latest-excerpt">
              Los capítulos aparecerán aquí a medida que se procesen episodios.
            </p>
            <div className="av2-latest-actions">
              <Link href="/v2/capitulos" className="av2-btn av2-btn--ghost">
                Ver archivo
              </Link>
            </div>
          </div>
        </div>
        <aside className="av2-cast-carousel" aria-label="Cast destacado">
          <p className="av2-cast-label">Cast del capítulo</p>
          <p className="av2-cast-empty">Sin personajes cargados.</p>
        </aside>
      </div>
    );
  }

  return (
    <div className="av2-hero-bottom">
      <article className="av2-latest" aria-label="Últimas crónicas">
        <div className="av2-latest-text">
          <p className="av2-latest-label">Últimas crónicas</p>
          <p className="av2-latest-num">
            {chapter.registroLabel} · {chapter.episodioLabel}
          </p>
          <h2 className="av2-latest-title">
            <Link href={chapter.href}>{chapter.titulo}</Link>
          </h2>
          {chapter.excerpt && (
            <p className="av2-latest-excerpt">{chapter.excerpt}</p>
          )}

          <div
            className="av2-latest-feature"
            data-kind={chapter.featured.kind}
          >
            <p className="av2-latest-feature-label">
              {chapter.featured.kind === "quote" ? "Cita del registro" : "Momento clave"}
            </p>
            {chapter.featured.kind === "quote" ? (
              <blockquote className="av2-latest-feature-text">
                <p>"{chapter.featured.text}"</p>
                {chapter.featured.author && (
                  <cite>{chapter.featured.author}</cite>
                )}
              </blockquote>
            ) : (
              <p className="av2-latest-feature-text">{chapter.featured.text}</p>
            )}
          </div>

        </div>

        <div className="av2-latest-actions">
          <Link href={chapter.href} className="av2-btn av2-btn--primary">
            Explorar capítulo
          </Link>
        </div>

        <figure className="av2-latest-scene" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sceneSrc}
            alt=""
            onError={() => setSceneSrc(FALLBACK_SCENE)}
          />
          <figcaption className="av2-latest-scene-cap">
            {chapter.episodioLabel}
          </figcaption>
        </figure>

        <div className="av2-latest-nav">
          <CarouselControls
            label="Cambiar cronica destacada"
            index={chapterIndex}
            total={slides.length}
            onPrev={() =>
              setChapterIndex((current) =>
                current === 0 ? slides.length - 1 : current - 1,
              )
            }
            onNext={() =>
              setChapterIndex((current) => (current + 1) % slides.length)
            }
            onSelect={setChapterIndex}
          />
        </div>
      </article>

      <aside
        className="av2-cast-carousel"
        aria-label={`Cast destacado de ${chapter.titulo}`}
      >
        <p className="av2-cast-label">Cast del capítulo</p>
        {castMember ? (
          <CastMember
            member={castMember}
            portraitSrc={portraitSrc}
            onPortraitError={() => setPortraitSrc(FALLBACK_PORTRAIT)}
          />
        ) : (
          <p className="av2-cast-empty">Sin personajes cargados.</p>
        )}

        {cast.length > 0 && (
          <div className="av2-cast-nav">
            <CarouselControls
              label="Cambiar personaje destacado"
              index={castIndex}
              total={cast.length}
              compact
              onPrev={() =>
                setCastIndex((current) =>
                  current === 0 ? cast.length - 1 : current - 1,
                )
              }
              onNext={() => setCastIndex((current) => (current + 1) % cast.length)}
              onSelect={setCastIndex}
            />
          </div>
        )}
      </aside>
    </div>
  );
}

function CastMember({
  member,
  portraitSrc,
  onPortraitError,
}: {
  member: HomeCastSlide;
  portraitSrc: string;
  onPortraitError: () => void;
}) {
  const name = (
    <h3 className="av2-cast-name">
      {member.href ? <Link href={member.href}>{member.name}</Link> : member.name}
    </h3>
  );

  return (
    <div className="av2-cast-member">
      <div className="av2-cast-head">
        <div className="av2-cast-portrait" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portraitSrc} alt="" onError={onPortraitError} />
        </div>
        <div className="av2-cast-copy">
          {name}
          <p className="av2-cast-meta">
            {[member.role, member.aliases.length > 0 ? member.aliases.join(" / ") : ""]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {member.quote && (
            <blockquote className="av2-cast-quote">
              <p>"{member.quote}"</p>
            </blockquote>
          )}
        </div>
      </div>
      <p className="av2-cast-detail">{member.detail}</p>
    </div>
  );
}

function CarouselControls({
  label,
  index,
  total,
  compact,
  onPrev,
  onNext,
  onSelect,
}: {
  label: string;
  index: number;
  total: number;
  compact?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  if (total <= 1) {
    return (
      <div className="av2-carousel-controls" data-compact={compact ? "true" : undefined}>
        <span className="av2-carousel-count">1 / 1</span>
      </div>
    );
  }

  return (
    <div
      className="av2-carousel-controls"
      data-compact={compact ? "true" : undefined}
      aria-label={label}
    >
      <button type="button" className="av2-carousel-btn" onClick={onPrev} aria-label="Anterior">
        ‹
      </button>
      <div className="av2-carousel-dots">
        {Array.from({ length: total }, (_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            className="av2-carousel-dot"
            data-active={dotIndex === index ? "true" : undefined}
            onClick={() => onSelect(dotIndex)}
            aria-label={`${label}: ${dotIndex + 1}`}
            aria-current={dotIndex === index ? "true" : undefined}
          />
        ))}
      </div>
      <span className="av2-carousel-count">
        {index + 1} / {total}
      </span>
      <button type="button" className="av2-carousel-btn" onClick={onNext} aria-label="Siguiente">
        ›
      </button>
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
