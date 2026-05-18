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

/** Item de la playlist de YouTube (cache local en _playlist.json) */
export type PlaylistItem = {
  numero: number; // posición en la playlist (1-indexed)
  titulo: string;
  videoId: string;
  url: string;
  publicado_en?: string; // ISO timestamp
};

export type PlaylistCache = {
  playlist_id: string;
  sincronizado_en: string; // ISO timestamp
  items: PlaylistItem[];
};

/** Etapas del pipeline de procesamiento automático */
export type JobEstado =
  | "queued"
  | "downloading"
  | "transcribing"
  | "esperando_resumen"
  | "summarizing"
  | "extracting"
  | "committing"
  | "done"
  | "error"
  | "cancelled";

/** Estado de un job de procesamiento de episodio (URL → resumen → vault) */
export type Job = {
  numero: number;
  videoId: string;
  url: string;
  titulo: string;
  publicado_en?: string;
  estado: JobEstado;
  etapa_actual: string;
  iniciado_en: string; // ISO
  actualizado_en: string; // ISO
  pid?: number;
  audio_path?: string;
  transcript_path?: string;
  resumen?: string;
  error?: string;
  /**
   * Si true, después del resumen el pipeline corre extracción con Claude y
   * commit al vault automáticamente (modo "nocturno"). Si false, se detiene
   * en "done" tras el resumen para revisión manual en el form.
   */
  auto_commit?: boolean;
  /** Contadores informativos tras commit exitoso */
  committed_entities?: number;
  /** Progreso de transcripción 0-100 (solo durante estado "transcribing") */
  progress?: number;
  /** Detalle legible del progreso, ej "12m / 45m de audio" */
  progress_detail?: string;
};
