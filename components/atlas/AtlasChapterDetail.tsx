import Link from "next/link";
import type { AtlasChapterDetail } from "@/lib/atlas-chapter";
import AtlasEntityReader, {
  type AtlasEntityReaderSection,
} from "./AtlasEntityReader";
import AtlasNarrativeFrame from "./AtlasNarrativeFrame";

type Neighbor = { number: number; title: string } | null;

type Props = {
  detail: AtlasChapterDetail;
  sections: AtlasEntityReaderSection[];
  previous: Neighbor;
  next: Neighbor;
};

export default function AtlasChapterDetail({
  detail,
  sections,
  previous,
  next,
}: Props) {
  return (
    <div className="av2-chapter-detail-page">
      <AtlasNarrativeFrame
        variant="secondary"
        className="av2-chapter-detail-cover"
      >
        <Link href="/capitulos" className="av2-entity-detail-back">
          <span aria-hidden="true">←</span>
          Volver a capítulos
        </Link>

        <div className="av2-chapter-detail-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={detail.imageSrc} alt="" />
          <span>Registro {String(detail.number).padStart(3, "0")}</span>
        </div>

        <div className="av2-chapter-detail-identity">
          <p>Crónica completa</p>
          <h1>{detail.title}</h1>
          <span>{detail.description}</span>
        </div>

        <nav
          className="av2-chapter-detail-neighbors"
          aria-label="Navegación entre capítulos"
        >
          {previous ? (
            <Link href={`/capitulos/${previous.number}`} className="previous">
              <small>← Registro anterior</small>
              <span>{previous.title}</span>
            </Link>
          ) : (
            <span className="av2-chapter-detail-neighbor-empty">
              Inicio del archivo
            </span>
          )}
          {next ? (
            <Link href={`/capitulos/${next.number}`} className="next">
              <small>Registro siguiente →</small>
              <span>{next.title}</span>
            </Link>
          ) : (
            <span className="av2-chapter-detail-neighbor-empty">
              Fin del archivo
            </span>
          )}
        </nav>
      </AtlasNarrativeFrame>

      <AtlasNarrativeFrame
        variant="primary"
        className="av2-chapter-detail-reader"
      >
        <AtlasEntityReader sections={sections} label="Crónica completa" />
      </AtlasNarrativeFrame>
    </div>
  );
}
