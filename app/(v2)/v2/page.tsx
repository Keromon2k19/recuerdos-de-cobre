// app/(v2)/v2/page.tsx — Home del atlas V2 (ruta /v2).
// Datos reales del vault cuando VAULT_PATH está configurado.
// Si no hay vault: estado vacío elegante, sin errores.
import AtlasHomeFeature from "@/components/atlas-v2/AtlasHomeFeature";
import { cachedListByType, cachedListEpisodes } from "@/lib/public-cache";
import { readEpisode } from "@/lib/vault";
import { parseMarkdown } from "@/lib/markdown";
import { resolveHeroBackground } from "@/data/atlas-v2/hero-backgrounds";
import { buildHomeChapterSlides } from "@/lib/atlas-v2-home";
import { publicVaultPath } from "@/lib/public-vault-path";

const HOME_CHAPTER_SCENE = "/assets/atlas-v2/scenes/metropolis.webp";

export const dynamic = "force-static";

export default async function V2HomePage() {
const heroBackground = resolveHeroBackground(undefined);
  const vp = publicVaultPath();

  const episodes = vp ? await cachedListEpisodes(vp) : [];
  const recentEpisodes = episodes.slice(-5);
  const [characters, episodeEntries] = vp
    ? await Promise.all([
        cachedListByType(vp, "personaje"),
        Promise.all(
          recentEpisodes.map(async (episode) => {
            const content = await readEpisode(vp, episode.numero);
            const body = content ? parseMarkdown(content).body : "";
            return [episode.numero, body] as const;
          }),
        ),
      ])
    : [[], [] as Array<readonly [number, string]>];
  const slides = buildHomeChapterSlides({
    episodes,
    episodeBodies: new Map(episodeEntries),
    characters,
  }).map((slide) => ({
    ...slide,
    imageSrc: HOME_CHAPTER_SCENE,
  }));

  return (
    <section className="av2-hero">
      {/* Fondo atmosférico: imagen + capas de gradiente CSS encima */}
      <div className="av2-hero-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroBackground.src}
          alt=""
          className="av2-hero-img"
        />
      </div>

      {/* — Título principal — */}
      <div className="av2-hero-top">
        <p className="av2-hero-eyebrow">Antología · Tomo I</p>

        <div className="av2-ornament" aria-hidden="true">
          <span className="av2-ornament-diamond" />
        </div>

        <h1 className="av2-hero-title">
          <span className="av2-title-main">Recuerdos</span>
          <span className="av2-title-de">de</span>
          <span className="av2-title-main av2-title-copper">Cobre</span>
        </h1>

        <div className="av2-ornament" aria-hidden="true">
          <span className="av2-ornament-diamond" />
        </div>

        <p className="av2-hero-sub">
          El archivo de lo que el grupo vivió: crónicas episodio por episodio,
          los personajes que cruzaron su camino y los misterios que siguen sin respuesta.
        </p>
      </div>

      {/* — Últimas crónicas + cast contextual — */}
      <AtlasHomeFeature slides={slides} />
    </section>
  );
}
