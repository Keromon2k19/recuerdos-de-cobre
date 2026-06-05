import Link from "next/link";
import type { AtlasV2EntityDetail } from "@/lib/atlas-v2-content";
import AtlasEntityReader, {
  type AtlasEntityReaderSection,
} from "./AtlasEntityReader";
import AtlasNarrativeFrame from "./AtlasNarrativeFrame";
import AtlasSectionHero from "./AtlasSectionHero";

export type AtlasEntityDetailVariant =
  | "character"
  | "faction"
  | "relic"
  | "mystery"
  | "world";

type Props = {
  detail: AtlasV2EntityDetail;
  sections: AtlasEntityReaderSection[];
  variant: AtlasEntityDetailVariant;
  backHref: string;
  backLabel: string;
};

export default function AtlasEntityDetail({
  detail,
  sections,
  variant,
  backHref,
  backLabel,
}: Props) {
  return (
    <div className="av2-entity-detail" data-variant={variant}>
      <AtlasNarrativeFrame variant="secondary" className="av2-entity-detail-stage">
        <Link href={backHref} className="av2-entity-detail-back">
          <span aria-hidden="true">←</span>
          {backLabel}
        </Link>

        <AtlasSectionHero
          variant={detail.imageSrc ? "image" : "material"}
          imageSrc={detail.imageSrc}
          glyph={detail.name.charAt(0)}
          alt={detail.name}
          title={detail.name}
          eyebrow={detail.kind}
          meta={
            detail.appearances.length > 0
              ? `${detail.appearances.length} apariciones`
              : undefined
          }
        />

        <div className="av2-entity-detail-identity">
          <p className="av2-entity-detail-kind">{detail.kind}</p>
          <h2>{detail.name}</h2>
          {detail.aliases.length > 0 && (
            <p className="av2-entity-detail-aliases">{detail.aliases.join(" · ")}</p>
          )}
          <p className="av2-entity-detail-description">{detail.description}</p>
        </div>

        <dl className="av2-entity-detail-meta">
          {detail.meta.map((row) => (
            <div key={`${row.label}-${row.value}`}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
          <div>
            <dt>Apariciones</dt>
            <dd>{detail.appearances.length}</dd>
          </div>
        </dl>
      </AtlasNarrativeFrame>

      <AtlasNarrativeFrame variant="primary" className="av2-entity-detail-reader">
        <AtlasEntityReader sections={sections} />
      </AtlasNarrativeFrame>

      <AtlasNarrativeFrame
        eyebrow="Vinculos"
        title="Relaciones registradas"
        variant="quiet"
        className="av2-entity-detail-relations"
      >
        {detail.relations.length > 0 ? (
          <ul>
            {detail.relations.map((relation, index) => (
              <li key={`${relation.name}-${relation.detail}-${index}`}>
                <strong>{relation.name}</strong>
                <span>{relation.detail}</span>
                {relation.episode && <small>Ep. {relation.episode}</small>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="av2-entity-detail-empty">
            No hay relaciones clasificadas para este registro.
          </p>
        )}
      </AtlasNarrativeFrame>
    </div>
  );
}
