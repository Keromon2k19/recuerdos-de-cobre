"use client";

import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { AtlasEntityDetail } from "@/lib/atlas-content";
import AtlasEntityReader, {
  type AtlasEntityReaderSection,
} from "./AtlasEntityReader";
import AtlasNarrativeFrame from "./AtlasNarrativeFrame";
import AtlasSectionHero from "./AtlasSectionHero";
import type { GraphNode, GraphLink } from "./AtlasRelationsGraph";

const AtlasRelationsGraph = dynamic(() => import("./AtlasRelationsGraph"), {
  ssr: false,
});

export type AtlasEntityDetailVariant =
  | "character"
  | "faction"
  | "relic"
  | "mystery"
  | "world";

type Props = {
  detail: AtlasEntityDetail;
  sections: AtlasEntityReaderSection[];
  variant: AtlasEntityDetailVariant;
  backHref: string;
  backLabel: string;
  relationsMap?: Record<string, string>;
  graphNodes?: GraphNode[];
  graphLinks?: GraphLink[];
};

export default function AtlasEntityDetail({
  detail,
  sections,
  variant,
  backHref,
  backLabel,
  relationsMap,
  graphNodes = [],
  graphLinks = [],
}: Props) {
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");

  // Agrupar relaciones por nombre de entidad destino
  const groupedMap = new Map<string, Array<{ detail: string; episode?: number }>>();
  for (const rel of detail.relations) {
    const name = rel.name;
    if (!groupedMap.has(name)) {
      groupedMap.set(name, []);
    }
    groupedMap.get(name)!.push({ detail: rel.detail, episode: rel.episode });
  }

  const groupedRelations = Array.from(groupedMap.entries()).map(([name, items]) => {
    // Las relaciones de frontmatter vienen en orden cronológico natural.
    // El último estado de la relación es el último elemento del array.
    const latestItem = items[items.length - 1];
    // Reversamos para mostrar el historial del más nuevo al más viejo
    const history = [...items].reverse();
    return {
      name,
      latestDetail: latestItem.detail,
      latestEpisode: latestItem.episode,
      history,
    };
  });

  // Ordenar por episodio más reciente (los vínculos más activos primero), con fallback alfabético
  groupedRelations.sort((a, b) => {
    const epA = a.latestEpisode ?? 0;
    const epB = b.latestEpisode ?? 0;
    if (epA !== epB) return epB - epA;
    return a.name.localeCompare(b.name);
  });

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
          showCaption={false}
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
        title={
          <div className="av2-relations-section-header">
            <span>Relaciones registradas</span>
            <div className="av2-relations-toggle">
              <button
                type="button"
                className="av2-relations-toggle-btn"
                data-active={viewMode === "list" ? "true" : undefined}
                onClick={() => setViewMode("list")}
              >
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                Lista
              </button>
              <button
                type="button"
                className="av2-relations-toggle-btn"
                data-active={viewMode === "graph" ? "true" : undefined}
                onClick={() => setViewMode("graph")}
              >
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Red
              </button>
            </div>
          </div>
        }
        variant="quiet"
        className="av2-entity-detail-relations"
      >
        {viewMode === "list" ? (
          groupedRelations.length > 0 ? (
            <ul className="av2-relations-list">
              {groupedRelations.map((relation, index) => {
                const href = relationsMap?.[relation.name];
                const nameElement = href ? (
                  <Link href={href} className="av2-relation-link">
                    {relation.name}
                  </Link>
                ) : (
                  <strong>{relation.name}</strong>
                );

                const hasHistory = relation.history.length > 1;

                if (hasHistory) {
                  return (
                    <li key={`${relation.name}-${index}`} className="av2-relation-group">
                      <details>
                        <summary className="av2-relation-summary">
                          <div className="av2-relation-header">
                            {nameElement}
                            <span className="av2-relation-badge">
                              {relation.history.length} acts.
                            </span>
                          </div>
                          <div className="av2-relation-latest">
                            <span>{relation.latestDetail}</span>
                            {relation.latestEpisode && (
                              <small>Ep. {relation.latestEpisode}</small>
                            )}
                          </div>
                        </summary>
                        <ul className="av2-relation-history">
                          {relation.history.map((hist, hIdx) => (
                            <li key={hIdx} className="av2-relation-history-item">
                              <span>{hist.detail}</span>
                              {hist.episode && <small>Ep. {hist.episode}</small>}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  );
                }

                // Elemento simple sin historial
                return (
                  <li key={`${relation.name}-${index}`} className="av2-relation-group av2-relation-plain">
                    <div className="av2-relation-header">{nameElement}</div>
                    <div className="av2-relation-latest">
                      <span>{relation.latestDetail}</span>
                      {relation.latestEpisode && (
                        <small>Ep. {relation.latestEpisode}</small>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="av2-entity-detail-empty">
              No hay relaciones clasificadas para este registro.
            </p>
          )
        ) : (
          <AtlasRelationsGraph
            nodes={graphNodes}
            links={graphLinks}
            centerId={detail.slug}
          />
        )}
      </AtlasNarrativeFrame>
    </div>
  );
}
