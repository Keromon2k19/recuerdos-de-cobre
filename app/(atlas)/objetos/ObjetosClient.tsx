"use client";

import AtlasDomainExplorer from "@/components/atlas/AtlasDomainExplorer";
import type { AtlasEntitySummary } from "@/lib/atlas-content";

export default function ObjetosClient({ items }: { items: AtlasEntitySummary[] }) {
  return (
    <AtlasDomainExplorer
      items={items}
      variant="relic"
      indexLabel="Piezas catalogadas"
      detailBaseHref="/objetos"
    />
  );
}
