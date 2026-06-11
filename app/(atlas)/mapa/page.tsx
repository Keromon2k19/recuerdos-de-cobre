import MapaClient from "./MapaClient";
import {
  locationSlugsResolved,
  resolveLocation,
} from "@/data/atlas/location-images";
import type { V2Region } from "@/data/atlas/locations";
import { getAllRegions, getAdditionSlugs } from "@/lib/map-overrides";
import { cachedBuildAtlasWikiResolver } from "@/lib/wiki-resolver";
import { cachedListByType, cachedAtlasEntityDetail } from "@/lib/public-cache";
import { publicVaultPath } from "@/lib/public-vault-path";
import { resolveAtlasPortrait } from "@/lib/atlas-portraits";
import { resolveAtlasCharacterRole } from "@/lib/atlas-character-role";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mapa - Grimorio de Lore",
};

export default async function MapaPage() {
  // Lugares con imágenes (originales curados) + lugares creados desde la UI.
  // Se filtran las originales sin imágenes (Yggdrasil, Nararok, Murmek).
  const addedSlugs = getAdditionSlugs();
  const additionSlugList = Array.from(addedSlugs);
  const regions = getAllRegions()
    .map(withResolvedLocationImage);

  const vp = publicVaultPath();
  const [rawChars, resolve] = await Promise.all([
    cachedListByType(vp, "personaje"),
    cachedBuildAtlasWikiResolver(vp),
  ]);

  // Obtener detalle de todos los personajes para procesar sus relaciones
  const charDetails = await Promise.all(
    rawChars.map(async (c) => {
      const detail = await cachedAtlasEntityDetail(vp, "personaje", c.slug);
      return {
        slug: c.slug,
        nombre: c.nombre,
        imageSrc: resolveAtlasPortrait(c.slug, c.image),
        isPC: resolveAtlasCharacterRole(c.slug, c.rol) === "PJ",
        relations: detail?.relations || [],
      };
    })
  );

  // 1. Trazado de Viaje por personaje: Lista de slugs de lugares visitados cronológicamente
  const characterJourneys = charDetails
    .filter((char) => char.isPC) // Principalmente trazamos a los PJs jugables
    .map((char) => {
      const visitedMap = new Map<string, { slug: string; episode: number }>();

      for (const rel of char.relations) {
        const resolvedPath = resolve(rel.name);
        if (resolvedPath && resolvedPath.startsWith("/lugares/")) {
          const locationSlug = resolvedPath.split("/")[2];
          const ep = rel.episode ?? 0;
          
          // Guardamos la primera aparición o visita en episodio para ordenar
          if (!visitedMap.has(locationSlug) || visitedMap.get(locationSlug)!.episode > ep) {
            visitedMap.set(locationSlug, { slug: locationSlug, episode: ep });
          }
        }
      }

      const journey = Array.from(visitedMap.values())
        .sort((a, b) => a.episode - b.episode)
        .map((v) => v.slug);

      return {
        slug: char.slug,
        nombre: char.nombre,
        journey,
      };
    })
    .filter((j) => j.journey.length > 0);

  // 2. Conexiones locales por Región/Lugar: mapa de slugLugar -> personajes vinculados
  const locationConnections: Record<
    string,
    Array<{ slug: string; nombre: string; imageSrc: string; relation: string; episode?: number }>
  > = {};

  for (const char of charDetails) {
    for (const rel of char.relations) {
      const resolvedPath = resolve(rel.name);
      if (resolvedPath && resolvedPath.startsWith("/lugares/")) {
        const locationSlug = resolvedPath.split("/")[2];
        if (!locationConnections[locationSlug]) {
          locationConnections[locationSlug] = [];
        }
        
        // Evitamos duplicar la misma relación exacta
        const exists = locationConnections[locationSlug].some(
          (conn) => conn.slug === char.slug && conn.relation === rel.detail && conn.episode === rel.episode
        );
        
        if (!exists) {
          locationConnections[locationSlug].push({
            slug: char.slug,
            nombre: char.nombre,
            imageSrc: char.imageSrc,
            relation: rel.detail,
            episode: rel.episode,
          });
        }
      }
    }
  }

  // Ordenar conexiones en cada lugar por episodio (más antiguos primero o más recientes)
  for (const slug of Object.keys(locationConnections)) {
    locationConnections[slug].sort((a, b) => (b.episode ?? 0) - (a.episode ?? 0));
  }

  return (
    <section className="av2-p-wrap">
      <div className="av2-p-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/atlas/backgrounds/hero.png"
          alt=""
          className="av2-p-bg-img"
        />
      </div>

      <header className="av2-page-head av2-page-head--mapa">
        <p className="av2-page-eyebrow">Atlas de Eyira</p>
        <h1 className="av2-page-title">Mapa</h1>
      </header>

      <MapaClient
        regions={regions}
        additionSlugs={additionSlugList}
        characterJourneys={characterJourneys}
        locationConnections={locationConnections}
      />
    </section>
  );
}

function withResolvedLocationImage(region: V2Region): V2Region {
  const resolved = resolveLocation(region.slug);
  const imageSrc =
    region.imageSrc ?? resolved?.immersiveBgSrc ?? resolved?.slides[0]?.src;
  return imageSrc === region.imageSrc ? region : { ...region, imageSrc };
}
