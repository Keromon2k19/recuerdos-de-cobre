import type { NextConfig } from "next";

// Las rutas legacy /episodios y /entidades quedaron reemplazadas por la
// antología pública (/cronicas, /personajes, /lugares, …). Se redirigen
// permanentemente para no romper enlaces viejos. El procesamiento vive en
// /procesar, /review, /importar.
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async redirects() {
    return [
      { source: "/episodios", destination: "/cronicas", permanent: true },
      { source: "/episodios/:num", destination: "/cronicas/:num", permanent: true },
      { source: "/entidades/personaje", destination: "/personajes", permanent: true },
      { source: "/entidades/personaje/:slug", destination: "/personajes/:slug", permanent: true },
      { source: "/entidades/lugar", destination: "/lugares", permanent: true },
      { source: "/entidades/lugar/:slug", destination: "/lugares/:slug", permanent: true },
      { source: "/entidades/faccion", destination: "/facciones", permanent: true },
      { source: "/entidades/faccion/:slug", destination: "/facciones/:slug", permanent: true },
      { source: "/entidades/objeto", destination: "/objetos", permanent: true },
      { source: "/entidades/objeto/:slug", destination: "/objetos/:slug", permanent: true },
      { source: "/entidades/misterio", destination: "/misterios", permanent: true },
      { source: "/entidades/misterio/:slug", destination: "/misterios/:slug", permanent: true },
      { source: "/entidades/worldbuilding", destination: "/worldbuilding", permanent: true },
      { source: "/entidades/worldbuilding/:slug", destination: "/worldbuilding/:slug", permanent: true },
      // Tipos sin sección pública propia (evento/quote/decision): al índice.
      { source: "/entidades/:tipo*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
