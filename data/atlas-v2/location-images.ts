// Mapeo central slug → carpeta en public/Lugares - planos/ + curado de slides.
// Para los lugares principales (Sanctuario, Metrópolis), las slides están
// curadas a mano con captions narrativas. Para el resto, el carrusel toma
// todas las imágenes de la carpeta y deriva caption del filename.

import fs from "node:fs";
import path from "node:path";

export type RawSlide = {
  file: string;        // path relativo dentro del folder ("Barsito/Barsito Inside.webp")
  caption: string;
  sub?: string;
};

export type LocationImageMap = {
  /** Path relativo desde "public/Lugares - planos/" hasta la carpeta del lugar */
  folder: string;
  /** Imagen de fondo blureada (file dentro del folder). Si no se pasa, usa la 1ra slide */
  immersiveBg?: string;
  /** Slides curados a mano. Si se omite, se autoderivan de la carpeta */
  curated?: RawSlide[];
};

const ROOT = "Lugares - planos";

// ── Curaciones a mano (los lugares con muchas imágenes merecen captions narrativas) ──

export const LOCATION_IMAGES: Record<string, LocationImageMap> = {
  "santuario-libres": {
    folder: "Plano Material/Los Renegados/El Sanctuario de los Libres",
    immersiveBg: "Afueras Sanctuario.webp",
    curated: [
      { file: "Estación de Barcos Flotantes.webp", caption: "Estación de Barcos Flotantes", sub: "Puerto de partida hacia las islas exteriores" },
      { file: "Afueras Sanctuario.webp", caption: "Afueras del Sanctuario", sub: "El camino que conduce al refugio" },
      { file: "El Sanctuario de los Libres.webp", caption: "El Sanctuario de los Libres", sub: "Vista cenital del refugio" },
      { file: "Baile en el Sanctuario.webp", caption: "Baile en el Sanctuario", sub: "Noches de reunión y celebración" },
      { file: "Catedral Druidia.webp", caption: "Catedral Druidia", sub: "Templo druídico de los Libres" },
      { file: "Catedral Luzne.webp", caption: "Catedral Luzne", sub: "Santuario de la luz" },
      { file: "Biblioteca Central de Tyr.webp", caption: "Biblioteca Central de Tyr", sub: "El archivo del juicio" },
      { file: "Librería Sanctuario.webp", caption: "Librería del Sanctuario", sub: "Saber abierto a todos" },
      { file: "Oráculo Encantado.webp", caption: "Oráculo Encantado", sub: "Visiones encerradas en cristal" },
      { file: "Casa de Freda y Larren.webp", caption: "Casa de Freda y Larren", sub: "Hogar al borde del camino" },
      { file: "Casa de Freda y Larren 2.webp", caption: "Casa de Freda y Larren", sub: "Vista del interior" },
      { file: "Miel de Dragón, Bar.webp", caption: "Miel de Dragón", sub: "Bar de los caminantes" },
      { file: "La Cabina de Los Tragos Magicoburbujeantes.webp", caption: "La Cabina", sub: "Tragos mágicoburbujeantes" },
      { file: "Rojo Pasión.webp", caption: "Rojo Pasión", sub: "El local de las luces rojas" },
      { file: "Barsito/Barsito Outside.webp", caption: "Barsito", sub: "Visto desde la calle" },
      { file: "Barsito/Barsito Inside.webp", caption: "Barsito", sub: "El interior cobrizo" },
      { file: "Escondite Raylen.webp", caption: "Escondite de Raylen", sub: "Refugio entre las sombras" },
      { file: "El Pasillo de la muerte.webp", caption: "El Pasillo de la Muerte", sub: "Corredor sin retorno" },
      { file: "Torneo de la Libertad.webp", caption: "Torneo de la Libertad", sub: "Arena de la ciudad libre" },
      { file: "Afueras del Sanct 2.webp", caption: "Afueras del Sanctuario", sub: "Vista alternativa" },
      { file: "Sanctuario de los Libres.webp", caption: "Sanctuario", sub: "Vista panorámica alternativa" },
    ],
  },

  "la-metropolis-cobre": {
    folder: "Plano Material/La Gran Aristocracia/La Metrópolis de Cobre",
    immersiveBg: "La Metrópolis de Cobre.webp",
    curated: [
      { file: "MetrópolisTech.webp", caption: "Metrópolis Tech", sub: "Maquinaria y vapor del corazón industrial" },
      { file: "La Metrópolis de Cobre.webp", caption: "La Metrópolis de Cobre", sub: "Vista panorámica de la capital" },
      { file: "Metrópolis de Cobre.webp", caption: "Metrópolis de Cobre", sub: "Otro ángulo de la capital" },
      { file: "Luz a la Historia.webp", caption: "Luz a la Historia", sub: "El monumento central" },
      { file: "Train Station.webp", caption: "Train Station", sub: "Estación de los trenes de vapor" },
      { file: "Plumas Doradas v1.webp", caption: "Plumas Doradas", sub: "El bar de las Plumas" },
      { file: "Plumas Doradas v2.webp", caption: "Plumas Doradas", sub: "Vista alternativa" },
      { file: "Plumas Doradas vs interior.webp", caption: "Plumas Doradas", sub: "Interior decadente" },
      { file: "´Planetario.webp", caption: "El Planetario", sub: "Bóveda celeste de cobre" },
      { file: "Alcantarillas.webp", caption: "Alcantarillas", sub: "Los túneles que nadie nombra" },
      { file: "draconic hideout.webp", caption: "Escondite Dracónico", sub: "Refugio oculto" },
    ],
  },

  "arkala": {
    folder: "Plano Material/Los Renegados/Arkala",
    immersiveBg: "Arkala outside.webp",
    curated: [
      { file: "Ciudad de Arkala.webp", caption: "Ciudad de Arkala", sub: "Vista del asentamiento principal" },
      { file: "Arkala outside.webp", caption: "Afueras de Arkala", sub: "Las rutas que llegan al sur" },
    ],
  },

  "lefayes-arrowhead": {
    folder: "Plano Material/Monarquía de Lefaye",
    immersiveBg: "Syltris.webp",
    curated: [
      { file: "Syltris.webp", caption: "Syltris", sub: "Capital de la Monarquía" },
      { file: "Syltris2.webp", caption: "Syltris", sub: "Vista alternativa" },
      { file: "Syltris3.webp", caption: "Syltris", sub: "Otro ángulo" },
      { file: "Syltris4.webp", caption: "Syltris", sub: "Cuarta vista" },
      { file: "Syltris entrada desde mar.webp", caption: "Syltris desde el mar", sub: "Entrada por el oeste" },
      { file: "Puente entrada syltris.webp", caption: "Puente de entrada", sub: "El acceso al puerto" },
      { file: "Sombra de Syltris.webp", caption: "Sombra de Syltris", sub: "Visión oscura de la capital" },
      { file: "Iglesia de Lefaye.webp", caption: "Iglesia de Lefaye", sub: "Templo central de la Monarquía" },
      { file: "Distrito comercial.webp", caption: "Distrito comercial", sub: "Mercados y gremios" },
      { file: "Jardín del SIlencio.webp", caption: "Jardín del Silencio", sub: "Espacio ceremonial" },
      { file: "Ingalvúr.webp", caption: "Ingalvúr", sub: "Frontera norte" },
      { file: "Woodpetal Mansion.webp", caption: "Mansión Woodpetal", sub: "Residencia aristocrática" },
      { file: "Slave Camp Syltris.webp", caption: "Campo de Syltris", sub: "Zona de servidumbre" },
      { file: "reloj de sol.webp", caption: "Reloj de Sol", sub: "Punto de referencia ancestral" },
      { file: "well en sombras de syltris.webp", caption: "Pozo en la sombra", sub: "Bajo Syltris" },
    ],
  },

  // ── Lugares sin curación: el componente auto-genera desde el filesystem ──

  "underdark": {
    folder: "Plano Material/Underdark",
    immersiveBg: "Camino de Turmalina.webp",
  },
  "coven-negro": {
    folder: "Plano Material/Zonas Grises/Bosque Petrificado/Coven Negro",
    immersiveBg: "Bosque Pettrificado.webp",
  },
  "coven-rojo": {
    folder: "Plano Material/Zonas Grises/Coven Rojo",
    immersiveBg: "bosque mysha.webp",
  },
  "bosque-memorias": {
    folder: "Plano Material/Zonas Grises/Bosque de las Memorias",
    immersiveBg: "Bosque de las Memorias.webp",
  },
  "gleetjeris": {
    folder: "Plano Material/Zonas Grises/Gleetjeris",
    immersiveBg: "Gleetjeris.webp",
  },
  "mar-leviatan": {
    folder: "Plano Material/Zonas Grises/Mar del Leviatán",
    immersiveBg: "underwater.webp",
  },
  "lorenza": {
    folder: "Plano Material/La Gran Aristocracia/Lorenza",
    immersiveBg: "Lorenza1.webp",
  },
  "plano-abisal": {
    folder: "Plano Abisal",
    immersiveBg: "1er capa, Pazunia,/1_pazunia_landscape_abyss.webp",
  },
};

