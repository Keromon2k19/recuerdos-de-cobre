import { parseEpisodioRef } from "./episode-number";
import type { EntityListItem, EpisodeMenciones } from "./vault";

type HomeEpisode = {
  numero: number;
  titulo: string;
  filename: string;
  procesado: string;
  image?: string;
  imageAlt?: string;
  menciones?: EpisodeMenciones;
  descripcion?: string;
};

export type HomeQuote = {
  text: string;
  author?: string;
};

export type HomeCastHighlight = {
  key: string;
  name: string;
  aliases: string[];
  detail: string;
};

export type HomeCastSlide = {
  key: string;
  name: string;
  aliases: string[];
  slug?: string;
  href?: string;
  role?: string;
  imageSrc: string;
  detail: string;
  quote?: string;
};

export type HomeChapterSlide = {
  numero: number;
  registroLabel: string;
  episodioLabel: string;
  titulo: string;
  excerpt: string;
  href: string;
  imageSrc: string;
  imageAlt?: string;
  featured:
    | { kind: "quote"; text: string; author?: string }
    | { kind: "moment"; text: string };
  cast: HomeCastSlide[];
};

export type BuildHomeChapterSlidesInput = {
  episodes: HomeEpisode[];
  episodeBodies: Map<number, string>;
  characters: EntityListItem[];
  limit?: number;
};

const FALLBACK_SCENE = "/assets/atlas-v2/scenes/metropolis.webp";
const PORTRAIT_PLACEHOLDER = "/assets/atlas-v2/portraits/_placeholder-1.svg";
const KNOWN_PORTRAITS: Record<string, string> = {
  mysha: "/assets/atlas-v2/portraits/mysha.png",
  "io-campbell": "/assets/atlas-v2/portraits/io-campbell.png",
  annora: "/assets/atlas-v2/portraits/annora.jpg",
  layra: "/images/personajes/layra.webp",
  narcissa: "/images/personajes/narcissa.webp",
};

function normalizeKey(raw: string): string {
  return stripWikilink(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugKey(raw: string): string {
  return normalizeKey(raw).replace(/\s+/g, "-");
}

function cleanMarkdownText(raw: string): string {
  return raw
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function stripWikilink(s: string): string {
  return s.replace(/^\[\[(?:[^|\]]+\|)?([^\]]+)\]\]$/, "$1").trim();
}

function truncate(raw: string, max = 220): string {
  const text = cleanMarkdownText(raw);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentence = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("? "),
    cut.lastIndexOf("! "),
  );
  if (sentence > 80) return cut.slice(0, sentence + 1);
  const space = cut.lastIndexOf(" ");
  return `${space > 120 ? cut.slice(0, space) : cut}...`;
}

