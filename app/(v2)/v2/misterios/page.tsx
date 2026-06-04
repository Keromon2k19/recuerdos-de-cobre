import MisteriosClient from "./MisteriosClient";
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import { toAtlasV2EntitySummary } from "@/lib/atlas-v2-content";
import { cachedListByType } from "@/lib/public-cache";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Misterios - Grimorio de Lore",
};

export default async function MisteriosPage() {
  const vp = process.env.VAULT_PATH?.trim() || "";
  const raw = vp ? await cachedListByType(vp, "misterio") : [];
  const items = raw
    .map((item) => toAtlasV2EntitySummary(item, "Pregunta abierta"))
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