// ── Helpers ──

const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Convierte "Catedral Druidia.webp" → "Catedral Druidia" */
function captionFromFilename(file: string): string {
  const basename = path.basename(file, path.extname(file));
  return basename.replace(/[_-]+/g, " ").trim();
}

/** Lista recursiva de archivos en una carpeta, devuelve paths relativos al folder */
function listFolderRecursive(absDir: string, baseDir = absDir): string[] {
  if (!fs.existsSync(absDir)) return [];
  const out: string[] = [];
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(absDir, e.name);
    if (e.isDirectory()) {
      out.push(...listFolderRecursive(abs, baseDir));
    } else if (/\.webp$/i.test(e.name)) {
      out.push(path.relative(baseDir, abs).replace(/\\/g, "/"));
    }
  }
  return out;
}

export type LocationSlide = {
  /** Path absoluto URL ("/Lugares - planos/Plano X/.../foo.webp"), ya URL-encoded */
  src: string;
  caption: string;
  sub?: string;
  alt: string;
  lightboxId: string;
};

export type ResolvedLocation = {
  slug: string;
  slides: LocationSlide[];
  immersiveBgSrc: string;
};

function urlFor(folderRel: string, fileRel: string): string {
  const full = `${ROOT}/${folderRel}/${fileRel}`;
  return "/" + full.split("/").map(encodeURIComponent).join("/");
}

