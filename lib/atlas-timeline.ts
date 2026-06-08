import { parseEpisodioRef } from "@/lib/episode-number";

export type TimelinePersona = {
  name: string;
  initial: string;
  isPlayer: boolean;
};

export type TimelineItem = {
  id: string;
  numero: number;
  displayNumero: string;
  eyebrow: string;
  titulo: string;
  lugar: string;
  placeSlug?: string;
  placeImageSrc?: string;
  placeImageAlt?: string;
  descripcion: string;
  personajes: TimelinePersona[];
  side: "left" | "right";
  href: string;
};

export type TimelinePlaceImage = {
  slug: string;
  name: string;
  imageSrc?: string | null;
  alt?: string;
  aliases?: string[];
};

type VaultEpisode = {
  numero: number;
  titulo: string;
  filename?: string;
  menciones?: {
    personajes?: string[];
    lugares?: string[];
  };
  descripcion?: string;
};

type CharacterItem = {
  nombre: string;
  slug: string;
  rol?: string;
};

const MAX_PERSONAJES = 8;
const PLACE_KEY_STOPWORDS = new Set(["el", "la", "los", "las", "de", "del"]);

function stripWikilink(value: string): string {
  return value.replace(/^\[\[(?:[^|\]]+\|)?([^\]]+)\]\]$/, "$1").trim();
}

function cleanTitulo(titulo: string): string {
  const colonIndex = titulo.indexOf(": ");
  return colonIndex > 0 ? titulo.slice(colonIndex + 2).trim() : titulo.trim();
}

function cleanDescripcion(descripcion: string | undefined): string {
  if (!descripcion) return "";
  const clean = descripcion
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return /^#{1,6}\s/.test(clean) ? "" : clean;
}

