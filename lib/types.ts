// lib/types.ts — Tipos compartidos del modelo de datos Mysha

export type EntityType =
  | "personaje"
  | "lugar"
  | "evento"
  | "objeto"
  | "faccion"
  | "worldbuilding"
  | "misterio"
  | "quote"
  | "decision";

export const ENTITY_TYPES: EntityType[] = [
  "personaje",
  "lugar",
  "evento",
  "objeto",
  "faccion",
  "worldbuilding",
  "misterio",
  "quote",
  "decision",
];

/** Carpeta en disco para cada tipo de entidad */
export const ENTITY_FOLDERS: Record<EntityType, string> = {
  personaje: "personajes",
  lugar: "lugares",
  evento: "eventos",
  objeto: "objetos",
  faccion: "facciones",
  worldbuilding: "worldbuilding",
  misterio: "misterios",
  quote: "quotes",
  decision: "decisiones",
};

export type Mention = {
  episodio: number;
  texto: string;
  contexto?: string;
};

export type Entity = {
  tipo: EntityType;
  nombre: string;
  alias: string[];
  apariciones: number[];
  menciones: Mention[];
  relaciones?: Relacion[];
  ultima_actualizacion?: string;
};

export type Relacion = {
  de: string;
  a: string;
  tipo: string;
  episodio: number;
};

/** Lo que devuelve la IA para un episodio procesado */
export type ExtractionResult = {
  personajes: Array<{ nombre: string; descripcion: string; alias?: string[] }>;
  lugares: Array<{ nombre: string; descripcion: string }>;
  eventos: Array<{ nombre: string; descripcion: string }>;
  objetos: Array<{ nombre: string; descripcion: string }>;
  facciones: Array<{ nombre: string; descripcion: string }>;
  worldbuilding: Array<{ tema: string; descripcion: string }>;
  relaciones: Relacion[];
  misterios: string[];
  quotes: Array<{ texto: string; autor?: string }>;
  decisiones: Array<{ descripcion: string; protagonistas: string[] }>;
};

export type Episodio = {
  numero: number;
  titulo: string;
  fecha_grabacion?: string;
  procesado: string; // ISO timestamp
  resumen_original: string;
  extraido: ExtractionResult;
};
