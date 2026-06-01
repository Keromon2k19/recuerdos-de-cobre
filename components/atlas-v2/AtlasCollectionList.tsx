"use client";

// components/atlas-v2/AtlasCollectionList.tsx
// Lista lateral de colecciones del archivo.

import type { V2Collection } from "@/data/atlas-v2/archives";

type Props = {
  collections: V2Collection[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

export default function AtlasCollectionList({ collections, selectedSlug, onSelect }: Props) {
  const total = collections.reduce((sum, collection) => sum + collection.count, 0);

  return (
    <aside className="av2-collection-list" aria-label="Colecciones del archivo">
      <div className="av2-collection-list-head">Colecciones</div>

      <ul className="av2-collection-list-items">
        {collections.map((collection) => (
          <li key={collection.slug}>
            <button
              type="button"
              className="av2-collection-item"
              data-active={selectedSlug === collection.slug ? "true" : undefined}
              data-tone={collection.tone}
              onClick={() => onSelect(collection.slug)}
              aria-pressed={selectedSlug === collection.slug}
            >
              <span className="av2-collection-item-code" aria-hidden="true">
                {collection.code}
              </span>
              <span className="av2-collection-item-text">
                <span className="av2-collection-item-name">{collection.nombre}</span>
                <span className="av2-collection-item-description">{collection.description}</span>
                <span className="av2-collection-item-count">{collection.count} documentos</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="av2-collection-list-foot">
        {total} registros indexados
      </div>
    </aside>
  );
}