function normalizeName(value: string): string {
  return stripWikilink(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function placeKey(value: string): string {
  return normalizeName(value)
    .split(" ")
    .filter((part) => part && !PLACE_KEY_STOPWORDS.has(part))
    .join(" ");
}

function wikilinkParts(value: string): { target: string; label: string } | null {
  const match = value.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/);
  if (!match) return null;
  return {
    target: match[1].trim(),
    label: (match[2] ?? match[1]).trim(),
  };
}

function placeMentionKeys(rawLugar: string): string[] {
  const parts = wikilinkParts(rawLugar);
  const sources = parts
    ? [parts.label, parts.target, parts.target.split("/").pop() ?? ""]
    : [rawLugar];
  return Array.from(new Set(sources.map(placeKey).filter(Boolean)));
}

function buildPlaceImageIndex(
  places: TimelinePlaceImage[]
): Map<string, TimelinePlaceImage> {
  const index = new Map<string, TimelinePlaceImage>();
  for (const place of places) {
    if (!place.imageSrc) continue;
    const keys = [place.name, place.slug, ...(place.aliases ?? [])].map(placeKey);
    for (const key of keys) {
      if (key && !index.has(key)) index.set(key, place);
    }
  }
  return index;
}

function findPlaceImage(
  rawLugar: string | undefined,
  placeIndex: Map<string, TimelinePlaceImage>
): TimelinePlaceImage | undefined {
  if (!rawLugar) return undefined;
  for (const key of placeMentionKeys(rawLugar)) {
    const exact = placeIndex.get(key);
    if (exact) return exact;

    for (const [candidateKey, place] of placeIndex) {
      if (candidateKey.includes(key) || key.includes(candidateKey)) return place;
    }
  }
  return undefined;
}

function findPlaceImageInMentions(
  rawLugares: string[],
  placeIndex: Map<string, TimelinePlaceImage>
): TimelinePlaceImage | undefined {
  for (const rawLugar of rawLugares) {
    const placeImage = findPlaceImage(rawLugar, placeIndex);
    if (placeImage) return placeImage;
  }
  return undefined;
}

function episodeEyebrow(titulo: string, fallbackNumero: number): string {
  const ref = parseEpisodioRef(titulo);
  if (!ref) return `REGISTRO ${String(fallbackNumero).padStart(3, "0")}`;

  const ep = `EPISODIO ${
    Number.isInteger(ref.ep) ? Math.trunc(ref.ep) : String(ref.ep)
  }`;
  return ref.parte ? `${ep} - PARTE ${ref.parte}` : ep;
}

function displayEpisodeNumber(ep: number): string {
  return Number.isInteger(ep) ? String(Math.trunc(ep)) : String(ep);
}

function initialOf(name: string): string {
  const initial = stripWikilink(name).trim().charAt(0);
  return initial ? initial.toUpperCase() : ".";
}

function buildRoleIndex(characters: CharacterItem[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const character of characters) {
    if (!character.rol) continue;
    index.set(normalizeName(character.nombre), character.rol);
    index.set(normalizeName(character.slug), character.rol);
  }
  return index;
}

function sortPersonajes(
  menciones: string[] | undefined,
  roles: Map<string, string>
): TimelinePersona[] {
  const seen = new Set<string>();
  const list = (menciones ?? [])
    .map((raw, index) => ({
      name: stripWikilink(raw),
      key: normalizeName(raw),
      index,
    }))
    .filter((item) => {
      if (!item.key || seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });

  return list
    .sort((a, b) => {
      const aIsPlayer = roles.get(a.key)?.toLowerCase() === "pj";
      const bIsPlayer = roles.get(b.key)?.toLowerCase() === "pj";
      if (aIsPlayer !== bIsPlayer) return aIsPlayer ? -1 : 1;

      return a.index - b.index;
    })
    .slice(0, MAX_PERSONAJES)
    .map((item) => ({
      name: item.name,
      initial: initialOf(item.name),
      isPlayer: roles.get(item.key)?.toLowerCase() === "pj",
    }));
}

function campaignSortKey(episode: VaultEpisode): {
  ep: number;
  parte: number;
} {
  const ref = parseEpisodioRef(episode.titulo);
  return {
    ep: ref?.ep ?? episode.numero,
    parte: ref?.parte ?? 0,
  };
}

export function buildTimelineItems(
  episodes: VaultEpisode[],
  characters: CharacterItem[],
  places: TimelinePlaceImage[] = []
): TimelineItem[] {
  const roles = buildRoleIndex(characters);
  const placeIndex = buildPlaceImageIndex(places);
  const defaultPlaceImage = places.find((place) => place.imageSrc);
  let lastPlaceImage: TimelinePlaceImage | undefined = defaultPlaceImage;
  const sorted = episodes
    .map((episode) => ({ episode, sort: campaignSortKey(episode) }))
    .sort(
      (a, b) =>
        a.sort.ep - b.sort.ep ||
        a.sort.parte - b.sort.parte ||
        a.episode.numero - b.episode.numero
    );

  return sorted.map(({ episode, sort }, index) => {
    const rawLugares = episode.menciones?.lugares ?? [];
    const rawLugar = rawLugares[0];
    const lugar = rawLugar ? stripWikilink(rawLugar) : "";
    const matchedPlaceImage = findPlaceImageInMentions(rawLugares, placeIndex);
    const placeImage = matchedPlaceImage ?? lastPlaceImage;
    if (matchedPlaceImage) lastPlaceImage = matchedPlaceImage;

    return {
      id: `${sort.ep}-${sort.parte}`,
      numero: episode.numero,
      displayNumero: displayEpisodeNumber(sort.ep),
      eyebrow: episodeEyebrow(episode.titulo, episode.numero),
      titulo: cleanTitulo(episode.titulo),
      lugar,
      placeSlug: placeImage?.slug,
      placeImageSrc: placeImage?.imageSrc ?? undefined,
      placeImageAlt: placeImage?.alt ?? placeImage?.name,
      descripcion: cleanDescripcion(episode.descripcion),
      personajes: sortPersonajes(episode.menciones?.personajes, roles),
      side: index % 2 === 0 ? "left" : "right",
      href: `/capitulos/${episode.numero}`,
    };
  });
}
