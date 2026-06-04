// data/atlas-v2/music.ts
// Fuente de verdad de las pistas de música de la campaña (UI V2).
// El slug es el id estable y el nombre del archivo en public/assets/atlas-v2/music/.

export type MusicTrack = {
  slug: string;
  title: string;
  context: string;
  src: string;
  sourceUrl: string;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  { slug: "apertura",         title: "Apertura de partida",     context: "Tema de inicio",     src: "/assets/atlas-v2/music/apertura.mp3",         sourceUrl: "https://www.youtube.com/watch?v=2N2EeZ3oWrw" },
  { slug: "santuario-libres", title: "Santuario de los Libres", context: "Lugar",              src: "/assets/atlas-v2/music/santuario-libres.mp3", sourceUrl: "https://www.youtube.com/watch?v=TJuPBBw-l-M" },
  { slug: "metropolis-cobre", title: "Metrópolis de Cobre",     context: "Lugar",              src: "/assets/atlas-v2/music/metropolis-cobre.mp3", sourceUrl: "https://www.youtube.com/watch?v=WAsFGJAmVHY" },
  { slug: "arco-io",          title: "Arco de Io",              context: "Personaje",          src: "/assets/atlas-v2/music/arco-io.mp3",          sourceUrl: "https://www.youtube.com/watch?v=scTUgxmvzW0" },
  { slug: "wendigo",          title: "Wendigo",                 context: "Criatura / arco",    src: "/assets/atlas-v2/music/wendigo.mp3",          sourceUrl: "https://www.youtube.com/watch?v=VrMK1w-qyhY" },
  { slug: "arco-narcissa",    title: "Arco de Narcissa",        context: "Personaje",          src: "/assets/atlas-v2/music/arco-narcissa.mp3",    sourceUrl: "https://www.youtube.com/watch?v=RuYC6U3LBRs" },
  { slug: "arco-borok",       title: "Arco de Borok",           context: "Personaje",          src: "/assets/atlas-v2/music/arco-borok.mp3",       sourceUrl: "https://www.youtube.com/watch?v=IehDebm--P0" },
  { slug: "underdark",        title: "Underdark",               context: "Lugar",              src: "/assets/atlas-v2/music/underdark.mp3",        sourceUrl: "https://www.youtube.com/watch?v=fA8j3wOVzcw" },
  { slug: "syltris",          title: "Syltris",                 context: "Lugar",              src: "/assets/atlas-v2/music/syltris.mp3",          sourceUrl: "https://www.youtube.com/watch?v=eU0aaq5pjnQ" },
];
