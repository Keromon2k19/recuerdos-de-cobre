// app/(v2)/v2/capitulos/page.tsx
import CapitulosClient from "./CapitulosClient";
import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import { cachedListByType, cachedListEpisodes } from "@/lib/public-cache";
import { parseEpisodioRef } from "@/lib/episode-number";
import { publicVaultPath } from "@/lib/public-vault-path";
import type { V2Chapter } from "@/data/atlas/chapters";
import { parseAtlasChapterDetail } from "@/lib/atlas-chapter";
import { renderMarkdown } from "@/lib/markdown-render";
import { readEpisode } from "@/lib/vault";
import { cachedBuildAtlasWikiResolver } from "@/lib/wiki-resolver";

export const dynamic = "force-static";

export const metadata = {
  title: "Capítulos · Grimorio de Lore",
};

function stripWikilink(s: string): string {
  return s.replace(/^\[\[(?:[^|\]]+\|)?([^\]]+)\]\]$/, "$1").trim();
}

function cleanTitulo(titulo: string): string {
  const colonIdx = titulo.indexOf(": ");
  if (colonIdx > 0) return titulo.slice(colonIdx + 2);
  return titulo;
}

type VaultEpisode = Awaited<ReturnType<typeof cachedListEpisodes>>[number];
type CharacterItem = Awaited<ReturnType<typeof cachedListByType>>[number];

const MAX_PERSONAJES = 8;
const PLAYER_ORDER = [
  "mysha",
  "narcissa",
  "eryon",
  "io campbell",
  "layra",
  "selenne",
  "veltra",
];

function formatEpisodeNumber(titulo: string, fallbackNumero: number): string {
  const ref = parseEpisodioRef(titulo);
  if (!ref) return String(fallbackNumero).padStart(2, "0");
  return Number.isInteger(ref.ep) ? String(ref.ep).padStart(2, "0") : String(ref.ep);
}

function episodeEyebrow(titulo: string, fallbackNumero: number): string {
  const ref = parseEpisodioRef(titulo);
  if (!ref) return `REGISTRO ${String(fallbackNumero).padStart(3, "0")}`;
  const ep = `EPISODIO ${Number.isInteger(ref.ep) ? ref.ep : String(ref.ep)}`;
  return ref.parte ? `${ep} - PARTE ${ref.parte}` : ep;
}

function thumbnailForRegistro(numero: number): string {
  return `/images/episodios/ep${String(numero).padStart(2, "0")}.jpg`;
}

function normalizeName(s: string): string {
  return stripWikilink(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

function sortPersonajes(menciones: string[] | undefined, roles: Map<string, string>): string[] {
  const seen = new Set<string>();
  const original = (menciones ?? [])
    .map((raw, index) => ({ name: stripWikilink(raw), key: normalizeName(raw), index }))
    .filter((item) => {
      if (!item.key || seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });

  return original
    .sort((a, b) => {
      const aIsPlayer = roles.get(a.key)?.toLowerCase() === "pj";
      const bIsPlayer = roles.get(b.key)?.toLowerCase() === "pj";
      if (aIsPlayer !== bIsPlayer) return aIsPlayer ? -1 : 1;
      if (aIsPlayer && bIsPlayer) {
        const aOrder = PLAYER_ORDER.indexOf(a.key);
        const bOrder = PLAYER_ORDER.indexOf(b.key);
        const aRank = aOrder === -1 ? Number.MAX_SAFE_INTEGER : aOrder;
        const bRank = bOrder === -1 ? Number.MAX_SAFE_INTEGER : bOrder;
        if (aRank !== bRank) return aRank - bRank;
      }
      return a.index - b.index;
    })
    .slice(0, MAX_PERSONAJES)
    .map((item) => item.name);
}

function toV2Chapter(ep: VaultEpisode, roles: Map<string, string>): V2Chapter {
  const personajes = sortPersonajes(ep.menciones?.personajes, roles);
  const lugar = ep.menciones?.lugares?.[0]
    ? stripWikilink(ep.menciones.lugares[0])
    : "Varios";

  return {
    id: String(ep.numero),
    numero: ep.numero,
    numeroDisplay: formatEpisodeNumber(ep.titulo, ep.numero),
    eyebrow: episodeEyebrow(ep.titulo, ep.numero),
    titulo: cleanTitulo(ep.titulo),
    fecha: "",
    lugar,
    personajes,
    estado: "Completado",
    descripcion: ep.descripcion ?? "",
    imageSrc: ep.image ?? thumbnailForRegistro(ep.numero),
  };
}

export default async function CapitulosPage() {
  const vp = publicVaultPath();
  const [episodes, personajes, resolve] = await Promise.all([
    cachedListEpisodes(vp),
    cachedListByType(vp, "personaje"),
    cachedBuildAtlasWikiResolver(vp),
  ]);
  const roles = buildRoleIndex(personajes);

  const chapters = await Promise.all(
    episodes.map(async (ep) => {
      const base = toV2Chapter(ep, roles);
      const content = await readEpisode(vp, ep.numero);
      const detail = content ? parseAtlasChapterDetail(content, ep.numero) : null;
      const sections = detail
        ? detail.sections.map((section) => ({
            id: section.id,
            title: section.title,
            kind: section.kind,
            html: renderMarkdown(section.markdown, resolve),
          }))
        : [];
      return { ...base, sections };
    })
  );

  const reversedChapters = chapters.reverse();

  return (
    <AtlasPageScene
      eyebrow="La crónica, episodio por episodio"
      title="Capítulos"
      subtitle="Cada sesión como un registro: qué pasó, quién estuvo, qué quedó abierto."
      variant="chapter"
    >
      <CapitulosClient chapters={reversedChapters} />
    </AtlasPageScene>
  );
}
