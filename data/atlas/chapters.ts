// data/atlas/chapters.ts — Mock data para /v2/capitulos.
// 8 capítulos representativos del campaign (de los 67 totales).
// Tipo V2Chapter exportado; se reemplaza por cachedListEpisodes() cuando
// la UI esté aprobada.

export type V2Reward = {
  key: string;
  label: string;
  value: string;
  /** Glyph SVG path o emoji-libre símbolo. Usamos texto unicode para placeholder. */
  glyph: string;
};

export type V2Chapter = {
  id: string;
  numero: number;
  numeroDisplay?: string;
  /** Eyebrow: "CAPÍTULO XX" */
  eyebrow: string;
  /** Título poético del capítulo */
  titulo: string;
  /** Fecha in-game (no la fecha real de sesión) */
  fecha: string;
  /** Lugar principal donde ocurre */
  lugar: string;
  /** Personajes principales (slugs que se podrían linkear) */
  personajes: string[];
  /** Estado de la crónica: "Completado", "En curso", "Misterio" */
  estado: string;
  /** Descripción larga, 2-3 párrafos */
  descripcion: string;
  /** Path a imagen panorámica de la escena */
  imageSrc: string;
  /** 4 recompensas desbloqueadas en el capítulo */
  rewards?: V2Reward[];
};

const SCENE = "/assets/atlas/backgrounds/hero.png";

function rewards(memoria: number, fragmento: number, exp: number, bronce: number): V2Reward[] {
  return [
    { key: "memoria",    label: "Memoria de cobre",   value: `+${memoria}`,   glyph: "❦" },
    { key: "fragmento",  label: "Fragmento de memoria", value: `+${fragmento}`, glyph: "❧" },
    { key: "experiencia", label: "Experiencia",        value: `+${exp}`,       glyph: "✦" },
    { key: "bronce",     label: "Reportaje de bronce", value: `+${bronce}`,   glyph: "❖" },
  ];
}

export const MOCK_CHAPTERS: V2Chapter[] = [
  {
    id: "ep-42",
    numero: 42,
    eyebrow: "Capítulo 42",
    titulo: "La Aguja Doble",
    fecha: "17 de Bronce, 1067",
    lugar: "Ciudad de Bronce",
    personajes: ["mysha", "borok", "layra"],
    estado: "Completado",
    descripcion:
      "La ciudad reanima el aliento. Sobre el vapor y la sal, un acento olvidado comienza a coser los hilos del pasado con los del presente.\n\nLo que parecía concedido bajo capas de óxido y mecánica, ahora vibra bajo la superficie, esperando a quienes despierten lo que queden sin recuerdos.",
    imageSrc: SCENE,
    rewards: rewards(125, 1, 250, 80),
  },
  {
    id: "ep-41",
    numero: 41,
    eyebrow: "Capítulo 41",
    titulo: "Sombras en el Cáliz",
    fecha: "10 de Bronce, 1067",
    lugar: "Coven Rojo",
    personajes: ["mysha", "narcissa"],
    estado: "Completado",
    descripcion:
      "Las velas del cáliz arden con un fuego que no es del todo fuego. Mysha lee tres veces el mismo verso antes de entender que la tinta cambia entre lecturas.",
    imageSrc: SCENE,
    rewards: rewards(90, 0, 180, 60),
  },
  {
    id: "ep-40",
    numero: 40,
    eyebrow: "Capítulo 40",
    titulo: "Rosa del Pasado",
    fecha: "3 de Bronce, 1067",
    lugar: "Coven Rosa",
    personajes: ["mysha", "champi"],
    estado: "Completado",
    descripcion:
      "El Coven Rosa recibe a Mysha con cortesía de juramento. Bajo los pétalos, los acuerdos se firman en aceite caliente y promesas que se astillan.",
    imageSrc: SCENE,
    rewards: rewards(110, 1, 220, 70),
  },
  {
    id: "ep-39",
    numero: 39,
    eyebrow: "Capítulo 39",
    titulo: "El Precio del Vapor",
    fecha: "27 de Cobre, 1067",
    lugar: "Metrópolis de Cobre",
    personajes: ["borok", "io-campbell"],
    estado: "Completado",
    descripcion:
      "La Hermandad de Cobre cobra sus deudas con intereses calculados al milímetro. Borok y Io descubren que el precio del vapor incluye un nombre.",
    imageSrc: SCENE,
    rewards: rewards(100, 1, 200, 65),
  },
  {
    id: "ep-38",
    numero: 38,
    eyebrow: "Capítulo 38",
    titulo: "Bajo el Puente de Hierro",
    fecha: "20 de Cobre, 1067",
    lugar: "Puente de Hierro",
    personajes: ["layra", "david-ilcard"],
    estado: "Completado",
    descripcion:
      "El puente cruje en una sola sílaba. Layra y David se encuentran a oscuras con un mensaje escrito en lengua que ninguno reconoce del todo.",
    imageSrc: SCENE,
    rewards: rewards(95, 0, 190, 55),
  },
  {
    id: "ep-37",
    numero: 37,
    eyebrow: "Capítulo 37",
    titulo: "El Susurro de las Reliquias",
    fecha: "13 de Cobre, 1067",
    lugar: "Cripta del Archivo",
    personajes: ["narcissa", "annora"],
    estado: "Misterio",
    descripcion:
      "Las reliquias del archivo susurran con voces que no terminan de ser suyas. Narcissa registra cada palabra; Annora exige que pare antes de que las paredes contesten.",
    imageSrc: SCENE,
    rewards: rewards(80, 2, 160, 50),
  },
  {
    id: "ep-36",
    numero: 36,
    eyebrow: "Capítulo 36",
    titulo: "El Último Mapa",
    fecha: "6 de Cobre, 1067",
    lugar: "Salón del Cartógrafo",
    personajes: ["io-campbell", "david-ilcard", "borok"],
    estado: "En curso",
    descripcion:
      "El cartógrafo dibuja una ruta que no existe sobre un mapa que ya fue corregido cinco veces. La cuadrilla cree entender el destino — el cartógrafo se ríe.",
    imageSrc: SCENE,
    rewards: rewards(70, 1, 140, 45),
  },
  {
    id: "ep-35",
    numero: 35,
    eyebrow: "Capítulo 35",
    titulo: "Crónica del Velo",
    fecha: "28 de Hierro, 1066",
    lugar: "Frontera del Velo",
    personajes: ["mysha", "champi", "layra"],
    estado: "Completado",
    descripcion:
      "Champi cruza el Velo por primera vez sin advertirlo. Cuando vuelve, Mysha advierte que el plumaje tiene un brillo nuevo, como si hubiese tomado prestada una memoria que no era suya.",
    imageSrc: SCENE,
    rewards: rewards(105, 1, 210, 75),
  },
];
