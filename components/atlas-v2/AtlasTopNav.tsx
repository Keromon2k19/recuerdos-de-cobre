"use client";

// Top nav con dropdowns. Reemplaza al dock bottom.
// Estructura: logo · INICIO · CRÓNICAS▾ · ATLAS▾ · BUSCAR
// Click toggle. Cierra con Esc o click afuera.

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  type MouseEvent,
  type FocusEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import AtlasMusicPlayer from "@/components/atlas-v2/AtlasMusicPlayer";

type NavLink = { href: string; label: string };
type NavGroup = { id: string; label: string; items: NavLink[] };

const GROUPS: NavGroup[] = [
  {
    id: "cronicas",
    label: "Crónicas",
    items: [
      { href: "/v2/capitulos", label: "Capítulos" },
      { href: "/v2/misterios", label: "Misterios" },
    ],
  },
  {
    id: "atlas",
    label: "Atlas",
    items: [
      { href: "/v2/personajes", label: "Personajes" },
      { href: "/v2/facciones", label: "Facciones" },
      { href: "/v2/lugares", label: "Lugares" },
      { href: "/v2/mapa", label: "Mapa" },
    ],
  },
  {
    id: "conocimiento",
    label: "Conocimiento",
    items: [
      { href: "/v2/dioses", label: "Dioses" },
      { href: "/v2/objetos", label: "Objetos" },
      { href: "/v2/mundo", label: "Mundo" },
    ],
  },
];

export default function AtlasTopNav() {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLElement | null>(null);

  // Cerrar al clickear afuera
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpenId(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Esc cierra
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cerrar al cambiar de ruta
  useEffect(() => { setOpenId(null); }, [pathname]);

  const isLinkActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const isGroupActive = (g: NavGroup) =>
    g.items.some((it) => isLinkActive(it.href));
  const moveIndicatorTo = useCallback((target: HTMLElement | null) => {
    const menu = menuRef.current;
    if (!menu || !target) return;

    const menuRect = menu.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    menu.style.setProperty("--av2-nav-ind-x", `${targetRect.left - menuRect.left}px`);
    menu.style.setProperty("--av2-nav-ind-w", `${targetRect.width}px`);
    menu.style.setProperty("--av2-nav-ind-opacity", "1");
  }, []);

  const moveIndicatorToActive = useCallback(() => {
    const menu = menuRef.current;
    if (openId) {
      const openTrigger = menu?.querySelector<HTMLElement>(
        `:scope > .av2-nav-group > .av2-nav-mlink[data-nav-item='${openId}']`,
      );
      if (openTrigger) {
        moveIndicatorTo(openTrigger);
        return;
      }
    }

    const homeTrigger = menu?.querySelector<HTMLElement>(
      ":scope > .av2-nav-mlink[data-nav-item='home']",
    );
    if (homeTrigger) {
      moveIndicatorTo(homeTrigger);
      return;
    }
    menu?.style.setProperty("--av2-nav-ind-opacity", "0");
  }, [moveIndicatorTo, openId]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(moveIndicatorToActive);
    window.addEventListener("resize", moveIndicatorToActive);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", moveIndicatorToActive);
    };
  }, [moveIndicatorToActive, pathname, openId]);

  const handleIndicatorEnter = (
    event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
  ) => moveIndicatorTo(event.currentTarget);

  return (
    <header className="av2-nav" role="banner" ref={rootRef}>
      <Link
        href="/v2"
        className="av2-nav-brand"
        aria-label="Recuerdos de Cobre · Inicio"
      >
        <Image
          src="/assets/atlas-v2/brand/logo-rdc.png"
          alt="Recuerdos de Cobre"
          width={120}
          height={72}
          priority
        />
      </Link>

      <nav
        className="av2-nav-menu"
        aria-label="Secciones"
        ref={menuRef}
        data-section="home"
        onMouseLeave={moveIndicatorToActive}
      >
        <Link
          href="/v2"
          className="av2-nav-mlink"
          data-active={pathname === "/v2" ? "true" : undefined}
          data-nav-item="home"
          onMouseEnter={handleIndicatorEnter}
          onFocus={handleIndicatorEnter}
        >
          Inicio
        </Link>

        {GROUPS.map((g) => {
          const open = openId === g.id;
          const groupActive = isGroupActive(g);
          return (
            <div
              key={g.id}
              className={`av2-nav-group ${open ? "is-open" : ""}`}
            >
              <button
                type="button"
                className="av2-nav-mlink av2-nav-mlink--trigger"
                data-active={groupActive ? "true" : undefined}
                data-nav-item={g.id}
                aria-haspopup="true"
                aria-expanded={open}
                aria-controls={`av2-menu-${g.id}`}
                onMouseEnter={handleIndicatorEnter}
                onFocus={handleIndicatorEnter}
                onClick={(event) => {
                  moveIndicatorTo(event.currentTarget);
                  setOpenId(open ? null : g.id);
                }}
              >
                {g.label}
                <svg
                  className="av2-nav-chev"
                  viewBox="0 0 12 12"
                  width="10"
                  height="10"
                  aria-hidden="true"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div
                id={`av2-menu-${g.id}`}
                className="av2-nav-pop"
                role="menu"
                hidden={!open}
              >
                <ul className="av2-nav-pop-list">
                  {g.items.map((it) => (
                    <li key={it.href} role="none">
                      <Link
                        href={it.href}
                        className="av2-nav-pop-item"
                        data-active={isLinkActive(it.href) ? "true" : undefined}
                        role="menuitem"
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}

        <Link
          href="/v2/buscar"
          className="av2-nav-search"
          aria-label="Buscar en el archivo"
          data-active={isLinkActive("/v2/buscar") ? "true" : undefined}
          data-nav-item="buscar"
          onMouseEnter={handleIndicatorEnter}
          onFocus={handleIndicatorEnter}
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
        </Link>

        <AtlasMusicPlayer />
      </nav>
    </header>
  );
}
