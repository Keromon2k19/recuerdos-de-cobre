import MundoClient from "./MundoClient";
import AtlasPageScene from "@/components/atlas-v2/AtlasPageScene";
import { toAtlasV2EntitySummary } from "@/lib/atlas-v2-content";
import { cachedListByType } from "@/lib/public-cache";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mundo - Grimorio de Lore",
};

export default async function MundoPage() {
  const vp = process.env.VAULT_PATH?.trim() || "";
  const raw = vp ? await cachedListByType(vp, "worldbuilding") : [];
  const items = raw
    .map((item) => toAtlasV2EntitySummary(item, "Concepto"))
    .sort((a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name, "es"));

  return (
    <AtlasPageScene
      eyebrow="Reglas, planos e historia"
      title="Mundo"
      subtitle="Cómo funciona Cobre: fuerzas, cosmología, magia, sociedades y memoria."
      variant="world"
    >
      <MundoClient items={items} />
    </AtlasPageScene>
  );
}
