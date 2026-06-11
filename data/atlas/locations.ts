// data/atlas/locations.ts
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
  /** True para lugares sin marker físico en el mapa (subterráneos, planos externos, etc).
      Aparecen en /v2/lugares (listado) pero NO como pin en /v2/mapa. */
  hideFromMap?: boolean;
};

export const MOCK_REGIONS: V2Region[] = [
  {
    slug: "la-metropolis-cobre",
    nombre: "La Metropolis de Cobre",
    category: "Capital",
    tagline: "Capital industrial al borde sur de Eyira.",
    glyph: "MC",
    imageSrc: "/assets/atlas/scenes/metropolis.webp",
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
  {
    slug: "underdark",
    nombre: "Underdark",
    category: "Subterráneo",
    tagline: "Red de cavernas bajo el plano material.",
    glyph: "UD",
    descripcion:
      "El Underdark se extiende como un mundo subterráneo paralelo al plano material. Hogar de los drow, dwarves de las profundidades y criaturas que rara vez ven la luz del sol.",
    meta: {
      gobierno: "Casas drow y enclaves dwarf",
      poblacion: "Variable",
      industria: "Minería y tráfico de secretos",
      influencia: "Oculta",
    },
    pin: { x: 56, y: 92 },
    tone: "petrol",
    hideFromMap: true,
  },
  {
    slug: "coven-negro",
    nombre: "Coven Negro",
    category: "Coven",
    tagline: "Coven de brujas en el Bosque Petrificado.",
    glyph: "CN",
    descripcion:
      "El Coven Negro se establece en las ruinas del Bosque Petrificado, donde la magia oscura encuentra resonancia. Sus prácticas marcan la zona de influencia y la temen quienes cruzan sus caminos.",
    meta: {
      gobierno: "Coven",
      poblacion: "Baja",
      industria: "Brujería oscura",
      influencia: "Regional",
    },
    pin: { x: 32, y: 50 },
    tone: "wine",
    hideFromMap: true,
  },
  {
    slug: "coven-rojo",
    nombre: "Coven Rojo",
    category: "Coven",
    tagline: "Coven de origen de Mysha.",
    glyph: "CR",
    descripcion:
      "El Coven Rojo es la cuna de varias brujas de sangre. Su simbolismo y su historia atraviesan el arco de Mysha y dejan marca en lo que vendrá.",
    meta: {
      gobierno: "Coven",
      poblacion: "Baja",
      industria: "Brujería de sangre",
      influencia: "Regional",
    },
    pin: { x: 38, y: 46 },
    tone: "wine",
    hideFromMap: true,
  },
  {
    slug: "bosque-memorias",
    nombre: "Bosque de las Memorias",
    category: "Bosque arcano",
    tagline: "Bosque vivo que guarda los recuerdos del mundo.",
    glyph: "BM",
    descripcion:
      "El Bosque de las Memorias es uno de los lugares más antiguos del continente. Su biblioteca, sus ruinas y el árbol central marcan un punto de tensión entre custodia, olvido y revelación.",
    meta: {
      gobierno: "Druidas y custodios",
      poblacion: "Dispersa",
      industria: "Memoria y biblioteca",
      influencia: "Antigua",
    },
    pin: { x: 26.53, y: 80.44 },
    tone: "moss",
  },
  {
    slug: "gleetjeris",
    nombre: "Gleetjeris",
    category: "Pueblo de hielo",
    tagline: "Pueblo en las cuevas heladas del norte.",
    glyph: "GL",
    descripcion:
      "Gleetjeris se aferra a la vida entre cuevas de hielo y montañas heladas. Su economía gira en torno a la caza y al paso de viajeros que necesitan refugio del clima extremo.",
    meta: {
      gobierno: "Autoridad local",
      poblacion: "Baja",
      industria: "Caza y refugio",
      influencia: "Local",
    },
    pin: { x: 28, y: 14 },
    tone: "petrol",
    hideFromMap: true,
  },
  {
    slug: "mar-leviatan",
    nombre: "Mar del Leviatán",
    category: "Mar",
    tagline: "Mar profundo donde acecha el Leviatán.",
    glyph: "ML",
    descripcion:
      "El Mar del Leviatán es ruta y tumba a la vez. Sus aguas conectan con el Plano de Agua y guardan barcos perdidos, ciudades sumergidas y la sombra de la criatura que le da nombre.",
    meta: {
      gobierno: "Ninguno",
      poblacion: "Tripulaciones de paso",
      industria: "Pesca peligrosa y portales",
      influencia: "Profunda",
    },
    pin: { x: 63.75, y: 49.31 },
    tone: "petrol",
  },
  {
    slug: "lorenza",
    nombre: "Lorenza",
    category: "Minas dwarf",
    tagline: "Aldea minera al pie de las montañas.",
    glyph: "LZ",
    descripcion:
      "Lorenza vive de la mina y para la mina. Sus túneles conectan con cámaras antiguas y la entrada al Kelgrim, el último bastión de su pueblo cuando el resto se perdió.",
    meta: {
      gobierno: "Concejo minero",
      poblacion: "Media",
      industria: "Minería y forja",
      influencia: "Sectorial",
    },
    pin: { x: 90.79, y: 78.42 },
    tone: "copper",
  },
  {
    slug: "plano-abisal",
    nombre: "Plano Abisal",
    category: "Plano externo",
    tagline: "El plano infinito de la corrupción y el caos.",
    glyph: "PA",
    descripcion:
      "El Plano Abisal se ramifica en capas sin fin, cada una más profunda que la anterior. Pazunia es solo la entrada. Cualquier intrusión en este plano marca a quien la realiza, dentro y fuera.",
    meta: {
      gobierno: "Señores demoníacos",
      poblacion: "Innumerable",
      industria: "Conquista y corrupción",
      influencia: "Cósmica",
    },
    pin: { x: 95, y: 8 },
    tone: "wine",
    hideFromMap: true,
  },
  {
    slug: "feywilds",
    nombre: "Feywilds",
    category: "Plano feérico",
    tagline: "El plano de las hadas, la naturaleza salvaje y el capricho.",
    glyph: "FW",
    descripcion:
      "Las Feywilds son un reflejo distorsionado del plano material donde la naturaleza crece sin freno, las estaciones cambian por voluntad de sus señores y el tiempo se comporta como le place. Aquí se encuentran las Ruinas de Ravinac, la Isla de las Estaciones y el Trono de Ambrosía.",
    meta: {
      gobierno: "Cortes feéricas",
      poblacion: "Incontable",
      industria: "Magia natural y capricho",
      influencia: "Planar",
    },
    pin: { x: 10, y: 10 },
    tone: "moss",
    hideFromMap: true,
  },
  {
    slug: "desierto-espejos",
    nombre: "Desierto de los Espejos",
    category: "Desierto",
    tagline: "Extensión de arena donde el cielo refleja otros planos.",
    glyph: "DE",
    descripcion:
      "El Desierto de los Espejos es una extensión de dunas donde el cielo nocturno refleja visiones del Plano Astral. Las caravanas lo cruzan con prisa y los viajeros reportan ver cosas que no deberían existir entre las tormentas de arena.",
    meta: {
      gobierno: "Ninguno",
      poblacion: "Nómada",
      industria: "Paso de caravanas",
      influencia: "Fronteriza",
    },
    pin: { x: 42.5, y: 72.5 },
    tone: "gold",
  },
  {
    slug: "el-diablillo",
    nombre: "El Diablillo",
    category: "Navío",
    tagline: "Barco de guerra que surca el Mar del Leviatán.",
    glyph: "ED",
    descripcion:
      "El Diablillo es un navío de guerra que navega las aguas del Mar del Leviatán. Sus múltiples cubiertas han sido escenario de batallas, negociaciones y descubrimientos que cambiaron el rumbo de la campaña.",
    meta: {
      gobierno: "Capitán del barco",
      poblacion: "Tripulación",
      industria: "Guerra naval y transporte",
      influencia: "Móvil",
    },
    pin: { x: 58, y: 55 },
    tone: "copper",
    hideFromMap: true,
  },
  {
    slug: "syranus",
    nombre: "Syranus",
    category: "Ruinas en la selva",
    tagline: "Ruinas antiguas ocultas en el Bosque de las Memorias.",
    glyph: "SY",
    descripcion:
      "Syranus yace entre la vegetación espesa del Bosque de las Memorias. Sus ruinas cubiertas de enredaderas guardan secretos anteriores a la memoria escrita del continente.",
    meta: {
      gobierno: "Abandonado",
      poblacion: "Ninguna",
      industria: "Ruinas y reliquias",
      influencia: "Olvidada",
    },
    pin: { x: 24, y: 78 },
    tone: "moss",
    hideFromMap: true,
  },
  {
    slug: "zona-corrupcion",
    nombre: "Zona de Corrupción",
    category: "Tierra corrupta",
    tagline: "Territorio donde la realidad se pudre desde adentro.",
    glyph: "ZC",
    descripcion:
      "La Zona de Corrupción es un territorio donde la influencia abisal o demoníaca ha deformado la tierra misma. La flora, la fauna y hasta el terreno muestran señales de una enfermedad que no responde a cura natural.",
    meta: {
      gobierno: "Ninguno",
      poblacion: "Criaturas corruptas",
      industria: "Ninguna",
      influencia: "Contaminante",
    },
    pin: { x: 45, y: 40 },
    tone: "wine",
    hideFromMap: true,
  },
  {
    slug: "far-realm",
    nombre: "Far Realm",
    category: "Plano externo",
    tagline: "Lo que existe más allá de la realidad comprensible.",
    glyph: "FR",
    descripcion:
      "El Far Realm es lo que queda cuando se cruzan todos los planos conocidos y se sigue avanzando. Las leyes de la física, la magia y la cordura no aplican aquí. Los Nautiloides navegan sus aguas imposibles.",
    meta: {
      gobierno: "Incomprensible",
      poblacion: "Entidades aberrantes",
      industria: "Ninguna conocida",
      influencia: "Cósmica",
    },
    pin: { x: 92, y: 5 },
    tone: "wine",
    hideFromMap: true,
  },
  {
    slug: "sigil",
    nombre: "Sigil",
    category: "Ciudad planar",
    tagline: "La Ciudad de las Puertas, centro del multiverso.",
    glyph: "SG",
    descripcion:
      "Sigil flota en el centro del multiverso como un anillo imposible. Cada puerta en sus calles puede llevar a cualquier plano de existencia. La Señora del Dolor gobierna en silencio y nadie la desafía dos veces.",
    meta: {
      gobierno: "La Señora del Dolor",
      poblacion: "Multiversal",
      industria: "Comercio planar y portales",
      influencia: "Universal",
    },
    pin: { x: 88, y: 5 },
    tone: "petrol",
    hideFromMap: true,
  },
  {
    slug: "aldea-molinos",
    nombre: "Aldea de Molinos",
    category: "Pueblo",
    tagline: "Pueblo rural de molinos y campos tranquilos.",
    glyph: "AM",
    descripcion:
      "La Aldea de Molinos es un asentamiento rural donde la vida gira alrededor de la cosecha y los molinos de viento. Un lugar aparentemente simple que guarda más de lo que muestra a primera vista.",
    meta: {
      gobierno: "Alcalde local",
      poblacion: "Baja",
      industria: "Agricultura y molienda",
      influencia: "Local",
    },
    pin: { x: 55, y: 68 },
    tone: "gold",
  },
  {
    slug: "dinastia-alas-metalicas",
    nombre: "Dinastía de las Alas Metálicas",
    category: "Reino dragón",
    tagline: "Territorio ancestral de los dragones metálicos.",
    glyph: "DA",
    descripcion:
      "La Dinastía de las Alas Metálicas es el dominio de los dragones metálicos. Aldam y Dracan son sus bastiones principales, ciudades donde la escala de todo recuerda que los verdaderos dueños miden decenas de metros.",
    meta: {
      gobierno: "Concilio dragón",
      poblacion: "Dragones y siervos",
      industria: "Custodia y conocimiento",
      influencia: "Continental",
    },
    pin: { x: 72, y: 18 },
    tone: "gold",
  },
  {
    slug: "oceano-tesoros-perdidos",
    nombre: "Océano de los Tesoros Perdidos",
    category: "Océano",
    tagline: "Aguas profundas donde yacen reliquias de eras pasadas.",
    glyph: "OT",
    descripcion:
      "El Océano de los Tesoros Perdidos se extiende como una inmensidad azul donde barcos hundidos, ciudades sumergidas y cofres olvidados esperan bajo la superficie. Pocos vuelven con lo que buscaban.",
    meta: {
      gobierno: "Ninguno",
      poblacion: "Criaturas marinas",
      industria: "Naufragios y leyendas",
      influencia: "Abisal",
    },
    pin: { x: 35, y: 50 },
    tone: "petrol",
  },
];
