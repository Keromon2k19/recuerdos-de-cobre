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
        <nav
          className="av2-chapter-detail-top-nav"
          aria-label="Navegación del registro"
        >
          {previous ? (
            <Link
              href={`/capitulos/${previous.number}`}
              className="nav-btn previous"
              title={previous.title}
            >
              ← Reg. {previous.number}
            </Link>
          ) : (
            <span className="nav-btn disabled">← Reg. --</span>
          )}

          <Link href="/capitulos" className="nav-btn back">
            Volver
          </Link>

          {next ? (
            <Link
              href={`/capitulos/${next.number}`}
              className="nav-btn next"
              title={next.title}
            >
              Reg. {next.number} →
            </Link>
          ) : (
            <span className="nav-btn disabled">Reg. -- →</span>
          )}
        </nav>

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
