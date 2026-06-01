"use client";

// components/public/SiteHeader.tsx — Navegación pública. Header slim, sin
// sidebar dominante. Las secciones aún no migradas se muestran como
// "pronto" en vez de links muertos.

import Link from "next/link";
import { usePathname } from "next/navigation";
import AtlasThemeToggle from "@/components/public/AtlasThemeToggle";

const LIVE = [
  { href: "/cronicas", label: "Crónicas" },
  { href: "/personajes", label: "Personajes" },
  { href: "/lugares", label: "Lugares" },
  { href: "/facciones", label: "Facciones" },
  { href: "/objetos", label: "Objetos" },
  { href: "/worldbuilding", label: "Mundo" },
  { href: "/misterios", label: "Misterios" },
  { href: "/mapa", label: "Mapa" },
  { href: "/buscar", label: "Buscar" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <Link href="/" className="site-brand" aria-label="Recuerdos de Cobre · inicio">
        <span className="mark">Antología de campaña</span>
        <span className="word">Recuerdos de Cobre</span>
      </Link>
      <nav className="site-nav" aria-label="Secciones del archivo">
        {LIVE.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            data-active={pathname === l.href || pathname.startsWith(l.href + "/")}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <span className="site-header-rule" aria-hidden="true" />
      <AtlasThemeToggle />
    </header>
  );
}
