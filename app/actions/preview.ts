"use server";

import { cachedAtlasEntityDetail } from "@/lib/public-cache";
import type { AtlasEntityKind } from "@/lib/atlas-content";
import { publicVaultPath } from "@/lib/public-vault-path";

export type EntityPreviewData = {
  success: boolean;
  name?: string;
  kind?: string;
  description?: string;
  imageSrc?: string;
  meta?: Array<{ label: string; value: string }>;
  href?: string;
  error?: string;
};

// Mapea el segmento de la URL pública al tipo de entidad del Atlas
const ROUTE_TO_KIND: Record<string, AtlasEntityKind> = {
  personajes: "personaje",
  lugares: "lugar",
  facciones: "faccion",
  objetos: "objeto",
  misterios: "misterio",
  mundo: "worldbuilding",
};

/**
 * Server Action que resuelve la información resumida de una entidad
 * a partir de su URL interna (ej. /personajes/narcissa).
 */
export async function getEntityPreviewAction(href: string): Promise<EntityPreviewData> {
  try {
    const vaultPath = publicVaultPath();

    // Quitar barras laterales y parsear partes
    const cleanPath = href.replace(/^\/+|\/+$/g, "");
    const parts = cleanPath.split("/");
    if (parts.length < 2) {
      return { success: false, error: `Ruta de entidad inválida: ${href}` };
    }

    const segment = parts[0];
    const slug = parts[1];
    const kind = ROUTE_TO_KIND[segment];

    if (!kind) {
      return { success: false, error: `Tipo de entidad desconocido para la ruta: ${href}` };
    }

    const detail = await cachedAtlasEntityDetail(vaultPath, kind, slug);
    if (!detail) {
      return { success: false, error: "No se encontró la entidad en el archivo del atlas" };
    }

    return {
      success: true,
      name: detail.name,
      kind: detail.kind,
      description: detail.description,
      imageSrc: detail.imageSrc,
      meta: detail.meta,
      href,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
