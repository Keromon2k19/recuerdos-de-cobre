export const ATLAS_V2_PORTRAIT_PLACEHOLDER =
  "/assets/atlas/portraits/_placeholder-1.svg";

export const ATLAS_V2_KNOWN_PORTRAITS: Record<string, string> = {
  mysha: "/assets/atlas/portraits/mysha.png",
  "io-campbell": "/assets/atlas/portraits/io-campbell.png",
  eryon: "/images/personajes/eryon.jpg",
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
  // lote imagenes personajes (jun 2026)
  aerindel: "/images/personajes/aerindel.png",
  aisha: "/images/personajes/aisha.jpg",
  "alexia-vostrofer": "/images/personajes/alexia-vostrofer.jpg",
  "el-desconocido": "/images/personajes/el-desconocido.jpg",
  "galdur-bloodblade": "/images/personajes/galdur-bloodblade.jpg",
  luari: "/images/personajes/luari.jpg",
  lucky: "/images/personajes/lucky.jpg",
  magma: "/images/personajes/magma.jpg",
  smooth: "/images/personajes/smooth.jpg",
  hansel: "/images/personajes/hansel.jpg",
  melissa: "/images/personajes/melissa.png",
  anastasia: "/images/personajes/anastasia.jpg",
  "michael-rudriberg": "/images/personajes/michael-rudriberg.jpg",
  "misri-mlesir": "/images/personajes/misri-mlesir.jpg",
  nendra: "/images/personajes/nendra.jpg",
  ormund: "/images/personajes/ormund.png",
  "talisa-talashon": "/images/personajes/talisa-talashon.jpg",
  katy: "/images/personajes/katy.jpg",
  "el-emperador": "/images/personajes/el-emperador.png",
  "eldrin-van-lurgdhen": "/images/personajes/eldrin-van-lurgdhen.jpg",
  tiamat: "/images/personajes/tiamat.png",
  vecna: "/images/personajes/vecna.png",
};

export function resolveAtlasPortrait(
  slug: string,
  image?: string | null,
): string {
  return (
    image?.trim() ||
    ATLAS_V2_KNOWN_PORTRAITS[slug] ||
    ATLAS_V2_PORTRAIT_PLACEHOLDER
  );
}
