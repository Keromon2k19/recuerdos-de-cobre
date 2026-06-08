import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import AtlasTimeline from "@/components/atlas/AtlasTimeline";
import { resolveLocation } from "@/data/atlas/location-images";
import { getAllRegions } from "@/lib/map-overrides";
import { cachedListByType, cachedListEpisodes } from "@/lib/public-cache";
import {
  buildTimelineItems,
  type TimelinePlaceImage,
} from "@/lib/atlas-timeline";
import { publicVaultPath } from "@/lib/public-vault-path";

export const dynamic = "force-static";

export const metadata = {
  title: "Linea de tiempo - Grimorio de Lore",
};

const TIMELINE_SLIDE_ALIASES: Record<string, string[]> = {
  Alcantarillas: ["Alcantarillas antiguas"],
  "Train Station": ["Tren privado", "Tren de carga privada", "Tren"],
  "Plumas Doradas": ["Bar Plumas Doradas"],
  "La Metropolis de Cobre": ["Metropolis de Cobre", "Metrópolis de Cobre"],
  "Metrópolis de Cobre": ["Metropolis de Cobre", "La Metrópolis de Cobre"],
};

function buildTimelinePlaceImages(): TimelinePlaceImage[] {
  const places: TimelinePlaceImage[] = [];

  for (const region of getAllRegions()) {
    const resolved = resolveLocation(region.slug);
    const regionImageSrc =
      resolved?.immersiveBgSrc ?? resolved?.slides[0]?.src ?? region.imageSrc;

    places.push({
      slug: region.slug,
      name: region.nombre,
      imageSrc: regionImageSrc,
      alt: region.nombre,
      aliases: TIMELINE_SLIDE_ALIASES[region.nombre],
    });

    for (const slide of resolved?.slides ?? []) {
      places.push({
        slug: region.slug,
        name: slide.caption,
        imageSrc: slide.src,
        alt: slide.alt,
        aliases: [
          ...(slide.sub ? [slide.sub] : []),
          ...(TIMELINE_SLIDE_ALIASES[slide.caption] ?? []),
        ],
      });
    }
  }

  return places;
}

export default async function TimelinePage() {
  const vaultPath = publicVaultPath();
  const [episodes, personajes] = await Promise.all([
    cachedListEpisodes(vaultPath),
    cachedListByType(vaultPath, "personaje"),
  ]);
  const items = buildTimelineItems(
    episodes,
    personajes,
    buildTimelinePlaceImages()
  );

  return (
    <AtlasPageScene
      eyebrow="La cronica, de principio a fin"
      title="Linea de tiempo"
      subtitle="Recorre la campana episodio por episodio: que paso, donde y quienes estuvieron."
      variant="timeline"
    >
      <AtlasTimeline items={items} />
    </AtlasPageScene>
  );
}
