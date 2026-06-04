"use client";

import AtlasDomainExplorer from "@/components/atlas-v2/AtlasDomainExplorer";
import type { AtlasV2EntitySummary } from "@/lib/atlas-v2-content";

export default function MundoClient({ items }: { items: AtlasV2EntitySummary[] }) {
  return (
    <AtlasDomainExplorer
      items={items}
      variant="world"
      indexLabel="Conceptos del mundo"
      detailBaseHref="/v2/mundo"
    />
  );
}
