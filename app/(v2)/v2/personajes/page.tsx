// app/(v2)/v2/personajes/page.tsx
import PersonajesClient from "./PersonajesClient";
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import { cachedListByType } from "@/lib/public-cache";
import type { EntityListItem } from "@/lib/vault";
import type { V2Character } from "@/data/atlas-v2/characters";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Personajes · Grimorio de Lore",
};

// Jugadores de los 6 PJs — no está en el vault, se asigna aquí.
const JUGADOR: Record<string, string> = {
  mysha: "Kero",
  borok: "Mati",
  layra: "Layla",
  narcissa: "Mica",
  "david-ilcard": "Lucho",
  "io-campbell": "Mile",
};

const PORTRAIT_PLACEHOLDER = "/assets/atlas-v2/portraits/_placeholder-1.svg";

function toV2Character(e: EntityListItem): V2Character {
  return {
    id: e.slug,
    slug: e.slug,
    nombre: e.nombre,
    jugador: e.jugador ?? JUGADOR[e.slug],
    rol: e.rol ?? (JUGADOR[e.slug] !== undefined ? "PJ" : "NPC"),
    facciones: e.facciones ?? [],
    region: e.region,
    descripcion: e.descripcion ?? "",
    apariciones: e.apariciones?.length ?? 0,
    imageSrc: e.image ?? PORTRAIT_PLACEHOLDER,
  };
}

export default async function PersonajesPage() {
  const vp = process.env.VAULT_PATH?.trim() || "";
  const raw = vp ? await cachedListByType(vp, "personaje") : [];
  const characters = raw.map(toV2Character);

  return (
    <AtlasPageScene
      eyebrow="El reparto de la campaña"
      title="Personajes"
      subtitle="Los seis del grupo y cada figura que cruzó su camino."
      variant="character"
    >
      <PersonajesClient characters={characters} />
    </AtlasPageScene>
  );
}
