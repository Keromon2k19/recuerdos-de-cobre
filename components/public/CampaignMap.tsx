"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { type MapMarker, type MarkerTone } from "@/lib/map-markers";

type FilterTone = "todos" | MarkerTone;
type VisitFilter = "todos" | "visitados" | "pendientes";

type DraftMarker = {
  name: string;
  region: string;
  note: string;
  href: string;
  tone: MarkerTone;
};

type CampaignMapProps = {
  markers: MapMarker[];
};

const STORAGE_KEY = "rdc-map-custom-markers";
const VISITED_KEY = "rdc-map-manual-visited";
const ZOOMS = [1, 1.35, 1.75, 2.2];

const DEFAULT_DRAFT: DraftMarker = {
  name: "",
  region: "",
  note: "",
  href: "",
  tone: "copper",
};

const FILTER_LABELS: Record<FilterTone, string> = {
  todos: "Todo",
  copper: "Cobre",
  petrol: "Mar",
  gold: "Desierto",
  moss: "Bosque",
  wine: "Conflicto",
};

const VISIT_LABELS: Record<VisitFilter, string> = {
  todos: "Todos",
  visitados: "Visitados",
  pendientes: "Pendientes",
};

function markerToCode(marker: MapMarker): string {
  const href = marker.href ? `\n  href: "${marker.href}",` : "";
  return `{
  id: "${marker.id}",
  name: "${marker.name}",
  region: "${marker.region}",
  x: ${marker.x},
  y: ${marker.y},
  tone: "${marker.tone}",${href}
  note: "${marker.note}",
}`;
}

function slugifyMarker(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function loadCustomMarkers(): MapMarker[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((marker) => typeof marker?.id === "string");
  } catch {
    return [];
  }
}

function loadVisitedOverrides(): Set<string> {
  try {
    const raw = window.localStorage.getItem(VISITED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((s): s is string => typeof s === "string"));
  } catch {
    return new Set();
  }
}

function vaultVisited(marker: MapMarker): boolean {
  return !marker.custom && (marker.apariciones?.length ?? 0) > 0;
}

function markerMeta(marker: MapMarker, manualVisited: boolean): string | null {
  if (marker.custom) return "Marcador local";
  const eps = marker.apariciones ?? [];
  if (eps.length > 0) {
    const last = Math.max(...eps);
    return `${eps.length} ep · últ. ${last}`;
  }
  if (manualVisited) return "Visitado · sin notas";
  return "No visitado aún";
}

