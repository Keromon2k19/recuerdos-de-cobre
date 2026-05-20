"use client";

import { useMemo, useState, type CSSProperties } from "react";

export type EpisodeBookPage = {
  id: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  icon: "summary" | "cast" | "chronology" | "relic" | "mystery" | "archive" | "page";
  tone: "copper" | "petrol" | "moss" | "gold" | "wine" | "ink";
  html: string;
};

type Props = {
  summaryTitle: string;
  summaryHtml: string;
  pages: EpisodeBookPage[];
};

const CHARS_PER_FOLIO = 2600;
const LIST_ITEM_SOFT_LIMIT = 8;

function splitList(tag: "ul" | "ol", inner: string): string[] {
  const items = inner.match(/<li[\s\S]*?<\/li>/g) ?? [];
  if (items.length <= LIST_ITEM_SOFT_LIMIT) return [`<${tag}>${inner}</${tag}>`];

  const groups: string[] = [];
  for (let i = 0; i < items.length; i += LIST_ITEM_SOFT_LIMIT) {
    groups.push(`<${tag}>${items.slice(i, i + LIST_ITEM_SOFT_LIMIT).join("")}</${tag}>`);
  }
  return groups;
}

function blockTokens(html: string): string[] {
  const blocks = html.match(
    /<h[2-4][\s\S]*?<\/h[2-4]>|<p[\s\S]*?<\/p>|<blockquote[\s\S]*?<\/blockquote>|<pre[\s\S]*?<\/pre>|<table[\s\S]*?<\/table>|[^<]+/gi,
  );
  return blocks ?? [];
}

function contentTokens(html: string): string[] {
  if (!html.trim()) return ["<p>Este registro todavia no tiene contenido.</p>"];

  const tokens: string[] = [];
  const listRe = /<(ul|ol)>([\s\S]*?)<\/\1>/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = listRe.exec(html))) {
    tokens.push(...blockTokens(html.slice(cursor, match.index)));
    tokens.push(...splitList(match[1].toLowerCase() as "ul" | "ol", match[2]));
    cursor = match.index + match[0].length;
  }

  tokens.push(...blockTokens(html.slice(cursor)));
  return tokens.filter((token) => token.trim().length > 0);
}

function paginateHtml(html: string): string[] {
  const tokens = contentTokens(html);
  const folios: string[] = [];
  let current = "";

  for (const token of tokens) {
    if (current && current.length + token.length > CHARS_PER_FOLIO) {
      folios.push(current);
      current = "";
    }

    if (token.length > CHARS_PER_FOLIO) {
      if (current) {
        folios.push(current);
        current = "";
      }
      folios.push(token);
      continue;
    }

    current += token;
  }

  if (current) folios.push(current);
  return folios.length > 0 ? folios : ["<p>Este registro todavia no tiene contenido.</p>"];
}

function Icon({ name }: { name: EpisodeBookPage["icon"] }) {
  if (name === "summary") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4.5h10l4 4V20H5z" />
        <path d="M15 4.5V9h4" />
        <path d="M8 12h8" />
        <path d="M8 15.5h6" />
      </svg>
    );
  }

  if (name === "cast") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.8 18.5c.8-3 2.6-4.5 5.2-4.5s4.4 1.5 5.2 4.5" />
        <circle cx="16.5" cy="9.5" r="2.2" />
        <path d="M14.8 14.5c2.8.2 4.6 1.5 5.4 4" />
      </svg>
    );
  }

  if (name === "chronology") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5v14" />
        <path d="M9 6h9" />
        <path d="M9 12h7" />
        <path d="M9 18h10" />
        <circle cx="5" cy="6" r="1.4" />
        <circle cx="5" cy="12" r="1.4" />
        <circle cx="5" cy="18" r="1.4" />
      </svg>
    );
  }

  if (name === "relic") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l5 5-5 13L7 8l5-5Z" />
        <path d="M7 8h10" />
        <path d="M12 3v18" />
      </svg>
    );
  }

  if (name === "mystery") {
    return (
      <span className="book-tab-icons" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="m15 15 5 5" />
        </svg>
        <svg viewBox="0 0 24 24">
          <path d="M9.2 9a3 3 0 1 1 5.3 2c-1.4 1.2-2.3 1.8-2.3 3.6" />
          <path d="M12.2 19h.1" />
        </svg>
      </span>
    );
  }

  if (name === "archive") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6.5h16v4H4z" />
        <path d="M6 10.5V20h12v-9.5" />
        <path d="M9 15h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.5h8l2 2V20H7z" />
      <path d="M9.5 9h5" />
      <path d="M9.5 13h5" />
      <path d="M9.5 17h3" />
    </svg>
  );
}

