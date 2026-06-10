"use client";

// components/atlas/AtlasMapViewer.tsx
// Visor de mapa con pins HTML overlay. Soporta:
// - Zoom: + / − / botón cíclico con label dinámico / wheel del mouse.
// - Pan por drag cuando zoom > 1.
// - Drag de pins directamente para reposicionarlos (threshold 5px).
// - Botón X al hover de cada pin para eliminarlo (override local).
// - Panel flotante con cambios pendientes → Guardar (server action) / Descartar.
// - Click en stage vacío deselecciona el pin activo.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMapLocation, saveMapOverrides, type SaveMapResult } from "@/app/actions/map";
import AddLocationPanel from "@/components/atlas/AddLocationPanel";
import type { V2Region } from "@/data/atlas/locations";

const MAP_SRC = "/mapa/eyira.webp";
const DRAG_THRESHOLD = 5; // px
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.5;
const ZOOM_STEP_BTN = 0.2;
const ZOOM_STEP_WHEEL = 0.15;
const ZOOM_PRESETS = [1, 1.5, 2, 2.5];

type Props = {
  regions: V2Region[];
  additionSlugs?: string[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  onClearSelection?: () => void;
  characterJourneys?: Array<{ slug: string; nombre: string; journey: string[] }>;
};

type PinOverride = { x: number; y: number };
type OverrideMap = Record<string, PinOverride | "deleted">;

export default function AtlasMapViewer({
  regions,
  additionSlugs = [],
  selectedSlug,
  onSelect,
  onClearSelection,
  characterJourneys = [],
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [savedFlag, setSavedFlag] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [draftPoint, setDraftPoint] = useState<{ x: number; y: number } | null>(null);
  const [createdFlag, setCreatedFlag] = useState(false);
  const [activeJourneyChar, setActiveJourneyChar] = useState<string>("");
  const router = useRouter();

  const stageRef = useRef<HTMLDivElement | null>(null);

  // Drag stage (pan)
  const panDragRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
  } | null>(null);

  // Drag pin (move)
  const pinDragRef = useRef<{
    slug: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  // Flag temporal: marca que el último gesto fue un drag (para suprimir click)
  const lastDragMovedRef = useRef<boolean>(false);

  const visibleRegions = regions.filter((r) => !r.hideFromMap);
  const additionSlugSet = new Set(additionSlugs);

  // ── Zoom helpers ─────────────────────────────────────────────────────
  function clampZoom(z: number) { return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)); }
  function setZoomLevel(next: number) {
    const clamped = clampZoom(next);
    setZoom(clamped);
    if (clamped <= 1) setPan({ x: 0, y: 0 });
  }
  function zoomIn()  { setZoomLevel(zoom + ZOOM_STEP_BTN); }
  function zoomOut() { setZoomLevel(zoom - ZOOM_STEP_BTN); }
  function zoomCycle() {
    // Encuentra el siguiente preset mayor al zoom actual. Si no hay, vuelve al primero.
    const next = ZOOM_PRESETS.find((p) => p > zoom + 0.001) ?? ZOOM_PRESETS[0];
    setZoomLevel(next);
  }

  // ── Wheel zoom (native listener para preventDefault) ─────────────────
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    function handler(e: WheelEvent) {
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      setZoom((z) => {
        const next = clampZoom(z + dir * ZOOM_STEP_WHEEL);
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ── Pan (drag stage) ─────────────────────────────────────────────────
  function onStagePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Si hay un drag de pin ya activo, no hacer pan
    if (pinDragRef.current) return;
    if (zoom <= 1) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    panDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      moved: false,
    };
    setIsPanning(true);
  }
  function onStagePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    // Drag de pin tiene prioridad
    if (pinDragRef.current) {
      updatePinDrag(e.clientX, e.clientY);
      return;
    }
    if (!panDragRef.current) return;
    const dx = e.clientX - panDragRef.current.startX;
    const dy = e.clientY - panDragRef.current.startY;
    if (!panDragRef.current.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      panDragRef.current.moved = true;
    }
    setPan({
      x: panDragRef.current.startPanX + dx,
      y: panDragRef.current.startPanY + dy,
    });
  }
  function onStagePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    // Termina drag de pin si está activo (sin slug = no se ejecuta select)
    if (pinDragRef.current) {
      finishPinDrag(e.clientX, e.clientY);
      return;
    }
    setIsPanning(false);
    // Limpieza inmediata del panDragRef. El guard `moved` para suprimir
    // el click vacío usa el ref ANTES de que se ejecute onStageClick.
    // En React, el click event handler corre después del pointerup en el mismo
    // tick, así que el moved=true sigue presente en ese momento si lo
    // chequeamos ANTES de limpiar. La forma correcta es chequear moved en el
    // click handler usando un flag separado.
    const moved = panDragRef.current?.moved ?? false;
    panDragRef.current = null;
    if (moved) {
      // Suprimir el siguiente click vacío usando un flag temporal
      lastDragMovedRef.current = true;
      setTimeout(() => { lastDragMovedRef.current = false; }, 50);
    }
  }

  // ── Click stage: agregar nuevo (si addMode) o deseleccionar (default) ─
  function onStageClick(e: React.MouseEvent<HTMLDivElement>) {
    // Suprimir click si el último gesto fue un drag (pan o pin)
    if (lastDragMovedRef.current) return;
    if (pinDragRef.current?.moved) return;
    if ((e.target as HTMLElement).closest(".av2-add-root, .av2-map-pin-wrap, .av2-map-zoom, .av2-map-edit-panel, .av2-map-journey-select-container")) return;

    if (addMode) {
      // Capturar coords como % del image visible. Usamos offsetWidth*zoom (state)
      // en lugar de rect.width para evitar valores mid-transition. El rect.left
      // sí lo necesitamos para conocer dónde arranca el image en pantalla.
      const img = stageRef.current?.querySelector(".av2-map-img") as HTMLImageElement | null;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const displayW = img.offsetWidth * zoom;
      const displayH = img.offsetHeight * zoom;
      if (localX < 0 || localY < 0 || localX > displayW || localY > displayH) return;
      const x = Number(((localX / displayW) * 100).toFixed(2));
      const y = Number(((localY / displayH) * 100).toFixed(2));
      setDraftPoint({ x, y });
      return;
    }

    if (onClearSelection) onClearSelection();
  }

  function onStageDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function exitAddMode() {
    setAddMode(false);
    setDraftPoint(null);
  }
  function onLocationCreated(_slug: string) {
    setDraftPoint(null);
    setAddMode(false);
    setCreatedFlag(true);
    router.refresh();
    setTimeout(() => setCreatedFlag(false), 1800);
  }

  // ── Drag pin (move) ──────────────────────────────────────────────────
  function getCurrentPinCoords(slug: string, baseX: number, baseY: number): { x: number; y: number } {
    const ov = overrides[slug];
    if (ov && ov !== "deleted") return ov;
    return { x: baseX, y: baseY };
  }

  function onPinPointerDown(slug: string, baseX: number, baseY: number, e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.stopPropagation();
    const current = getCurrentPinCoords(slug, baseX, baseY);
    pinDragRef.current = {
      slug,
      startX: e.clientX,
      startY: e.clientY,
      originX: current.x,
      originY: current.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function updatePinDrag(clientX: number, clientY: number) {
    const d = pinDragRef.current;
    if (!d) return;
    const dx = clientX - d.startX;
    const dy = clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      d.moved = true;
    }
    if (!d.moved) return;
    const img = stageRef.current?.querySelector(".av2-map-img") as HTMLImageElement | null;
    if (!img) return;
    // Importante: NO usar getBoundingClientRect porque puede tomar valores
    // mid-transition (cuando hay animación de zoom en curso). Usamos el tamaño
    // natural (offsetWidth) multiplicado por el zoom del STATE, que es estable.
    const displayW = img.offsetWidth * zoom;
    const displayH = img.offsetHeight * zoom;
    const deltaXpct = (dx / displayW) * 100;
    const deltaYpct = (dy / displayH) * 100;
    const newX = Math.max(0, Math.min(100, d.originX + deltaXpct));
    const newY = Math.max(0, Math.min(100, d.originY + deltaYpct));
    setOverrides((o) => ({ ...o, [d.slug]: { x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) } }));
  }

  function onPinPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (pinDragRef.current) updatePinDrag(e.clientX, e.clientY);
  }

  function onPinPointerUp(slug: string, e: React.PointerEvent<HTMLButtonElement>) {
    if (!pinDragRef.current) return;
    // Stop propagation: sin esto, onStagePointerUp también dispara y llama
    // finishPinDrag(undefined, undefined) — que falla el match slug === dragSlug
    // y nunca ejecuta onSelect en clicks sin drag.
    e.stopPropagation();
    finishPinDrag(e.clientX, e.clientY, slug);
  }

  function finishPinDrag(_clientX?: number, _clientY?: number, slug?: string) {
    if (!pinDragRef.current) return;
    const moved = pinDragRef.current.moved;
    const dragSlug = pinDragRef.current.slug;
    pinDragRef.current = null;
    if (!moved && slug === dragSlug) {
      // Era un click: seleccionar
      onSelect(dragSlug);
    }
  }

  // ── Eliminar pin ─────────────────────────────────────────────────────
  function onPinDelete(slug: string, e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    setOverrides((o) => ({ ...o, [slug]: "deleted" }));
    if (selectedSlug === slug && onClearSelection) onClearSelection();
  }

  // ── Cambios pendientes: guardar (server) / descartar ─────────────────
  const changes = Object.entries(overrides).filter(([, v]) => v !== undefined);
  const hasChanges = changes.length > 0;
  const removedChanges = changes.filter(([, v]) => v === "deleted");
  const removedCount = removedChanges.length;
  const deletedAdditionCount = removedChanges.filter(([slug]) => additionSlugSet.has(slug)).length;
  const movedCount = changes.length - removedCount;
  const pendingLabel = removedCount > 0 && movedCount === 0
    ? deletedAdditionCount > 0
      ? `lugar${deletedAdditionCount !== 1 ? "es" : ""} eliminado${deletedAdditionCount !== 1 ? "s" : ""} pendiente${deletedAdditionCount !== 1 ? "s" : ""}`
      : `marca${removedCount !== 1 ? "s" : ""} quitada${removedCount !== 1 ? "s" : ""} pendiente${removedCount !== 1 ? "s" : ""}`
    : removedCount > 0
      ? `cambio${changes.length !== 1 ? "s" : ""} pendiente${changes.length !== 1 ? "s" : ""} · ${removedCount} quitar`
      : `cambio${changes.length !== 1 ? "s" : ""} pendiente${changes.length !== 1 ? "s" : ""}`;

  async function saveChanges() {
    if (isSaving) return;
    setSaveError(null);
    // Convertir overrides locales → patch para la server action
    const patch: Record<string, { pin?: { x: number; y: number }; hideFromMap?: boolean }> = {};
    for (const [slug, v] of changes) {
      if (v === "deleted") {
        if (!additionSlugSet.has(slug)) patch[slug] = { hideFromMap: true };
      } else if (v) {
        patch[slug] = { pin: v };
      }
    }

    setIsSaving(true);
    try {
      for (const [slug, v] of changes) {
        if (v === "deleted" && additionSlugSet.has(slug)) {
          const deleteResult = await deleteMapLocation(slug);
          if (!deleteResult.ok) {
            setSaveError(deleteResult.error);
            return;
          }
        }
      }

      const result: SaveMapResult = Object.keys(patch).length > 0
        ? await saveMapOverrides(patch)
        : { ok: true, count: 0 };
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }

      setOverrides({});
      setSavedFlag(true);
      router.refresh();
      setTimeout(() => setSavedFlag(false), 1800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron guardar los cambios";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }
  function discardChanges() {
    setOverrides({});
    setSavedFlag(false);
    setSaveError(null);
  }

  // ── Render ───────────────────────────────────────────────────────────
  const cursor = addMode ? "crosshair" : isPanning ? "grabbing" : zoom > 1 ? "grab" : "default";
  const zoomLabel = zoom % 1 === 0 ? `${zoom}x` : `${zoom.toFixed(1)}x`;

  // Calcular camino del viaje activo
  const activeJourneyObj = characterJourneys.find((j) => j.slug === activeJourneyChar);
  const currentJourney = activeJourneyObj ? activeJourneyObj.journey : [];
  const lastJourneySlug = currentJourney[currentJourney.length - 1];

  const pathsList: React.ReactNode[] = [];
  for (let i = 0; i < currentJourney.length - 1; i++) {
    const r1 = visibleRegions.find((r) => r.slug === currentJourney[i]);
    const r2 = visibleRegions.find((r) => r.slug === currentJourney[i + 1]);
    if (r1 && r2) {
      const c1 = getCurrentPinCoords(r1.slug, r1.pin.x, r1.pin.y);
      const c2 = getCurrentPinCoords(r2.slug, r2.pin.x, r2.pin.y);
      
      const midX = (c1.x + c2.x) / 2;
      const midY = (c1.y + c2.y) / 2 - Math.min(6, Math.abs(c1.x - c2.x) * 0.12);

      pathsList.push(
        <path
          key={`journey-line-${i}`}
          d={`M ${c1.x} ${c1.y} Q ${midX} ${midY} ${c2.x} ${c2.y}`}
          fill="none"
          stroke="var(--av2-copper)"
          strokeWidth="0.4"
          strokeLinecap="round"
          filter="drop-shadow(0 0 2px var(--av2-copper-dim))"
          style={{
            strokeDasharray: "2.5 1.5",
            animation: "av2-journey-flow 25s linear infinite",
          }}
        />
      );
    }
  }

  return (
    <section className="av2-map-viewer" aria-label="Mapa del mundo">
      <div
        ref={stageRef}
        className="av2-map-stage"
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={onStagePointerUp}
        onPointerLeave={onStagePointerUp}
        onClick={onStageClick}
        onDoubleClick={onStageDoubleClick}
        style={{ cursor, touchAction: zoom > 1 ? "none" : "auto" }}
      >
        {/* Selector de Trazado de Viaje */}
        {characterJourneys.length > 0 && (
          <div className="av2-map-journey-select-container">
            <span className="av2-map-journey-label">Trazado de viaje</span>
            <select
              className="av2-map-journey-select"
              value={activeJourneyChar}
              onChange={(e) => setActiveJourneyChar(e.target.value)}
              aria-label="Seleccionar personaje para trazar su viaje"
            >
              <option value="">-- Sin trazado --</option>
              {characterJourneys.map((j) => (
                <option key={j.slug} value={j.slug}>
                  {j.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          className="av2-map-canvas"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transition: isPanning ? "none" : "transform 0.3s var(--av2-ease)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MAP_SRC}
            alt="Mapa de Eyira"
            className="av2-map-img"
            draggable={false}
          />

          {/* SVG Overlay para Hilos de Viaje */}
          {activeJourneyChar !== "" && currentJourney.length > 0 && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              {pathsList}
            </svg>
          )}

          {draftPoint && (
            <span
              className="av2-map-draft"
              style={{ left: `${draftPoint.x}%`, top: `${draftPoint.y}%` }}
              aria-hidden="true"
            >
              <span className="av2-map-draft-dot" />
              <span className="av2-map-draft-label">
                x {draftPoint.x}% · y {draftPoint.y}%
              </span>
            </span>
          )}

          {visibleRegions.map((r) => {
            if (overrides[r.slug] === "deleted") return null;
            const coords = getCurrentPinCoords(r.slug, r.pin.x, r.pin.y);
            const edge = coords.x > 82 ? "right" : coords.x < 18 ? "left" : undefined;
            const moved = !!overrides[r.slug] && overrides[r.slug] !== "deleted";
            const isDraggingThis = pinDragRef.current?.slug === r.slug && pinDragRef.current?.moved;
            const isAddition = additionSlugSet.has(r.slug);
            
            const inJourney = currentJourney.includes(r.slug);
            const isDimmed = activeJourneyChar !== "" && !inJourney;
            const isLastOfJourney = activeJourneyChar !== "" && lastJourneySlug === r.slug;

            return (
              <span
                key={r.slug}
                className="av2-map-pin-wrap"
                data-selected={selectedSlug === r.slug ? "true" : undefined}
                data-moved={moved ? "true" : undefined}
                data-dimmed={isDimmed ? "true" : undefined}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              >
                <button
                  type="button"
                  className="av2-map-pin"
                  data-active={selectedSlug === r.slug ? "true" : undefined}
                  data-edge={edge}
                  data-tone={r.tone}
                  data-moved={moved ? "true" : undefined}
                  data-dragging={isDraggingThis ? "true" : undefined}
                  data-journey-active={isLastOfJourney ? "true" : undefined}
                  onPointerDown={(e) => onPinPointerDown(r.slug, r.pin.x, r.pin.y, e)}
                  onPointerMove={onPinPointerMove}
                  onPointerUp={(e) => onPinPointerUp(r.slug, e)}
                  aria-label={r.nombre}
                  title={r.nombre + " — arrastrá para mover"}
                >
                  <span className="av2-map-pin-dot" aria-hidden="true" />
                  <span className="av2-map-pin-label">{r.nombre}</span>
                </button>
                <button
                  type="button"
                  className="av2-map-pin-x"
                  onClick={(e) => onPinDelete(r.slug, e)}
                  aria-label={isAddition ? `Eliminar ${r.nombre}` : `Quitar marca de ${r.nombre}`}
                  title={isAddition ? `Eliminar ${r.nombre}` : `Quitar marca de ${r.nombre}`}
                >
                  <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>

        <div className="av2-map-zoom" aria-label="Controles del mapa">
          <button type="button" className="av2-map-zoom-btn" onClick={zoomIn} aria-label="Acercar">+</button>
          <button
            type="button"
            className="av2-map-zoom-btn av2-map-zoom-cycle"
            onClick={zoomCycle}
            aria-label={`Zoom ${zoomLabel}, ciclar nivel`}
            title={`Zoom ${zoomLabel} — click para ciclar 1x · 1.5x · 2x · 2.5x`}
          >
            {zoomLabel}
          </button>
          <button type="button" className="av2-map-zoom-btn" onClick={zoomOut} aria-label="Alejar">−</button>
          <button
            type="button"
            className="av2-map-zoom-btn av2-map-add-btn"
            data-active={addMode ? "true" : undefined}
            onClick={() => {
              if (addMode) exitAddMode();
              else { setAddMode(true); setDraftPoint(null); }
            }}
            aria-label={addMode ? "Cancelar agregar lugar" : "Agregar lugar nuevo"}
            title={addMode ? "Salir del modo agregar (Esc)" : "Agregar lugar nuevo"}
          >
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M8 2v12M2 8h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {addMode && !draftPoint && (
          <div className="av2-map-add-hint" role="status">
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M8 2v12M2 8h12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Click en el mapa para elegir la ubicación del lugar nuevo
          </div>
        )}

        {createdFlag && (
          <div className="av2-map-edit-panel" role="status">
            <p className="av2-map-edit-count">
              <span style={{ color: "var(--av2-gold)", letterSpacing: "0.16em" }}>Lugar creado</span>
            </p>
          </div>
        )}

        {draftPoint && (
          <AddLocationPanel
            point={draftPoint}
            onCancel={exitAddMode}
            onCreated={onLocationCreated}
          />
        )}

        {(hasChanges || savedFlag) && !addMode && !draftPoint && (
          <div className="av2-map-edit-panel" role="status">
            {hasChanges ? (
              <p className="av2-map-edit-count">
                <b>{changes.length}</b>
                <span>{pendingLabel}</span>
              </p>
            ) : (
              <p className="av2-map-edit-count">
                <span style={{ color: "var(--av2-gold)", letterSpacing: "0.16em" }}>Guardado</span>
              </p>
            )}
            {hasChanges && (
              <div className="av2-map-edit-actions">
                <button
                  type="button"
                  className="av2-map-edit-copy"
                  onClick={saveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando…" : "Guardar"}
                </button>
                <button
                  type="button"
                  className="av2-map-edit-discard"
                  onClick={discardChanges}
                  disabled={isSaving}
                >
                  Descartar
                </button>
              </div>
            )}
            {saveError && (
              <p className="av2-map-edit-error" role="alert">{saveError}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