export default function CampaignMap({ markers: baseMarkers }: CampaignMapProps) {
  const [activeId, setActiveId] = useState("");
  const [zoomIndex, setZoomIndex] = useState(0);
  const [filter, setFilter] = useState<FilterTone>("todos");
  const [visit, setVisit] = useState<VisitFilter>("todos");
  const [search, setSearch] = useState("");
  const [episodeMax, setEpisodeMax] = useState(0);
  const [calibrating, setCalibrating] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<DraftMarker>(DEFAULT_DRAFT);
  const [customMarkers, setCustomMarkers] = useState<MapMarker[]>([]);
  const [manualVisited, setManualVisited] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const skipCustomSave = useRef(true);
  const skipVisitedSave = useRef(true);
  const panelRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const wasDraggedRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    setCustomMarkers(loadCustomMarkers());
    setManualVisited(loadVisitedOverrides());
  }, []);

  useEffect(() => {
    if (skipCustomSave.current) {
      skipCustomSave.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customMarkers));
  }, [customMarkers]);

  useEffect(() => {
    if (skipVisitedSave.current) {
      skipVisitedSave.current = false;
      return;
    }
    window.localStorage.setItem(VISITED_KEY, JSON.stringify([...manualVisited]));
  }, [manualVisited]);

  // Wheel = zoom (no scroll). Listener nativo con passive:false para poder
  // preventDefault y evitar que el browser scrollee la pagina. Direccion:
  // rueda arriba (deltaY < 0) acerca, rueda abajo aleja.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    function onWheel(event: WheelEvent) {
      if (event.ctrlKey) return; // dejar que el browser haga zoom de pagina si Ctrl+wheel
      event.preventDefault();
      if (event.deltaY < 0) {
        setZoomIndex((index) => Math.min(ZOOMS.length - 1, index + 1));
      } else if (event.deltaY > 0) {
        setZoomIndex((index) => Math.max(0, index - 1));
      }
    }
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, []);

  // Cierra el drawer al clickear/tocar fuera. Uso pointerdown (no mousedown)
  // porque el preventDefault del startPan suprime los mouse events
  // sintetizados — pero los pointer events siguen bubbleando intactos.
  useEffect(() => {
    if (activeId === "") return;
    function handler(event: globalThis.PointerEvent) {
      if (calibrating) return;
      const target = event.target as HTMLElement;
      if (panelRef.current?.contains(target)) return;
      if (target.closest(".map-marker")) return;
      setActiveId("");
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [activeId, calibrating]);

  const allMarkers = useMemo(
    () => [...baseMarkers, ...customMarkers],
    [baseMarkers, customMarkers],
  );

  // Maximo episodio en el vault → tope del slider de filtro temporal.
  const lastEpisodeInVault = useMemo(() => {
    let max = 0;
    for (const m of baseMarkers) {
      for (const ep of m.apariciones ?? []) {
        if (ep > max) max = ep;
      }
    }
    return max;
  }, [baseMarkers]);

  const active = activeId
    ? allMarkers.find((marker) => marker.id === activeId) ?? null
    : null;
  const zoom = ZOOMS[zoomIndex];

  const searchNorm = useMemo(() => normalize(search.trim()), [search]);

  const visibleMarkers = useMemo(() => {
    return allMarkers.filter((m) => {
      if (filter !== "todos" && m.tone !== filter) return false;
      if (searchNorm && !normalize(m.name).includes(searchNorm)) return false;
      const eps = m.apariciones ?? [];
      const visited = vaultVisited(m) || manualVisited.has(m.id);
      if (visit === "visitados" && !visited && !m.custom) return false;
      if (visit === "pendientes" && (visited || m.custom)) return false;
      if (episodeMax > 0) {
        if (m.custom) return true;
        // Manual override sin apariciones → mostrar siempre (no tenemos episodios)
        if (manualVisited.has(m.id) && eps.length === 0) return true;
        if (eps.length === 0) return false;
        if (!eps.some((ep) => ep <= episodeMax)) return false;
      }
      return true;
    });
  }, [allMarkers, filter, searchNorm, visit, episodeMax, manualVisited]);

  function toggleManualVisited(id: string) {
    setManualVisited((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const codePreview = pickedPoint
    ? markerToCode({
        id: slugifyMarker(draft.name || "nuevo-lugar") || "nuevo-lugar",
        name: draft.name || "Nuevo lugar",
        region: draft.region || "Región pendiente",
        x: pickedPoint.x,
        y: pickedPoint.y,
        tone: draft.tone,
        href: draft.href || undefined,
        note: draft.note || "Descripción pendiente.",
      })
    : "Hacé click en el mapa para capturar coordenadas.";

  function capturePoint(event: MouseEvent<HTMLDivElement>) {
    if (!calibrating) return;
    const target = event.target as HTMLElement;
    if (target.closest(".map-marker")) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    const point = { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
    setPickedPoint(point);
  }

  function addDraftMarker() {
    if (!pickedPoint || !draft.name.trim()) return;
    const marker: MapMarker = {
      id: `custom-${slugifyMarker(draft.name)}-${Date.now().toString(36)}`,
      name: draft.name.trim(),
      region: draft.region.trim() || "Región pendiente",
      x: pickedPoint.x,
      y: pickedPoint.y,
      tone: draft.tone,
      href: draft.href.trim() || undefined,
      note: draft.note.trim() || "Descripción pendiente.",
      custom: true,
    };
    setCustomMarkers((current) => [...current, marker]);
    setActiveId(marker.id);
    setDraft(DEFAULT_DRAFT);
  }

  function removeActiveMarker() {
    if (!active?.custom) return;
    setCustomMarkers((current) => current.filter((marker) => marker.id !== active.id));
    setActiveId("");
  }

  // Drag-to-pan: registramos move/up a nivel document para que el drag siga
  // funcionando cuando el cursor sale del viewport. Mas confiable que
  // setPointerCapture en algunas combinaciones browser/SO.
  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (calibrating) return;
    if (zoomIndex === 0) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const target = event.target as HTMLElement;
    if (target.closest(".map-marker")) return;
    const vpEl = viewportRef.current;
    if (!vpEl) return;

    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    const startScrollLeft = vpEl.scrollLeft;
    const startScrollTop = vpEl.scrollTop;
    wasDraggedRef.current = false;

    function onMove(ev: globalThis.PointerEvent) {
      if (ev.pointerId !== pointerId) return;
      const el = viewportRef.current;
      if (!el) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) wasDraggedRef.current = true;
      el.scrollLeft = startScrollLeft - dx;
      el.scrollTop = startScrollTop - dy;
    }

    function onUp(ev: globalThis.PointerEvent) {
      if (ev.pointerId !== pointerId) return;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      setIsPanning(false);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    setIsPanning(true);
    event.preventDefault();
  }

  // Si el usuario arrastro, suprimir el click subsiguiente para que no se
  // dispare capturePoint o el onClick de algun marker que termino bajo el cursor.
  function suppressClickAfterDrag(event: ReactMouseEvent<HTMLDivElement>) {
    if (wasDraggedRef.current) {
      event.stopPropagation();
      event.preventDefault();
      wasDraggedRef.current = false;
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codePreview);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can fail on non-secure contexts; the text remains visible.
    }
  }

  const activeManualVisited = active ? manualVisited.has(active.id) : false;
  const activeMeta = active ? markerMeta(active, activeManualVisited) : null;
  const activeEps = active?.apariciones ?? [];
  const activeVaultVisited = active ? vaultVisited(active) : false;

  return (
    <div className="atlas-map">
      <div className="map-stage">
        <div className="map-toolbar" aria-label="Controles del mapa">
          <div className="map-toolbar-row">
            <div className="map-search" role="search">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar lugar…"
                aria-label="Buscar lugares en el mapa"
              />
              <span>
                {visibleMarkers.length}/{allMarkers.length}
              </span>
            </div>
            <div className="map-zoom" aria-label="Zoom del mapa">
              <button
                type="button"
                onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
                disabled={zoomIndex === 0}
                aria-label="Reducir zoom"
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomIndex((index) => Math.min(ZOOMS.length - 1, index + 1))}
                disabled={zoomIndex === ZOOMS.length - 1}
                aria-label="Aumentar zoom"
              >
                +
              </button>
              <button
                type="button"
                data-active={calibrating}
                onClick={() => setCalibrating((v) => !v)}
              >
                Calibrar
              </button>
            </div>
          </div>
          <div className="map-toolbar-row">
            <div className="map-filters" aria-label="Filtro por categoría">
              {(["todos", "copper", "petrol", "gold", "moss", "wine"] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  data-active={filter === tone}
                  onClick={() => setFilter(tone)}
                >
                  {FILTER_LABELS[tone]}
                </button>
              ))}
            </div>
            <div className="map-filters" aria-label="Filtro por estado de visita">
              {(["todos", "visitados", "pendientes"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  data-active={visit === v}
                  onClick={() => setVisit(v)}
                >
                  {VISIT_LABELS[v]}
                </button>
              ))}
            </div>
            {lastEpisodeInVault > 0 && (
              <label className="map-episode" aria-label="Filtrar hasta episodio">
                <span>Hasta ep</span>
                <input
                  type="range"
                  min={0}
                  max={lastEpisodeInVault}
                  value={episodeMax}
                  onChange={(event) => setEpisodeMax(Number(event.target.value))}
                />
                <b>{episodeMax === 0 ? "—" : episodeMax}</b>
              </label>
            )}
          </div>
        </div>

        <div
          ref={viewportRef}
          className="map-viewport"
          data-zoomed={zoomIndex > 0}
          data-panning={isPanning}
          onPointerDown={startPan}
          onClickCapture={suppressClickAfterDrag}
        >
          <div
            className="map-canvas"
            data-calibrating={calibrating}
            style={{ ["--zoom" as string]: zoom }}
            onClick={capturePoint}
          >
            <img src="/mapa/eyira.webp" alt="Mapa del continente de Eyira" />
            {visibleMarkers.map((marker) => {
              const manual = manualVisited.has(marker.id);
              const meta = markerMeta(marker, manual);
              const visited = vaultVisited(marker) || manual;
              return (
                <button
                  key={marker.id}
                  type="button"
                  className="map-marker"
                  data-tone={marker.tone}
                  data-active={active ? marker.id === active.id : false}
                  data-custom={marker.custom}
                  data-visited={visited}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  onClick={() => setActiveId(marker.id)}
                >
                  <span />
                  <b>
                    {marker.name}
                    {meta && <em>{meta}</em>}
                  </b>
                </button>
              );
            })}
            {pickedPoint && (
              <div
                className="map-pick"
                style={{ left: `${pickedPoint.x}%`, top: `${pickedPoint.y}%` }}
              >
                <span />
                <b>
                  x {pickedPoint.x}% · y {pickedPoint.y}%
                </b>
              </div>
            )}
          </div>
        </div>
      </div>

      <aside
        ref={panelRef}
        className="map-panel"
        data-open={active !== null || calibrating}
        aria-hidden={active === null && !calibrating}
      >
        <header className="map-panel-head">
          <button
            type="button"
            className="map-panel-close"
            aria-label="Cerrar panel"
            onClick={() => {
              setActiveId("");
              if (calibrating) setCalibrating(false);
            }}
          >
            ×
          </button>
        </header>

        {active ? (
          <div className="map-panel-body">
            <p className="map-panel-kicker">
              {active.region}
              {activeMeta && <span> · {activeMeta}</span>}
            </p>
            <h2>{active.name}</h2>
            {active.descripcion && (
              <p className="map-panel-desc">{active.descripcion}</p>
            )}
            {active.note && <p className="map-panel-note">{active.note}</p>}

            {active.habitantes && active.habitantes.length > 0 && (
              <section className="map-panel-section" aria-label="Habitantes">
                <p className="map-panel-label">Habitantes</p>
                <div className="map-panel-chips">
                  {active.habitantes.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/personajes/${p.slug}`}
                      className="map-panel-chip"
                      data-tone="habitante"
                    >
                      {p.nombre}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {active.personajes && active.personajes.length > 0 && (
              <section className="map-panel-section" aria-label="Personajes asociados">
                <p className="map-panel-label">
                  Asociados <em>(co-aparición)</em>
                </p>
                <div className="map-panel-chips">
                  {active.personajes.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/personajes/${p.slug}`}
                      className="map-panel-chip"
                    >
                      {p.nombre}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {activeEps.length > 0 && (
              <section className="map-panel-section" aria-label="Episodios donde aparece">
                <p className="map-panel-label">
                  Episodios <em>({activeEps.length})</em>
                </p>
                <div className="map-panel-chips map-panel-eps">
                  {activeEps
                    .slice()
                    .sort((a, b) => a - b)
                    .map((ep) => (
                      <Link
                        key={ep}
                        href={`/cronicas/${ep}`}
                        className="map-panel-chip"
                      >
                        ep {ep}
                      </Link>
                    ))}
                </div>
              </section>
            )}

            <div className="map-panel-actions">
              {active.href && (
                <Link className="map-panel-link" href={active.href}>
                  Abrir ficha completa
                </Link>
              )}
              {!active.custom && !activeVaultVisited && (
                <button
                  className="map-panel-link"
                  type="button"
                  data-toggle={activeManualVisited ? "on" : "off"}
                  onClick={() => toggleManualVisited(active.id)}
                >
                  {activeManualVisited ? "Quitar visitado" : "Marcar visitado"}
                </button>
              )}
              {active.custom && (
                <button className="map-panel-link" type="button" onClick={removeActiveMarker}>
                  Quitar local
                </button>
              )}
            </div>
          </div>
        ) : calibrating ? (
          <div className="map-panel-body">
            <p className="map-panel-kicker">Calibración</p>
            <h2>Nuevo punto</h2>
            <p className="map-panel-desc">
              {pickedPoint
                ? `Coordenadas capturadas: x ${pickedPoint.x}% · y ${pickedPoint.y}%. Completá el formulario para agregar el lugar o copiá el bloque para pegarlo en lib/map-markers.ts.`
                : "Hacé click en cualquier punto del mapa para capturar coordenadas."}
            </p>

            <div className="map-calibrator">
              <label>
                Nombre
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
                  placeholder="Nuevo lugar"
                />
              </label>
              <label>
                Región
                <input
                  value={draft.region}
                  onChange={(event) => setDraft((value) => ({ ...value, region: event.target.value }))}
                  placeholder="Costa, frontera, bosque…"
                />
              </label>
              <label>
                Ficha
                <input
                  value={draft.href}
                  onChange={(event) => setDraft((value) => ({ ...value, href: event.target.value }))}
                  placeholder="/lugares/slug"
                />
              </label>
              <label>
                Nota
                <textarea
                  value={draft.note}
                  onChange={(event) => setDraft((value) => ({ ...value, note: event.target.value }))}
                  placeholder="Por qué importa este lugar"
                />
              </label>
              <label>
                Tipo
                <select
                  value={draft.tone}
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, tone: event.target.value as MarkerTone }))
                  }
                >
                  <option value="copper">Cobre</option>
                  <option value="petrol">Mar</option>
                  <option value="gold">Desierto</option>
                  <option value="moss">Bosque</option>
                  <option value="wine">Conflicto</option>
                </select>
              </label>
              <div className="map-calibrator-actions">
                <button
                  type="button"
                  onClick={addDraftMarker}
                  disabled={!pickedPoint || !draft.name.trim()}
                >
                  Agregar lugar
                </button>
                <button
                  type="button"
                  onClick={copyCode}
                  disabled={!pickedPoint}
                  data-copied={copied}
                  aria-live="polite"
                >
                  {copied ? "Copiado" : "Copiar bloque"}
                </button>
              </div>
              <pre>{codePreview}</pre>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
