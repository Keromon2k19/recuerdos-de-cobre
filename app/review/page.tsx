"use client";

// app/review/page.tsx — Pantalla de revisión post-extracción
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReviewCard, { type ReviewItemStatus } from "@/components/ReviewCard";
import { commitEpisodeAction } from "@/app/actions/commit";
import type { ExtractionResult } from "@/lib/types";

type CategoryConfig = {
  key: keyof ExtractionResult;
  label: string;
  icon: string;
  hasAlias?: boolean;
};

const CATEGORIES: CategoryConfig[] = [
  { key: "personajes", label: "Personajes", icon: "🧙", hasAlias: true },
  { key: "lugares", label: "Lugares", icon: "🗺️" },
  { key: "eventos", label: "Eventos", icon: "⚔️" },
  { key: "objetos", label: "Objetos", icon: "💎" },
  { key: "facciones", label: "Facciones", icon: "🏴" },
  { key: "worldbuilding", label: "Worldbuilding", icon: "🌍" },
  { key: "relaciones", label: "Relaciones", icon: "🔗" },
  { key: "misterios", label: "Misterios", icon: "❓" },
  { key: "quotes", label: "Quotes", icon: "💬" },
  { key: "decisiones", label: "Decisiones", icon: "⚖️" },
];

type ReviewItem = {
  id: string;
  category: string;
  categoryIcon: string;
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
      categoryIcon: "🧙",
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
      categoryIcon: "🗺️",
      nombre: l.nombre,
      descripcion: l.descripcion,
      status: "accepted",
    });
  }

  for (const e of data.eventos) {
    items.push({
      id: `evento-${e.nombre}`,
      category: "eventos",
      categoryIcon: "⚔️",
      nombre: e.nombre,
      descripcion: e.descripcion,
      status: "accepted",
    });
  }

  for (const o of data.objetos) {
    items.push({
      id: `objeto-${o.nombre}`,
      category: "objetos",
      categoryIcon: "💎",
      nombre: o.nombre,
      descripcion: o.descripcion,
      status: "accepted",
    });
  }

  for (const f of data.facciones) {
    items.push({
      id: `faccion-${f.nombre}`,
      category: "facciones",
      categoryIcon: "🏴",
      nombre: f.nombre,
      descripcion: f.descripcion,
      status: "accepted",
    });
  }

  for (const w of data.worldbuilding) {
    items.push({
      id: `worldbuilding-${w.tema}`,
      category: "worldbuilding",
      categoryIcon: "🌍",
      nombre: w.tema,
      descripcion: w.descripcion,
      status: "accepted",
    });
  }

  for (const r of data.relaciones) {
    items.push({
      id: `relacion-${r.de}-${r.a}`,
      category: "relaciones",
      categoryIcon: "🔗",
      nombre: `${r.de} ↔ ${r.a}`,
      descripcion: r.tipo,
      status: "accepted",
    });
  }

  for (const m of data.misterios) {
    items.push({
      id: `misterio-${m.substring(0, 30)}`,
      category: "misterios",
      categoryIcon: "❓",
      nombre: m.length > 60 ? m.substring(0, 60) + "..." : m,
      descripcion: m,
      status: "accepted",
    });
  }

  for (const q of data.quotes) {
    items.push({
      id: `quote-${q.texto.substring(0, 30)}`,
      category: "quotes",
      categoryIcon: "💬",
      nombre: q.autor ? `${q.autor}` : "Anónimo",
      descripcion: q.texto,
      status: "accepted",
    });
  }

  for (const d of data.decisiones) {
    items.push({
      id: `decision-${d.descripcion.substring(0, 30)}`,
      category: "decisiones",
      categoryIcon: "⚖️",
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
      <div className="empty-state">
        <span className="empty-state-icon">⏳</span>
        <p>Cargando datos de extracción...</p>
      </div>
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
        <h1>📋 Revisión — Ep. {session.numero}</h1>
        <p>
          {session.titulo && `"${session.titulo}" — `}
          Revisá y editá el lore extraído antes de guardarlo en el vault.
        </p>
      </div>

      {grouped.map((group) => (
        <div key={group.key} className="review-section">
          <div className="review-section-header">
            <span>{group.icon}</span>
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
                categoryIcon={group.icon}
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
        <div className="error-box">
          <p className="error-title">⚠️ Error al guardar</p>
          <pre className="error-detail">{error}</pre>
        </div>
      )}

      <div className="review-actions-bar">
        <div className="review-stats">
          ✓ {acceptedCount} aceptados
          {discardedCount > 0 && ` · ✕ ${discardedCount} descartados`}
        </div>
        <div className="review-actions-buttons">
          <button onClick={() => router.push("/")} className="btn-secondary">
            ← Volver y reextraer
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
              `⛧ Confirmar y guardar (${acceptedCount})`
            )}
          </button>
        </div>
      </div>
    </>
  );
}
