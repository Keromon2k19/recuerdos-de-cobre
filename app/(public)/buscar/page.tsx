// app/(public)/buscar/page.tsx — Búsqueda global. Arma un índice slim en el
// server (solo nombre/tipo/ruta, datos ya procesados) y lo filtra el
// cliente. No usa Gemini/Ollama ni endpoints internos.
import Link from "next/link";
import { cachedListEpisodes, cachedListByType } from "@/lib/public-cache";
import { PUBLIC_ENTITIES } from "@/lib/entity-public";
import SearchView, { type SearchItem } from "@/components/public/SearchView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Buscar · Recuerdos de Cobre",
  description: "Búsqueda global en el archivo de Recuerdos de Cobre.",
};

export default async function BuscarPage() {
  const vp = process.env.VAULT_PATH?.trim() || "";
  const index: SearchItem[] = [];

  if (vp) {
    const [episodes, ...entityLists] = await Promise.all([
      cachedListEpisodes(vp),
      ...PUBLIC_ENTITIES.map((c) => cachedListByType(vp, c.tipo)),
    ]);

    for (const ep of episodes) {
      index.push({
        nombre: ep.titulo || `Registro ${ep.numero}`,
        kind: "Crónicas",
        href: `/cronicas/${ep.numero}`,
        sub: `№ ${String(ep.numero).padStart(3, "0")}`,
      });
    }
    PUBLIC_ENTITIES.forEach((cfg, i) => {
      for (const e of entityLists[i]) {
        index.push({
          nombre: e.nombre,
          kind: cfg.plural,
          href: `/${cfg.segment}/${e.slug}`,
          sub: e.apariciones?.length ? `${e.apariciones.length} aprc.` : "Canon",
        });
      }
    });
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="doc-head">
          <p className="crumb">
            <Link href="/">Archivo</Link> / Buscar
          </p>
          <p className="eyebrow">Índice global</p>
          <h1>Buscar en el archivo</h1>
          <p className="sub">
            Todo el archivo público en un solo campo: crónicas, personajes,
            lugares, facciones, objetos, misterios y worldbuilding.
          </p>
        </div>
        <SearchView index={index} />
      </div>
    </section>
  );
}
