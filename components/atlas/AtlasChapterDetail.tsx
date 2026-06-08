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
        <Link href="/v2/capitulos" className="av2-entity-detail-back">
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
          <h2>{detail.title}</h2>
          <span>{detail.description}</span>
        </div>
      </AtlasNarrativeFrame>

      <AtlasNarrativeFrame
        variant="primary"
        className="av2-chapter-detail-reader"
      >
        <AtlasEntityReader sections={sections} label="Crónica completa" />
      </AtlasNarrativeFrame>

      <AtlasNarrativeFrame
        eyebrow="Señales narrativas"
        title="Índice del registro"
        variant="quiet"
        className="av2-chapter-detail-index"
      >
        <dl className="av2-chapter-detail-stats">
          {detail.stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <nav
          className="av2-chapter-detail-neighbors"
          aria-label="Navegación entre capítulos"
        >
          {previous ? (
            <Link href={`/v2/capitulos/${previous.number}`}>
              <small>Registro anterior</small>
              <span>{previous.title}</span>
            </Link>
          ) : (
            <span className="av2-chapter-detail-neighbor-empty">
              Inicio del archivo
            </span>
          )}
          {next ? (
            <Link href={`/v2/capitulos/${next.number}`}>
              <small>Registro siguiente</small>
              <span>{next.title}</span>
            </Link>
          ) : (
            <span className="av2-chapter-detail-neighbor-empty">
              Fin del archivo
            </span>
          )}
        </nav>
      </AtlasNarrativeFrame>
    </div>
  );
}
