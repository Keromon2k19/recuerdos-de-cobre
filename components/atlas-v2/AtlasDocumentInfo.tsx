// components/atlas-v2/AtlasDocumentInfo.tsx
// Columna de lectura y metadatos del documento seleccionado.

import type { V2Document } from "@/data/atlas-v2/archives";

type Props = {
  document: V2Document;
};

const META_LABELS: Array<[keyof V2Document["meta"], string]> = [
  ["origen", "Origen"],
  ["fecha", "Fecha"],
  ["autor", "Autor"],
  ["material", "Material"],
  ["estado", "Estado"],
  ["clasificacion", "Clasificacion"],
  ["acceso", "Acceso"],
];

export default function AtlasDocumentInfo({ document: doc }: Props) {
  return (
    <aside className="av2-document-info" aria-label="Informacion del documento">
      <div className="av2-document-info-head">Informacion</div>

      <div className="av2-document-titleblock">
        <p className="av2-document-eyebrow">{doc.eyebrow}</p>
        <h2 className="av2-document-title">{doc.titulo}</h2>
        <p className="av2-document-numero">{doc.numero}</p>
      </div>

      <div className="av2-document-fragment av2-document-fragment--lead">
        <h3 className="av2-document-fragment-title">Fragmento destacado</h3>
        <blockquote className="av2-document-fragment-quote">
          {doc.fragmento}
        </blockquote>
      </div>

      <dl className="av2-document-meta">
        {META_LABELS.map(([key, label]) => {
          const value = doc.meta[key];
          if (!value) return null;
          return (
            <div key={key} className="av2-document-meta-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          );
        })}
      </dl>

      <div className="av2-document-desc">
        {doc.descripcion.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </aside>
  );
}