function sectionAfterHeading(md: string, heading: RegExp): string {
  const lines = md.split("\n");
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return "";

  const level = lines[start].match(/^(#+)\s/)?.[1].length ?? 2;
  const body: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const next = lines[i].match(/^(#+)\s/);
    if (next && next[1].length <= level) break;
    body.push(lines[i]);
  }
  return body.join("\n").trim();
}

export function extractEpisodeQuotes(md: string): HomeQuote[] {
  const section = sectionAfterHeading(md, /^###\s+Quotes\s*$/i);
  if (!section) return [];

  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith(">"))
    .map<HomeQuote | null>((line) => {
      const raw = line.replace(/^>\s*/, "").trim();
      const match = raw.match(/^[“"](.+?)[”"]\s*(?:—|–|-|--)\s*(.+)$/);
      if (!match) return null;
      return {
        text: cleanMarkdownText(match[1]),
        author: cleanMarkdownText(match[2]).replace(/\s*\([^)]*\)\s*$/, ""),
      };
    })
    .filter((quote): quote is HomeQuote => quote !== null);
}

export function extractImportantMoment(md: string): string {
  const decision = firstBullet(sectionAfterHeading(md, /^###\s+Decisiones clave\s*$/i));
  if (decision) return decision;

  const event = firstBullet(sectionAfterHeading(md, /^###\s+Eventos\s*$/i));
  if (event) return event;

  const summary = sectionAfterHeading(md, /^##\s+Resumen\s*$/i);
  return truncate(summary, 180);
}

function firstBullet(section: string): string {
  const line = section
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.startsWith("- "));
  if (!line) return "";

  return cleanMarkdownText(line.slice(2))
    .replace(/\s+\([^)]*\)\s*$/, "")
    .trim();
}

export function extractCastHighlights(md: string): HomeCastHighlight[] {
  const section = sectionAfterHeading(md, /^##\s+Cast del episodio\s*$/i);
  if (!section) return [];

  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => {
      const match = line.match(/^-\s+\*\*([^*]+)\*\*\s+(.+)$/);
      if (!match) return null;

      const names = match[1]
        .split("/")
        .map((part) => cleanMarkdownText(part))
        .filter(Boolean);
      const name = names[0];
      if (!name) return null;

      return {
        key: slugKey(name),
        name,
        aliases: names.slice(1),
        detail: cleanMarkdownText(match[2]),
      };
    })
    .filter((item): item is HomeCastHighlight => item !== null);
}

export function buildHomeChapterSlides({
  episodes,
  episodeBodies,
  characters,
  limit = 5,
}: BuildHomeChapterSlidesInput): HomeChapterSlide[] {
  const characterIndex = buildCharacterIndex(characters);

  return episodes
    .slice(-limit)
    .reverse()
    .map((episode) => {
      const body = episodeBodies.get(episode.numero) ?? "";
      const quotes = extractEpisodeQuotes(body);
      const moment = extractImportantMoment(body);
      const cast =
        extractCastHighlights(body).length > 0
          ? extractCastHighlights(body)
          : castFromMentions(episode.menciones?.personajes);

      const castSlides = cast.map((item) =>
        toCastSlide(item, characterIndex, quotes),
      );
      const firstQuote = quotes[0];

      return {
        numero: episode.numero,
        registroLabel: `Registro ${String(episode.numero).padStart(3, "0")}`,
        episodioLabel: formatEpisodeLabel(episode.titulo, episode.numero),
        titulo: cleanEpisodeTitle(episode.titulo),
        excerpt: episode.descripcion || truncate(body, 220),
        href: `/cronicas/${episode.numero}`,
        imageSrc: episode.image ?? thumbnailForRegistro(episode.numero),
        imageAlt: episode.imageAlt,
        featured: firstQuote
          ? { kind: "quote", text: firstQuote.text, author: firstQuote.author }
          : { kind: "moment", text: moment || "Registro pendiente de resumen." },
        cast: castSlides,
      };
    });
}

function buildCharacterIndex(characters: EntityListItem[]): Map<string, EntityListItem> {
  const index = new Map<string, EntityListItem>();
  for (const character of characters) {
    index.set(normalizeKey(character.nombre), character);
    index.set(normalizeKey(character.slug), character);
  }
  return index;
}

function castFromMentions(menciones: string[] | undefined): HomeCastHighlight[] {
  const seen = new Set<string>();
  return (menciones ?? [])
    .map((raw) => stripWikilink(raw))
    .map((name) => ({
      key: slugKey(name),
      name,
      aliases: [],
      detail: "Aparece en este registro del archivo.",
    }))
    .filter((item) => {
      if (!item.key || seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
}

function toCastSlide(
  item: HomeCastHighlight,
  characterIndex: Map<string, EntityListItem>,
  quotes: HomeQuote[],
): HomeCastSlide {
  const character =
    characterIndex.get(normalizeKey(item.name)) ??
    characterIndex.get(item.key) ??
    item.aliases
      .map((alias) => characterIndex.get(normalizeKey(alias)))
      .find((match): match is EntityListItem => Boolean(match));
  const quote = quotes.find((candidate) => {
    if (!candidate.author) return false;
    const author = normalizeKey(candidate.author);
    return (
      author === normalizeKey(item.name) ||
      item.aliases.some((alias) => normalizeKey(alias) === author)
    );
  });

  return {
    key: character?.slug ?? item.key,
    name: character?.nombre ?? item.name,
    aliases: item.aliases,
    slug: character?.slug,
    href: character?.slug ? `/personajes/${character.slug}` : undefined,
    role: character?.rol,
    imageSrc:
      character?.image ??
      KNOWN_PORTRAITS[character?.slug ?? item.key] ??
      PORTRAIT_PLACEHOLDER,
    detail: item.detail,
    quote: quote?.text,
  };
}

function cleanEpisodeTitle(titulo: string): string {
  const colon = titulo.indexOf(": ");
  if (colon > -1) return titulo.slice(colon + 2).trim();
  return titulo.trim();
}

function formatEpisodeLabel(titulo: string, fallbackNumero: number): string {
  const ref = parseEpisodioRef(titulo);
  if (!ref) return `Registro ${String(fallbackNumero).padStart(3, "0")}`;
  const base = `Episodio ${Number.isInteger(ref.ep) ? ref.ep : String(ref.ep)}`;
  return ref.parte ? `${base} - Parte ${ref.parte}` : base;
}

function thumbnailForRegistro(numero: number): string {
  return numero > 0
    ? `/images/episodios/ep${String(numero).padStart(2, "0")}.jpg`
    : FALLBACK_SCENE;
}
