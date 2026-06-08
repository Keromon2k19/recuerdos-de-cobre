// app/(v2)/v2/kit/page.tsx
// Catálogo de desarrollo NO enlazado: renderiza cada primitiva del kit en sus
// variantes para validar el sistema en aislamiento. No se enlaza desde la nav
// ni se indexa en búsqueda.
import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import AtlasSectionHero from "@/components/atlas/AtlasSectionHero";
import AtlasNarrativeFrame from "@/components/atlas/AtlasNarrativeFrame";

export const metadata = { title: "Kit V2 (dev) · Grimorio de Lore" };

export default function KitPage() {
  return (
    <AtlasPageScene
      eyebrow="Desarrollo · Kit"
      title="Catálogo de primitivas"
      subtitle="Validación en aislamiento del sistema visual compartido."
    >
      <div style={{ display: "grid", gap: 32, padding: "0 24px 80px" }}>
        <AtlasNarrativeFrame
          eyebrow="Hero"
          title="AtlasSectionHero — material"
          variant="primary"
        >
          <AtlasSectionHero
            variant="material"
            glyph="C"
            alt=""
            title="Carta de Nabish"
            eyebrow="objeto"
            meta="3 apariciones"
          />
        </AtlasNarrativeFrame>

        <AtlasNarrativeFrame
          eyebrow="Hero"
          title="AtlasSectionHero — image"
          variant="primary"
        >
          <AtlasSectionHero
            variant="image"
            imageSrc="/assets/atlas/scenes/metropolis.webp"
            glyph="M"
            alt="Metrópolis de Cobre"
            title="Metrópolis de Cobre"
            eyebrow="lugar"
            meta="12 apariciones"
          />
        </AtlasNarrativeFrame>

        <AtlasNarrativeFrame
          eyebrow="Marco"
          title="AtlasNarrativeFrame — variantes"
          variant="secondary"
        >
          <p>Cuerpo de marco narrativo de ejemplo.</p>
        </AtlasNarrativeFrame>
      </div>
    </AtlasPageScene>
  );
}
