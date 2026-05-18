"use client";

// components/Sidebar.tsx — Sidebar del códice (sistema rdc, edición III fija).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

const ENTITY_LABELS: Record<EntityType, string> = {
  personaje: "Personajes",
  lugar: "Lugares",
  evento: "Eventos",
  objeto: "Objetos",
  faccion: "Facciones",
  worldbuilding: "Worldbuilding",
  misterio: "Misterios",
  quote: "Quotes",
  decision: "Decisiones",
};

type SidebarProps = {
  stats: Record<string, number>;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function Sidebar({ stats }: SidebarProps) {
  const pathname = usePathname();
  const totalFiles = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <aside className="rdc-sidebar">
      <div className="rdc-brand">
        <Link href="/procesar">
          <div className="rdc-mark">PANEL LOCAL</div>
          <h1>Recuerdos de Cobre</h1>
          <div className="rdc-sub">Pipeline de procesamiento</div>
        </Link>
      </div>

      <div
        className="rdc-nav-group rdc-rise"
        style={{ "--rdc-rise-i": 0 } as React.CSSProperties}
      >
        <div className="rdc-nav-label">El Pipeline</div>

        <Link
          href="/procesar"
          className="rdc-nav-item"
          data-active={pathname === "/procesar"}
        >
          <span className="rdc-name">Cargar Episodio</span>
          <span className="rdc-count" />
        </Link>

        <Link
          href="/episodios"
          className="rdc-nav-item"
          data-active={pathname.startsWith("/episodios")}
        >
          <span className="rdc-name">Episodios</span>
          <span className="rdc-count">
            {stats.episodios ? pad(stats.episodios) : ""}
          </span>
        </Link>

        <Link
          href="/importar"
          className="rdc-nav-item"
          data-active={pathname.startsWith("/importar")}
        >
          <span className="rdc-name">Importar Playlist</span>
          <span className="rdc-count" />
        </Link>
      </div>

      <div
        className="rdc-nav-group rdc-rise"
        style={{ "--rdc-rise-i": 1 } as React.CSSProperties}
      >
        <div className="rdc-nav-label">Las Entradas</div>
        {ENTITY_TYPES.map((tipo) => {
          const count = stats[tipo] ?? 0;
          const href = `/entidades/${tipo}`;
          return (
            <Link
              key={tipo}
              href={href}
              className="rdc-nav-item"
              data-active={pathname.startsWith(href)}
            >
              <span className="rdc-name">{ENTITY_LABELS[tipo]}</span>
              <span className="rdc-count">{count ? pad(count) : ""}</span>
            </Link>
          );
        })}
      </div>

      <div
        className="rdc-side-controls rdc-rise"
        style={{ "--rdc-rise-i": 2 } as React.CSSProperties}
      >
        <div className="rdc-theme-row">
          <span className="rdc-nav-label" style={{ margin: 0 }}>
            Lámpara
          </span>
          <ThemeToggle />
        </div>
        <Link
          href="/"
          className="rdc-nav-item"
          style={{ marginTop: 4 }}
          data-active={false}
        >
          <span className="rdc-name">Ver sitio público →</span>
          <span className="rdc-count" />
        </Link>
        <p
          className="rdc-sub"
          style={{ margin: 0, fontFamily: "var(--rdc-mono)", fontSize: 10.5 }}
        >
          Vault · {totalFiles} archivos
        </p>
      </div>
    </aside>
  );
}
