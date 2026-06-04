import { readFile } from "node:fs/promises";
import path from "node:path";
import { splitEpisodeSections } from "./episode-sections";
import { parseMarkdown } from "./markdown";
import { slugify } from "./slugify";
import { ENTITY_FOLDERS, type EntityType } from "./types";
import type { EntityListItem } from "./vault";

export type AtlasV2EntityKind = Extract<
  EntityType,
  "personaje" | "lugar" | "faccion" | "objeto" | "misterio" | "worldbuilding"
>;

export type AtlasV2EntitySection = {
  id: string;
  title: string;
  kind: "profile" | "mentions" | "narrative";
  markdown: string;
};

export type AtlasV2EntityDetail = {
  kind: AtlasV2EntityKind;
  slug: string;
  name: string;
  aliases: string[];
  description: string;
  imageSrc?: string;
  appearances: number[];
  meta: Array<{ label: string; value: string }>;
  relations: Array<{ name: string; detail: string; episode?: number }>;
  sections: AtlasV2EntitySection[];
};

export type AtlasV2EntitySummary = {
  slug: string;
  name: string;
  description: string;
  imageSrc?: string;
  appearances: number;
  eyebrow: string;
  meta: string;
  glyph: string;
};

type RawRelation = {
  con?: unknown;
  a?: unknown;
  de?: unknown;
  tipo?: unknown;
  episodio?: unknown;
};

function asStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function wikiLinkLabel(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^\[\[([^|\]]+)\|([^\]]+)\]\]$/, "$2")
    .replace(/^\[\[([^\]]+)\]\]$/, "$1")
    .trim();
}

function imageFrom(frontmatter: Record<string, unknown>): string | undefined {
  if (typeof frontmatter.image === "string" && frontmatter.image.trim()) {
    return frontmatter.image.trim();
  }

  if (!Array.isArray(frontmatter.images)) return undefined;
  for (const item of frontmatter.images) {
    if (typeof item === "string" && item.trim()) return item.trim();
    if (item && typeof item === "object") {
      const src = (item as Record<string, unknown>).src;
      if (typeof src === "string" && src.trim()) return src.trim();
    }
  }
  return undefined;
}

function plainText(markdown: string, maxLength = 280): string {
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
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 120 ? cut.slice(0, lastSpace) : cut}...`;
}

function sectionKind(title: string): AtlasV2EntitySection["kind"] {
  if (/^(perfil|canon|sobre)\b/i.test(title)) return "profile";
  if (/menci/i.test(title)) return "mentions";
  return "narrative";
}

function buildMeta(
  frontmatter: Record<string, unknown>,
): AtlasV2EntityDetail["meta"] {
  const rows: Array<[string, unknown]> = [
    ["Rol", frontmatter.rol],
    ["Jugador", frontmatter.jugador],
    ["Facciones", frontmatter.facciones],
    ["Region", frontmatter.region],
    ["Categoria", frontmatter.categoria],
    ["Origen", frontmatter.origen],
  ];

  return rows.flatMap(([label, raw]) => {
    const values = asStrings(raw);
    return values.length > 0 ? [{ label, value: values.join(" · ") }] : [];
  });
}

function buildRelations(
  frontmatter: Record<string, unknown>,
): AtlasV2EntityDetail["relations"] {
  if (!Array.isArray(frontmatter.relaciones)) return [];

  return frontmatter.relaciones.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const relation = raw as RawRelation;
    const name = wikiLinkLabel(relation.con ?? relation.a ?? relation.de);
    const detail = String(relation.tipo ?? "").trim();
    if (!name || !detail) return [];
    const episode =
      typeof relation.episodio === "number" ? relation.episodio : undefined;
    return [{ name, detail, episode }];
  });
}

export function parseAtlasV2EntityDetail(
  content: string,
  kind: AtlasV2EntityKind,
  slug: string,
): AtlasV2EntityDetail {
  const { frontmatter, body } = parseMarkdown(content);
  const sections = splitEpisodeSections(body).map((section, index) => ({
    id: slugify(section.title || `narrativa-${index + 1}`),
    title: section.title || "Narrativa",
    kind: sectionKind(section.title),
    markdown: section.body,
  }));
  const profile = sections.find((section) => section.kind === "profile");
  const firstSection = sections[0];
  const appearances = asStrings(frontmatter.apariciones)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  return {
    kind,
    slug,
    name:
      typeof frontmatter.nombre === "string" && frontmatter.nombre.trim()
        ? frontmatter.nombre.trim()
        : slug,
    aliases: asStrings(frontmatter.alias),
    description: plainText(profile?.markdown ?? firstSection?.markdown ?? body),
    imageSrc: imageFrom(frontmatter),
    appearances,
    meta: buildMeta(frontmatter),
    relations: buildRelations(frontmatter),
    sections,
  };
}

export async function readAtlasV2EntityDetail(
  vaultPath: string,
  kind: AtlasV2EntityKind,
  slug: string,
): Promise<AtlasV2EntityDetail | null> {
  const filePath = path.join(vaultPath, ENTITY_FOLDERS[kind], `${slug}.md`);
  try {
    const content = await readFile(filePath, "utf8");
    return parseAtlasV2EntityDetail(content, kind, slug);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function toAtlasV2EntitySummary(
  item: EntityListItem,
  fallbackEyebrow: string,
): AtlasV2EntitySummary {
  const appearances = item.apariciones?.length ?? 0;
  const eyebrow =
    item.categoria ||
    item.rol ||
    item.region ||
    item.origen ||
    fallbackEyebrow;
  const context = [
    appearances > 0
      ? `${appearances} ${appearances === 1 ? "aparicion" : "apariciones"}`
      : "Sin apariciones",
    item.region || item.origen,
  ].filter(Boolean);

  return {
    slug: item.slug,
    name: item.nombre,
    description: item.descripcion ?? "",
    imageSrc: item.image,
    appearances,
    eyebrow,
    meta: context.join(" · "),
    glyph: item.nombre.charAt(0).toUpperCase(),
  };
}
