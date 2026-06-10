"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";

type ViewTransitionHandle = {
  finished: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (
    updateCallback: () => void | Promise<void>,
  ) => ViewTransitionHandle;
};

type PendingNavigation = {
  resolve: () => void;
  timeoutId: number;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function transitionDocument(): ViewTransitionDocument {
  return document as ViewTransitionDocument;
}

function clearTransitionType() {
  delete document.documentElement.dataset.av2Vt;
}

function routeTransitionType(from: string, to: string) {
  if (to.startsWith(from + "/")) return "route-detail";
  if (from.startsWith(to + "/")) return "route-back";
  return "route-forward";
}

export function runAtlasViewTransition(
  update: () => void,
  type = "state-place",
) {
  const doc = transitionDocument();
  if (!doc.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }

  document.documentElement.dataset.av2Vt = type;
  const transition = doc.startViewTransition(() => {
    flushSync(update);
  });
  transition.finished.finally(clearTransitionType);
}

export default function AtlasViewTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const pendingRef = useRef<PendingNavigation | null>(null);

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;

    window.clearTimeout(pending.timeoutId);
    pending.resolve();
    pendingRef.current = null;
  }, [pathname]);

  useEffect(() => {
    function resolvePending() {
      const pending = pendingRef.current;
      if (!pending) return;
      window.clearTimeout(pending.timeoutId);
      pending.resolve();
      pendingRef.current = null;
    }

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !anchor.closest(".av2")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.dataset.noViewTransition === "true") return;

      // Restricción por Rutas Principales / Navegación Estructural
      const isNav = anchor.closest(".av2-nav") !== null;
      const isBack = anchor.closest(".av2-entity-detail-back") !== null || anchor.classList.contains("av2-entity-detail-back");
      const isChapterNeighbors = anchor.closest(".av2-chapter-detail-neighbors") !== null;
      const isHomeShortcut = anchor.closest(".av2-latest-actions") !== null || anchor.closest(".av2-latest-feature") !== null;
      const isDetailCta = anchor.closest(".av2-detail-cta") !== null || anchor.classList.contains("av2-detail-cta") || anchor.closest(".av2-chapter-cta") !== null || anchor.classList.contains("av2-chapter-cta");
      const isTimelineCard = anchor.closest(".av2-tl-card") !== null || anchor.classList.contains("av2-tl-card");
      const isChapterFoot = anchor.closest(".av2-chapter-list-foot") !== null || anchor.classList.contains("av2-chapter-list-foot");

      const isStructural = isNav || isBack || isChapterNeighbors || isHomeShortcut || isDetailCta || isTimelineCard || isChapterFoot;
      if (!isStructural) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      // Excluir rutas del sistema, de API, assets estáticos y archivos directos
      if (
        url.pathname.startsWith("/_next") ||
        url.pathname.startsWith("/api") ||
        url.pathname.startsWith("/assets") ||
        url.pathname.includes(".")
      ) {
        return;
      }

      const currentPath = window.location.pathname;
      const sameLocation =
        url.pathname === currentPath && url.search === window.location.search;
      if (sameLocation) return;

      const doc = transitionDocument();
      if (!doc.startViewTransition || prefersReducedMotion()) return;

      event.preventDefault();
      resolvePending();

      const href = `${url.pathname}${url.search}${url.hash}`;
      document.documentElement.dataset.av2Vt = routeTransitionType(
        currentPath,
        url.pathname,
      );

      const transition = doc.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const timeoutId = window.setTimeout(resolvePending, 2000);
            pendingRef.current = { resolve, timeoutId };
            router.push(href);
          }),
      );

      transition.finished.finally(clearTransitionType);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      resolvePending();
    };
  }, [router]);

  return null;
}


