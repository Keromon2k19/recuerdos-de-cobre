import type { NextConfig } from "next";
import { LEGACY_PUBLIC_REDIRECTS } from "./lib/atlas-routes";

// Trigger config reload: 1
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
    return Object.entries(LEGACY_PUBLIC_REDIRECTS).map(
      ([source, destination]) => ({ source, destination, permanent: true }),
    );
  },
};

export default nextConfig;
