import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AtlasEntityDetail, {
  type AtlasEntityDetailVariant,
} from "./AtlasEntityDetail";
import AtlasPageScene from "./AtlasPageScene";
import type { AtlasV2EntityKind } from "@/lib/atlas-v2-content";
import { renderMarkdown } from "@/lib/markdown-render";
import { cachedAtlasV2EntityDetail } from "@/lib/public-cache";
import { cachedBuildAtlasV2WikiResolver } from "@/lib/wiki-resolver";

type Props = {
  kind: AtlasV2EntityKind;
  slug: string;
  variant: AtlasEntityDetailVariant;
  backHref: string;
  backLabel: string;
  eyebrow: string;
};

export async function buildAtlasV2EntityMetadata(
  kind: AtlasV2EntityKind,
  slug: string,
): Promise<Metadata> {
  const vaultPath = process.env.VAULT_PATH?.trim() || "";
  const detail = vaultPath
    ? await cachedAtlasV2EntityDetail(vaultPath, kind, slug)
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
    cachedAtlasV2EntityDetail(vaultPath, kind, slug),
    cachedBuildAtlasV2WikiResolver(vaultPath),
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
      />
    </AtlasPageScene>
  );
}
