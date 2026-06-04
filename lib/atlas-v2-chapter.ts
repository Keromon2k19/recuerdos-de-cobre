import { splitEpisodeSections } from "./episode-sections";
import { parseMarkdown } from "./markdown";
import { slugify } from "./slugify";

export type AtlasV2ChapterSection = {
  id: string;
  title: string;
  kind: "profile" | "mentions" | "narrative";
  markdown: string;
};

export type AtlasV2ChapterDetail = {
  number: number;
  title: string;
  description: string;
  imageSrc: string;
  processed?: string;
  sections: AtlasV2ChapterSection[];
  stats: Array<{ label: string; value: number }>;
};

const STAT_LABELS: Record<string, string> = {
  personajes: "Personajes",
  lugares: "Lugares",
  facciones: "Facciones",
  eventos: "Eventos",
  objetos: "Objetos",
  misterios: "Misterios",
  quotes: "Citas",
  decisiones: "Decisiones",
  worldbuilding: "Mundo",
};

function plainText(markdown: string, maxLength = 300): string {
  const text = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/^[>-]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

function sectionKind(title: string): AtlasV2ChapterSection["kind"] {
  if (/resumen/i.test(title)) return "profile";
  if (/lore extra|extraido|menciones/i.test(title)) return "mentions";
  return "narrative";
}

function buildStats(raw: unknown): AtlasV2ChapterDetail["stats"] {
  if (!raw || typeof raw !== "object") return [];
  const mentions = raw as Record<string, unknown>;

  return Object.entries(STAT_LABELS).flatMap(([key, label]) => {
    const value = mentions[key];
    const count = Array.isArray(value)
      ? value.length
      : typeof value === "number"
        ? value
        : 0;
    return count > 0 ? [{ label, value: count }] : [];
  });
}

export function parseAtlasV2ChapterDetail(
  content: string,
  number: number,
): AtlasV2ChapterDetail {
  const { frontmatter, body } = parseMarkdown(content);
  const sections = splitEpisodeSections(body).map((section, index) => ({
    id: slugify(section.title || `parte-${index + 1}`),
    title: section.title || `Parte ${index + 1}`,
    kind: sectionKind(section.title),
    markdown: section.body,
  }));
  const summary = sections.find((section) => section.kind === "profile");

  return {
    number,
    title:
      typeof frontmatter.titulo === "string" && frontmatter.titulo.trim()
        ? frontmatter.titulo.trim()
        : `Registro ${number}`,
    description: plainText(summary?.markdown ?? sections[0]?.markdown ?? body),
    imageSrc:
      typeof frontmatter.image === "string" && frontmatter.image.trim()
        ? frontmatter.image.trim()
        : `/images/episodios/ep${String(number).padStart(2, "0")}.jpg`,
    processed:
      typeof frontmatter.procesado === "string"
        ? frontmatter.procesado
        : undefined,
    sections,
    stats: buildStats(frontmatter.menciones),
  };
}
