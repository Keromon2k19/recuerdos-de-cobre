"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";

type MarkerTone = "copper" | "petrol" | "moss" | "gold" | "wine";
type FilterTone = "todos" | MarkerTone;

type MapMarker = {
  id: string;
  name: string;
  region: string;
  x: number;
  y: number;
  tone: MarkerTone;
  href?: string;
  note: string;
  custom?: boolean;
};

type DraftMarker = {
  name: string;
  region: string;
  note: string;
  href: string;
  tone: MarkerTone;
};

const STORAGE_KEY = "rdc-map-custom-markers";

const BASE_MARKERS: MapMarker[] = [];

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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
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

export default function CampaignMap() {
  const [activeId, setActiveId] = useState("");
  const [zoomIndex, setZoomIndex] = useState(0);
  const [filter, setFilter] = useState<FilterTone>("todos");
  const [calibrating, setCalibrating] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<DraftMarker>(DEFAULT_DRAFT);
  const [customMarkers, setCustomMarkers] = useState<MapMarker[]>([]);

  useEffect(() => {
    setCustomMarkers(loadCustomMarkers());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customMarkers));
  }, [customMarkers]);

  const markers = useMemo(() => [...BASE_MARKERS, ...customMarkers], [customMarkers]);
  const active = markers.find((marker) => marker.id === activeId) ?? markers[0] ?? null;
  const zoom = ZOOMS[zoomIndex];
  const visibleMarkers = useMemo(
    () => markers.filter((marker) => filter === "todos" || marker.tone === filter),
    [filter, markers],
  );
  const codePreview = pickedPoint
    ? markerToCode({
        id: slugifyMarker(draft.name || "nuevo-lugar") || "nuevo-lugar",
        name: draft.name || "Nuevo lugar",
        region: draft.region || "Region pendiente",
        x: pickedPoint.x,
        y: pickedPoint.y,
        tone: draft.tone,
        href: draft.href || undefined,
        note: draft.note || "Descripcion pendiente.",
      })
    : "Click en el mapa para capturar coordenadas.";

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
      region: draft.region.trim() || "Region pendiente",
      x: pickedPoint.x,
      y: pickedPoint.y,
      tone: draft.tone,
      href: draft.href.trim() || undefined,
      note: draft.note.trim() || "Descripcion pendiente.",
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

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codePreview);
    } catch {
      // Clipboard can fail on non-secure contexts; the text remains visible.
    }
  }

  return (
    <div className="atlas-map">
      <div className="map-stage">
        <div className="map-toolbar" aria-label="Controles del mapa">
          <div className="map-filters" aria-label="Filtro de regiones">
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
          <div className="map-zoom" aria-label="Zoom del mapa">
            <button
              type="button"
              onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
              disabled={zoomIndex === 0}
            >
              Menos
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomIndex((index) => Math.min(ZOOMS.length - 1, index + 1))}
              disabled={zoomIndex === ZOOMS.length - 1}
            >
              Mas
            </button>
            <button type="button" data-active={calibrating} onClick={() => setCalibrating((v) => !v)}>
              Calibrar
            </button>
          </div>
        </div>

        <div className="map-viewport">
          <div
            className="map-canvas"
            data-calibrating={calibrating}
            style={{
              width: `${zoom * 100}%`,
              transformOrigin: active ? `${active.x}% ${active.y}%` : "50% 50%",
            }}
            onClick={capturePoint}
          >
            <img src="/mapa/eyira.webp" alt="Mapa del continente de Eyira" />
            {visibleMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                className="map-marker"
                data-tone={marker.tone}
                data-active={active ? marker.id === active.id : false}
                data-custom={marker.custom}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                onClick={() => setActiveId(marker.id)}
              >
                <span />
                <b>{marker.name}</b>
              </button>
            ))}
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

      <aside className="map-panel">
        {active ? (
          <>
            <p className="map-panel-kicker">{active.region}</p>
            <h2>{active.name}</h2>
            <p>{active.note}</p>
            <div className="map-panel-actions">
              {active.href && (
                <Link className="map-panel-link" href={active.href}>
                  Abrir ficha
                </Link>
              )}
              {active.custom && (
                <button className="map-panel-link" type="button" onClick={removeActiveMarker}>
                  Quitar local
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="map-panel-kicker">Mapa limpio</p>
            <h2>Sin puntos cargados</h2>
            <p>
              Activa calibrar, haz click sobre una ubicacion real del mapa y agrega el
              lugar desde el formulario.
            </p>
          </>
        )}

        <div className="map-calibrator">
          <div className="map-calibrator-head">
            <p>Calibracion</p>
            <span>{pickedPoint ? `x ${pickedPoint.x}% / y ${pickedPoint.y}%` : "Sin punto"}</span>
          </div>
          <label>
            Nombre
            <input
              value={draft.name}
              onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              placeholder="Nuevo lugar"
            />
          </label>
          <label>
            Region
            <input
              value={draft.region}
              onChange={(event) => setDraft((value) => ({ ...value, region: event.target.value }))}
              placeholder="Costa, frontera, bosque..."
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
              placeholder="Por que importa este lugar"
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
            <button type="button" onClick={addDraftMarker} disabled={!pickedPoint || !draft.name.trim()}>
              Agregar lugar
            </button>
            <button type="button" onClick={copyCode} disabled={!pickedPoint}>
              Copiar bloque
            </button>
          </div>
          <pre>{codePreview}</pre>
        </div>

        <div className="map-list" aria-label="Ubicaciones del atlas">
          {markers.length === 0 ? (
            <p className="map-list-empty">Todavia no hay lugares calibrados.</p>
          ) : (
            markers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                data-active={active ? marker.id === active.id : false}
                data-tone={marker.tone}
                onClick={() => {
                  setActiveId(marker.id);
                  if (filter !== "todos" && filter !== marker.tone) setFilter("todos");
                }}
              >
                <span>{marker.custom ? "Local" : marker.region}</span>
                <b>{marker.name}</b>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
