// lib/te-de-media-noche.ts
// Helper puro: mapea details del vault + config curada → props de la
// constelación. Sin I/O — testeable con mocks.

import type { AtlasEntityDetail } from "@/lib/atlas-content";
import {
  ATLAS_V2_KNOWN_PORTRAITS,
  ATLAS_V2_PORTRAIT_PLACEHOLDER,
} from "@/lib/atlas-portraits";
import {
  TDMN_MEMBERS,
  TDMN_CUT_LINKS,
  type TdmnMemberConfig,
} from "@/data/atlas/te-de-media-noche";

export type ConstellationMember = {
  slug: string;
  name: string;
  etiqueta: string;
  rolCorto: string;
  estado: TdmnMemberConfig["estado"];
  imageSrc: string;
  aliases: string[];
  bio: string;
  episodes: number;
  href: string; // ficha completa
};

export type ConstellationEdge = { a: string; b: string };

export type SatKind = "personaje" | "faccion";

export type ConstellationSat = {
  slug: string;
  name: string;
  kind: SatKind;
  episode?: number;
  imageSrc?: string; // solo personajes
  sigla?: string;    // solo facciones
  href: string | null;
};

export type ConstellationData = {
  members: ConstellationMember[];
  edges: ConstellationEdge[];
  cutEdges: Array<[string, string]>;
  satsByMember: Record<string, ConstellationSat[]>;
};

const MAX_SATS = 8;

type Resolver = (name: string) => string | null;

function portraitFor(slug: string, detail?: AtlasEntityDetail | null): string {
  return (
    detail?.imageSrc ??
    ATLAS_V2_KNOWN_PORTRAITS[slug] ??
    ATLAS_V2_PORTRAIT_PLACEHOLDER
  );
}

function siglaDe(nombre: string): string {
  const words = nombre.split(/\s+/).filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(w));
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || nombre.slice(0, 2).toUpperCase();
}

function parseAtlasPath(path: string): { segment: string; slug: string } | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { segment: parts[0], slug: parts[1] };
}

export function buildConstellation(
  details: Map<string, AtlasEntityDetail | null>,
  resolve: Resolver,
): ConstellationData {
  const memberSlugs = new Set(TDMN_MEMBERS.map((m) => m.slug));

  const members: ConstellationMember[] = TDMN_MEMBERS.map((cfg) => {
    const d = details.get(cfg.slug) ?? null;
    return {
      slug: cfg.slug,
      name: d?.name ?? cfg.nombre,
      etiqueta: cfg.etiqueta,
      rolCorto: cfg.rolCorto,
      estado: cfg.estado,
      imageSrc: portraitFor(cfg.slug, d),
      aliases: d?.aliases ?? [],
      bio: d?.description ?? "",
      episodes: d?.appearances.length ?? 0,
      href: `/personajes/${cfg.slug}`,
    };
  });

  // Edges del anillo: relaciones del vault entre pares de miembros.
  // 1 edge por par (orden alfabético del par como key) y sin borok
  // (su vínculo es la línea cortada curada).
  const edgeKeys = new Set<string>();
  const edges: ConstellationEdge[] = [];
  const separados = new Set(
    TDMN_MEMBERS.filter((m) => m.estado === "separado").map((m) => m.slug),
  );

  for (const cfg of TDMN_MEMBERS) {
    const d = details.get(cfg.slug);
    if (!d) continue;
    for (const rel of d.relations) {
      const path = resolve(rel.name);
      const parsed = path ? parseAtlasPath(path) : null;
      if (!parsed || parsed.segment !== "personajes") continue;
      const target = parsed.slug;
      if (!memberSlugs.has(target) || target === cfg.slug) continue;
      if (separados.has(cfg.slug) || separados.has(target)) continue;
      const [a, b] = [cfg.slug, target].sort();
      const key = `${a}---${b}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push({ a, b });
    }
  }

  // Satélites por miembro: personajes + facciones (alcance del spec),
  // 1 por target, orden episodio desc, tope MAX_SATS.
  const satsByMember: Record<string, ConstellationSat[]> = {};
  for (const cfg of TDMN_MEMBERS) {
    const d = details.get(cfg.slug);
    const byTarget = new Map<string, ConstellationSat>();
    for (const rel of d?.relations ?? []) {
      const path = resolve(rel.name);
      const parsed = path ? parseAtlasPath(path) : null;
      if (!parsed) continue;
      let kind: SatKind;
      if (parsed.segment === "personajes") kind = "personaje";
      else if (parsed.segment === "facciones") kind = "faccion";
      else continue; // lugares/objetos/etc. fuera de alcance
      const prev = byTarget.get(parsed.slug);
      const episode = rel.episode;
      if (prev && (prev.episode ?? -1) >= (episode ?? -1)) continue;
      byTarget.set(parsed.slug, {
        slug: parsed.slug,
        name: rel.name,
        kind,
        episode,
        imageSrc: kind === "personaje" ? portraitFor(parsed.slug) : undefined,
        sigla: kind === "faccion" ? siglaDe(rel.name) : undefined,
        href: path,
      });
    }
    satsByMember[cfg.slug] = [...byTarget.values()]
      .sort((x, y) => (y.episode ?? 0) - (x.episode ?? 0))
      .slice(0, MAX_SATS);
  }

  return { members, edges, cutEdges: TDMN_CUT_LINKS, satsByMember };
}
