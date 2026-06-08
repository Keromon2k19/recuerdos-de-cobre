import MapaClient from "./MapaClient";
import {
  locationSlugsResolved,
  resolveLocation,
} from "@/data/atlas-v2/location-images";
import type { V2Region } from "@/data/atlas-v2/locations";
import { getAllRegions, getAdditionSlugs } from "@/lib/map-overrides";

export const metadata = {
  title: "Mapa - Grimorio de Lore",
};

export default function MapaPage() {
  // Lugares con imágenes (originales curados) + lugares creados desde la UI.
  // Se filtran las originales sin imágenes (Yggdrasil, Nararok, Murmek).
  const imageSlugs = locationSlugsResolved();
  const addedSlugs = getAdditionSlugs();
  const additionSlugList = Array.from(addedSlugs);
  const visible = new Set([...imageSlugs, ...addedSlugs]);
  const regions = getAllRegions()
    .filter((r) => visible.has(r.slug))
    .map(withResolvedLocationImage);

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
        <h1 className="av2-page-title">Mapa</h1>
      </header>

      <MapaClient regions={regions} additionSlugs={additionSlugList} />
    </section>
  );
}

function withResolvedLocationImage(region: V2Region): V2Region {
  const resolved = resolveLocation(region.slug);
  const imageSrc =
    region.imageSrc ?? resolved?.immersiveBgSrc ?? resolved?.slides[0]?.src;
  return imageSrc === region.imageSrc ? region : { ...region, imageSrc };
}
