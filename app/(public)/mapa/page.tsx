// app/(public)/mapa/page.tsx — Memoria conectada. Placeholder conceptual:
// el mapa interactivo se construye más adelante; la estructura ya existe.
import Link from "next/link";

export const metadata = {
  title: "Mapa · Recuerdos de Cobre",
  description: "Memoria conectada de la campaña — en preparación.",
};

export default function MapaPage() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="doc-head">
          <p className="crumb">
            <Link href="/">Archivo</Link> / Mapa
          </p>
          <p className="eyebrow">Memoria conectada</p>
          <h1>El mapa todavía se está dibujando</h1>
          <p className="sub">
            La idea: un atlas navegable donde personajes, lugares y facciones
            se conectan por dónde y cuándo aparecieron. Por ahora esa memoria
            vive distribuida en cada ficha —las relaciones y apariciones ya
            enlazan todo el archivo entre sí.
          </p>
        </div>

        <div className="empty">
          <p className="e-title">Próximamente · atlas relacional</p>
          <p>
            Mientras tanto, podés recorrer los hilos desde las{" "}
            <Link href="/cronicas">crónicas</Link>, los{" "}
            <Link href="/personajes">personajes</Link> o los{" "}
            <Link href="/misterios">misterios abiertos</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
