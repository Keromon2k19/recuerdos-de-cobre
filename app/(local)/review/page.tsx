"use client";

// app/review/page.tsx — Pantalla de revisión post-extracción
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReviewCard, { type ReviewItemStatus } from "@/components/ReviewCard";
import EmptyState from "@/components/EmptyState";
import { commitEpisodeAction } from "@/app/actions/commit";
import type { ExtractionResult } from "@/lib/types";

type CategoryConfig = {
  key: keyof ExtractionResult;
  label: string;
  hasAlias?: boolean;
};

const CATEGORIES: CategoryConfig[] = [
  { key: "personajes", label: "Personajes", hasAlias: true },
  { key: "lugares", label: "Lugares" },
  { key: "eventos", label: "Eventos" },
  { key: "objetos", label: "Objetos" },
  { key: "facciones", label: "Facciones" },
  { key: "worldbuilding", label: "Worldbuilding" },
  { key: "relaciones", label: "Relaciones" },
  { key: "misterios", label: "Misterios" },
  { key: "quotes", label: "Quotes" },
  { key: "decisiones", label: "Decisiones" },
];

type ReviewItem = {
  id: string;
  category: string;
  nombre: string;
  descripcion: string;
  alias?: string[];
  status: ReviewItemStatus;
};

type ExtractionSession = {
  numero: number;
  titulo: string;
  fecha: string;
  resumen: string;
  data: ExtractionResult;
};

function extractionToReviewItems(data: ExtractionResult): ReviewItem[] {
  const items: ReviewItem[] = [];

  for (const p of data.personajes) {
    items.push({
      id: `personaje-${p.nombre}`,
      category: "personajes",
      nombre: p.nombre,
      descripcion: p.descripcion,
      alias: p.alias ?? [],
      status: "accepted",
    });
  }

  for (const l of data.lugares) {
    items.push({
      id: `lugar-${l.nombre}`,
      category: "lugares",
      nombre: l.nombre,
      descripcion: l.descripcion,
      status: "accepted",
    });
  }

  for (const e of data.eventos) {
    items.push({
      id: `evento-${e.nombre}`,
      category: "eventos",
      nombre: e.nombre,
      descripcion: e.descripcion,
      status: "accepted",
    });
  }

  for (const o of data.objetos) {
    items.push({
      id: `objeto-${o.nombre}`,
      category: "objetos",
      nombre: o.nombre,
      descripcion: o.descripcion,
      status: "accepted",
    });
  }

  for (const f of data.facciones) {
    items.push({
      id: `faccion-${f.nombre}`,
      category: "facciones",
      nombre: f.nombre,
      descripcion: f.descripcion,
      status: "accepted",
    });
  }

  for (const w of data.worldbuilding) {
    items.push({
      id: `worldbuilding-${w.tema}`,
      category: "worldbuilding",
      nombre: w.tema,
      descripcion: w.descripcion,
      status: "accepted",
    });
  }

  for (const r of data.relaciones) {
    items.push({
      id: `relacion-${r.de}-${r.a}`,
      category: "relaciones",
      nombre: `${r.de} ↔ ${r.a}`,
      descripcion: r.tipo,
      status: "accepted",
    });
  }

  for (const m of data.misterios) {
    items.push({
      id: `misterio-${m.substring(0, 30)}`,
      category: "misterios",
      nombre: m.length > 60 ? m.substring(0, 60) + "..." : m,
      descripcion: m,
      status: "accepted",
    });
  }

  for (const q of data.quotes) {
    items.push({
      id: `quote-${q.texto.substring(0, 30)}`,
      category: "quotes",
      nombre: q.autor ? `${q.autor}` : "Anónimo",
      descripcion: q.texto,
      status: "accepted",
    });
  }

  for (const d of data.decisiones) {
    items.push({
      id: `decision-${d.descripcion.substring(0, 30)}`,
      category: "decisiones",
      nombre: d.descripcion.length > 60 ? d.descripcion.substring(0, 60) + "..." : d.descripcion,
      descripcion: d.descripcion,
      status: "accepted",
    });
  }

  return items;
}

/**
 * Reconstruye el ExtractionResult a partir de los review items editados/filtrados.
 */
