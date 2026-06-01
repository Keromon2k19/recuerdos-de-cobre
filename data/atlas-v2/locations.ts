// data/atlas-v2/locations.ts
// Datos iniciales para /v2/lugares y /v2/mapa.

export type V2RegionTone = "copper" | "gold" | "moss" | "petrol" | "wine";

export type V2Region = {
  slug: string;
  nombre: string;
  category: string;
  tagline: string;
  glyph: string;
  imageSrc?: string;
  descripcion: string;
  meta: {
    gobierno: string;
    poblacion: string;
    industria: string;
    influencia: string;
  };
  pin: { x: number; y: number };
  tone: V2RegionTone;
};

export const MOCK_REGIONS: V2Region[] = [
  {
    slug: "la-metropolis-cobre",
    nombre: "La Metropolis de Cobre",
    category: "Capital",
    tagline: "Capital industrial al borde sur de Eyira.",
    glyph: "MC",
    imageSrc: "/assets/atlas-v2/scenes/metropolis.webp",
    descripcion:
      "La gran ciudad de cobre funciona como centro de poder, comercio y maquinaria. Su presencia en el mapa queda marcada por vapor, rutas de abastecimiento y una influencia que se extiende mucho mas alla de sus murallas.",
    meta: {
      gobierno: "Consejo urbano y redes de gremios",
      poblacion: "Muy alta",
      industria: "Vapor, cobre y maquinaria",
      influencia: "Central",
    },
    pin: { x: 91.29, y: 88.78 },
    tone: "copper",
  },
  {
    slug: "santuario-libres",
    nombre: "El Santuario de los Libres",
    category: "Refugio",
    tagline: "Punto de reunion en el corazon del continente.",
    glyph: "SL",
    descripcion:
      "El Santuario de los Libres se lee como un lugar de paso, reunion y proteccion. Su posicion central lo vuelve una referencia natural para rutas, pactos temporales y decisiones que afectan a varias regiones.",
    meta: {
      gobierno: "Acuerdos locales",
      poblacion: "Media",
      industria: "Abastecimiento y refugio",
      influencia: "Regional",
    },
    pin: { x: 51.04, y: 60.19 },
    tone: "copper",
  },
  {
    slug: "arkala",
    nombre: "Arkala",
    category: "Ciudad del sur",
    tagline: "Asentamiento clave entre rutas secas y frontera.",
    glyph: "AK",
    descripcion:
      "Arkala controla un tramo sensible del sur, donde el terreno obliga a viajar con cuidado. Es una parada importante para caravanas, rumores de frontera y expediciones que cruzan zonas mas hostiles.",
    meta: {
      gobierno: "Autoridad local",
      poblacion: "Media",
      industria: "Comercio de ruta",
      influencia: "Fronteriza",
    },
    pin: { x: 64.92, y: 83.78 },
    tone: "gold",
  },
  {
    slug: "yggdrasil",
    nombre: "Yggdrasil",
    category: "Bosque antiguo",
    tagline: "Raiz y memoria viva en el oeste de Eyira.",
    glyph: "YG",
    descripcion:
      "Yggdrasil concentra una escala distinta del mundo: antigua, natural y dificil de dominar. En torno a su nombre se agrupan caminos, relatos y fuerzas que no responden del todo a los centros urbanos.",
    meta: {
      gobierno: "Custodios y pactos del bosque",
      poblacion: "Dispersa",
      industria: "Saberes naturales",
      influencia: "Antigua",
    },
    pin: { x: 16.75, y: 66.03 },
    tone: "moss",
  },
  {
    slug: "nararok",
    nombre: "Nararok",
    category: "Ciudad oriental",
    tagline: "Nodo duro en el este del mapa.",
    glyph: "NR",
    descripcion:
      "Nararok aparece lejos de los centros conocidos por el grupo, lo que le da peso como destino y amenaza potencial. Su ubicacion permite conectar conflictos del este con rutas de largo alcance.",
    meta: {
      gobierno: "Poder local",
      poblacion: "Media",
      industria: "Defensa y control territorial",
      influencia: "Estrategica",
    },
    pin: { x: 79.38, y: 26.97 },
    tone: "wine",
  },
  {
    slug: "murmek",
    nombre: "Murmek",
    category: "Ciudad norte",
    tagline: "Referencia urbana entre montanas y pasos frios.",
    glyph: "MK",
    descripcion:
      "Murmek sostiene una posicion al norte que sirve para ordenar rutas, climas y accesos dificiles. Es util como punto de lectura para viajes largos y movimientos de facciones.",
    meta: {
      gobierno: "Administracion local",
      poblacion: "Media",
      industria: "Paso de montana",
      influencia: "Local",
    },
    pin: { x: 21.96, y: 24 },
    tone: "petrol",
  },
  {
    slug: "lefayes-arrowhead",
    nombre: "Lefaye's Arrowhead",
    category: "Isla",
    tagline: "Punta aislada al oeste del continente.",
    glyph: "LF",
    descripcion:
      "Lefaye's Arrowhead queda separada del cuerpo principal de Eyira, ideal para tramas de viaje, aislamiento o informacion que llega tarde. En el mapa funciona como un extremo reconocible del mundo jugado.",
    meta: {
      gobierno: "Desconocido",
      poblacion: "Baja",
      industria: "Navegacion y escala",
      influencia: "Aislada",
    },
    pin: { x: 17.01, y: 77.33 },
    tone: "petrol",
  },
];
