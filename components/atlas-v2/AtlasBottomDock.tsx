"use client";

// components/atlas-v2/AtlasBottomDock.tsx - Dock inferior de la UI V2.
// Preview reversible: usa los candidatos nuevos sin sobrescribir assets finales.

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// Dock = 6 secciones de contenido. Inicio se accede desde el logo del TopNav;
// Buscar vive como icono en el TopNav también.
const DOCK_ITEMS = [
  { href: "/v2/capitulos", label: "Capitulos", iconSrc: "/assets/atlas-v2/dock/capitulos-cronologia.png", exact: false },
  { href: "/v2/personajes", label: "Personajes", iconSrc: "/assets/atlas-v2/dock/personajes.png", exact: false },
  { href: "/v2/facciones", label: "Facciones", iconSrc: "/assets/atlas-v2/dock/facciones.png", exact: false },
  { href: "/v2/lugares", label: "Lugares", iconSrc: "/assets/atlas-v2/dock/lugares-mapa.png", exact: false },
  { href: "/v2/dioses", label: "Dioses", iconSrc: "/assets/atlas-v2/dock/candidates/dioses-v1.png", exact: false },
  { href: "/v2/archivos", label: "Archivos", iconSrc: "/assets/atlas-v2/dock/candidates/archivos.png", exact: false },
] as const;

export default function AtlasBottomDock() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="av2-dock" aria-label="Navegacion rapida">
      {DOCK_ITEMS.map((item) => {
        const active = isActive(item.href, item.exact);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="av2-dock-item av2-dock-item--medallion"
            data-active={active ? "true" : undefined}
            aria-label={item.label}
          >
            <span className="av2-dock-icon av2-dock-icon--medallion" aria-hidden="true">
              <Image
                src={item.iconSrc}
                alt=""
                width={72}
                height={72}
                sizes="72px"
                className="av2-dock-medallion"
              />
            </span>
            <span className="av2-dock-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