function reviewItemsToExtraction(
  items: ReviewItem[],
  originalData: ExtractionResult
): ExtractionResult {
  const accepted = items.filter((i) => i.status !== "discarded");

  return {
    personajes: accepted
      .filter((i) => i.category === "personajes")
      .map((i) => ({ nombre: i.nombre, descripcion: i.descripcion, alias: i.alias })),
    lugares: accepted
      .filter((i) => i.category === "lugares")
      .map((i) => ({ nombre: i.nombre, descripcion: i.descripcion })),
    eventos: accepted
      .filter((i) => i.category === "eventos")
      .map((i) => ({ nombre: i.nombre, descripcion: i.descripcion })),
    objetos: accepted
      .filter((i) => i.category === "objetos")
      .map((i) => ({ nombre: i.nombre, descripcion: i.descripcion })),
    facciones: accepted
      .filter((i) => i.category === "facciones")
      .map((i) => ({ nombre: i.nombre, descripcion: i.descripcion })),
    worldbuilding: accepted
      .filter((i) => i.category === "worldbuilding")
      .map((i) => ({ tema: i.nombre, descripcion: i.descripcion })),
    relaciones: originalData.relaciones.filter((r) =>
      accepted.some(
        (i) => i.category === "relaciones" && i.id === `relacion-${r.de}-${r.a}`
      )
    ),
    misterios: accepted
      .filter((i) => i.category === "misterios")
      .map((i) => i.descripcion),
    quotes: accepted
      .filter((i) => i.category === "quotes")
      .map((i) => ({
        texto: i.descripcion,
        autor: i.nombre !== "Anónimo" ? i.nombre : undefined,
      })),
    decisiones: accepted
      .filter((i) => i.category === "decisiones")
      .map((i) => ({
        descripcion: i.descripcion,
        protagonistas: originalData.decisiones.find(
          (d) => d.descripcion === i.descripcion
        )?.protagonistas ?? [],
      })),
  };
}

export default function ReviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<ExtractionSession | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("mysha-extraction");
    if (!raw) {
      router.push("/");
      return;
    }
    try {
      const parsed: ExtractionSession = JSON.parse(raw);
      setSession(parsed);
      setItems(extractionToReviewItems(parsed.data));
    } catch {
      router.push("/");
    }
  }, [router]);

  const handleUpdate = useCallback(
    (id: string, data: { nombre: string; descripcion: string; alias?: string[] }) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...data, status: "edited" as const }
            : item
        )
      );
    },
    []
  );

  const handleDiscard = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "discarded" as const } : item
      )
    );
  }, []);

  const handleRestore = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "accepted" as const } : item
      )
    );
  }, []);

  async function handleCommit() {
    if (!session) return;
    setCommitting(true);
    setError(null);

    try {
      const revisedData = reviewItemsToExtraction(items, session.data);
      const result = await commitEpisodeAction(
        session.numero,
        session.titulo,
        session.resumen,
        revisedData,
        session.fecha || undefined
      );

      if (result.success) {
        // Limpiar sesión
        sessionStorage.removeItem("mysha-extraction");
        localStorage.removeItem("mysha-draft-resumen");
        router.push(`/episodios/${session.numero}`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setCommitting(false);
    }
  }

  if (!session) {
    return (
      <EmptyState message="Buscando la extraccion en curso. Si llegaste aca sin pasar por la carga, vas a volver a la pantalla principal." />
    );
  }

  const acceptedCount = items.filter((i) => i.status !== "discarded").length;
  const discardedCount = items.filter((i) => i.status === "discarded").length;

  // Agrupar items por categoría
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.key),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Revisión</div>
        <h1>Ep. {session.numero}{session.titulo ? ` · ${session.titulo}` : ""}</h1>
        <p>
          Revisá y editá el lore extraído antes de guardarlo en el vault.
        </p>
      </div>

      {grouped.map((group, gi) => (
        <div
          key={group.key}
          className="review-section rdc-rise"
          style={{ ["--rdc-rise-i" as string]: gi }}
        >
          <div className="review-section-header">
            <h2>{group.label}</h2>
            <span className="review-section-count">
              {group.items.filter((i) => i.status !== "discarded").length}/
              {group.items.length}
            </span>
          </div>
          <div className="review-cards">
            {group.items.map((item) => (
              <ReviewCard
                key={item.id}
                id={item.id}
                category={group.label}
                nombre={item.nombre}
                descripcion={item.descripcion}
                alias={group.hasAlias ? item.alias : undefined}
                status={item.status}
                onUpdate={handleUpdate}
                onDiscard={handleDiscard}
                onRestore={handleRestore}
              />
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div className="error-box" role="alert">
          <p className="error-title">Error al guardar</p>
          <pre className="error-detail">{error}</pre>
        </div>
      )}

      <div className="review-actions-bar">
        <div className="review-stats">
          {acceptedCount} aceptados
          {discardedCount > 0 && ` · ${discardedCount} descartados`}
        </div>
        <div className="review-actions-buttons">
          <button onClick={() => router.push("/")} className="btn-secondary">
            Volver y reextraer
          </button>
          <button
            onClick={handleCommit}
            disabled={committing || acceptedCount === 0}
            className="btn-primary"
          >
            {committing ? (
              <span className="btn-loading">
                <span className="spinner" /> Guardando...
              </span>
            ) : (
              `Confirmar y guardar (${acceptedCount})`
            )}
          </button>
        </div>
      </div>
    </>
  );
}
