import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AtlasEntityDetail, {
  type AtlasEntityDetailVariant,
} from "./AtlasEntityDetail";
import AtlasPageScene from "./AtlasPageScene";
import type { AtlasEntityDetail as AtlasEntityDetailType, AtlasEntityKind } from "@/lib/atlas-content";
import { renderMarkdown } from "@/lib/markdown-render";
import { cachedAtlasEntityDetail } from "@/lib/public-cache";
import { cachedBuildAtlasWikiResolver } from "@/lib/wiki-resolver";
import type { GraphNode, GraphLink } from "./AtlasRelationsGraph";
import { slugify } from "@/lib/slugify";
import { publicVaultPath } from "@/lib/public-vault-path";

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
  const vaultPath = publicVaultPath();
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

async function getLocalRelationsGraph(
  vaultPath: string,
  detail: AtlasEntityDetailType,
  resolve: (target: string) => string | null,
) {
  const nodesMap = new Map<string, GraphNode>();
  const linksList: GraphLink[] = [];
  const linkKeys = new Set<string>();

  const addLink = (source: string, target: string, type?: string, episode?: number) => {
    if (source === target) return;
    const sorted = [source, target].sort();
    const key = `${sorted[0]}---${sorted[1]}`;
    if (!linkKeys.has(key)) {
      linkKeys.add(key);
      linksList.push({ source, target, type, episode });
    }
  };

  // 1. Agregar nodo central
  nodesMap.set(detail.slug, {
    id: detail.slug,
    name: detail.name,
    kind: detail.kind,
    isCenter: true,
    isPC: detail.meta.some(m => m.label === "Rol" && m.value.toLowerCase().includes("pj")),
    href: null,
  });

  // 2. Agregar vecinos de primer grado
  const neighborsToFetch: Array<{ slug: string; kind: AtlasEntityKind; href: string }> = [];

  for (const rel of detail.relations) {
    const resolvedPath = resolve(rel.name);
    if (resolvedPath) {
      const parts = resolvedPath.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const segment = parts[0];
        const slug = parts[1];
        
        let kind: AtlasEntityKind = "personaje";
        if (segment === "lugares") kind = "lugar";
        else if (segment === "facciones") kind = "faccion";
        else if (segment === "objetos") kind = "objeto";
        else if (segment === "misterios") kind = "misterio";
        else if (segment === "mundo") kind = "worldbuilding";

        if (!nodesMap.has(slug)) {
          neighborsToFetch.push({ slug, kind, href: resolvedPath });
          nodesMap.set(slug, {
            id: slug,
            name: rel.name,
            kind,
            href: resolvedPath,
          });
        }
        addLink(detail.slug, slug, rel.detail, rel.episode);
      }
    } else {
      const minorId = slugify(rel.name);
      if (!nodesMap.has(minorId)) {
        nodesMap.set(minorId, {
          id: minorId,
          name: rel.name,
          kind: "minor",
          href: null,
        });
      }
      addLink(detail.slug, minorId, rel.detail, rel.episode);
    }
  }

  // 3. Enriquecer nodos y buscar enlaces cruzados entre los vecinos
  await Promise.all(
    neighborsToFetch.map(async ({ slug, kind }) => {
      const nDetail = await cachedAtlasEntityDetail(vaultPath, kind, slug);
      if (nDetail) {
        const node = nodesMap.get(slug);
        if (node) {
          node.name = nDetail.name;
          node.isPC = nDetail.meta.some(m => m.label === "Rol" && m.value.toLowerCase().includes("pj"));
        }

        for (const nRel of nDetail.relations) {
          const resolvedPath = resolve(nRel.name);
          if (resolvedPath) {
            const parts = resolvedPath.split("/").filter(Boolean);
            if (parts.length >= 2) {
              const targetSlug = parts[1];
              if (nodesMap.has(targetSlug)) {
                addLink(slug, targetSlug, nRel.detail, nRel.episode);
              }
            }
          }
        }
      }
    })
  );

  return {
    nodes: Array.from(nodesMap.values()),
    links: linksList,
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
  const vaultPath = publicVaultPath();
  if (!vaultPath) notFound();

  const [detail, resolve] = await Promise.all([
    cachedAtlasEntityDetail(vaultPath, kind, slug),
    cachedBuildAtlasWikiResolver(vaultPath),
  ]);
  if (!detail) notFound();

  const [sections, graphData] = await Promise.all([
    Promise.resolve(
      detail.sections.map((section) => ({
        id: section.id,
        title: section.title,
        kind: section.kind,
        html: renderMarkdown(section.markdown, resolve),
      }))
    ),
    getLocalRelationsGraph(vaultPath, detail, resolve),
  ]);

  const tagline =
    detail.description.length > 150
      ? `${detail.description.slice(0, 150).replace(/\s+\S*$/, "").trim()}…`
      : detail.description;

  const relationsMap: Record<string, string> = {};
  for (const rel of detail.relations) {
    const href = resolve(rel.name);
    if (href) {
      relationsMap[rel.name] = href;
    }
  }

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
        relationsMap={relationsMap}
        graphNodes={graphData.nodes}
        graphLinks={graphData.links}
      />
    </AtlasPageScene>
  );
}
