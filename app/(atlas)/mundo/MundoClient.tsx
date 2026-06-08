"use client";

import AtlasDomainExplorer from "@/components/atlas/AtlasDomainExplorer";
import type { AtlasEntitySummary } from "@/lib/atlas-content";

export default function MundoClient({ items }: { items: AtlasEntitySummary[] }) {
  return (
    <AtlasDomainExplorer
      items={items}
      variant="world"
      indexLabel="Conceptos del mundo"
      detailBaseHref="/mundo"
    />
  );
}
