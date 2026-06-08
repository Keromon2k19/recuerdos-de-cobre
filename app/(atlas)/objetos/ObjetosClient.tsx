"use client";

import AtlasDomainExplorer from "@/components/atlas-v2/AtlasDomainExplorer";
import type { AtlasV2EntitySummary } from "@/lib/atlas-v2-content";

export default function ObjetosClient({ items }: { items: AtlasV2EntitySummary[] }) {
  return (
    <AtlasDomainExplorer
      items={items}
      variant="relic"
      indexLabel="Piezas catalogadas"
      detailBaseHref="/objetos"
    />
  );
}
