// app/(v2)/v2/facciones/page.tsx
import FaccionesClient from "./FaccionesClient";
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import { cachedListByType } from "@/lib/public-cache";
import type { EntityListItem } from "@/lib/vault";
import type { V2Faction, V2FactionCategory } from "@/data/atlas-v2/factions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Facciones · Grimorio de Lore",
};

function derivarCategoria(nombre: string, catVault?: string): V2FactionCategory {
  if (catVault) return catVault as V2FactionCategory;
  const n = nombre.toLowerCase();
  if (n.includes("coven")) return "Coven";
  if (n.includes("guardia") || n.includes("milicia") || n.includes("ejército") || n.includes("ejercito")) return "Fuerza militar";
  if (n.includes("alianza") || n.includes("orden del")) return "Alianza antigua";
  if (n.includes("hermandad") || n.includes("gremio")) return "Gremio";
  return "Gremio";
}

function derivarTono(nombre: string): V2Faction["tono"] {
  const n = nombre.toLowerCase();
  if (n.includes("coven")) return "coven";
  if (n.includes("guardia") || n.includes("milicia")) return "military";
  if (n.includes("alianza antigua") || n.includes("orden del")) return "ancient";
  return "ally";
}

function toV2Faction(e: EntityListItem): V2Faction {
  return {
    slug: e.slug,
    nombre: e.nombre,
    sigil: e.nombre.charAt(0).toUpperCase(),
    categoria: derivarCategoria(e.nombre, e.categoria),
    estado: "",
    alcance: "",
    apariciones: e.apariciones?.length ?? 0,
    descripcion: e.descripcion ?? "",
    foco: "",
    tono: derivarTono(e.nombre),
    imageSrc: e.image,
    figures: [],
    relaciones: [],
    tags: [],
  };
}

export default async function FaccionesPage() {
  const vp = process.env.VAULT_PATH?.trim() || "";
  const raw = vp ? await cachedListByType(vp, "faccion") : [];
  const factions = raw
    .map(toV2Faction)
    .sort((a, b) => b.apariciones - a.apariciones);

  return (
    <AtlasPageScene
      eyebrow="Covens, gremios y alianzas"
      title="Facciones"
      subtitle="Quién mueve los hilos: aquelarres, hermandades y fuerzas en pugna."
      variant="faction"
    >
      <FaccionesClient factions={factions} />
    </AtlasPageScene>
  );
}