/** Devuelve null si el slug no tiene mapping o si la carpeta está vacía */
export function resolveLocation(slug: string): ResolvedLocation | null {
  const map = LOCATION_IMAGES[slug];
  if (!map) return null;

  const absFolder = path.join(PUBLIC_DIR, ROOT, map.folder);
  const allFiles = listFolderRecursive(absFolder);
  if (allFiles.length === 0) return null;

  let rawSlides: RawSlide[];
  if (map.curated && map.curated.length > 0) {
    // Filtrar curados a los que realmente existen en disco
    const fileSet = new Set(allFiles);
    rawSlides = map.curated.filter((s) => fileSet.has(s.file));
  } else {
    // Auto-derivar de todos los archivos
    rawSlides = allFiles.map((file) => ({ file, caption: captionFromFilename(file) }));
  }

  if (rawSlides.length === 0) return null;

  const slides: LocationSlide[] = rawSlides.map((s, i) => ({
    src: urlFor(map.folder, s.file),
    caption: s.caption,
    sub: s.sub,
    alt: s.caption + (s.sub ? " — " + s.sub : ""),
    lightboxId: `${slug}-${i}`,
  }));

  const immersiveBg = map.immersiveBg ?? rawSlides[0].file;
  const immersiveBgSrc = urlFor(map.folder, immersiveBg);

  return { slug, slides, immersiveBgSrc };
}

/** Lista de slugs con mapping definido (no garantiza que tengan archivos en disco) */
export function locationSlugsWithImages(): string[] {
  return Object.keys(LOCATION_IMAGES);
}

/** Versión filtrada: solo slugs que tienen al menos 1 archivo en disco */
export function locationSlugsResolved(): string[] {
  return Object.keys(LOCATION_IMAGES).filter((slug) => resolveLocation(slug) !== null);
}
