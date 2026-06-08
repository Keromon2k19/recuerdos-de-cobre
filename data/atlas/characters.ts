// data/atlas/characters.ts — Mock data para /v2/personajes.
// 6 PJs + 2 NPCs notables, datos representativos del campaign real.
// Se reemplaza por cachedListByType(vp, "personaje") cuando la UI esté aprobada.
//
// imageSrc apunta DIRECTAMENTE a un placeholder SVG (no a un .jpg inexistente)
// para evitar 404s y el flash de "imagen rota" mientras carga el fallback.
// Cuando existan retratos reales, cambiar imageSrc al path real.

export type V2Character = {
  id: string;
  slug: string;
  nombre: string;
  /** Alias, apodos y grafias alternativas usadas para busqueda. */
  aliases?: string[];
  /** Jugador real si es PJ. Undefined si es NPC. */
  jugador?: string;
  /** Rol corto — Bruja, Mercenario, Paladín, NPC, etc. */
  rol: string;
  /** Epíteto poético opcional — "Voz de la Hermandad", "Tres en una", etc. */
  epiteto?: string;
  facciones: string[];
  /** Región principal — Metrópolis de Cobre, Eyra, Norte, etc. */
  region?: string;
  /** Bio corta de 1–3 oraciones. */
  descripcion: string;
  /** Cantidad de episodios en los que aparece. */
  apariciones: number;
  /** Path a un retrato. Apunta a placeholder SVG por ahora. */
  imageSrc: string;
  imageFit?: "cover" | "contain";
  imagePosition?: string;
};

export const MOCK_CHARACTERS: V2Character[] = [
  {
    id: "mysha",
    slug: "mysha",
    nombre: "Mysha",
    jugador: "Kero",
    rol: "Bruja de sangre",
    epiteto: "Tres en una",
    facciones: ["Coven Rojo"],
    region: "Eyra",
    descripcion:
      "Bruja de sangre con tres personalidades — Mysha, Selenne y Veltra — que comparten un mismo cuerpo. Hereda el Coven Rojo y recupera su nombre original, Coven Rosa, al decidir refundarlo.",
    apariciones: 67,
    imageSrc: "/assets/atlas/portraits/mysha.png",
  },
  {
    id: "borok",
    slug: "borok",
    nombre: "Borok",
    jugador: "Mati",
    rol: "Mercenario",
    facciones: ["Hermandad de Cobre"],
    region: "Metrópolis de Cobre",
    descripcion:
      "Mercenario veterano del gremio de la Hermandad. Ancla del grupo en combate; los demás suelen cubrirse detrás de su hacha.",
    apariciones: 64,
    imageSrc: "/assets/atlas/portraits/_placeholder-2.svg",
  },
  {
    id: "layra",
    slug: "layra",
    nombre: "Layra",
    jugador: "Layla",
    rol: "Pícara",
    facciones: [],
    region: "Caminos del Este",
    descripcion:
      "Pícara errante sin facción declarada. Vive de contratos cortos y de información robada en los márgenes de la Metrópolis.",
    apariciones: 58,
    imageSrc: "/assets/atlas/portraits/_placeholder-3.svg",
  },
  {
    id: "narcissa",
    slug: "narcissa",
    nombre: "Narcissa",
    jugador: "Mica",
    rol: "Hechicera",
    facciones: ["Coven Negro"],
    region: "Eyra",
    descripcion:
      "Hechicera del Coven Negro. Su magia oscila entre lo ritual y lo improvisado; las consecuencias rara vez son las mismas dos veces.",
    apariciones: 61,
    imageSrc: "/assets/atlas/portraits/_placeholder-4.svg",
  },
  {
    id: "david-ilcard",
    slug: "david-ilcard",
    nombre: "David Ilcard",
    jugador: "Lucho",
    rol: "Paladín",
    epiteto: "El Juramentado",
    facciones: ["Orden de la Llave"],
    region: "Norte",
    descripcion:
      "Paladín de la Orden de la Llave. Voto de silencio roto solo en presencia del enemigo. Carga una espada que no le pertenece.",
    apariciones: 59,
    imageSrc: "/assets/atlas/portraits/_placeholder-1.svg",
  },
  {
    id: "io-campbell",
    slug: "io-campbell",
    nombre: "Io Campbell",
    jugador: "Mile",
    rol: "Mecánico",
    facciones: ["Hermandad de Cobre"],
    region: "Metrópolis de Cobre",
    descripcion:
      "Mecánico de la Hermandad. Su rotación de alias — Kuzu, Sis, Nico — funciona mejor que cualquier identidad fija que le hayan intentado imponer.",
    apariciones: 56,
    imageSrc: "/assets/atlas/portraits/io-campbell.png",
  },
  {
    id: "annora",
    slug: "annora",
    nombre: "Annora",
    rol: "NPC",
    epiteto: "Voz de la Hermandad",
    facciones: ["Hermandad de Cobre"],
    region: "Metrópolis de Cobre",
    descripcion:
      "Líder rebelde con parche en el ojo y un collar de rubí que nadie le vio quitarse. Recompensa de 150 000 monedas por su cabeza.",
    apariciones: 12,
    imageSrc: "/assets/atlas/portraits/annora.jpg",
  },
  {
    id: "champi",
    slug: "champi",
    nombre: "Champi",
    rol: "Familiar",
    epiteto: "Búho de Mysha",
    facciones: [],
    descripcion:
      "Búho familiar vinculado a Mysha. Ha cruzado más fronteras del Velo que cualquier otro personaje del grupo, casi sin advertirlo.",
    apariciones: 45,
    imageSrc: "/assets/atlas/portraits/_placeholder-4.svg",
  },
];
