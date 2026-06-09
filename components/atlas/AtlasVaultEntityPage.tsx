import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AtlasEntityDetail, {
  type AtlasEntityDetailVariant,
} from "./AtlasEntityDetail";
import AtlasPageScene from "./AtlasPageScene";
import type { AtlasEntityKind } from "@/lib/atlas-content";
import { renderMarkdown } from "@/lib/markdown-render";
import { cachedAtlasEntityDetail } from "@/lib/public-cache";
import { cachedBuildAtlasWikiResolver } from "@/lib/wiki-resolver";

type Props = {
  kind: AtlasEntityKind;
  slug: string;
  variant: AtlasEntityDetailVariant;
  backHref: string;
  backLabel: string;
  eyebrow: string;
};

export async function buildAtlasEntityMetadata(
  kind: AtlasEntityKind,
  slug: string,
): Promise<Metadata> {
  const vaultPath = process.env.VAULT_PATH?.trim() || "";
  const detail = vaultPath
    ? await cachedAtlasEntityDetail(vaultPath, kind, slug)
    : null;

  return {
    title: detail
      ? `${detail.name} · Grimorio de Lore`
      : "Registro no encontrado · Grimorio de Lore",
    description: detail?.description,
  };
}

export default async function AtlasVaultEntityPage({
  kind,
  slug,
  variant,
  backHref,
  backLabel,
  eyebrow,
}: Props) {
  const vaultPath = process.env.VAULT_PATH?.trim() || "";
  if (!vaultPath) notFound();

  const [detail, resolve] = await Promise.all([
    cachedAtlasEntityDetail(vaultPath, kind, slug),
    cachedBuildAtlasWikiResolver(vaultPath),
  ]);
  if (!detail) notFound();

  const sections = detail.sections.map((section) => ({
    id: section.id,
    title: section.title,
    kind: section.kind,
    html: renderMarkdown(section.markdown, resolve),
  }));

  const tagline =
    detail.description.length > 150
      ? `${detail.description.slice(0, 150).replace(/\s+\S*$/, "").trim()}…`
      : detail.description;

  return (
    <AtlasPageScene
      eyebrow={eyebrow}
      title={detail.name}
      subtitle={tagline}
      variant={variant}
    >
      <AtlasEntityDetail
        detail={detail}
        sections={sections}
        variant={variant}
        backHref={backHref}
        backLabel={backLabel}
        resolve={resolve}
      />
    </AtlasPageScene>
  );
}
