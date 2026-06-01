// lib/atlas-v2-search.ts — Helper de búsqueda cross-entity para /v2/buscar.
// Normaliza todas las entidades V2 (personajes, capítulos, archivos, regiones)
// a un shape común y filtra por query + tipo.

import { MOCK_CHARACTERS, type V2Character } from "@/data/atlas-v2/characters";
import { MOCK_CHAPTERS,   type V2Chapter   } from "@/data/atlas-v2/chapters";
import { MOCK_DOCUMENTS,  type V2Document  } from "@/data/atlas-v2/archives";
import { MOCK_REGIONS,    type V2Region    } from "@/data/atlas-v2/locations";

export type EntityKind = "personaje" | "capitulo" | "archivo" | "region";

export const KIND_LABELS: Record<EntityKind, string> = {
  personaje: "Personaje",
  capitulo:  "Capítulo",
  archivo:   "Archivo",
  region:    "Región",
};

export const KIND_GLYPHS: Record<EntityKind, string> = {
  personaje: "◈",
  capitulo:  "◇",
  archivo:   "❦",
  region:    "◉",
};

export type SearchResult = {
  id: string;
  kind: EntityKind;
  /** Título principal del resultado */
  titulo: string;
  /** Subtítulo / contexto (rol, colección, etc.) */
  subtitulo: string;
  /** Snippet de descripción (~140 chars máx) */
  snippet: string;
  /** Ruta al detalle (V2 cuando exista, V1 mientras tanto) */
  href: string;
  /** Texto completo usado para matching (no se renderiza) */
  haystack: string;
};

function snippetOf(text: string, max = 140): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > 60 ? cut.slice(0, sp) : cut) + "…";
}

function fromCharacter(c: V2Character): SearchResult {
  return {
    id: `personaje-${c.id}`,
    kind: "personaje",
    titulo: c.nombre,
    subtitulo: c.epiteto ? `${c.rol} · ${c.epiteto}` : c.rol,
    snippet: snippetOf(c.descripcion),
    href: `/v2/personajes`,
    haystack: [
      c.nombre, c.rol, c.epiteto, c.jugador, c.region,
      ...c.facciones, c.descripcion,
    ].filter(Boolean).join(" ").toLowerCase(),
  };
}

function fromChapter(c: V2Chapter): SearchResult {
  return {
    id: `capitulo-${c.id}`,
    kind: "capitulo",
    titulo: c.titulo,
    subtitulo: `${c.eyebrow} · ${c.lugar}`,
    snippet: snippetOf(c.descripcion),
    href: `/v2/capitulos`,
    haystack: [
      c.titulo, c.eyebrow, c.lugar, c.estado, c.descripcion,
      ...c.personajes,
    ].join(" ").toLowerCase(),
  };
}

function fromDocument(d: V2Document): SearchResult {
  return {
    id: `archivo-${d.id}`,
    kind: "archivo",
    titulo: d.titulo,
    subtitulo: `${d.eyebrow} · ${d.numero}`,
    snippet: snippetOf(d.descripcion),
    href: `/v2/archivos`,
    haystack: [
      d.titulo, d.eyebrow, d.numero, d.descripcion, d.fragmento,
      ...d.tags,
      d.meta.origen, d.meta.autor, d.meta.material,
    ].join(" ").toLowerCase(),
  };
}

function fromRegion(r: V2Region): SearchResult {
  return {
    id: `region-${r.slug}`,
    kind: "region",
    titulo: r.nombre,
    subtitulo: r.tagline,
    snippet: snippetOf(r.descripcion),
    href: `/v2/mapa`,
    haystack: [
      r.nombre, r.tagline, r.descripcion,
      r.meta.gobierno, r.meta.industria, r.meta.poblacion,
    ].join(" ").toLowerCase(),
  };
}

export function getAllSearchable(): SearchResult[] {
  return [
    ...MOCK_CHARACTERS.map(fromCharacter),
    ...MOCK_CHAPTERS.map(fromChapter),
    ...MOCK_DOCUMENTS.map(fromDocument),
    ...MOCK_REGIONS.map(fromRegion),
  ];
}

export function search(
  query: string,
  kindFilter: EntityKind | null,
  items: SearchResult[] = getAllSearchable()
): SearchResult[] {
  let list = items;
  if (kindFilter) list = list.filter((r) => r.kind === kindFilter);
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((r) => r.haystack.includes(q));
}
