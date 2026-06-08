import ObjetosClient from "./ObjetosClient";
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import { toAtlasV2EntitySummary } from "@/lib/atlas-v2-content";
import { cachedListByType } from "@/lib/public-cache";
import { publicVaultPath } from "@/lib/public-vault-path";

export const dynamic = "force-static";

export const metadata = {
  title: "Objetos - Grimorio de Lore",
};

export default async function ObjetosPage() {
  const raw = await cachedListByType(publicVaultPath(), "objeto");
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
