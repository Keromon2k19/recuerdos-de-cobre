import type { EntityListItem, EpisodeMenciones } from "./vault";

export const SEARCH_KINDS = [
  "personaje",
  "capitulo",
  "faccion",
  "lugar",
  "dios",
  "objeto",
  "misterio",
  "mundo",
] as const;

export type EntityKind = (typeof SEARCH_KINDS)[number];

export const KIND_LABELS: Record<EntityKind, string> = {
  personaje: "Personaje",
  capitulo: "Capitulo",
  faccion: "Faccion",
  lugar: "Lugar",
  dios: "Dios",
  objeto: "Objeto",
  misterio: "Misterio",
  mundo: "Mundo",
};

export const KIND_GLYPHS: Record<EntityKind, string> = {
  personaje: "◈",
  capitulo: "◇",
  faccion: "⬡",
  lugar: "◉",
  dios: "✦",
  objeto: "◆",
  misterio: "⌁",
  mundo: "◎",
};

export type SearchResult = {
  id: string;
  kind: EntityKind;
  titulo: string;
  subtitulo: string;
  snippet: string;
  href: string;
  haystack: string;
};

type SearchEntityKind = Exclude<EntityKind, "capitulo" | "dios">;

type SearchEpisode = {
  numero: number;
  titulo: string;
  descripcion?: string;
  menciones?: EpisodeMenciones;
};

type SearchGod = {
  slug: string;
  nombre: string;
  titulo: string;
  profile: string;
  domains: string[];
};

type SearchRegion = {
  slug: string;
  nombre: string;
  tagline: string;
  descripcion: string;
  category: string;
};

export type BuildAtlasSearchIndexInput = {
  episodes?: SearchEpisode[];
  entities?: Partial<Record<SearchEntityKind, EntityListItem[]>>;
  gods?: SearchGod[];
  regions?: SearchRegion[];
};

const ENTITY_ROUTES: Record<SearchEntityKind, string> = {
  personaje: "/personajes",
  faccion: "/facciones",
  lugar: "/lugares",
  objeto: "/objetos",
  misterio: "/misterios",
  mundo: "/mundo",
};

function snippetOf(text: string, max = 150): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 70 ? cut.slice(0, lastSpace) : cut}...`;
}

function wikiLinkLabel(value: string): string {
  return value
    .trim()
    .replace(/^\[\[([^|\]]+)\|([^\]]+)\]\]$/, "$2")
    .replace(/^\[\[([^\]]+)\]\]$/, "$1")
    .trim();
}

function entitySubtitle(kind: SearchEntityKind, item: EntityListItem): string {
  const context =
    item.rol ||
    item.categoria ||
    item.region ||
    (item.facciones?.length ? item.facciones.join(" · ") : "") ||
    KIND_LABELS[kind];
  const appearances = item.apariciones?.length ?? 0;
  return appearances > 0 ? `${context} · ${appearances} apariciones` : context;
}

function fromEntity(
  kind: SearchEntityKind,
  item: EntityListItem,
): SearchResult {
  const subtitle = entitySubtitle(kind, item);
  const snippet = snippetOf(item.descripcion ?? subtitle);
  return {
    id: `${kind}-${item.slug}`,
    kind,
    titulo: item.nombre,
    subtitulo: subtitle,
    snippet,
    href: `${ENTITY_ROUTES[kind]}/${item.slug}`,
    haystack: [
      item.nombre,
      subtitle,
      snippet,
      item.origen,
      item.rol,
      item.jugador,
      item.region,
      item.categoria,
      ...(item.facciones ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function cleanEpisodeTitle(title: string): string {
  const separator = title.indexOf(": ");
  return separator >= 0 ? title.slice(separator + 2) : title;
}

function fromEpisode(episode: SearchEpisode): SearchResult {
  const places = (episode.menciones?.lugares ?? []).map(wikiLinkLabel);
  const characters = (episode.menciones?.personajes ?? []).map(wikiLinkLabel);
  const factions = (episode.menciones?.facciones ?? []).map(wikiLinkLabel);
  const subtitle = [
    `Registro ${String(episode.numero).padStart(3, "0")}`,
    places[0],
  ]
    .filter(Boolean)
    .join(" · ");
  const snippet = snippetOf(episode.descripcion ?? "Cronica de la campana.");

  return {
    id: `capitulo-${episode.numero}`,
    kind: "capitulo",
    titulo: cleanEpisodeTitle(episode.titulo),
    subtitulo: subtitle,
    snippet,
    href: `/capitulos/${episode.numero}`,
    haystack: [
      episode.titulo,
      subtitle,
      snippet,
      ...places,
      ...characters,
      ...factions,
    ]
      .join(" ")
      .toLowerCase(),
  };
}

function fromGod(god: SearchGod): SearchResult {
  const subtitle = [god.titulo, ...god.domains].filter(Boolean).join(" · ");
  return {
    id: `dios-${god.slug}`,
    kind: "dios",
    titulo: god.nombre,
    subtitulo: subtitle,
    snippet: snippetOf(god.profile),
    href: `/dioses?dios=${god.slug}`,
    haystack: [god.nombre, subtitle, god.profile].join(" ").toLowerCase(),
  };
}

function fromRegion(region: SearchRegion): SearchResult {
  return {
    id: `lugar-region-${region.slug}`,
    kind: "lugar",
    titulo: region.nombre,
    subtitulo: [region.category, region.tagline].filter(Boolean).join(" · "),
    snippet: snippetOf(region.descripcion),
    href: `/lugares/${region.slug}`,
    haystack: [
      region.nombre,
      region.category,
      region.tagline,
      region.descripcion,
    ]
      .join(" ")
      .toLowerCase(),
  };
}

export function buildAtlasSearchIndex({
  episodes = [],
  entities = {},
  gods = [],
  regions = [],
}: BuildAtlasSearchIndexInput): SearchResult[] {
  const results: SearchResult[] = [
    ...episodes.map(fromEpisode),
    ...Object.entries(entities).flatMap(([kind, items]) =>
      (items ?? []).map((item) => fromEntity(kind as SearchEntityKind, item)),
    ),
    ...gods.map(fromGod),
    ...regions.map(fromRegion),
  ];

  const unique = new Map<string, SearchResult>();
  for (const result of results) {
    const key = `${result.kind}:${result.href}`;
    if (!unique.has(key)) unique.set(key, result);
  }
  return [...unique.values()];
}

export function search(
  query: string,
  kindFilter: EntityKind | null,
  items: SearchResult[],
): SearchResult[] {
  let list = items;
  if (kindFilter) list = list.filter((result) => result.kind === kindFilter);
  const normalized = query.trim().toLowerCase();
  if (!normalized) return list;
  return list.filter((result) => result.haystack.includes(normalized));
}
