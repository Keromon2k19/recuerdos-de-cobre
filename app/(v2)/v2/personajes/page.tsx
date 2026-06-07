// app/(v2)/v2/personajes/page.tsx
import PersonajesClient from "./PersonajesClient";
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import { resolveAtlasV2CharacterRole } from "@/lib/atlas-v2-character-role";
import { resolveAtlasV2Portrait } from "@/lib/atlas-v2-portraits";
import { cachedListByType } from "@/lib/public-cache";
import { publicVaultPath } from "@/lib/public-vault-path";
import type { EntityListItem } from "@/lib/vault";
import type { V2Character } from "@/data/atlas-v2/characters";

export const dynamic = "force-static";

export const metadata = {
  title: "Personajes · Grimorio de Lore",
};

// Jugadores conocidos; si falta el nombre, el rol PJ se resuelve aparte.
const JUGADOR: Record<string, string> = {
  mysha: "Kero",
  borok: "Mati",
  layra: "Layla",
  narcissa: "Mica",
  "david-ilcard": "Lucho",
  "io-campbell": "Mile",
};

const IMAGE_LAYOUT_OVERRIDES: Record<
  string,
  Pick<V2Character, "imageFit" | "imagePosition">
> = {
  champi: {
    imageFit: "contain",
    imagePosition: "center center",
  },
};

function toV2Character(e: EntityListItem): V2Character {
  return {
    id: e.slug,
    slug: e.slug,
    nombre: e.nombre,
    aliases: e.aliases ?? [],
    jugador: e.jugador ?? JUGADOR[e.slug],
    rol: resolveAtlasV2CharacterRole(e.slug, e.rol),
    facciones: e.facciones ?? [],
    region: e.region,
    descripcion: e.descripcion ?? "",
    apariciones: e.apariciones?.length ?? 0,
    imageSrc: resolveAtlasV2Portrait(e.slug, e.image),
    ...IMAGE_LAYOUT_OVERRIDES[e.slug],
  };
}

export default async function PersonajesPage() {
  const raw = await cachedListByType(publicVaultPath(), "personaje");
  const characters = raw.map(toV2Character);

  return (
    <AtlasPageScene
      eyebrow="El reparto de la campaña"
      title="Personajes"
      subtitle="Los jugadores del grupo y cada figura que cruzó su camino."
      variant="character"
    >
      <PersonajesClient characters={characters} />
    </AtlasPageScene>
  );
}
