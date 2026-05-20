// Markers del Atlas de Eyira. Generados desde output/eyira-ocr.json (Google
// Vision OCR) + curacion manual de fragmentos. Posiciones en % del ancho/alto
// de public/mapa/eyira.webp (2400x1800px).
//
// Tonos:
//   copper = ciudades, faros, civilizacion
//   petrol = mares, oceanos, lagos, archipielagos
//   moss   = bosques
//   gold   = montanas, cordilleras, desiertos
//   wine   = conflicto, volcanes, ruinas, zonas oscuras
//
// Ajuste fino con el calibrador en /mapa (boton "Calibrar").

export type MarkerTone = "copper" | "petrol" | "moss" | "gold" | "wine";

export type MapMarker = {
  id: string;
  name: string;
  region: string;
  x: number;
  y: number;
  tone: MarkerTone;
  href?: string;
  note: string;
  custom?: boolean;
  /** Episodios donde aparece (enriquecido desde el vault en page.tsx) */
  apariciones?: number[];
  /** Fragmento Canon o primera mención (enriquecido desde el vault) */
  descripcion?: string;
  /** Personajes cuyo origen/residencia es este lugar (override curado o frontmatter) */
  habitantes?: { nombre: string; slug: string }[];
  /** Personajes que aparecen frecuentemente sin ser habitantes (co-aparición) */
  personajes?: { nombre: string; slug: string }[];
};

