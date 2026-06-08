import { splitEpisodeSections } from "./episode-sections";
import { parseMarkdown } from "./markdown";
import { slugify } from "./slugify";

export type AtlasChapterSection = {
  id: string;
  title: string;
  kind: "profile" | "mentions" | "narrative";
  markdown: string;
};

export type AtlasChapterDetail = {
  number: number;
  title: string;
  description: string;
  imageSrc: string;
  processed?: string;
  sections: AtlasChapterSection[];
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

function sectionKind(title: string): AtlasChapterSection["kind"] {
  if (/resumen/i.test(title)) return "profile";
  if (/lore extra|extraido|menciones/i.test(title)) return "mentions";
  return "narrative";
}

function buildStats(raw: unknown): AtlasChapterDetail["stats"] {
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

function splitH3Sections(markdown: string): Array<{ title: string; body: string }> {
  const lines = markdown.split("\n");
  const subSections: Array<{ title: string; body: string }> = [];
  let current: { title: string; body: string } | null = null;

  for (const line of lines) {
    const h3 = line.match(/^### +(.+?)\s*$/);
    if (h3) {
      if (current) subSections.push(current);
      current = { title: h3[1].trim(), body: "" };
      continue;
    }
    if (current) {
      current.body += line + "\n";
    }
  }
  if (current) subSections.push(current);

  return subSections
    .map((s) => ({ title: s.title, body: s.body.trim() }))
    .filter((s) => s.body !== "");
}

export function parseAtlasChapterDetail(
  content: string,
  number: number,
): AtlasChapterDetail {
  const { frontmatter, body } = parseMarkdown(content);
  
  const rawSections = splitEpisodeSections(body);
  const sections: AtlasChapterSection[] = [];

  for (const section of rawSections) {
    if (/lore extra|extraido/i.test(section.title)) {
      const subSections = splitH3Sections(section.body);
      for (const sub of subSections) {
        let title = sub.title;
        if (/quotes|citas/i.test(title)) {
          title = "Citas destacadas";
        }
        sections.push({
          id: slugify(title),
          title,
          kind: "mentions",
          markdown: sub.body,
        });
      }
    } else {
      sections.push({
        id: slugify(section.title || `parte-${sections.length + 1}`),
        title: section.title || `Parte ${sections.length + 1}`,
        kind: sectionKind(section.title),
        markdown: section.body,
      });
    }
  }

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
