"use client";

import AtlasDomainExplorer from "@/components/atlas/AtlasDomainExplorer";
import type { AtlasEntitySummary } from "@/lib/atlas-content";

export default function MisteriosClient({ items }: { items: AtlasEntitySummary[] }) {
  return (
    <AtlasDomainExplorer
      items={items}
      variant="mystery"
      indexLabel="Hilos abiertos"
      detailBaseHref="/misterios"
    />
  );
}
