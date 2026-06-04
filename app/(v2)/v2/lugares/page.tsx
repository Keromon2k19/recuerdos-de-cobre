import MapaClient from "../mapa/MapaClient";
import { locationSlugsResolved } from "@/data/atlas-v2/location-images";
import { getAllRegions, getAdditionSlugs } from "@/lib/map-overrides";

export const metadata = {
  title: "Lugares - Grimorio de Lore",
};

export default function LugaresPage() {
  const imageSlugs = locationSlugsResolved();
  const addedSlugs = getAdditionSlugs();
  const additionSlugList = Array.from(addedSlugs);
  const visible = new Set([...imageSlugs, ...addedSlugs]);
  const regions = getAllRegions().filter((r) => visible.has(r.slug));

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

      <MapaClient regions={regions} additionSlugs={additionSlugList} />
    </section>
  );
}
