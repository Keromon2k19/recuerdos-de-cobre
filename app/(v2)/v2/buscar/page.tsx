import BuscarClient from "./BuscarClient";
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import { MOCK_GODS } from "@/data/atlas-v2/gods";
import { buildAtlasV2SearchIndex } from "@/lib/atlas-v2-search";
import { getAllRegions } from "@/lib/map-overrides";
import { cachedListByType, cachedListEpisodes } from "@/lib/public-cache";
import { publicVaultPath } from "@/lib/public-vault-path";

export const dynamic = "force-static";

export const metadata = {
  title: "Buscar - Grimorio de Lore",
};

export default async function BuscarPage() {
  const vp = publicVaultPath();
  const [
    episodes,
    personajes,
    facciones,
    lugares,
    objetos,
    misterios,
    mundo,
  ] = await Promise.all([
    cachedListEpisodes(vp),
    cachedListByType(vp, "personaje"),
    cachedListByType(vp, "faccion"),
    cachedListByType(vp, "lugar"),
    cachedListByType(vp, "objeto"),
    cachedListByType(vp, "misterio"),
    cachedListByType(vp, "worldbuilding"),
  ]);

  const items = buildAtlasV2SearchIndex({
    episodes,
    entities: {
      personaje: personajes,
      faccion: facciones,
      lugar: lugares,
      objeto: objetos,
      misterio: misterios,
      mundo,
    },
    gods: MOCK_GODS,
    regions: getAllRegions(),
  });

  return (
    <AtlasPageScene
      eyebrow="Índice transversal del atlas"
      title="Buscar"
      subtitle="Una puerta única hacia personajes, crónicas, lugares, objetos, misterios y reglas del mundo."
      variant="search"
    >
      <BuscarClient items={items} />
    </AtlasPageScene>
  );
}
