// app/(v2)/v2/personajes/page.tsx
import PersonajesClient from "./PersonajesClient";
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
        <h1 className="av2-page-title">Personajes</h1>
      </header>

      <PersonajesClient characters={characters} />
    </section>
  );
}
