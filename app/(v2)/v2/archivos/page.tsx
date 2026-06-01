import ArchivosClient from "./ArchivosClient";
import { MOCK_COLLECTIONS, MOCK_DOCUMENTS } from "@/data/atlas-v2/archives";

export const metadata = {
  title: "Archivos - Grimorio de Lore",
};

export default function ArchivosPage() {
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

      <header className="av2-page-head av2-page-head--archivos">
        <p className="av2-page-eyebrow">Biblioteca de Bronce</p>
        <h1 className="av2-page-title">Archivos</h1>
      </header>

      <ArchivosClient
        collections={MOCK_COLLECTIONS}
        documents={MOCK_DOCUMENTS}
      />
    </section>
  );
}
