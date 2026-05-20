// app/(public)/mapa/page.tsx - Atlas geografico de la campana.
import Link from "next/link";
import CampaignMap from "@/components/public/CampaignMap";
import { BASE_MARKERS, type MapMarker } from "@/lib/map-markers";
import { PERSONAJE_ORIGEN } from "@/lib/personajes-origen";
import { loadConfig } from "@/lib/config";
import { listByType } from "@/lib/vault";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mapa · Recuerdos de Cobre",
  description: "Atlas navegable del continente de Eyira y sus lugares principales.",
};

export default async function MapaPage() {
  const config = loadConfig();
  const [lugares, personajes] = await Promise.all([
    listByType(config.vaultPath, "lugar"),
    listByType(config.vaultPath, "personaje"),
  ]);

  // Indexo por slug para hacer lookup O(1) al enriquecer cada marker.
  const bySlug = new Map(lugares.map((l) => [l.slug, l]));

  // Match contra el vault con tolerancia a articulos: "La Metropolis de Cobre"
  // en el marker puede vivir como "metropolis-de-cobre.md" en el vault (sin
  // "la-"). Pruebo en orden: slug exacto → slug sin articulo inicial → slug con
  // articulos comunes prefijados.
  function resolveVaultEntry(name: string) {
    const exact = slugify(name);
    if (bySlug.has(exact)) return { entry: bySlug.get(exact)!, slug: exact };

    const stripped = exact.replace(/^(la|el|los|las)-/, "");
    if (stripped !== exact && bySlug.has(stripped)) {
      return { entry: bySlug.get(stripped)!, slug: stripped };
    }

    for (const prefix of ["la-", "el-", "los-", "las-"]) {
      const withPrefix = prefix + exact;
      if (bySlug.has(withPrefix)) return { entry: bySlug.get(withPrefix)!, slug: withPrefix };
    }
    return null;
  }

  // Mapa inverso: id de marker → lista de personajes cuyo origen es este lugar.
  // Source 1 (gana): override en lib/personajes-origen.ts.
  // Source 2: campo `origen` en frontmatter del personaje (cuando exista).
  const habitantesPorMarker = new Map<string, { nombre: string; slug: string }[]>();
  function pushHabitante(markerId: string, p: { nombre: string; slug: string }) {
    const list = habitantesPorMarker.get(markerId) ?? [];
    if (!list.find((x) => x.slug === p.slug)) list.push(p);
    habitantesPorMarker.set(markerId, list);
  }
  for (const p of personajes) {
    const override = PERSONAJE_ORIGEN[p.slug];
    if (override) {
      pushHabitante(override, { nombre: p.nombre, slug: p.slug });
      continue;
    }
    if (p.origen) {
      // Si frontmatter trae origen, intentar resolver contra ids de markers
      // o slug de lugares.
      const origenSlug = slugify(p.origen);
      const marker = BASE_MARKERS.find(
        (mk) => mk.id === origenSlug || slugify(mk.name) === origenSlug,
      );
      if (marker) {
        pushHabitante(marker.id, { nombre: p.nombre, slug: p.slug });
      }
    }
  }

  // Co-aparicion: personajes que aparecen >=2 episodios con el lugar, ordenados
  // por overlap. Sirve como "visitantes frecuentes" cuando no hay habitantes.
  function visitantes(
    epsLugar: number[],
    excluirSlugs: Set<string>,
  ): { nombre: string; slug: string }[] {
    if (epsLugar.length === 0) return [];
    const set = new Set(epsLugar);
    return personajes
      .filter((p) => !excluirSlugs.has(p.slug))
      .map((p) => ({
        p,
        overlap: (p.apariciones || []).filter((e) => set.has(e)).length,
      }))
      .filter((x) => x.overlap >= 2)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 6)
      .map((x) => ({ nombre: x.p.nombre, slug: x.p.slug }));
  }

  const markers: MapMarker[] = BASE_MARKERS.map((m) => {
    const resolved = resolveVaultEntry(m.name);
    const habitantes = habitantesPorMarker.get(m.id) ?? [];
    if (!resolved) return habitantes.length ? { ...m, habitantes } : m;
    const excluir = new Set(habitantes.map((h) => h.slug));
    return {
      ...m,
      apariciones: resolved.entry.apariciones,
      descripcion: resolved.entry.descripcion,
      href: `/lugares/${resolved.slug}`,
      habitantes: habitantes.length ? habitantes : undefined,
      personajes: visitantes(resolved.entry.apariciones, excluir),
    };
  });

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

        <CampaignMap markers={markers} />
      </div>
    </section>
  );
}
