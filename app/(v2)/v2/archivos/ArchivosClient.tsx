"use client";

// app/(v2)/v2/archivos/ArchivosClient.tsx
// Orquesta coleccion, busqueda local y documento seleccionado.

import { useEffect, useMemo, useState } from "react";
import AtlasCollectionList from "@/components/atlas-v2/AtlasCollectionList";
import AtlasDocumentViewer from "@/components/atlas-v2/AtlasDocumentViewer";
import AtlasDocumentInfo from "@/components/atlas-v2/AtlasDocumentInfo";
import type { V2Collection, V2Document } from "@/data/atlas-v2/archives";

type Props = {
  collections: V2Collection[];
  documents: V2Document[];
};

export default function ArchivosClient({ collections, documents }: Props) {
  const [collectionSlug, setCollectionSlug] = useState<string>(collections[0]?.slug ?? "");
  const [search, setSearch] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const byCollection = documents.filter((document) => document.collectionSlug === collectionSlug);

    if (!query) return byCollection;

    return byCollection.filter((document) => {
      const haystack = [
        document.titulo,
        document.descripcion,
        document.fragmento,
        document.eyebrow,
        ...document.tags,
        ...Object.values(document.meta),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [documents, collectionSlug, search]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [collectionSlug, search]);

  const selected = filtered[selectedIdx] ?? filtered[0];

  return (
    <div className="av2-archivos-layout">
      <AtlasCollectionList
        collections={collections}
        selectedSlug={collectionSlug}
        onSelect={setCollectionSlug}
      />

      {selected ? (
        <>
          <AtlasDocumentViewer
            document={selected}
            search={search}
            onSearchChange={setSearch}
            currentIndex={selectedIdx + 1}
            totalDocs={filtered.length}
            onPrev={() => setSelectedIdx((index) => Math.max(0, index - 1))}
            onNext={() => setSelectedIdx((index) => Math.min(filtered.length - 1, index + 1))}
          />
          <AtlasDocumentInfo document={selected} />
        </>
      ) : (
        <div className="av2-empty av2-archives-empty">
          <p>
            {search
              ? `Sin resultados para "${search}" en esta coleccion.`
              : "Sin documentos en esta coleccion."}
          </p>
        </div>
      )}
    </div>
  );
}
