// lib/map-overrides.ts
// Persistencia de cambios del mapa V2:
//  - location-overrides.json: patches a entries existentes (pin, hideFromMap)
//  - location-additions.json: lugares nuevos creados desde la UI
// Ambos son parte del repo (curaduría versionada en git).

import fs from "node:fs";
import path from "node:path";
import { MOCK_REGIONS, type V2Region } from "@/data/atlas-v2/locations";

const FILE = path.join(process.cwd(), "data/atlas-v2/location-overrides.json");
const ADDITIONS_FILE = path.join(process.cwd(), "data/atlas-v2/location-additions.json");

export type LocationOverridePatch = {
  pin?: { x: number; y: number };
  hideFromMap?: boolean;
};

export type LocationOverrides = Record<string, LocationOverridePatch>;

function writeJsonAtomic(filePath: string, value: unknown): void {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(value, null, 2) + "\n", "utf8");
  fs.renameSync(tmpPath, filePath);
}

export function loadOverrides(): LocationOverrides {
  try {
    if (!fs.existsSync(FILE)) return {};
    const raw = fs.readFileSync(FILE, "utf8").trim();
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveOverrides(overrides: LocationOverrides): void {
  // Limpieza: descartar entradas vacías
  const clean: LocationOverrides = {};
  for (const [slug, patch] of Object.entries(overrides)) {
    if (!patch) continue;
    const hasPin = patch.pin !== undefined;
    const hasHide = patch.hideFromMap !== undefined;
    if (!hasPin && !hasHide) continue;
    clean[slug] = {
      ...(hasPin ? { pin: patch.pin } : {}),
      ...(hasHide ? { hideFromMap: patch.hideFromMap } : {}),
    };
  }
  writeJsonAtomic(FILE, clean);
}

/** Devuelve una copia de las regiones con los overrides aplicados. */
export function applyOverrides(
  regions: V2Region[],
  overrides: LocationOverrides
): V2Region[] {
  return regions.map((r) => {
    const ov = overrides[r.slug];
    if (!ov) return r;
    return {
      ...r,
      pin: ov.pin ?? r.pin,
      hideFromMap: ov.hideFromMap ?? r.hideFromMap,
    };
  });
}

// ── Additions: lugares nuevos creados desde la UI ──

export function loadAdditions(): V2Region[] {
  try {
    if (!fs.existsSync(ADDITIONS_FILE)) return [];
    const raw = fs.readFileSync(ADDITIONS_FILE, "utf8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAdditions(additions: V2Region[]): void {
  writeJsonAtomic(ADDITIONS_FILE, additions);
}

/** Set de slugs creados desde la UI (additions). Útil para filtros UI. */
export function getAdditionSlugs(): Set<string> {
  return new Set(loadAdditions().map((r) => r.slug));
}

/** Conjunto completo: MOCK_REGIONS + additions + overrides aplicados.
 *  Es la única función que deberían usar las pages para acceder a regions. */
export function getAllRegions(): V2Region[] {
  const base = [...MOCK_REGIONS, ...loadAdditions()];
  return applyOverrides(base, loadOverrides());
}
