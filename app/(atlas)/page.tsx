// app/(v2)/v2/page.tsx — Home del atlas V2 (ruta /v2).
// Datos reales del vault cuando VAULT_PATH está configurado.
// Si no hay vault: estado vacío elegante, sin errores.
import AtlasHomeFeature from "@/components/atlas/AtlasHomeFeature";
import { cachedListByType, cachedListEpisodes } from "@/lib/public-cache";
import { readEpisode } from "@/lib/vault";
import { parseMarkdown } from "@/lib/markdown";
import { resolveHeroBackground } from "@/data/atlas/hero-backgrounds";
import { buildHomeChapterSlides } from "@/lib/atlas-home";
import { publicVaultPath } from "@/lib/public-vault-path";
import styles from "./AtlasHero.module.css";

const HOME_CHAPTER_SCENE = "/assets/atlas/scenes/metropolis.webp";

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
    <section className={styles.hero}>
      {/* Fondo atmosférico: imagen + capas de gradiente CSS encima */}
      <div className={styles.heroBg} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroBackground.src}
          alt=""
          className={styles.heroImg}
        />
      </div>

      {/* — Título principal — */}
      <div className={styles.heroTop}>
        <p className={styles.heroEyebrow}>Antología · Tomo I</p>

        <div className={styles.ornament} aria-hidden="true">
          <span className={styles.ornamentDiamond} />
        </div>

        <h1 className={styles.heroTitle}>
          <span className={styles.titleMain}>Recuerdos</span>
          <span className={styles.titleDe}>de</span>
          <span className={`${styles.titleMain} ${styles.titleCopper}`}>Cobre</span>
        </h1>

        <div className={styles.ornament} aria-hidden="true">
          <span className={styles.ornamentDiamond} />
        </div>

        <p className={styles.heroSub}>
          El archivo de lo que el grupo vivió: crónicas episodio por episodio,
          los personajes que cruzaron su camino y los misterios que siguen sin respuesta.
        </p>
      </div>

      {/* — Últimas crónicas + cast contextual — */}
      <AtlasHomeFeature slides={slides} />
    </section>
  );
}
