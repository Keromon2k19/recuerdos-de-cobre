// app/(v2)/v2/dioses/page.tsx
// Server component. Carga dioses curados para revisar la UI V2.

import DiosesClient from "./DiosesClient";
import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import { MOCK_GODS } from "@/data/atlas/gods";

export const metadata = {
  title: "Dioses - Grimorio de Lore",
};

export default function DiosesPage() {
  return (
    <AtlasPageScene
      eyebrow="Panteon registrado"
      title="Dioses"
      subtitle="Poderes, pactos y cultos que sostienen la historia antigua de Cobre."
      variant="gods"
    >
      <DiosesClient gods={MOCK_GODS} />
    </AtlasPageScene>
  );
}
