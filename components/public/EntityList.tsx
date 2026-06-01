// components/public/EntityList.tsx — Listado público genérico de un tipo de
// entidad. Server: arma los datos y las facetas; el filtro y la grilla son
// cliente. Las facetas (rol, apariciones, facción, región) solo aplican a
// personajes; un eje se omite si no tiene al menos dos valores distintos.
import Link from "next/link";
import { cachedListByType } from "@/lib/public-cache";
import { BY_TIPO } from "@/lib/entity-public";
import { glyphFor } from "@/lib/images";
import type { EntityType } from "@/lib/types";
import ListFilter, {
  type ListItem,
  type FacetGroup,
} from "@/components/public/ListFilter";

// ── Rol ──────────────────────────────────────────────────────────────
const ROL_LABEL: Record<string, string> = {
  PJ: "Jugadores",
  NPC: "NPC",
  familiar: "Familiar",
};
const ROL_ORDER = ["PJ", "NPC", "familiar"];

function rolValue(rol?: string): string {
  if (rol === "PJ") return "PJ";
  if (rol === "familiar") return "familiar";
  return "NPC";
}

// ── Apariciones ──────────────────────────────────────────────────────
const APARICION_ORDER = [
  "Protagónico",
  "Recurrente",
  "Episódico",
  "Solo canon",
];

function aparicionBucket(n: number): string {
  if (n >= 10) return "Protagónico";
  if (n >= 3) return "Recurrente";
  if (n >= 1) return "Episódico";
  return "Solo canon";
}

/** Cuenta cuántos ítems tienen cada valor de una faceta. */
function tally(items: ListItem[], key: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    for (const v of it.facets[key] ?? []) {
      m.set(v, (m.get(v) ?? 0) + 1);
    }
  }
  return m;
}

export default async function EntityList({ tipo }: { tipo: EntityType }) {
  const cfg = BY_TIPO[tipo];
  if (!cfg) return null;

  const vp = process.env.VAULT_PATH?.trim() || "";
  const raw = vp ? await cachedListByType(vp, tipo) : [];
  const isPersonaje = tipo === "personaje";

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

      const facets: Record<string, string[]> = {};
      if (isPersonaje) {
        facets.rol = [rolValue(e.rol)];
        facets.aparicion = [aparicionBucket(e.apariciones?.length ?? 0)];
        facets.faccion =
          e.facciones && e.facciones.length > 0 ? e.facciones : [];
        facets.region = e.region ? [e.region] : [];
      }

      return {
        slug: e.slug,
        nombre: e.nombre,
        kicker: e.rol || e.categoria || e.region || cfg.singular,
        desc: e.descripcion,
        image: e.image,
        imageAlt: e.imageAlt || e.nombre,
        tags,
        facets,
      };
    });

  // ── Facetas (solo personajes) ──────────────────────────────────────
  const facetGroups: FacetGroup[] = [];
  if (isPersonaje && items.length > 0) {
    const rolM = tally(items, "rol");
    if (rolM.size >= 2) {
      facetGroups.push({
        key: "rol",
        label: "Rol",
        options: ROL_ORDER.filter((v) => rolM.has(v)).map((v) => ({
          value: v,
          label: ROL_LABEL[v] ?? v,
          count: rolM.get(v) ?? 0,
        })),
      });
    }

    const apM = tally(items, "aparicion");
    if (apM.size >= 2) {
      facetGroups.push({
        key: "aparicion",
        label: "Apariciones",
        options: APARICION_ORDER.filter((v) => apM.has(v)).map((v) => ({
          value: v,
          label: v,
          count: apM.get(v) ?? 0,
        })),
      });
    }

    // Facción y región dependen del backfill del vault: si todavía no hay
    // datos (o solo un valor), el eje no se muestra.
    const facM = tally(items, "faccion");
    if (facM.size >= 2) {
      facetGroups.push({
        key: "faccion",
        label: "Facción",
        options: [...facM.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
          .map(([v, c]) => ({ value: v, label: v, count: c })),
      });
    }

    const regM = tally(items, "region");
    if (regM.size >= 2) {
      facetGroups.push({
        key: "region",
        label: "Región",
        options: [...regM.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
          .map(([v, c]) => ({ value: v, label: v, count: c })),
      });
    }
  }

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
            facets={facetGroups}
          />
        )}
      </div>
    </section>
  );
}
