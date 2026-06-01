// data/atlas-v2/archives.ts
// Datos curados temporales para la primera pasada visual de /v2/archivos.

export type V2CollectionTone = "copper" | "gold" | "moss" | "petrol" | "wine";

export type V2Collection = {
  slug: string;
  nombre: string;
  count: number;
  code: string;
  description: string;
  tone: V2CollectionTone;
};

export type V2Document = {
  id: string;
  collectionSlug: string;
  eyebrow: string;
  titulo: string;
  numero: string;
  descripcion: string;
  fragmento: string;
  tags: string[];
  meta: {
    origen: string;
    fecha: string;
    autor: string;
    material: string;
    estado: string;
    clasificacion: string;
    acceso: string;
  };
  imageSrc: string;
  paginacion: { actual: number; total: number };
};

const CODEX = "/assets/atlas-v2/documents/_placeholder-codex.svg";
const PLANES = "/assets/atlas-v2/documents/cosmology-planes.jpg";

export const MOCK_COLLECTIONS: V2Collection[] = [
  {
    slug: "cronicas-de-bronce",
    nombre: "Cronicas de Bronce",
    count: 12,
    code: "CB",
    description: "Relatos reconstruidos de la campana.",
    tone: "copper",
  },
  {
    slug: "diarios-personales",
    nombre: "Diarios personales",
    count: 27,
    code: "DP",
    description: "Notas privadas, cartas incompletas y voces parciales.",
    tone: "gold",
  },
  {
    slug: "registros-mecanicos",
    nombre: "Registros mecanicos",
    count: 18,
    code: "RM",
    description: "Bitacoras, relojes, inventarios y maquinas.",
    tone: "petrol",
  },
  {
    slug: "cartas-y-mensajes",
    nombre: "Cartas y mensajes",
    count: 34,
    code: "CM",
    description: "Correspondencia interceptada o preservada.",
    tone: "copper",
  },
  {
    slug: "manuscritos-antiguos",
    nombre: "Manuscritos antiguos",
    count: 9,
    code: "MA",
    description: "Textos previos a los registros modernos.",
    tone: "moss",
  },
  {
    slug: "mapas-y-planos",
    nombre: "Mapas y planos",
    count: 6,
    code: "MP",
    description: "Cartografia, rutas, planos y cosmologias.",
    tone: "petrol",
  },
  {
    slug: "artefactos-y-reliquias",
    nombre: "Artefactos y reliquias",
    count: 11,
    code: "AR",
    description: "Fichas de objetos, restos y piezas activas.",
    tone: "gold",
  },
  {
    slug: "textos-prohibidos",
    nombre: "Textos prohibidos",
    count: 4,
    code: "TP",
    description: "Registros censurados o de acceso negado.",
    tone: "wine",
  },
];

