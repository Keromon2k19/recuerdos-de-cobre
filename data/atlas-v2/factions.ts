// data/atlas-v2/factions.ts - Datos curados para /v2/facciones.
// Basado en facciones existentes del vault; se reemplaza por una fuente
// dinamica cuando la UI V2 pase de mock visual a integracion completa.

export type V2FactionCategory =
  | "Grupo protagonista"
  | "Gremio"
  | "Coven"
  | "Amenaza"
  | "Alianza antigua"
  | "Fuerza militar";

export type V2FactionRelation = {
  label: string;
  detail: string;
};

export type V2FactionFigure = {
  nombre: string;
  slug?: string;
  rol: string;
};

export type V2Faction = {
  slug: string;
  nombre: string;
  sigil: string;
  categoria: V2FactionCategory;
  estado: string;
  alcance: string;
  apariciones: number;
  descripcion: string;
  foco: string;
  tono: "ally" | "coven" | "threat" | "ancient" | "military";
  imageSrc?: string;
  figures: V2FactionFigure[];
  relaciones: V2FactionRelation[];
  tags: string[];
};

export const MOCK_FACTIONS: V2Faction[] = [
  {
    slug: "te-de-medianoche",
    nombre: "Te de Medianoche",
    sigil: "TM",
    categoria: "Grupo protagonista",
    estado: "Activo",
    alcance: "Grupo viajero",
    apariciones: 36,
    descripcion:
      "Nombre adoptado por el grupo protagonista desde el episodio 22. A partir de ahi funciona como identidad comun para viajes, pactos, rescates y negociaciones.",
    foco: "Identidad del grupo, decisiones compartidas y memoria de ruta.",
    tono: "ally",
    figures: [
      { nombre: "Mysha", slug: "mysha", rol: "Bruja de sangre" },
      { nombre: "Io Campbell", slug: "io-campbell", rol: "Mecanico" },
      { nombre: "Borok", slug: "borok", rol: "Mercenario" },
    ],
    relaciones: [
      {
        label: "Origen",
        detail: "El nombre nace tras una conversacion sobre identidad comun.",
      },
      {
        label: "Trayecto",
        detail: "Cruza Arkala, el Santuario, Feywild y la Carcel Viviente.",
      },
      {
        label: "Funcion",
        detail: "Da una firma reconocible a un grupo que cambia de alianzas por arco.",
      },
    ],
    tags: ["grupo", "viaje", "alianzas"],
  },
  {
    slug: "hermandad-de-cobre",
    nombre: "Hermandad de Cobre",
    sigil: "HC",
    categoria: "Gremio",
    estado: "Activa",
    alcance: "Metropolis de Cobre",
    apariciones: 22,
    descripcion:
      "Red escondida bajo el casino Plumas Doradas. Recluta al grupo, opera rutas por alcantarillas y se presenta como hermandad multirracial contra la corrupcion.",
    foco: "Misiones, refugio, pagos, informacion y artefactos.",
    tono: "ally",
    figures: [
      { nombre: "Annora", slug: "annora", rol: "Lider visible" },
      { nombre: "Darko", slug: "darko", rol: "Investigador" },
      { nombre: "Io Campbell", slug: "io-campbell", rol: "Miembro" },
    ],
    relaciones: [
      {
        label: "Marca",
        detail: "Usa simbolos de pluma dorada y contratos de sangre.",
      },
      {
        label: "Metodo",
        detail: "Infiltracion politica legal, refugio y trabajo encubierto.",
      },
      {
        label: "Tension",
        detail: "Es odiada en algunos sectores de la zona de las capas.",
      },
    ],
    tags: ["gremio", "metropolis", "annora"],
  },
  {
    slug: "coven-rojo",
    nombre: "Coven Rojo",
    sigil: "CR",
    categoria: "Coven",
    estado: "Destruido",
    alcance: "Tradicion de sangre",
    apariciones: 24,
    descripcion:
      "Origen de Mysha y de su magia de sangre. Sus rituales usan sangre, raices y un arbol sagrado; su historia queda marcada por la masacre, los caminantes etereos y la disputa por el ritual de ascension.",
    foco: "Sangre, memoria, plano etereo y herencia de matriarcas.",
    tono: "coven",
    imageSrc: "/assets/atlas-v2/factions/coven-rojo.png",
    figures: [
      { nombre: "Mysha", slug: "mysha", rol: "Sobreviviente" },
      { nombre: "Sina", rol: "Matriarca vinculada" },
      { nombre: "Lexia", slug: "lexia", rol: "Opositora" },
    ],
    relaciones: [
      {
        label: "Rito",
        detail: "La iniciada ofrece sangre y recibe una varita nacida de savia.",
      },
      {
        label: "Lugar sagrado",
        detail: "El Salon de Sangre guarda el centro ritual del coven.",
      },
      {
        label: "Conflicto",
        detail: "El Coven Verde acusa una traicion antigua ligada al ascenso.",
      },
    ],
    tags: ["coven", "mysha", "sangre"],
  },
  {
    slug: "coven-rosa",
    nombre: "Coven Rosa",
    sigil: "CO",
    categoria: "Coven",
    estado: "Historico",
    alcance: "Runas de Mystra",
    apariciones: 2,
    descripcion:
      "Nombre original asociado al linaje del Coven Rojo. Sus registros conectan runas de Mystra, contencion de caminantes etereos y la presentacion del ritual de ascension.",
    foco: "Memoria anterior del coven y lectura historica de la ascension.",
    tono: "coven",
    figures: [
      { nombre: "Mysha", slug: "mysha", rol: "Heredera" },
      { nombre: "Mystra", rol: "Influencia divina" },
    ],
    relaciones: [
      {
        label: "Archivo",
        detail: "Aparece como lectura clave del pasado del Coven Rojo.",
      },
      {
        label: "Ritual",
        detail: "Su matriarca presento el ritual de ascension con apoyo de Mystra.",
      },
    ],
    tags: ["coven", "mystra", "ascension"],
  },
  {
    slug: "coven-negro",
    nombre: "Coven Negro",
    sigil: "CN",
    categoria: "Coven",
    estado: "Sitiado",
    alcance: "Sombras y defensa",
    apariciones: 6,
    descripcion:
      "Comunidad a la que Selenne debe dirigirse tras la advertencia del familiar. Mas adelante queda asociada a tecnicas de sombras, a las Lagrimas de Selune y a la resistencia contra el Wendigo.",
    foco: "Sombras, supervivencia y reconstruccion tras la profanacion.",
    tono: "coven",
    figures: [
      { nombre: "Narcissa", slug: "narcissa", rol: "Vinculo de coven" },
      { nombre: "Aerion", rol: "Representante reciente" },
      { nombre: "Melissa", rol: "Lider comunitaria" },
    ],
    relaciones: [
      {
        label: "Amenaza",
        detail: "Queda bajo presion del Wendigo y canibales tras la profanacion.",
      },
      {
        label: "Tecnica",
        detail: "Mysha aprende una primera tecnica de sombras vinculada a este umbral.",
      },
    ],
    tags: ["coven", "sombras", "wendigo"],
  },
  {
    slug: "coven-verde",
    nombre: "Coven Verde",
    sigil: "CV",
    categoria: "Coven",
    estado: "Hostil",
    alcance: "Naturaleza y maldicion",
    apariciones: 5,
    descripcion:
      "Coven de Lexia, identificado entre restos antiguos y luego como fuerza invasora. Se opuso al ritual de ascension y su maldicion queda ligada al sangrado de Mysha al lanzar magia.",
    foco: "Oposicion al ritual de ascension y ruptura del balance espiritual.",
    tono: "coven",
    figures: [
      { nombre: "Lexia", slug: "lexia", rol: "Lider invasora" },
      { nombre: "Druidia", rol: "Origen de la acusacion" },
    ],
    relaciones: [
      {
        label: "Ataque",
        detail: "Usa rehenes, lanzas encendidas y lianas con pinches en la masacre.",
      },
      {
        label: "Maldicion",
        detail: "Reacciona contra la magia espiritual por romper el balance.",
      },
    ],
    tags: ["coven", "lexia", "druidia"],
  },
  {
    slug: "los-nefarios",
    nombre: "Los Nefarios",
    sigil: "LN",
    categoria: "Amenaza",
    estado: "Activos",
    alcance: "Red criminal",
    apariciones: 8,
    descripcion:
      "Organizacion criminal o mercenaria vinculada al Caliz, al mercado oscuro, a puertas secretas y a represalias sangrientas. Su sombra alcanza a Raylen, Breos y El Corruptor.",
    foco: "Contratos, amenazas, castigos ejemplares y conexiones abisales.",
    tono: "threat",
    figures: [
      { nombre: "El Corruptor", slug: "el-corruptor", rol: "Lider asociado" },
      { nombre: "Raylen", slug: "raylen", rol: "Pasado perseguido" },
      { nombre: "Breos", slug: "breos", rol: "Presion local" },
    ],
    relaciones: [
      {
        label: "Represalia",
        detail: "La carta y los cuerpos funcionan como advertencia contra Raylen.",
      },
      {
        label: "Rastro",
        detail: "Aparecen ligados a El Ensueno, el Caliz y una mansion abisal.",
      },
    ],
    tags: ["amenaza", "abisal", "raylen"],
  },
  {
    slug: "nueve-puntas-de-eira",
    nombre: "Nueve Puntas de Eira",
    sigil: "9P",
    categoria: "Alianza antigua",
    estado: "Revelada",
    alcance: "Faccion divina antigua",
    apariciones: 4,
    descripcion:
      "Una de las tres alianzas divinas antiguas, junto al Pacto del Eclipse y la Alianza del Equilibrio. Su marca aparece en Khelgrim y la biblioteca de Solaria revela su composicion.",
    foco: "Guerra antigua, campeones de Vecna y memoria borrada del plano material.",
    tono: "ancient",
    figures: [
      { nombre: "Raven Queen", rol: "Deidad" },
      { nombre: "Tyr", rol: "Deidad" },
      { nombre: "Mystra", rol: "Deidad" },
    ],
    relaciones: [
      {
        label: "Composicion",
        detail: "Incluye Raven Queen, Mystra, Asmodeus, Tyr, Selune, Luzne, Moradin, Lefaye, Bahamut y el Dios de Dioses.",
      },
      {
        label: "Eco moderno",
        detail: "La alianza politica de Annora replica parte del nucleo antiguo.",
      },
    ],
    tags: ["dioses", "khelgrim", "vecna"],
  },
  {
    slug: "ejercito-de-la-libertad",
    nombre: "Ejercito de la Libertad",
    sigil: "EL",
    categoria: "Fuerza militar",
    estado: "Activo",
    alcance: "Renegados",
    apariciones: 13,
    descripcion:
      "Fuerza historica respetada como liberadora de semi-orcos y semi-elfos. Planea intervenir en el pueblo de Layra y aparece representada por figuras militares en reuniones politicas.",
    foco: "Intervencion militar, proteccion y presion politica.",
    tono: "military",
    figures: [
      { nombre: "Amari Zaled", rol: "Teniente coronel" },
      { nombre: "Safira Nyerovik", rol: "Representante" },
      { nombre: "Layra", slug: "layra", rol: "Vinculo tactico" },
    ],
    relaciones: [
      {
        label: "Operacion",
        detail: "Espera informacion de Layra para actuar contra el dragon rojo.",
      },
      {
        label: "Red",
        detail: "Se vincula con Halcones Grises y movimientos cerca de la aldea de Io.",
      },
    ],
    tags: ["militar", "renegados", "layra"],
  },
  {
    slug: "los-renegados",
    nombre: "Los Renegados",
    sigil: "LR",
    categoria: "Fuerza militar",
    estado: "Activos",
    alcance: "Tribu nomada",
    apariciones: 6,
    descripcion:
      "Tribu nomada de semirrazas y gente no bienvenida en otros lados. Borok viene de ese mundo y la Voz de Yggdrasil los representa en discusiones politicas mayores.",
    foco: "Exilio, supervivencia nomada y alianzas contra amenazas continentales.",
    tono: "military",
    imageSrc: "/assets/atlas-v2/factions/los-renegados.jpg",
    figures: [
      { nombre: "Borok", slug: "borok", rol: "Origen personal" },
      { nombre: "Voz de Yggdrasil", rol: "Representante" },
      { nombre: "Armola Caihana", rol: "Lider" },
    ],
    relaciones: [
      {
        label: "Historia",
        detail: "Vinculados a marcas de Vecna, pesadillas y movimientos de tropas elficas.",
      },
      {
        label: "Politica",
        detail: "Participan en discusiones sobre el Emperador, el Corruptor y la revolucion.",
      },
    ],
    tags: ["borok", "nomadas", "renegados"],
  },
];
