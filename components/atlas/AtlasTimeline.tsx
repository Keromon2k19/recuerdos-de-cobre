"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { TimelineItem } from "@/lib/atlas-timeline";

const MAX_CHIPS = 4;

function partLabel(eyebrow: string): string {
  const match = eyebrow.match(/PARTE\s+(.+)$/);
  return match ? `P${match[1]}` : "";
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function AtlasTimeline({ items }: { items: TimelineItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  const jumpToItem = (index: number, align: "start" | "center" = "center") => {
    const root = rootRef.current;
    const row = root?.querySelectorAll<HTMLElement>(".av2-tl-row")[index];
    const scrollRoot = root?.closest<HTMLElement>(".av2-page-scene-content");
    if (!row || !scrollRoot) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollRect = scrollRoot.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const anchor = align === "start" ? 0.22 : 0.34;
    const target =
      scrollRoot.scrollTop +
      rowRect.top -
      scrollRect.top -
      scrollRoot.clientHeight * anchor;

    scrollRoot.scrollTo({
      top: Math.max(0, target),
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const handleStepKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const lastIndex = items.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = Math.min(lastIndex, index + 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = Math.max(0, index - 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null || nextIndex === index) return;
    event.preventDefault();
    jumpToItem(nextIndex, nextIndex === 0 ? "start" : "center");
    const nextStep = rootRef.current?.querySelectorAll<HTMLButtonElement>(
      ".av2-tl-progress-step"
    )[nextIndex];
    nextStep?.focus();
  };

  useEffect(() => {
    const apply = () => {
      try {
        const fontSize = 20;
        const lineHeight = 20;
        const context = document.createElement("canvas").getContext("2d");
        if (!context) return;

        context.font = `600 ${fontSize}px "Cormorant Garamond", serif`;
        const metrics = context.measureText("012345678");
        const fontAscent = metrics.fontBoundingBoxAscent;
        const fontDescent = metrics.fontBoundingBoxDescent;
        const actualAscent = metrics.actualBoundingBoxAscent;
        const actualDescent = metrics.actualBoundingBoxDescent;
        const halfLeading = (lineHeight - (fontAscent + fontDescent)) / 2;
        const baselineFromTop = halfLeading + fontAscent;
        const inkCenter =
          baselineFromTop + (actualDescent - actualAscent) / 2;
        const nudge = Math.round(-(inkCenter - lineHeight / 2) * 100) / 100;

        rootRef.current?.style.setProperty(
          "--av2-tl-num-nudge",
          `${nudge}px`
        );
      } catch {
        rootRef.current?.style.setProperty("--av2-tl-num-nudge", "1px");
      }
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(apply).catch(apply);
    } else {
      apply();
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = Array.from(root.querySelectorAll<HTMLElement>(".av2-tl-row"));
    const thumb = root.querySelector<HTMLElement>(".av2-tl-progress-thumb");
    const caption = root.querySelector<HTMLElement>(".av2-tl-progress-cap");
    const progressList = root.querySelector<HTMLElement>(
      ".av2-tl-progress-list"
    );
    const steps = Array.from(
      root.querySelectorAll<HTMLButtonElement>(".av2-tl-progress-step")
    );
    const scrollRoot = root.closest<HTMLElement>(".av2-page-scene-content");

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    const syncVisibleRows = () => {
      if (reduce) {
        rows.forEach((row) => row.setAttribute("data-visible", "true"));
        return;
      }

      const viewportRect = scrollRoot?.getBoundingClientRect();
      const viewportTop = viewportRect?.top ?? 0;
      const viewportBottom =
        viewportTop + (viewportRect?.height ?? window.innerHeight);

      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        const visible =
          rect.bottom > viewportTop && rect.top < viewportBottom - 72;
        row.toggleAttribute("data-visible", visible);
      });
    };

    rows.forEach((row) => {
      row.removeAttribute("style");
      row.querySelector<HTMLElement>(".av2-tl-card")?.removeAttribute("style");
      row.querySelector<HTMLElement>(".av2-tl-node")?.removeAttribute("style");
    });

    const revealObserver = reduce
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              entry.target.toggleAttribute("data-visible", entry.isIntersecting);
            });
          },
          {
            root: scrollRoot ?? null,
            threshold: 0.18,
            rootMargin: "0px 0px -8% 0px",
          }
        );

    revealObserver
      ? rows.forEach((row) => revealObserver.observe(row))
      : rows.forEach((row) => row.setAttribute("data-visible", "true"));

    let ticking = false;
    const update = () => {
      const viewportRect = scrollRoot?.getBoundingClientRect();
      const viewportTop = viewportRect?.top ?? 0;
      const viewportHeight = viewportRect?.height ?? window.innerHeight;
      const scrollTop =
        scrollRoot?.scrollTop ?? Math.max(0, -root.getBoundingClientRect().top);
      let activeIndex = 0;
      let activeDistance = Number.POSITIVE_INFINITY;

      rows.forEach((row, index) => {
        const rect = row.getBoundingClientRect();
        const center = rect.top - viewportTop + rect.height / 2;

        const distance = Math.abs(center - viewportHeight / 2);
        if (distance < activeDistance) {
          activeDistance = distance;
          activeIndex = index;
        }
      });

      const rootRect = root.getBoundingClientRect();
      const totalScrollable = scrollRoot
        ? scrollRoot.scrollHeight - scrollRoot.clientHeight
        : rootRect.height - viewportHeight;
      const progress = clamp(
        totalScrollable > 0
          ? scrollRoot
            ? scrollRoot.scrollTop / totalScrollable
            : -rootRect.top / totalScrollable
          : 0,
        0,
        1
      );
      root.style.setProperty(
        "--av2-tl-line-progress",
        clamp((scrollTop + viewportHeight * 0.46) / root.offsetHeight, 0.004, 1).toFixed(3)
      );
      if (scrollRoot && scrollRoot.scrollTop <= 2) {
        activeIndex = 0;
      } else if (
        scrollRoot &&
        totalScrollable > 0 &&
        totalScrollable - scrollRoot.scrollTop <= 2
      ) {
        activeIndex = rows.length - 1;
      }

      rows.forEach((row, index) => {
        row.toggleAttribute("data-active", index === activeIndex);
      });
      if (thumb) thumb.style.top = `${(progress * 100).toFixed(2)}%`;
      if (caption && rows[activeIndex]) {
        caption.textContent = `EP ${rows[activeIndex].dataset.num ?? ""}`;
      }
      steps.forEach((step, index) => {
        const active = index === activeIndex;
        step.toggleAttribute("data-active", active);
        step.tabIndex = active ? 0 : -1;
        if (active) {
          step.setAttribute("aria-current", "step");
          if (progressList) {
            const top = step.offsetTop;
            const bottom = top + step.offsetHeight;
            const viewTop = progressList.scrollTop;
            const viewBottom = viewTop + progressList.clientHeight;
            if (top < viewTop + 14) {
              progressList.scrollTop = Math.max(0, top - 14);
            } else if (bottom > viewBottom - 14) {
              progressList.scrollTop =
                bottom - progressList.clientHeight + 14;
            }
          }
        } else {
          step.removeAttribute("aria-current");
        }
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    const scrollTarget: HTMLElement | Window = scrollRoot ?? window;
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    syncVisibleRows();
    update();

    return () => {
      revealObserver?.disconnect();
      scrollTarget.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  const firstItem = items[0];
  const lastItem = items[items.length - 1];

  return (
    <div className="av2-tl" ref={rootRef}>
      <div className="av2-tl-spine" aria-hidden="true" />
      <nav className="av2-tl-progress" aria-label="Navegacion de episodios">
        <div className="av2-tl-progress-head">
          <span className="av2-tl-progress-label">Episodios</span>
          <span className="av2-tl-progress-cap">
            EP {firstItem?.displayNumero ?? ""}
          </span>
        </div>
        {firstItem ? (
          <button
            type="button"
            className="av2-tl-jump av2-tl-jump-start"
            onClick={() => jumpToItem(0, "start")}
            aria-label={`Ir al primer episodio: ${firstItem.titulo}`}
          >
            <span>Inicio</span>
            <strong>EP {firstItem.displayNumero}</strong>
          </button>
        ) : null}
        <span className="av2-tl-progress-track">
          <span className="av2-tl-progress-thumb" />
        </span>
        <div className="av2-tl-progress-list">
          {items.map((item, index) => {
            const part = partLabel(item.eyebrow);

            return (
              <button
                type="button"
                className="av2-tl-progress-step"
                key={item.id}
                data-active={index === 0 || undefined}
                tabIndex={index === 0 ? 0 : -1}
                onClick={() => jumpToItem(index)}
                onKeyDown={(event) => handleStepKeyDown(event, index)}
                aria-label={`Ir a ${item.eyebrow}: ${item.titulo}`}
              >
                <span>{item.displayNumero}</span>
                {part ? <em>{part}</em> : null}
              </button>
            );
          })}
        </div>
        {lastItem ? (
          <button
            type="button"
            className="av2-tl-jump av2-tl-jump-end"
            onClick={() => jumpToItem(items.length - 1)}
            aria-label={`Ir al ultimo episodio: ${lastItem.titulo}`}
          >
            <span>Final</span>
            <strong>EP {lastItem.displayNumero}</strong>
          </button>
        ) : null}
      </nav>

      <ol className="av2-tl-list">
        {items.map((item) => {
          const shown = item.personajes.slice(0, MAX_CHIPS);
          const rest = item.personajes.length - shown.length;

          return (
            <li
              key={item.id}
              className="av2-tl-row"
              data-side={item.side}
              data-num={item.displayNumero}
              data-has-place-image={item.placeImageSrc ? "true" : undefined}
            >
              <div className="av2-tl-node" aria-hidden="true">
                <span className="av2-tl-num">{item.displayNumero}</span>
              </div>

              <Link href={item.href} className="av2-tl-card">
                {item.placeImageSrc ? (
                  <div className="av2-tl-card-media" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.placeImageSrc} alt="" loading="lazy" />
                    <span className="av2-tl-card-date">{item.eyebrow}</span>
                  </div>
                ) : null}

                <div className="av2-tl-card-content">
                  <div className="av2-tl-eyebrow">
                    {item.placeImageSrc ? "Registro de campaña" : item.eyebrow}
                  </div>
                  <h3 className="av2-tl-title">{item.titulo}</h3>

                  {item.lugar ? (
                    <div className="av2-tl-meta">
                      <PinIcon />
                      <span>{item.lugar}</span>
                    </div>
                  ) : null}

                  {item.descripcion ? (
                    <p className="av2-tl-desc">{item.descripcion}</p>
                  ) : null}

                  {item.personajes.length ? (
                    <div className="av2-tl-chips">
                      {shown.map((personaje) => (
                        <span className="av2-tl-chip" key={personaje.name}>
                          <span
                            className="av2-tl-av"
                            data-player={personaje.isPlayer || undefined}
                          >
                            {personaje.initial}
                          </span>
                          <span>{personaje.name}</span>
                        </span>
                      ))}
                      {rest > 0 ? (
                        <span className="av2-tl-chip av2-tl-more">+{rest}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
