import MapaClient from "../mapa/MapaClient";
import { MOCK_REGIONS } from "@/data/atlas-v2/locations";

export const metadata = {
  title: "Lugares - Grimorio de Lore",
};

export default function LugaresPage() {
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

      <header className="av2-page-head av2-page-head--mapa">
        <p className="av2-page-eyebrow">Atlas de Eyira</p>
        <h1 className="av2-page-title">Lugares</h1>
      </header>

      <MapaClient regions={MOCK_REGIONS} />
    </section>
  );
}
