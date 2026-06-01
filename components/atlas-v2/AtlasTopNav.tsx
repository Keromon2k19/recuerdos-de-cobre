// components/atlas-v2/AtlasTopNav.tsx — Top nav: logo RdC (Inicio) + medallón Buscar.
// Navbar 100% transparente — los dos iconos flotan sobre el hero.

import Link from "next/link";
import Image from "next/image";

export default function AtlasTopNav() {
  return (
    <header className="av2-nav" role="banner">
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

      <div className="av2-nav-actions">
        <Link
          href="/v2/buscar"
          className="av2-nav-action av2-nav-action--medallion"
          aria-label="Buscar en el archivo"
        >
          <Image
            src="/assets/atlas-v2/dock/candidates/buscar-v1.png"
            alt=""
            width={64}
            height={64}
            sizes="64px"
          />
        </Link>
      </div>
    </header>
  );
}
