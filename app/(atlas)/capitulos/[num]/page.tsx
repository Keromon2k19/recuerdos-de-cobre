import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AtlasChapterDetail from "@/components/atlas/AtlasChapterDetail";
import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import { parseAtlasChapterDetail } from "@/lib/atlas-chapter";
import { renderMarkdown } from "@/lib/markdown-render";
import { cachedListEpisodes } from "@/lib/public-cache";
import { readEpisode } from "@/lib/vault";
import { cachedBuildAtlasWikiResolver } from "@/lib/wiki-resolver";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ num: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const number = Number.parseInt((await params).num, 10);
  const vaultPath = process.env.VAULT_PATH?.trim() || "";
  const content = vaultPath && Number.isFinite(number)
    ? await readEpisode(vaultPath, number)
    : null;
  if (!content) return { title: "Registro no encontrado · Grimorio de Lore" };
  const detail = parseAtlasChapterDetail(content, number);
  return { title: `${detail.title} · Grimorio de Lore`, description: detail.description };
}

export default async function ChapterDetailPage({ params }: Props) {
  const number = Number.parseInt((await params).num, 10);
  const vaultPath = process.env.VAULT_PATH?.trim() || "";
  if (!vaultPath || !Number.isFinite(number)) notFound();

  const [content, episodes, resolve] = await Promise.all([
    readEpisode(vaultPath, number),
    cachedListEpisodes(vaultPath),
    cachedBuildAtlasWikiResolver(vaultPath),
  ]);
  if (!content) notFound();

  const detail = parseAtlasChapterDetail(content, number);
  const sections = detail.sections.map((section) => ({
    id: section.id,
    title: section.title,
    kind: section.kind,
    html: renderMarkdown(section.markdown, resolve),
  }));
  const index = episodes.findIndex((episode) => episode.numero === number);
  const previous = index > 0
    ? { number: episodes[index - 1].numero, title: episodes[index - 1].titulo }
    : null;
  const next = index >= 0 && index < episodes.length - 1
    ? { number: episodes[index + 1].numero, title: episodes[index + 1].titulo }
    : null;

  return (
    <AtlasPageScene
      eyebrow={`Registro ${String(number).padStart(3, "0")}`}
      title=""
      variant="chapter"
    >
      <AtlasChapterDetail
        detail={detail}
        sections={sections}
        previous={previous}
        next={next}
      />
    </AtlasPageScene>
  );
}
