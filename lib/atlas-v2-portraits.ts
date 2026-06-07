export const ATLAS_V2_PORTRAIT_PLACEHOLDER =
  "/assets/atlas-v2/portraits/_placeholder-1.svg";

export const ATLAS_V2_KNOWN_PORTRAITS: Record<string, string> = {
  mysha: "/assets/atlas-v2/portraits/mysha.png",
  "io-campbell": "/assets/atlas-v2/portraits/io-campbell.png",
  anora: "/images/personajes/annora.jpg",
  annora: "/images/personajes/annora.jpg",
  "aeron-sylvaris": "/images/personajes/aeron-sylvaris.webp",
  ann: "/images/personajes/ann.webp",
  bishak: "/images/personajes/bishak.webp",
  borok: "/images/personajes/borok.png",
  champi: "/images/personajes/champi.png",
  cleopatra: "/images/personajes/cleopatra.webp",
  darko: "/images/personajes/darko.jpg",
  "david-ilcard": "/images/personajes/david-ilcard.png",
  eldyra: "/images/personajes/eldyra.webp",
  "elian-campbell": "/images/personajes/elian-campbell.png",
  "feanor-sylvaris": "/images/personajes/feanor-sylvaris.webp",
  layra: "/images/personajes/layra.webp",
  lucy: "/images/personajes/lucy.jpg",
  margot: "/images/personajes/margot.jpg",
  "miriel-campbell": "/images/personajes/miriel-campbell.png",
  narcissa: "/images/personajes/narcissa.webp",
  pablo: "/images/personajes/pablo.png",
  "pat-pat": "/images/personajes/pat.png",
  pat: "/images/personajes/pat.png",
  pilar: "/images/personajes/pilar.jpg",
  raylen: "/images/personajes/rylen.png",
  rylen: "/images/personajes/rylen.png",
  selenne: "/images/personajes/selenne.jpg",
  veltra: "/images/personajes/veltra.jpg",
};

export function resolveAtlasV2Portrait(
  slug: string,
  image?: string | null,
): string {
  return (
    image?.trim() ||
    ATLAS_V2_KNOWN_PORTRAITS[slug] ||
    ATLAS_V2_PORTRAIT_PLACEHOLDER
  );
}
