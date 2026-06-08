import MundoClient from "./MundoClient";
import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import { toAtlasEntitySummary } from "@/lib/atlas-content";
import { cachedListByType } from "@/lib/public-cache";
import { publicVaultPath } from "@/lib/public-vault-path";

export const dynamic = "force-static";

export const metadata = {
  title: "Mundo - Grimorio de Lore",
};

export default async function MundoPage() {
  const raw = await cachedListByType(publicVaultPath(), "worldbuilding");
  const items = raw
    .map((item) => toAtlasEntitySummary(item, "Concepto"))
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
