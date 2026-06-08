import MisteriosClient from "./MisteriosClient";
import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import { toAtlasEntitySummary } from "@/lib/atlas-content";
import { cachedListByType } from "@/lib/public-cache";
import { publicVaultPath } from "@/lib/public-vault-path";

export const dynamic = "force-static";

export const metadata = {
  title: "Misterios - Grimorio de Lore",
};

export default async function MisteriosPage() {
  const raw = await cachedListByType(publicVaultPath(), "misterio");
  const items = raw
    .map((item) => toAtlasEntitySummary(item, "Pregunta abierta"))
    .sort((a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name, "es"));

  return (
    <AtlasPageScene
      eyebrow="Hilos sin resolver"
      title="Misterios"
      subtitle="Preguntas que sobreviven a cada capítulo y conectan hechos distantes."
      variant="mystery"
    >
      <MisteriosClient items={items} />
    </AtlasPageScene>
  );
}