export default function EpisodeBook({ summaryTitle, summaryHtml, pages }: Props) {
  const allPages = useMemo<EpisodeBookPage[]>(
    () => [
      {
        id: "resumen-principal",
        title: summaryTitle || "Resumen",
        shortTitle: "Resumen",
        eyebrow: "Apertura",
        icon: "summary",
        tone: "copper",
        html: summaryHtml || "<p>Este registro todavia no tiene resumen.</p>",
      },
      ...pages,
    ],
    [pages, summaryHtml, summaryTitle],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [folioIndex, setFolioIndex] = useState(0);
  const active = allPages[activeIndex] ?? allPages[0];
  const folios = useMemo(() => paginateHtml(active.html), [active.html]);
  const currentFolio = folios[Math.min(folioIndex, folios.length - 1)] ?? folios[0];
  const hasPreviousSection = activeIndex > 0;
  const hasNextSection = activeIndex < allPages.length - 1;
  const hasPreviousFolio = folioIndex > 0;
  const hasNextFolio = folioIndex < folios.length - 1;

  function selectSection(index: number) {
    setActiveIndex(index);
    setFolioIndex(0);
  }

  function goBack() {
    if (hasPreviousFolio) {
      setFolioIndex((i) => i - 1);
      return;
    }
    if (hasPreviousSection) {
      setActiveIndex((i) => i - 1);
      setFolioIndex(0);
    }
  }

  function goForward() {
    if (hasNextFolio) {
      setFolioIndex((i) => i + 1);
      return;
    }
    if (hasNextSection) {
      setActiveIndex((i) => i + 1);
      setFolioIndex(0);
    }
  }

  return (
    <div className="episode-book">
      <section id="partes" className="book-shell rise" style={{ "--i": 2 } as CSSProperties}>
        <div className="book-nav">
          <div className="book-tabs" role="tablist" aria-label="Partes del registro">
            {allPages.map((page, index) => (
              <button
                key={page.id}
                id={`${page.id}-tab`}
                className="book-tab"
                data-active={index === activeIndex}
                data-tone={page.tone}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-controls={`${page.id}-panel`}
                onClick={() => selectSection(index)}
              >
                <span className="book-tab-icon">
                  <Icon name={page.icon} />
                </span>
                <span className="book-tab-copy">
                  <span>{page.eyebrow}</span>
                  <b>{page.shortTitle}</b>
                </span>
              </button>
            ))}
          </div>
          <div className="book-reader-controls" aria-label="Navegacion de lectura">
            <button type="button" onClick={goBack} disabled={!hasPreviousFolio && !hasPreviousSection}>
              Anterior
            </button>
            <span>
              {String(activeIndex + 1).padStart(2, "0")} / {String(allPages.length).padStart(2, "0")}
              {folios.length > 1 && ` - folio ${folioIndex + 1}/${folios.length}`}
            </span>
            <button type="button" onClick={goForward} disabled={!hasNextFolio && !hasNextSection}>
              Siguiente
            </button>
          </div>
        </div>

        <article
          id={`${active.id}-panel`}
          className="read-panel book-page"
          role="tabpanel"
          aria-labelledby={`${active.id}-tab`}
        >
          <div className="book-page-head">
            <div>
              <p>{active.eyebrow}</p>
              <h2>{active.title}</h2>
            </div>
            <span>
              Parte {String(activeIndex + 1).padStart(2, "0")}
              {folios.length > 1 && ` - pagina ${folioIndex + 1}`}
            </span>
          </div>
          <div
            key={`${active.id}-${folioIndex}`}
            className="prose book-folio"
            dangerouslySetInnerHTML={{
              __html: currentFolio,
            }}
          />
          {folios.length > 1 && (
            <div className="folio-dots" aria-label="Folios de esta parte">
              {folios.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  data-active={index === folioIndex}
                  aria-label={`Ir al folio ${index + 1}`}
                  onClick={() => setFolioIndex(index)}
                />
              ))}
            </div>
          )}
          <div className="book-page-actions">
            <button type="button" onClick={goBack} disabled={!hasPreviousFolio && !hasPreviousSection}>
              Anterior
            </button>
            <span>
              {active.shortTitle} - {folioIndex + 1}/{folios.length}
            </span>
            <button type="button" onClick={goForward} disabled={!hasNextFolio && !hasNextSection}>
              Siguiente
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
