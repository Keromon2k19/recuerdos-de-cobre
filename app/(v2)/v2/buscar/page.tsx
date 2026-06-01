// app/(v2)/v2/buscar/page.tsx — Server shell, cliente maneja estado de búsqueda.

import BuscarClient from "./BuscarClient";

export const metadata = {
  title: "Buscar · Grimorio de Lore",
};

export default function BuscarPage() {
  return (
    <section className="av2-p-wrap">
      <div className="av2-p-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/atlas-v2/backgrounds/hero.png"
          alt=""
          className="av2-p-bg-img"
        />
      </div>

      <header className="av2-page-head">
        <h1 className="av2-page-title">Buscar</h1>
      </header>

      <BuscarClient />
    </section>
  );
}
