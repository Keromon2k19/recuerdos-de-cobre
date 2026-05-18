// lib/entity-public.ts — Configuración de las secciones públicas de
// entidades. Una sola fuente para rutas, rótulos y tipo de imagen, así los
// listados/fichas son genéricos y consistentes.
import type { EntityType } from "./types";
import type { ImgKind } from "./images";

export type PublicEntityConfig = {
  tipo: EntityType;
  segment: string; // /<segment>
  singular: string;
  plural: string;
  eyebrow: string;
  blurb: string;
  img: ImgKind;
  /**
   * Cómo se presenta la imagen en la ficha:
   * - "portrait": retrato 3:4 en tarjeta lateral (personajes).
   * - "hero": imagen ancha cinematográfica + galería (lugares, facciones…).
   */
  media: "portrait" | "hero";
};

// Orden = orden en el índice del archivo / nav.
export const PUBLIC_ENTITIES: PublicEntityConfig[] = [
  {
    tipo: "personaje",
    segment: "personajes",
    singular: "Personaje",
    plural: "Personajes",
    eyebrow: "El elenco",
    blurb: "Quién es quién en la campaña.",
    img: "personajes",
    media: "portrait",
  },
  {
    tipo: "lugar",
    segment: "lugares",
    singular: "Lugar",
    plural: "Lugares",
    eyebrow: "La geografía",
    blurb: "Dónde ocurrió cada cosa.",
    img: "lugares",
    media: "hero",
  },
  {
    tipo: "faccion",
    segment: "facciones",
    singular: "Facción",
    plural: "Facciones",
    eyebrow: "Los poderes",
    blurb: "Gremios, covens y poderes en juego.",
    img: "facciones",
    media: "hero",
  },
  {
    tipo: "objeto",
    segment: "objetos",
    singular: "Objeto",
    plural: "Objetos",
    eyebrow: "El inventario",
    blurb: "Artefactos y objetos con peso narrativo.",
    img: "objetos",
    media: "hero",
  },
  {
    tipo: "misterio",
    segment: "misterios",
    singular: "Misterio",
    plural: "Misterios",
    eyebrow: "Hilos abiertos",
    blurb: "Lo que sigue sin respuesta.",
    img: "misterios",
    media: "hero",
  },
  {
    tipo: "worldbuilding",
    segment: "worldbuilding",
    singular: "Tema",
    plural: "Worldbuilding",
    eyebrow: "El mundo",
    blurb: "Cómo funciona el mundo de Cobre.",
    img: "worldbuilding",
    media: "hero",
  },
];

export const BY_SEGMENT: Record<string, PublicEntityConfig> = Object.fromEntries(
  PUBLIC_ENTITIES.map((c) => [c.segment, c])
);

export const BY_TIPO = Object.fromEntries(
  PUBLIC_ENTITIES.map((c) => [c.tipo, c])
) as Record<EntityType, PublicEntityConfig | undefined>;
