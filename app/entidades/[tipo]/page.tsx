// app/entidades/[tipo]/page.tsx — Lista de entidades por tipo
import Link from "next/link";
import { listByType } from "@/lib/vault";
import { ENTITY_TYPES, type EntityType, ENTITY_FOLDERS } from "@/lib/types";
import { notFound } from "next/navigation";

const TYPE_LABELS: Record<EntityType, { emoji: string; singular: string; plural: string }> = {
  personaje: { emoji: "🧙", singular: "Personaje", plural: "Personajes" },
  lugar: { emoji: "🗺️", singular: "Lugar", plural: "Lugares" },
  evento: { emoji: "⚔️", singular: "Evento", plural: "Eventos" },
  objeto: { emoji: "💎", singular: "Objeto", plural: "Objetos" },
  faccion: { emoji: "🏴", singular: "Facción", plural: "Facciones" },
  worldbuilding: { emoji: "🌍", singular: "Worldbuilding", plural: "Worldbuilding" },
  misterio: { emoji: "❓", singular: "Misterio", plural: "Misterios" },
  quote: { emoji: "💬", singular: "Quote", plural: "Quotes" },
  decision: { emoji: "⚖️", singular: "Decisión", plural: "Decisiones" },
};

type Props = {
  params: Promise<{ tipo: string }>;
};

export default async function EntidadesListPage({ params }: Props) {
  const { tipo } = await params;

  if (!ENTITY_TYPES.includes(tipo as EntityType)) {
    notFound();
  }

  const entityType = tipo as EntityType;
  const label = TYPE_LABELS[entityType];

  const vaultPath = process.env.VAULT_PATH?.trim();
  if (!vaultPath) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚠️</span>
        <p>VAULT_PATH no configurado.</p>
      </div>
    );
  }

  const entities = await listByType(vaultPath, entityType);

  return (
    <>
      <div className="page-header">
        <h1>
          {label.emoji} {label.plural}
        </h1>
        <p>
          {entities.length > 0
            ? `${entities.length} ${entities.length === 1 ? label.singular.toLowerCase() : label.plural.toLowerCase()} en el grimorio`
            : `No hay ${label.plural.toLowerCase()} registrados todavía.`}
        </p>
      </div>

      {entities.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">{label.emoji}</span>
          <p>Cargá un episodio para que aparezcan acá.</p>
          <Link href="/" className="btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>
            ⛧ Cargar Episodio
          </Link>
        </div>
      ) : (
        <div className="entity-grid">
          {entities.map((entity) => (
            <Link
              key={entity.slug}
              href={`/entidades/${tipo}/${entity.slug}`}
              className="entity-card"
            >
              <div className="entity-card-name">
                {label.emoji} {entity.nombre}
              </div>
              <div className="entity-card-meta">
                {entity.apariciones.length} episodio
                {entity.apariciones.length !== 1 ? "s" : ""}
                {entity.apariciones.length > 0 &&
                  ` (${entity.apariciones.join(", ")})`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
