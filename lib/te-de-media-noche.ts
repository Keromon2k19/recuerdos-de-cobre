// lib/te-de-media-noche.ts
// Helper puro: mapea details del vault + config curada → props de la
// constelación. Sin I/O — testeable con mocks.

import type { AtlasEntityDetail } from "@/lib/atlas-content";
import {
  ATLAS_V2_KNOWN_PORTRAITS,
  ATLAS_V2_PORTRAIT_PLACEHOLDER,
} from "@/lib/atlas-portraits";
import type { MemberStats } from "@/lib/foundry-stats";
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
  raza: string | null;
  edad: string | null;
  altura: string | null;
  stats: MemberStats | null;
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

// La prosa del vault suele abrir aclarando el rol ("<Nombre> es una de las PJ /
// un NPC de la campaña…"): info obvia para quien lee el expediente. Y como la
// descripción se autoextrae y se trunca, a veces cierra a mitad de oración. Acá
// limpiamos solo la bio de la constelación (no toca el vault ni la description
// global): sacamos la apertura obvia de rol y cerramos en oración completa.
function cleanBio(raw: string, name: string): string {
  let t = raw.trim();
  if (!t) return t;

  // 1. Si la primera cláusula (hasta la primera coma/punto/…) nombra al personaje
  //    y aclara su rol, es relleno obvio: la quitamos.
  const firstClause = t.match(/^[^,.;:—–]*[,.;:]\s*/);
  if (firstClause) {
    const clause = firstClause[0].toLowerCase();
    const mentionsRole = /\b(pj|pjs|pg|pgs|npc|npcs|personaje|jugador|integrante)\b/.test(clause);
    const mentionsName = clause.includes(name.toLowerCase());
    if (mentionsRole && mentionsName) t = t.slice(firstClause[0].length).trimStart();
  }

  // 2. Si venía truncada ("…"/"..."), cerrar en el último corte de oración para
  //    que no quede colgada a mitad de frase.
  if (/(\.\.\.|…)\s*$/.test(t)) {
    t = t.replace(/(\.\.\.|…)\s*$/, "").trimEnd();
    let stop = Math.max(t.lastIndexOf("."), t.lastIndexOf("!"), t.lastIndexOf("?"));
    const soft = Math.max(t.lastIndexOf(":"), t.lastIndexOf(";"));
    if (soft > stop) stop = soft;
    if (stop >= 80) {
      t = t.slice(0, stop).trimEnd();
      if (!/[.!?]$/.test(t)) t += ".";
    }
  }

  // 3. Capitalizar la inicial (quedó en minúscula al sacar la apertura).
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

function parseAtlasPath(path: string): { segment: string; slug: string } | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { segment: parts[0], slug: parts[1] };
}

export function buildConstellation(
  details: Map<string, AtlasEntityDetail | null>,
  resolve: Resolver,
  stats: Record<string, MemberStats> = {},
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
      bio: cleanBio(d?.description ?? "", d?.name ?? cfg.nombre),
      episodes: d?.appearances.length ?? 0,
      raza: cfg.raza ?? null,
      edad: cfg.edad ?? null,
      altura: cfg.altura ?? null,
      stats: stats[cfg.slug] ?? null,
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