export const MOCK_DOCUMENTS: V2Document[] = [
  {
    id: "doc-001",
    collectionSlug: "cronicas-de-bronce",
    eyebrow: "Cronicas de Bronce",
    titulo: "La Aguja Doble",
    numero: "Documento 012",
    descripcion:
      "La ciudad reanima el aliento. Sobre vapor, sal y metal, un acento olvidado intenta coser los hilos del pasado con los del presente.\n\nLo que parecia concedido bajo capas de oxido y mecanica vuelve a vibrar bajo la superficie. El archivo conserva este registro como una cronica incomoda, marcada por notas cruzadas y sellos retirados.",
    fragmento: "La verdad, como el vapor, se escapa por las grietas de quienes no la contienen.",
    tags: ["Ciudad de Bronce", "Secreto", "Espionaje", "Memoria"],
    meta: {
      origen: "Biblioteca de Bronce",
      fecha: "1059, aprox.",
      autor: "Cronista anonimo",
      material: "Papel mojado y tinta ferrosa",
      estado: "Erosionado",
      clasificacion: "Restringido",
      acceso: "Investigadores autorizados",
    },
    imageSrc: CODEX,
    paginacion: { actual: 12, total: 342 },
  },
  {
    id: "doc-002",
    collectionSlug: "diarios-personales",
    eyebrow: "Diarios personales",
    titulo: "El cuaderno de Annora",
    numero: "Documento 003",
    descripcion:
      "Fragmentos de un diario personal hallado entre los efectos de Annora. Las paginas estan manchadas y la tinta se diluye en varios lugares; lo que queda legible alcanza para inquietar a tres archivistas.",
    fragmento: "Si me lees, no me busques. Y si me has buscado, ya no soy quien fui.",
    tags: ["Annora", "Hermandad de Cobre", "Diario", "Reliquia"],
    meta: {
      origen: "Confiscacion posterior a la batalla",
      fecha: "1066",
      autor: "Annora",
      material: "Cuaderno de cuero",
      estado: "Danado por agua",
      clasificacion: "Confidencial",
      acceso: "Personal autorizado",
    },
    imageSrc: CODEX,
    paginacion: { actual: 3, total: 342 },
  },
  {
    id: "doc-003",
    collectionSlug: "registros-mecanicos",
    eyebrow: "Registros mecanicos",
    titulo: "Bitacora de la Aguja Doble",
    numero: "Documento 007",
    descripcion:
      "Registro tecnico de los movimientos del reloj central de la Metropolis. Las anotaciones a mano contradicen los reportes oficiales; alguien tacho las desviaciones con tinta de otra epoca.",
    fragmento: "El mecanismo nunca falla. Es el tiempo el que se mueve.",
    tags: ["Mecanismo", "Reloj", "Bronce", "Cobre"],
    meta: {
      origen: "Metropolis de Cobre",
      fecha: "1065",
      autor: "Ingeniero Veltra",
      material: "Pergamino de bronce repujado",
      estado: "Buen estado",
      clasificacion: "Publica",
      acceso: "Libre",
    },
    imageSrc: CODEX,
    paginacion: { actual: 7, total: 342 },
  },
  {
    id: "doc-004",
    collectionSlug: "cartas-y-mensajes",
    eyebrow: "Cartas y mensajes",
    titulo: "Carta al Coven Rosa",
    numero: "Documento 021",
    descripcion:
      "Carta interceptada en el cruce del Velo. El sello fue forzado y restaurado con cera de otra mano; la firma es de Mysha, pero la letra no termina de pertenecerle del todo.",
    fragmento: "No es magia lo que cruza. Es memoria que se niega a quedarse atras.",
    tags: ["Mysha", "Coven Rosa", "Velo", "Correspondencia"],
    meta: {
      origen: "Cruce del Velo",
      fecha: "1067",
      autor: "Mysha, firma cuestionada",
      material: "Papel ceroso, sello violado",
      estado: "Restaurado",
      clasificacion: "Restringido",
      acceso: "Investigadores autorizados",
    },
    imageSrc: CODEX,
    paginacion: { actual: 21, total: 342 },
  },
  {
    id: "doc-005",
    collectionSlug: "manuscritos-antiguos",
    eyebrow: "Manuscritos antiguos",
    titulo: "Tratado del Velo",
    numero: "Documento 002",
    descripcion:
      "Uno de los pocos textos previos a la fundacion de la Metropolis. Hipotetiza sobre el origen del Velo y sus consecuencias en el sueno de los familiares.",
    fragmento: "El Velo no es muro. Es respiracion.",
    tags: ["Velo", "Familiar", "Origen", "Cosmologia"],
    meta: {
      origen: "Ruinas del Templo Sin Nombre",
      fecha: "Pre-fundacion",
      autor: "Desconocido",
      material: "Lino encerado",
      estado: "Fragil",
      clasificacion: "Reliquia",
      acceso: "Custodios del archivo",
    },
    imageSrc: CODEX,
    paginacion: { actual: 2, total: 342 },
  },
  {
    id: "doc-006",
    collectionSlug: "mapas-y-planos",
    eyebrow: "Mapas y planos",
    titulo: "Rueda de los Planos",
    numero: "Documento 004",
    descripcion:
      "Diagrama cosmologico usado para explicar planos superiores, inferiores y zonas de transito. El archivo conserva esta copia como apoyo visual hasta que el DM entregue una version propia.",
    fragmento: "Todo plano promete distancia, pero todos terminan tocando el centro.",
    tags: ["Mapa", "Planos", "Cosmologia", "Velo"],
    meta: {
      origen: "Inventario de planos",
      fecha: "Disputada",
      autor: "Cartografo anonimo",
      material: "Lamina restaurada",
      estado: "Buen estado",
      clasificacion: "Consulta",
      acceso: "Libre",
    },
    imageSrc: PLANES,
    paginacion: { actual: 4, total: 342 },
  },
  {
    id: "doc-007",
    collectionSlug: "artefactos-y-reliquias",
    eyebrow: "Artefactos y reliquias",
    titulo: "Catalogo del Engranaje Vivo",
    numero: "Documento 009",
    descripcion:
      "Catalogacion de un engranaje hallado entre restos de batalla. Late con un ritmo irregular y no responde a ninguna mecanica conocida.",
    fragmento: "Lo que late no siempre vive. A veces solo recuerda.",
    tags: ["Reliquia", "Engranaje", "Annora", "Arcano"],
    meta: {
      origen: "Efectos confiscados",
      fecha: "1066",
      autor: "Custodios del archivo",
      material: "Bronce con nucleo desconocido",
      estado: "Activo",
      clasificacion: "Restringido",
      acceso: "Bajo escolta",
    },
    imageSrc: CODEX,
    paginacion: { actual: 9, total: 342 },
  },
  {
    id: "doc-008",
    collectionSlug: "textos-prohibidos",
    eyebrow: "Textos prohibidos",
    titulo: "La Tercera Cuenta de Mysha",
    numero: "Documento 001",
    descripcion:
      "Texto atribuido a Veltra. Catalogado como prohibido por mencionar el Velo y nombres que el Coven Blanco no autoriza pronunciar.",
    fragmento: "Soy tres y soy una. Y ninguna de mi ha pedido perdon.",
    tags: ["Mysha", "Veltra", "Prohibido", "Coven"],
    meta: {
      origen: "Confiscacion del Coven Blanco",
      fecha: "1067",
      autor: "Veltra",
      material: "Papel quemado en bordes",
      estado: "Censurado parcial",
      clasificacion: "Prohibido",
      acceso: "Acceso denegado",
    },
    imageSrc: CODEX,
    paginacion: { actual: 1, total: 342 },
  },
];
