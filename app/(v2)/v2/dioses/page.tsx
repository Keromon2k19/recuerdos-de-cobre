// app/(v2)/v2/dioses/page.tsx
// Server component. Carga dioses curados para revisar la UI V2.

import DiosesClient from "./DiosesClient";
import { MOCK_GODS } from "@/data/atlas-v2/gods";

export const metadata = {
  title: "Dioses - Grimorio de Lore",
};

export default function DiosesPage() {
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
        <h1 className="av2-page-title">Dioses</h1>
      </header>

      <DiosesClient gods={MOCK_GODS} />
    </section>
  );
}
