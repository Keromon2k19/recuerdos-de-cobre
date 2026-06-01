// app/(public)/cronicas/page.tsx — El registro completo de la campaña.
// Ledger editorial (no grilla SaaS): cada episodio es un asiento del
// archivo, escaneable de un vistazo aunque sean decenas.
import Link from "next/link";
import { cachedListEpisodes } from "@/lib/public-cache";
import { episodioLedger } from "@/lib/episode-number";
import { resolveImage } from "@/lib/images";
import AtlasImage from "@/components/public/AtlasImage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Crónicas · Recuerdos de Cobre",
  description: "El registro episodio por episodio de la campaña Recuerdos de Cobre.",
};

function fmtDate(iso?: string): string {
  if (!iso) return "Sin fecha";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function capLabel(numero: number): string {
  return `Cap. ${String(numero).padStart(3, "0")}`;
}

export default async function CronicasPage() {
  const vp = process.env.VAULT_PATH?.trim() || "";
  const episodes = vp ? await cachedListEpisodes(vp) : [];

  return (
    <section className="section">
      <div className="wrap">
        <div className="doc-head">
          <p className="crumb">
            <Link href="/">Archivo</Link> / Crónicas
          </p>
          <p className="eyebrow">El registro</p>
          <h1>Crónicas</h1>
          <p className="sub">
            {episodes.length > 0
              ? `${episodes.length} ${episodes.length === 1 ? "registro archivado" : "registros archivados"} de la campaña, en orden de sesión.`
              : "Todavía no hay registros archivados."}
          </p>
        </div>

        {episodes.length === 0 ? (
          <div className="empty">
            <p className="e-title">El archivo está vacío</p>
            <p>
              Cuando se procesen episodios aparecerán acá como registros
              consultables.
            </p>
          </div>
        ) : (
          <div className="ledger" role="list">
            {episodes.map((ep, i) => {
              const reg = episodioLedger(ep.titulo, ep.numero);
              const cover = resolveImage(
                { image: ep.image, imageAlt: ep.imageAlt },
                "episodios",
                `Miniatura del registro ${ep.numero}: ${ep.titulo || ""}`.trim()
              );
              return (
              <Link
                key={ep.numero}
                href={`/cronicas/${ep.numero}`}
                className="ledger-row rise"
                role="listitem"
                style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
              >
                <span className="thumb">
                  <AtlasImage img={cover} sizes="92px" />
                </span>
                <span className="reg">
                  {reg.main}
                  <small>{reg.sub}</small>
                </span>
                <h3>
                  <span className="cap-no">{capLabel(ep.numero)}</span>
                  {ep.titulo || `Registro ${ep.numero}`}
                </h3>
                <span className="date">{fmtDate(ep.procesado)}</span>
              </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
