"use client";

// components/Sidebar.tsx — Navegación lateral con links a tipos + stats
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENTITY_TYPES, ENTITY_FOLDERS, type EntityType } from "@/lib/types";

const TYPE_LABELS: Record<EntityType, string> = {
  personaje: "🧙 Personajes",
  lugar: "🗺️ Lugares",
  evento: "⚔️ Eventos",
  objeto: "💎 Objetos",
  faccion: "🏴 Facciones",
  worldbuilding: "🌍 Worldbuilding",
  misterio: "❓ Misterios",
  quote: "💬 Quotes",
  decision: "⚖️ Decisiones",
};

type SidebarProps = {
  stats: Record<string, number>;
};

export default function Sidebar({ stats }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo">
          <span className="logo-icon">⛧</span>
          <span className="logo-text">Mysha</span>
        </Link>
        <p className="sidebar-subtitle">Grimorio de Lore</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">Principal</h3>
          <Link
            href="/"
            className={`nav-link ${pathname === "/" ? "active" : ""}`}
          >
            <span className="nav-icon">📜</span>
            <span>Cargar Episodio</span>
          </Link>
          <Link
            href="/episodios"
            className={`nav-link ${pathname.startsWith("/episodios") ? "active" : ""}`}
          >
            <span className="nav-icon">📚</span>
            <span>Episodios</span>
            {stats.episodios > 0 && (
              <span className="nav-badge">{stats.episodios}</span>
            )}
          </Link>
        </div>

        <div className="nav-section">
          <h3 className="nav-section-title">Entidades</h3>
          {ENTITY_TYPES.map((tipo) => {
            const folder = ENTITY_FOLDERS[tipo];
            const count = stats[tipo] ?? 0;
            const href = `/entidades/${tipo}`;
            const isActive = pathname.startsWith(href);

            return (
              <Link
                key={tipo}
                href={href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">
                  {TYPE_LABELS[tipo].split(" ")[0]}
                </span>
                <span>{TYPE_LABELS[tipo].split(" ").slice(1).join(" ")}</span>
                {count > 0 && <span className="nav-badge">{count}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-footer-text">
          Vault: {Object.values(stats).reduce((a, b) => a + b, 0)} archivos
        </p>
      </div>
    </aside>
  );
}
