// app/(public)/mapa/page.tsx - Atlas geografico de la campana.
import Link from "next/link";
import CampaignMap from "@/components/public/CampaignMap";

export const metadata = {
  title: "Mapa · Recuerdos de Cobre",
  description: "Atlas navegable del continente de Eyira y sus lugares principales.",
};

export default function MapaPage() {
  return (
    <section className="section map-section">
      <div className="wrap">
        <div className="doc-head map-head">
          <p className="crumb">
            <Link href="/">Archivo</Link> / Mapa
          </p>
          <p className="eyebrow">Atlas de Eyira</p>
          <h1>Mapa de campaña</h1>
          <p className="sub">
            Un tablero navegable para ubicar ciudades, rutas y regiones que ya
            aparecen en las cronicas. Las marcas son puntos editoriales sobre el
            mapa base; se pueden ajustar a medida que el archivo gane precision.
          </p>
        </div>

        <CampaignMap />
      </div>
    </section>
  );
}
