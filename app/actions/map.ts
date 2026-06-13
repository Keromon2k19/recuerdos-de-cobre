"use server";

// app/actions/map.ts — Server actions para persistir los cambios del mapa V2.
// Overrides (mover/hidear) → location-overrides.json
// Additions (lugares nuevos) → location-additions.json
// Ambos versionados en git.

import { revalidatePath } from "next/cache";
import {
  loadOverrides,
  saveOverrides,
  loadAdditions,
  saveAdditions,
  type LocationOverrides,
  type LocationOverridePatch,
} from "@/lib/map-overrides";
import { slugify } from "@/lib/slugify";
import { MOCK_REGIONS, type V2Region } from "@/data/atlas/locations";

export type SaveMapResult = { ok: true; count: number } | { ok: false; error: string };

/** Mezcla patch con overrides actuales y persiste.
 *  patch: parcial por slug — solo las claves a actualizar. Si una entrada en
 *  patch viene con `null`, esa entrada se resetea al default. */
export async function saveMapOverrides(
  patch: Record<string, LocationOverridePatch | null>
): Promise<SaveMapResult> {
  try {
    const current = loadOverrides();
    const merged: LocationOverrides = { ...current };
    for (const [slug, p] of Object.entries(patch)) {
      if (p === null) {
        delete merged[slug];
        continue;
      }
      const existing = merged[slug] ?? {};
      merged[slug] = {
        ...existing,
        ...(p.pin !== undefined ? { pin: p.pin } : {}),
        ...(p.hideFromMap !== undefined ? { hideFromMap: p.hideFromMap } : {}),
      };
    }
    saveOverrides(merged);
    revalidatePath("/mapa");
    revalidatePath("/lugares");
    return { ok: true, count: Object.keys(merged).length };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error };
  }
}

export async function resetMapOverrides(): Promise<SaveMapResult> {
  try {
    saveOverrides({});
    revalidatePath("/mapa");
    revalidatePath("/lugares");
    return { ok: true, count: 0 };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error };
  }
}

// ── Agregar lugar nuevo ──

export type AddLocationInput = {
  nombre: string;
  category?: string;
  tagline?: string;
  descripcion?: string;
  tone?: V2Region["tone"];
  glyph?: string;
  pin: { x: number; y: number };
  meta?: Partial<V2Region["meta"]>;
};

export type AddLocationResult = { ok: true; slug: string } | { ok: false; error: string };

export async function addMapLocation(input: AddLocationInput): Promise<AddLocationResult> {
  try {
    const nombre = input.nombre.trim();
    if (!nombre) return { ok: false, error: "El nombre es obligatorio" };

    // Slug único: tomar del nombre, sufijar si choca con base + additions
    const baseSlug = slugify(nombre) || "lugar";
    const baseRegion = MOCK_REGIONS.find((r) => r.slug === baseSlug || slugify(r.nombre) === baseSlug);
    if (baseRegion) {
      const current = loadOverrides();
      saveOverrides({
        ...current,
        [baseRegion.slug]: {
          ...(current[baseRegion.slug] ?? {}),
          pin: {
            x: Number(input.pin.x.toFixed(2)),
            y: Number(input.pin.y.toFixed(2)),
          },
          hideFromMap: false,
        },
      });
      revalidatePath("/mapa");
      revalidatePath("/lugares");
      return { ok: true, slug: baseRegion.slug };
    }

    // Glyph: si el user no lo dio, generar iniciales del nombre.
    // "La Torre de Cristal" → "TC"  (ignora articulos cortos)
    // "Arkala" → "AR"  (palabra sola → primeras 2 letras)
    const STOP = new Set(["el", "la", "los", "las", "de", "del", "y", "en", "al"]);
    const autoGlyph = (() => {
      const words = nombre
        .split(/\s+/)
        .filter((w) => w && !STOP.has(w.toLowerCase()));
      if (words.length === 0) return nombre.slice(0, 2);
      if (words.length === 1) return words[0].slice(0, 2);
      return words.slice(0, 2).map((w) => w[0]).join("");
    })();

    const additions = loadAdditions();
    const existingAdditionIndex = additions.findIndex(
      (r) => r.slug === baseSlug || slugify(r.nombre) === baseSlug
    );

    if (existingAdditionIndex >= 0) {
      const existingAddition = additions[existingAdditionIndex];
      additions[existingAdditionIndex] = {
        ...existingAddition,
        category: input.category?.trim() || existingAddition.category,
        tagline: input.tagline?.trim() || existingAddition.tagline,
        glyph: (input.glyph?.trim() || existingAddition.glyph || autoGlyph).toUpperCase(),
        descripcion: input.descripcion?.trim() || existingAddition.descripcion,
        meta: {
          gobierno: input.meta?.gobierno?.trim() || existingAddition.meta.gobierno,
          poblacion: input.meta?.poblacion?.trim() || existingAddition.meta.poblacion,
          industria: input.meta?.industria?.trim() || existingAddition.meta.industria,
          influencia: input.meta?.influencia?.trim() || existingAddition.meta.influencia,
        },
        pin: {
          x: Number(input.pin.x.toFixed(2)),
          y: Number(input.pin.y.toFixed(2)),
        },
        tone: input.tone ?? existingAddition.tone,
        hideFromMap: false,
      };
      saveAdditions(additions);
      revalidatePath("/mapa");
      revalidatePath("/lugares");
      return { ok: true, slug: existingAddition.slug };
    }

    const existing = new Set([
      ...MOCK_REGIONS.map((r) => r.slug),
      ...additions.map((r) => r.slug),
    ]);
    let slug = baseSlug;
    let i = 2;
    while (existing.has(slug)) {
      slug = `${baseSlug}-${i}`;
      i++;
    }

    const region: V2Region = {
      slug,
      nombre,
      category: input.category?.trim() || "Lugar",
      tagline: input.tagline?.trim() || "",
      glyph: (input.glyph?.trim() || autoGlyph).toUpperCase(),
      descripcion: input.descripcion?.trim() || "",
      meta: {
        gobierno: input.meta?.gobierno?.trim() || "—",
        poblacion: input.meta?.poblacion?.trim() || "—",
        industria: input.meta?.industria?.trim() || "—",
        influencia: input.meta?.influencia?.trim() || "—",
      },
      pin: {
        x: Number(input.pin.x.toFixed(2)),
        y: Number(input.pin.y.toFixed(2)),
      },
      tone: input.tone ?? "copper",
    };

    additions.push(region);
    saveAdditions(additions);

    revalidatePath("/mapa");
    revalidatePath("/lugares");
    return { ok: true, slug };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error };
  }
}

export async function deleteMapLocation(slug: string): Promise<SaveMapResult> {
  try {
    const additions = loadAdditions().filter((r) => r.slug !== slug);
    saveAdditions(additions);
    const overrides = loadOverrides();
    if (overrides[slug]) {
      delete overrides[slug];
      saveOverrides(overrides);
    }
    revalidatePath("/mapa");
    revalidatePath("/lugares");
    return { ok: true, count: additions.length };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error };
  }
}
