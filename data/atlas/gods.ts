// data/atlas/gods.ts - Datos curados para /v2/dioses.
// Basado en _glossary.md, worldbuilding y facciones del vault.
// Se reemplaza por una fuente dinamica cuando la UI V2 pase a integracion real.

export type V2DivineAlliance =
  | "Nueve Puntas de Eira"
  | "Pacto del Eclipse"
  | "Alianza del Equilibrio"
  | "Figura velada";

export type V2GodTone =
  | "memory"
  | "arcane"
  | "justice"
  | "moon"
  | "flame"
  | "death"
  | "secret"
  | "dragon"
  | "storm"
  | "origin";

export type V2GodPlace = {
  nombre: string;
  detalle: string;
};

export type V2GodLoreLink = {
  label: string;
  detail: string;
  href?: string;
};

export type V2God = {
  slug: string;
  nombre: string;
  titulo: string;
  sigil: string;
  symbolSrc?: string;
  alliance: V2DivineAlliance;
  estado: string;
  domains: string[];
  principles: string[];
  sacredSymbol: string;
  sacredPlaces: V2GodPlace[];
  linkedLore: V2GodLoreLink[];
  profile: string;
  quote: string;
  tension: string;
  tone: V2GodTone;
  primaryHref: string;
};

export const MOCK_GODS: V2God[] = [
  {
    slug: "raven-queen",
    nombre: "Raven Queen",
    titulo: "Primera matriarca ascendida",
    sigil: "RQ",
    alliance: "Nueve Puntas de Eira",
    estado: "Activa en memoria, almas y secretos",
    domains: ["Recuerdos", "Almas", "Frio", "Sacrificio"],
    principles: [
      "La memoria puede proteger tanto como condenar.",
      "Los secretos sostienen pactos antiguos.",
      "La muerte deja deudas que no siempre descansan.",
    ],
    sacredSymbol: "Corona, pluma y circulo de memoria",
    sacredPlaces: [
      {
        nombre: "Shadowlands",
        detalle: "Plano asociado a almas castigadas y traiciones contra la Reina Cuervo.",
      },
      {
        nombre: "Coven Rojo",
        detalle: "Tradicion donde su ascension aparece como centro de la historia antigua.",
      },
      {
        nombre: "Coven Negro",
        detalle: "Destino marcado por su familiar abandonado y por la defensa de la memoria.",
      },
    ],
    linkedLore: [
      {
        label: "Familiar abandonado",
        detail: "El Wendigo aparece como resto duplicado o dejado atras tras su ascension.",
        href: "/v2/mundo/familiar-de-la-raven-queen",
      },
      {
        label: "Borrado historico",
        detail: "Junto a Tyr, queda vinculada al ocultamiento de hechos antiguos.",
        href: "/v2/mundo/borrado-historico",
      },
    ],
    profile:
      "Figura central del pasado del Coven Rojo. Su ascension esta atada al Ritual de Ascension, al borrado de recuerdos y a una lectura incomoda de la historia oficial.",
    quote:
      "No todo recuerdo debe volver intacto; algunos vuelven como deuda.",
    tension:
      "Su culto protege secretos que el grupo necesita entender, pero revelarlos puede romper pactos antiguos.",
    tone: "memory",
    primaryHref: "/v2/mundo/familiar-de-la-raven-queen",
  },
  {
    slug: "mystra",
    nombre: "Mystra",
    titulo: "Forjador de runas arcanas",
    sigil: "MY",
    alliance: "Nueve Puntas de Eira",
    estado: "Perdido en Pandemonium, segun Navish",
    domains: ["Magia arcana", "Runas", "Magia mistica", "Velo espiritual"],
    principles: [
      "La runa abre lo que el mundo mantiene cerrado.",
      "La magia caotica exige catalizadores y costo.",
      "El conocimiento arcano puede cruzar planos, pero no sin romper algo.",
    ],
    sacredSymbol: "Runa circular y compas del velo",
    sacredPlaces: [
      {
        nombre: "Coven Rosa",
        detalle: "Custodio original de runas usadas para atravesar el velo espiritual.",
      },
      {
        nombre: "Plano espiritual",
        detalle: "Cruce habilitado por runas, magia caotica y catalizadores.",
      },
      {
        nombre: "Pandemonium",
        detalle: "Lugar donde Navish ubica su avatar enloquecido.",
      },
    ],
    linkedLore: [
      {
        label: "Runas de Mystra",
        detail: "Permitieron al Coven Rosa usar energia espiritual.",
        href: "/v2/mundo/runas-de-mystra",
      },
      {
        label: "Cordura divina",
        detail: "Lexia vincula el ritual antiguo con un dios que perdio la cordura.",
        href: "/v2/mundo/mystra-y-cordura-divina",
      },
    ],
    profile:
      "Creador o dador de las runas arcanas. Su influencia atraviesa el Coven Rosa, la magia mistica, el Ritual de Ascension y la historia rota de las matriarcas.",
    quote:
      "Una runa no abre una puerta: obliga al mundo a recordar que la puerta existia.",
    tension:
      "Su legado permite cruzar planos, pero tambien aparece ligado a subyugacion, desbalance y magia fuera de control.",
    tone: "arcane",
    primaryHref: "/v2/mundo/runas-de-mystra",
  },
  {
    slug: "tyr",
    nombre: "Tyr",
    titulo: "Juez de Mount Celestia",
    sigil: "TY",
    symbolSrc: "/assets/atlas/gods/tyr.png",
    alliance: "Nueve Puntas de Eira",
    estado: "Activo en justicia celestial e instituciones",
    domains: ["Justicia", "Conocimiento", "Juicio", "Orden"],
    principles: [
      "Toda alma debe ser juzgada.",
      "La ley celestial no se negocia con facilidad.",
      "El conocimiento sin justicia se vuelve herramienta de poder.",
    ],
    sacredSymbol: "Espada vertical y balanza cerrada",
    sacredPlaces: [
      {
        nombre: "Mount Celestia",
        detalle: "Plano donde su justicia aparece jerarquica e inflexible.",
      },
      {
        nombre: "Templo de Tyr del Santuario",
        detalle: "Institucion visible en el Santuario de los Libres.",
      },
      {
        nombre: "Cobre en Rojo",
        detalle: "Lugar donde aparece un angel de Tyr vinculado al pasado del Coven Rojo.",
      },
    ],
    linkedLore: [
      {
        label: "Puente y juicio",
        detail: "Las almas recorren el Puente de Myrkul y son juzgadas por Tyr.",
        href: "/v2/mundo/puente-de-myrkul-y-juicio-de-tyr",
      },
      {
        label: "Cara oscura",
        detail: "Aria critica sus instituciones y templos desde una version incomoda.",
        href: "/v2/mundo/tyr-segun-aria",
      },
    ],
    profile:
      "Dios de justicia y conocimiento, con presencia fuerte en aasimares, angeles y juicios celestiales. David Ilcard esta ligado a su sangre divina.",
    quote:
      "El juicio no absuelve por compasion; mide el peso de lo que queda.",
    tension:
      "Su orden sostiene destino y juicio, pero varias fuentes cuestionan la dureza y la politica de sus templos.",
    tone: "justice",
    primaryHref: "/v2/mundo/justicia-celestial-de-tyr",
  },
  {
    slug: "selune",
    nombre: "Selune",
    titulo: "Luna de sombras y caza",
    sigil: "SE",
    symbolSrc: "/assets/atlas/gods/selune-symbol.webp",
    alliance: "Nueve Puntas de Eira",
    estado: "Presente en covens lunares",
    domains: ["Luna", "Caza", "Oscuridad", "Sacrificio"],
    principles: [
      "Toda luz proyecta una sombra.",
      "La penumbra tambien puede ser santuario.",
      "Los caidos dejan marcas que protegen a los vivos.",
    ],
    sacredSymbol: "Media luna sobre llama fria",
    sacredPlaces: [
      {
        nombre: "Coven Oscuro",
        detalle: "Tradicion ligada a la luna y a las sombras que toda luz proyecta.",
      },
      {
        nombre: "Coven Negro",
        detalle: "Protegido por las Lagrimas de Selune antes de la profanacion.",
      },
      {
        nombre: "Bosque de penumbra",
        detalle: "Santuario de memoria nacido de lagrimas por seguidores caidos.",
      },
    ],
    linkedLore: [
      {
        label: "Lagrimas de Selune",
        detail: "Flores nacidas por seguidores caidos que vuelven sagrado el bosque.",
        href: "/v2/mundo/lagrimas-de-selune",
      },
      {
        label: "Fuego lunar",
        detail: "Barrera que sostiene al Coven Negro frente a malditos.",
        href: "/v2/mundo/fuego-de-selune",
      },
    ],
    profile:
      "Deidad lunar ligada al Coven Oscuro, al Coven Negro y a una defensa donde sombra, memoria y sacrificio dejan de ser opuestos.",
    quote:
      "La sombra no niega la luz; revela cuanto cuesta sostenerla.",
    tension:
      "Su proteccion puede volverse fragile cuando se profanan muertos, flores y memoria comunitaria.",
    tone: "moon",
    primaryHref: "/v2/mundo/lagrimas-de-selune",
  },
  {
    slug: "luzne",
    nombre: "Luzne",
    titulo: "Fuego sagrado de renovacion",
    sigil: "LU",
    symbolSrc: "/assets/atlas/gods/luzne-symbol.png",
    alliance: "Nueve Puntas de Eira",
    estado: "Activa por devocion e iglesias",
    domains: ["Luz", "Fuego", "Renovacion", "Purificacion"],
    principles: [
      "La luz sirve a quien intenta dejar atras lo que era.",
      "La purificacion no siempre exige oro ni sacrificio.",
      "Guiar tambien es calmar antes de decidir.",
    ],
    sacredSymbol: "Llama dentro de corona solar",
    sacredPlaces: [
      {
        nombre: "Templo de Luzne",
        detalle: "Espacio religioso donde su devocion calma y orienta.",
      },
      {
        nombre: "Santuario de los Libres",
        detalle: "Ciudad donde sus templos conviven con tensiones politicas y divinas.",
      },
      {
        nombre: "Camino al Underdark",
        detalle: "Fe de Tali vinculada a luz para quienes no ven y renovacion.",
      },
    ],
    linkedLore: [
      {
        label: "Devocion de Luzne",
        detail: "Sermones que calman y dejan guia espiritual temporal.",
        href: "/v2/mundo/devocion-de-luzne",
      },
      {
        label: "Purificacion",
        detail: "La Iglesia de Luzne puede destruir maldiciones infernales.",
        href: "/v2/mundo/luzne-y-purificacion",
      },
    ],
    profile:
      "Diosa de luz, fuego, renovacion y lo sagrado. Su presencia se lee menos como poder militar y mas como guia para salir de maldiciones, miedo o identidad rota.",
    quote:
      "La llama no borra la cicatriz; permite mirarla sin obedecerla.",
    tension:
      "Su promesa de renovacion choca con deudas antiguas que no se resuelven solo con buena fe.",
    tone: "flame",
    primaryHref: "/v2/mundo/luzne-y-renovacion",
  },
  {
    slug: "myrkul",
    nombre: "Myrkul",
    titulo: "Custodio del ciclo",
    sigil: "MK",
    symbolSrc: "/assets/atlas/gods/myrkul-symbol.jpg",
    alliance: "Alianza del Equilibrio",
    estado: "Activo en muerte, juicio previo y refugio",
    domains: ["Vida", "Muerte", "Ciclo", "Refugio"],
    principles: [
      "La muerte no cancela el ciclo.",
      "El refugio puede existir dentro de una ciudad hostil.",
      "Cada alma cruza antes de ser juzgada.",
    ],
    sacredSymbol: "Puente circular y mascara partida",
    sacredPlaces: [
      {
        nombre: "Puente de Myrkul",
        detalle: "Ruta de las almas tras la muerte antes del juicio final.",
      },
      {
        nombre: "Catedral de Myrkul de Millegroth",
        detalle: "Templo en construccion donde se predica ciclo y trato igualitario.",
      },
      {
        nombre: "Millegroth",
        detalle: "Capital del Underdark con una zona marcada por su culto.",
      },
    ],
    linkedLore: [
      {
        label: "Myrkul en Millegroth",
        detail: "Su culto aparece como fuerza de ciclo y refugio, no solo muerte.",
        href: "/v2/mundo/myrkul-en-millegroth",
      },
      {
        label: "Resurreccion",
        detail: "Los apostoles y la muerte plantean reglas morales propias.",
        href: "/v2/mundo/resurreccion-y-apostoles-de-myrkul",
      },
    ],
    profile:
      "Dios de vida y muerte. En el Underdark su culto muestra una cara de ciclo, refugio y convivencia, separada del estereotipo de culto oscuro.",
    quote:
      "Todo cuerpo vuelve, toda alma cruza, todo ciclo exige testigos.",
    tension:
      "Su equilibrio puede parecer compasivo o terrible segun quien mire desde la superficie.",
    tone: "death",
    primaryHref: "/v2/mundo/myrkul-en-millegroth",
  },
  {
    slug: "vecna",
    nombre: "Vecna",
    titulo: "Secreto que ofrece poder",
    sigil: "VC",
    symbolSrc: "/assets/atlas/gods/vecna-symbol.png",
    alliance: "Pacto del Eclipse",
    estado: "Influencia activa por marcas, visiones y pactos",
    domains: ["Secretos", "Perdida", "Dolor", "Poder oculto"],
    principles: [
      "Todo secreto tiene precio.",
      "La verdad puede liberar o fortalecer a quien la oculta.",
      "El poder ofrecido en vida o muerte deja marca.",
    ],
    sacredSymbol: "Ojo cerrado y mano marcada",
    sacredPlaces: [
      {
        nombre: "Khelgrim",
        detalle: "Bastion antiguo donde su historia reaparece entre duergars y campeones.",
      },
      {
        nombre: "Underdark",
        detalle: "Redes y cultos vinculados a seguidores, visiones y secretos.",
      },
      {
        nombre: "Shadowlands",
        detalle: "Plano que Zaros buscaba abrir para permitir su entrada.",
      },
    ],
    linkedLore: [
      {
        label: "Tratos de Vecna",
        detail: "Ofrece poder en momentos limite y deja marcas fisicas o espirituales.",
        href: "/v2/mundo/tratos-de-vecna",
      },
      {
        label: "Vecna y secretos",
        detail: "Aria lo presenta como cargador de secretos; otros lo ven como amenaza.",
        href: "/v2/mundo/vecna-y-los-secretos",
      },
    ],
    profile:
      "Dios de secretos, perdida y dolor. En la campana se manifiesta mediante pactos, visiones, marcas y campeones como Borok o Zaros.",
    quote:
      "El secreto no pesa menos por esconderse; solo aprende donde clavarse.",
    tension:
      "Puede revelar abusos ocultos, pero cada revelacion aumenta su campo de influencia.",
    tone: "secret",
    primaryHref: "/v2/mundo/vecna",
  },
  {
    slug: "tiamat",
    nombre: "Tiamat",
    titulo: "Madre cromatica bajo disputa",
    sigil: "TI",
    symbolSrc: "/assets/atlas/gods/tiamat-symbol.png",
    alliance: "Pacto del Eclipse",
    estado: "Recordada por linajes dracónidos y guerra antigua",
    domains: ["Dragones elementales", "Linaje cromatico", "Guerra", "Juramento"],
    principles: [
      "La version oficial de una guerra rara vez queda limpia.",
      "El linaje dracónido hereda dioses y rupturas.",
      "Proteger un arbol tambien puede ser mandato divino.",
    ],
    sacredSymbol: "Corona de cinco puntas dracónicas",
    sacredPlaces: [
      {
        nombre: "Pueblo de Layra",
        detalle: "Tradicion cromatica que se alejo de Tiamat.",
      },
      {
        nombre: "Glaciares",
        detalle: "Escenario de la version del Creador sobre Tiamat y Bahamut.",
      },
      {
        nombre: "Guerra antigua",
        detalle: "Conflicto extremo donde aparece junto a Vecna, Talos y Demogorgon.",
      },
    ],
    linkedLore: [
      {
        label: "Version del Creador",
        detail: "Afirma que Bahamut ataco a Tiamat mientras ella retiraba la espada.",
        href: "/v2/mundo/version-del-creador-sobre-tiamat-y-bahamut",
      },
      {
        label: "Dracónidos cromáticos",
        detail: "La tradicion cromatica la sigue, aunque no todos conservan esa fe.",
        href: "/v2/mundo/tiamat-y-draconicos-cromaticos",
      },
    ],
    profile:
      "Diosa de dragones elementales y linajes cromaticos. Su lugar en la historia es conflictivo porque algunas versiones invierten el relato heroico habitual.",
    quote:
      "Las escamas guardan versiones que los vencedores prefieren llamar monstruo.",
    tension:
      "Su memoria tensiona el relato de Bahamut, el pueblo de Layra y las alianzas de la guerra antigua.",
    tone: "dragon",
    primaryHref: "/v2/mundo/tiamat-y-draconicos-cromaticos",
  },
  {
    slug: "bahamut",
    nombre: "Bahamut",
    titulo: "Patron de dragones metalicos",
    sigil: "BA",
    alliance: "Nueve Puntas de Eira",
    estado: "Presente como poder metalico de la alianza antigua",
    domains: ["Dragones metalicos", "Honor", "Alianza", "Legado"],
    principles: [
      "El metal recuerda el golpe que lo forjo.",
      "La nobleza divina tambien puede ser discutida.",
      "Una alianza antigua deja ecos politicos modernos.",
    ],
    sacredSymbol: "Ala metalica y estrella de nueve puntas",
    sacredPlaces: [
      {
        nombre: "Khelgrim",
        detalle: "Visiones muestran dracónidos metálicos luchando junto a Nueve Puntas.",
      },
      {
        nombre: "Metropolis de Cobre",
        detalle: "Eco politico moderno de antiguas alianzas divinas.",
      },
      {
        nombre: "Glaciares",
        detalle: "Lugar asociado al relato conflictivo sobre Tiamat y la espada.",
      },
    ],
    linkedLore: [
      {
        label: "Alianza divina",
        detail: "Bahamut aparece en una alianza distorsionada por la historia oficial.",
        href: "/v2/mundo/alianza-divina-ocultada",
      },
      {
        label: "Tiamat y Bahamut",
        detail: "El Creador de Glaciares contradice la version limpia de la guerra.",
        href: "/v2/mundo/version-del-creador-sobre-tiamat-y-bahamut",
      },
    ],
    profile:
      "Dios de dragones metalicos, asociado a la alianza antigua y a ecos politicos contemporaneos. Su figura no queda aislada del conflicto con Tiamat.",
    quote:
      "El metal brilla, pero tambien conserva la marca del primer golpe.",
    tension:
      "Su posicion heroica se vuelve menos simple cuando entran versiones de la guerra que contradicen la memoria oficial.",
    tone: "dragon",
    primaryHref: "/v2/mundo/alianza-divina-ocultada",
  },
  {
    slug: "talos",
    nombre: "Talos",
    titulo: "Vestigio de tormenta",
    sigil: "TA",
    alliance: "Pacto del Eclipse",
    estado: "Relevante por orbe, corazon y barrera",
    domains: ["Tormenta", "Vestigio", "Destruccion", "Umbral"],
    principles: [
      "La tormenta no siempre cae del cielo.",
      "Un vestigio puede abrir lo que una barrera mantiene cerrado.",
      "El poder antiguo vuelve como mecanismo incompleto.",
    ],
    sacredSymbol: "Rayo encerrado en aro quebrado",
    sacredPlaces: [
      {
        nombre: "Biblioteca de Solaria",
        detalle: "Lugar donde se revela la barrera y el papel de su corazon.",
      },
      {
        nombre: "Khelgrim",
        detalle: "Su orbe aparece conectado a campeones perseguidos por las Nueve Puntas.",
      },
      {
        nombre: "Barrera de Solaria",
        detalle: "Defensa que su corazon podria disipar.",
      },
    ],
    linkedLore: [
      {
        label: "Barrera de Solaria",
        detail: "Impide que dioses e invasiones extraplanares crucen como antes.",
        href: "/v2/mundo/barrera-de-solaria",
      },
      {
        label: "Plan de Vecna",
        detail: "Vecna parece usar carta de Navish y vestigio de Talos para repetir historia.",
        href: "/v2/mundo/plan-de-vecna-y-borok",
      },
    ],
    profile:
      "Dios de tormenta e hijo de Druidia segun el glosario. Su vestigio reaparece como pieza capaz de tensar la Barrera de Solaria.",
    quote:
      "Un rayo antiguo no ilumina: busca la grieta que aun recuerda.",
    tension:
      "Su corazon puede convertir una defensa cosmica en puerta abierta para poderes extraplanares.",
    tone: "storm",
    primaryHref: "/v2/mundo/barrera-de-solaria",
  },
  {
    slug: "dios-de-dioses",
    nombre: "Dios de Dioses",
    titulo: "Entidad olvidada del hechizo mayor",
    sigil: "DD",
    alliance: "Figura velada",
    estado: "Desterrado u oculto por la historia antigua",
    domains: ["Origen", "Hechizo mayor", "Destierro", "Turmalina"],
    principles: [
      "Lo mas poderoso puede quedar fuera de la memoria comun.",
      "La historia oficial necesita huecos para sobrevivir.",
      "Un dios olvidado sigue moviendo consecuencias.",
    ],
    sacredSymbol: "Circulo vacio con corona interior",
    sacredPlaces: [
      {
        nombre: "Biblioteca de Solaria",
        detalle: "Archivo donde sobreviven verdades fuera del borrado material.",
      },
      {
        nombre: "Plano material",
        detalle: "Lugar afectado por el destierro de mitad de la humanidad.",
      },
      {
        nombre: "Turmalina",
        detalle: "Sustancia originada por su hechizo segun registros recientes.",
      },
    ],
    linkedLore: [
      {
        label: "Dios de Dioses",
        detail: "Entidad olvidada cuyo hechizo origino la Turmalina.",
        href: "/v2/mundo/dios-de-dioses",
      },
      {
        label: "Ritual de Ascension",
        detail: "El ritual desterro mitad de la humanidad junto a esta entidad.",
        href: "/v2/mundo/ritual-de-ascension",
      },
    ],
    profile:
      "Figura mas velada del panteon. Aparece atada al Ritual de Ascension, al destierro de media humanidad y a magia de escala imposible.",
    quote:
      "El nombre borrado no desaparece; se vuelve el borde de todos los mapas.",
    tension:
      "Saber que existio reordena la guerra antigua, la Turmalina y el costo real del Ritual de Ascension.",
    tone: "origin",
    primaryHref: "/v2/mundo/dios-de-dioses",
  },
];