export const BASE_MARKERS: MapMarker[] = [
  // ── Capital narrativa ────────────────────────────────────────────────
  {
    id: "metropolis-de-cobre",
    name: "La Metrópolis de Cobre",
    region: "Capital",
    x: 91.29,
    y: 88.78,
    tone: "copper",
    note: "Sede de la Hermandad de Cobre. Centro narrativo de la campaña.",
  },

  // ── Ciudades y pueblos ───────────────────────────────────────────────
  { id: "brummdur",   name: "Brummdur",   region: "Norte",       x: 20.08, y: 14.44, tone: "copper", note: "" },
  { id: "murmek",     name: "Murmek",     region: "Norte",       x: 21.96, y: 24.00, tone: "copper", note: "" },
  { id: "ragdal",     name: "Ragdal",     region: "Centro",      x: 40.58, y: 28.97, tone: "copper", note: "" },
  { id: "luradik",    name: "Luradik",    region: "Centro",      x: 33.29, y: 38.42, tone: "copper", note: "" },
  { id: "tyon",       name: "Tyon",       region: "Este",        x: 73.98, y: 21.97, tone: "copper", note: "" },
  { id: "nararok",    name: "Nararok",    region: "Este",        x: 79.38, y: 26.97, tone: "copper", note: "" },
  { id: "phregnux",   name: "Phregnux",   region: "Este",        x: 72.38, y: 37.97, tone: "copper", note: "" },
  { id: "vhimzek",    name: "Vhimzek",    region: "Este",        x: 81.85, y: 40.25, tone: "copper", note: "" },
  { id: "dracan",     name: "Dracan",     region: "Este",        x: 74.96, y: 44.50, tone: "copper", note: "" },
  { id: "elmora",     name: "Elmora",     region: "Este",        x: 85.00, y: 49.89, tone: "copper", note: "" },
  { id: "akhtea",     name: "Akhtea",     region: "Este",        x: 74.98, y: 52.17, tone: "copper", note: "" },
  { id: "quan-ma",    name: "Quan Ma",    region: "Este",        x: 89.08, y: 32.06, tone: "copper", note: "" },
  { id: "lavanora",   name: "Lavanora",   region: "Centro",      x: 21.04, y: 45.58, tone: "copper", note: "" },
  { id: "elaxidor",   name: "Elaxidor",   region: "Oeste",       x: 9.29,  y: 52.25, tone: "copper", note: "" },
  { id: "syltris",    name: "Syltris",    region: "Oeste",       x: 10.50, y: 70.92, tone: "copper", note: "" },
  { id: "irma-alari", name: "Irma Alari", region: "Centro",      x: 32.29, y: 57.83, tone: "copper", note: "" },
  { id: "ingalvur",   name: "Ingalvur",   region: "Centro-Oeste", x: 20.69, y: 62.39, tone: "copper", note: "" },
  { id: "yggdrasil",  name: "Yggdrasil",  region: "Centro-Oeste", x: 16.75, y: 66.03, tone: "copper", note: "" },
  { id: "nymira",     name: "Nymira",     region: "Sur",         x: 42.46, y: 71.64, tone: "copper", note: "" },
  { id: "darby",      name: "Darby",      region: "Sur",         x: 35.81, y: 77.92, tone: "copper", note: "" },
  { id: "lancaster",  name: "Lancaster",  region: "Sur",         x: 46.06, y: 81.36, tone: "copper", note: "" },
  { id: "briar",      name: "Briar",      region: "Sur",         x: 52.42, y: 70.17, tone: "copper", note: "" },
  { id: "arkala",     name: "Arkala",     region: "Sur",         x: 64.92, y: 83.78, tone: "copper", note: "" },
  { id: "aldam",      name: "Aldam",      region: "Sur-Este",    x: 72.83, y: 64.42, tone: "copper", note: "" },
  { id: "lorenza",    name: "Lorenza",    region: "Sur-Este",    x: 90.79, y: 78.42, tone: "copper", note: "" },
  { id: "pasto-viejo", name: "Pasto Viejo", region: "Sur-Este",   x: 83.35, y: 81.50, tone: "copper", note: "" },
  { id: "pueblo-de-bagre", name: "Pueblo de Bagre", region: "Sur-Este", x: 86.43, y: 84.56, tone: "copper", note: "" },
  { id: "aldea-montana", name: "Aldea Montaña", region: "Este",  x: 79.23, y: 16.31, tone: "copper", note: "" },

  // ── Faros (costa) ────────────────────────────────────────────────────
  { id: "faro-norte",            name: "Faro Norte",            region: "Costa Norte", x: 29.52, y: 1.39,  tone: "copper", note: "" },
  { id: "faro-enano",            name: "Faro Enano",            region: "Costa Oeste", x: 13.94, y: 24.61, tone: "copper", note: "" },
  { id: "faro-del-titan",        name: "Faro del Titán",        region: "Costa Oeste", x: 10.54, y: 33.24, tone: "copper", note: "" },
  { id: "faro-de-las-ilusiones", name: "Faro de las Ilusiones", region: "Costa Oeste", x: 5.48,  y: 47.14, tone: "copper", note: "" },
  { id: "faro-oeste",            name: "Faro Oeste",            region: "Costa Oeste", x: 6.40,  y: 71.28, tone: "copper", note: "" },
  { id: "faro-del-monstruo",     name: "Faro del Monstruo",     region: "Costa Centro", x: 69.34, y: 57.47, tone: "copper", note: "" },
  { id: "faro-orco",             name: "Faro Orco",             region: "Costa Este",  x: 89.69, y: 37.86, tone: "copper", note: "" },
  { id: "faro-este",             name: "Faro Este",             region: "Costa Este",  x: 95.79, y: 81.72, tone: "copper", note: "" },
  { id: "faro-sur",              name: "Faro Sur",              region: "Costa Sur",   x: 52.84, y: 83.60, tone: "copper", note: "" },
  { id: "faro-de-la-victoria",   name: "Faro de la Victoria",   region: "Costa Sur",   x: 88.29, y: 94.06, tone: "copper", note: "" },

  // ── Mares, oceanos y golfos ──────────────────────────────────────────
  { id: "oceano-fin-del-mundo",     name: "Océano del Fin del Mundo",     region: "Mar Noroeste", x: 4.61,  y: 31.04, tone: "petrol", note: "" },
  { id: "oceano-gelido",            name: "Océano Gélido",                region: "Mar Norte",    x: 68.46, y: 1.42,  tone: "petrol", note: "" },
  { id: "oceano-tesoros-prohibidos", name: "Océano de los Tesoros Prohibidos", region: "Mar Sur", x: 55.04, y: 91.89, tone: "petrol", note: "" },
  { id: "oceano-caidos",            name: "Océano de los Caídos",         region: "Mar Este",     x: 94.19, y: 53.23, tone: "petrol", note: "" },
  { id: "golfo-ballenas-gigantes",  name: "El Golfo de las Ballenas Gigantes", region: "Golfo",   x: 25.00, y: 30.33, tone: "petrol", note: "" },
  { id: "golfo-del-dragon",         name: "El Golfo del Dragón",          region: "Golfo",        x: 90.17, y: 20.04, tone: "petrol", note: "" },
  { id: "mar-del-leviatan",         name: "Mar del Leviatán",             region: "Mar Centro",   x: 63.75, y: 49.31, tone: "petrol", note: "" },
  { id: "mar-rubi-esmeralda",       name: "Mar del Rubí y la Esmeralda",  region: "Mar Centro",   x: 45.22, y: 43.72, tone: "petrol", note: "" },
  { id: "mar-del-espejismo",        name: "Mar del Espejismo",            region: "Mar Sur",      x: 45.42, y: 67.83, tone: "petrol", note: "" },

  // ── Archipielagos e islas ────────────────────────────────────────────
  { id: "archipielago-espiritus",       name: "Archipiélago de los Espíritus",   region: "Archipiélago Este", x: 95.99, y: 43.60, tone: "petrol", note: "" },
  { id: "archipielago-suenos-oniricos", name: "Archipiélago de los Sueños Oníricos", region: "Archipiélago Noroeste", x: 2.66, y: 64.59, tone: "petrol", note: "" },
  { id: "archipielago-velas-negras",    name: "El Archipiélago de las Velas Negras", region: "Archipiélago Suroeste", x: 9.00, y: 90.58, tone: "petrol", note: "" },
  { id: "isla-de-la-riqueza",           name: "La Isla de la Riqueza",           region: "Isla Sur-Este",  x: 91.75, y: 66.24, tone: "petrol", note: "" },
  { id: "isla-de-los-geiseres",         name: "La Isla de los Géiseres",         region: "Isla Sur",       x: 80.66, y: 95.84, tone: "petrol", note: "" },
  { id: "las-gemelas-vanidosas",        name: "Las Gemelas Vanidosas",           region: "Isla Sur",       x: 66.05, y: 96.97, tone: "petrol", note: "" },
  { id: "lefayes-arrowhead",            name: "Lefaye's Arrowhead",              region: "Isla Suroeste",  x: 17.01, y: 77.33, tone: "petrol", note: "" },
  { id: "isla-de-las-estatuas",         name: "Isla de las Estatuas",            region: "Isla Norte",     x: 51.75, y: 2.28,  tone: "petrol", note: "Nombre completo cortado en el mapa." },

  // ── Lagos y lagunas ──────────────────────────────────────────────────
  { id: "lago-susurro-esmeralda", name: "Lago del Susurro Esmeralda", region: "Lago",  x: 22.90, y: 52.52, tone: "petrol", note: "" },
  { id: "lago-almas-errantes",    name: "Lago de Almas Errantes",     region: "Lago",  x: 76.48, y: 30.81, tone: "petrol", note: "" },
  { id: "lago-sombras-profundas", name: "Lago de las Sombras Profundas", region: "Lago oscuro", x: 54.16, y: 19.62, tone: "wine", note: "" },
  { id: "lago-suspiros",          name: "Lago de los Suspiros",       region: "Lago",  x: 83.93, y: 32.36, tone: "petrol", note: "" },
  { id: "lago-mariposas",         name: "Lago de las Mariposas",      region: "Lago",  x: 33.85, y: 64.97, tone: "petrol", note: "" },
  { id: "laguna-luciernagas",     name: "Laguna de las Luciérnagas",  region: "Laguna", x: 16.67, y: 59.11, tone: "petrol", note: "" },
  { id: "lago-cisne-blanco",      name: "Lago del Cisne Blanco",      region: "Lago",  x: 9.71,  y: 57.36, tone: "petrol", note: "" },
  { id: "lago-de-los-peces",      name: "Lago de los Peces",          region: "Lago",  x: 90.21, y: 84.50, tone: "petrol", note: "" },
  { id: "espejo-del-crepusculo",  name: "Espejo del Crepúsculo",      region: "Lago",  x: 29.92, y: 72.97, tone: "petrol", note: "" },
  { id: "santuario-libres",       name: "El Santuario de los Libres", region: "Refugio", x: 51.04, y: 60.19, tone: "copper", note: "" },

  // ── Bosques ──────────────────────────────────────────────────────────
  { id: "bosque-sollozos",  name: "Bosque de los Sollozos",   region: "Bosque", x: 83.23, y: 57.75, tone: "moss", note: "" },
  { id: "bosque-memorias",  name: "El Bosque de las Memorias", region: "Bosque", x: 26.53, y: 80.44, tone: "moss", note: "" },

  // ── Desiertos ────────────────────────────────────────────────────────
  { id: "desierto-espejos", name: "Desierto de los Espejos", region: "Desierto", x: 61.06, y: 75.30, tone: "gold", note: "" },

  // ── Montanas y cordilleras ───────────────────────────────────────────
  { id: "montanas-hierro-fundido", name: "Montañas del Hierro Fundido", region: "Montaña Norte",   x: 30.20, y: 10.78, tone: "gold", note: "" },
  { id: "montanas-frio-eterno",    name: "Montañas del Frío Eterno",    region: "Montaña Norte",   x: 60.49, y: 10.82, tone: "gold", note: "" },
  { id: "cordillera-alados",       name: "La Cordillera de los Alados", region: "Cordillera Este", x: 68.35, y: 39.72, tone: "gold", note: "" },
  { id: "cordillera-libertad",     name: "La Cordillera de la Libertad", region: "Cordillera Centro", x: 40.03, y: 50.84, tone: "gold", note: "" },
  { id: "monte-espadas",           name: "El Monte de las Espadas",     region: "Montaña Este",    x: 69.67, y: 25.42, tone: "gold", note: "" },
  { id: "hermanas-ying-yang",      name: "Las Hermanas Ying y Yang",    region: "Montaña Centro",  x: 57.64, y: 28.53, tone: "gold", note: "" },
  { id: "montanas-celestiales",    name: "Las Montañas Celestiales",    region: "Montaña Sur-Este", x: 75.80, y: 71.00, tone: "gold", note: "" },
  { id: "cerro-de-la-paz",         name: "El Cerro de la Paz",          region: "Cerro",           x: 33.47, y: 43.00, tone: "gold", note: "" },

  // ── Conflicto / volcanes / ruinas ────────────────────────────────────
  { id: "zona-de-corrupcion",   name: "Zona de Corrupción",   region: "Tierra muerta", x: 53.96, y: 43.57, tone: "wine", note: "" },
  { id: "el-gran-volcan",       name: "El Gran Volcán",       region: "Volcán",        x: 39.02, y: 89.53, tone: "wine", note: "" },
  { id: "isla-magma",           name: "Isla Magma",           region: "Volcán",        x: 41.32, y: 94.94, tone: "wine", note: "" },
  { id: "el-caldero-forja",     name: "El Caldero de la Forja", region: "Forja",       x: 38.75, y: 34.50, tone: "wine", note: "" },
  { id: "el-bastion-gigantes",  name: "El Bastión de Gigantes", region: "Frontera",    x: 83.81, y: 6.22,  tone: "wine", note: "" },
];
