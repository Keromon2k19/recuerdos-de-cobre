import ObjetosClient from "./ObjetosClient";
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import { toAtlasV2EntitySummary } from "@/lib/atlas-v2-content";
import { cachedListByType } from "@/lib/public-cache";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Objetos - Grimorio de Lore",
};

export default async function ObjetosPage() {
  const vp = process.env.VAULT_PATH?.trim() || "";
  const raw = vp ? await cachedListByType(vp, "objeto") : [];
  const items = raw
    .map((item) => toAtlasV2EntitySummary(item, "Objeto"))
    .sort((a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name, "es"));

  return (
    <AtlasPageScene
      eyebrow="Inventario de piezas activas"
      title="Objetos"
      subtitle="Reliquias, cartas, diarios, libros y herramientas que alteraron la historia."
      variant="relic"
    >
      <ObjetosClient items={items} />
    </AtlasPageScene>
  );
}
