// components/public/EntityList.tsx — Listado público genérico de un tipo de
// entidad. Server: arma los datos; el filtro y la grilla son cliente.
import Link from "next/link";
import { cachedListByType } from "@/lib/public-cache";
import { BY_TIPO } from "@/lib/entity-public";
import { glyphFor } from "@/lib/images";
import type { EntityType } from "@/lib/types";
import ListFilter, { type ListItem } from "@/components/public/ListFilter";

export default async function EntityList({ tipo }: { tipo: EntityType }) {
  const cfg = BY_TIPO[tipo];
  if (!cfg) return null;

  const vp = process.env.VAULT_PATH?.trim() || "";
  const raw = vp ? await cachedListByType(vp, tipo) : [];

  const items: ListItem[] = [...raw]
    .sort((a, b) => (b.apariciones?.length ?? 0) - (a.apariciones?.length ?? 0))
    .map((e) => {
      const tags: string[] = [];
      if (e.apariciones?.length)
        tags.push(
          `${e.apariciones.length} ${e.apariciones.length === 1 ? "aparición" : "apariciones"}`
        );
      else tags.push("Solo canon");
      const facet = e.facciones?.[0] || e.region || e.categoria;
      if (facet) tags.push(facet);
      return {
        slug: e.slug,
        nombre: e.nombre,
        kicker: e.rol || e.categoria || e.region || cfg.singular,
        desc: e.descripcion,
        tags,
      };
    });

  return (
    <section className="section">
      <div className="wrap">
        <div className="doc-head">
          <p className="crumb">
            <Link href="/">Archivo</Link> / {cfg.plural}
          </p>
          <p className="eyebrow">{cfg.eyebrow}</p>
          <h1>{cfg.plural}</h1>
          <p className="sub">
            {raw.length > 0
              ? `${raw.length} ${raw.length === 1 ? "registro" : "registros"} · ${cfg.blurb}`
              : `Todavía no hay ${cfg.plural.toLowerCase()} en el archivo.`}
          </p>
        </div>

        {raw.length === 0 ? (
          <div className="empty">
            <p className="e-title">Sección vacía</p>
            <p>Aparecerá contenido a medida que se procesen episodios.</p>
          </div>
        ) : (
          <ListFilter
            items={items}
            segment={cfg.segment}
            glyph={glyphFor(cfg.img)}
          />
        )}
      </div>
    </section>
  );
}
