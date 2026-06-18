import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AtlasChapterDetail from "@/components/atlas/AtlasChapterDetail";
import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import { parseAtlasChapterDetail } from "@/lib/atlas-chapter";
import { renderMarkdown } from "@/lib/markdown-render";
import { cachedListEpisodes } from "@/lib/public-cache";
import { readEpisode } from "@/lib/vault";
import { cachedBuildAtlasWikiResolver } from "@/lib/wiki-resolver";
import { publicVaultPath, publicEpisodeStaticParams } from "@/lib/public-vault-path";

// Pre-render all episodes at build time (SSG) so Vercel can serve them
export const dynamicParams = false;

export function generateStaticParams() {
  return publicEpisodeStaticParams();
}

type Props = { params: Promise<{ num: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const number = Number.parseInt((await params).num, 10);
  const vp = publicVaultPath();
  const content = vp && Number.isFinite(number)
    ? await readEpisode(vp, number)
    : null;
  if (!content) return { title: "Registro no encontrado · Grimorio de Lore" };
  const detail = parseAtlasChapterDetail(content, number);
  return { title: `${detail.title} · Grimorio de Lore`, description: detail.description };
}

export default async function ChapterDetailPage({ params }: Props) {
  const number = Number.parseInt((await params).num, 10);
  const vp = publicVaultPath();
  if (!vp || !Number.isFinite(number)) notFound();

  const [content, episodes, resolve] = await Promise.all([
    readEpisode(vp, number),
    cachedListEpisodes(vp),
    cachedBuildAtlasWikiResolver(vp),
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
      eyebrow=""
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
