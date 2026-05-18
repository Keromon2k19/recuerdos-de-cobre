// lib/public-meta.ts — Metadata dinámica para páginas de la antología, así
// la pestaña/compartir muestran el nombre real en vez del título genérico.
// Usa el cache público (no agrega lecturas extra de disco).
import type { Metadata } from "next";
import type { EntityType } from "./types";
import { BY_TIPO } from "./entity-public";
import { cachedListByType, cachedListEpisodes } from "./public-cache";

const SITE = "Recuerdos de Cobre";

export async function buildEntityMetadata(
  tipo: EntityType,
  slug: string
): Promise<Metadata> {
  const cfg = BY_TIPO[tipo];
  const vp = process.env.VAULT_PATH?.trim() || "";
  if (!cfg || !vp) return { title: `${SITE}` };

  const items = await cachedListByType(vp, tipo);
  const item = items.find((e) => e.slug === slug);
  const nombre = item?.nombre ?? slug;
  const desc =
    item?.descripcion ??
    `${cfg.singular} del archivo de ${SITE}.`;

  return {
    title: `${nombre} · ${cfg.plural} · ${SITE}`,
    description: desc.slice(0, 160),
  };
}

export async function buildEpisodeMetadata(
  numero: number
): Promise<Metadata> {
  const vp = process.env.VAULT_PATH?.trim() || "";
  if (!vp || isNaN(numero)) return { title: `Crónicas · ${SITE}` };

  const eps = await cachedListEpisodes(vp);
  const ep = eps.find((e) => e.numero === numero);
  const reg = `№ ${String(numero).padStart(3, "0")}`;
  const titulo = ep?.titulo || `Registro ${numero}`;

  return {
    title: `${reg} · ${titulo} · ${SITE}`,
    description: `Expediente del registro ${reg} de la campaña ${SITE}.`,
  };
}
