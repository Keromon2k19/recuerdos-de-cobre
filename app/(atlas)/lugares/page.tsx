import Link from "next/link";
import type { CSSProperties } from "react";
import {
  resolveLocation,
  type ResolvedLocation,
} from "@/data/atlas-v2/location-images";
import type { V2Region } from "@/data/atlas-v2/locations";
import { getAllRegions, getAdditionSlugs } from "@/lib/map-overrides";

export const metadata = {
  title: "Lugares - Grimorio de Lore",
};

type LugarIndexItem = {
  region: V2Region;
  resolved: ResolvedLocation | null;
  imageSrc: string | null;
  imageCount: number;
  isAddition: boolean;
};

const FEATURED_SLUGS = [
  "santuario-libres",
  "la-metropolis-cobre",
  "bosque-memorias",
  "lefayes-arrowhead",
];

function toLugarIndexItem(
  region: V2Region,
  additionSlugs: Set<string>
): LugarIndexItem | null {
  const resolved = resolveLocation(region.slug);
  const isAddition = additionSlugs.has(region.slug);

  // La ficha de detalle solo abre lugares con imagen resuelta o additions.
  if (!resolved && !isAddition) return null;

  return {
    region,
    resolved,
    imageSrc:
      resolved?.immersiveBgSrc ??
      resolved?.slides[0]?.src ??
      region.imageSrc ??
      null,
    imageCount: resolved?.slides.length ?? 0,
    isAddition,
  };
}

function buildLugarItems(): LugarIndexItem[] {
  const additionSlugs = getAdditionSlugs();
  return getAllRegions()
    .map((region) => toLugarIndexItem(region, additionSlugs))
    .filter((item): item is LugarIndexItem => item !== null);
}

function pickFeatured(items: LugarIndexItem[]): LugarIndexItem {
  return (
    FEATURED_SLUGS
      .map((slug) => items.find((item) => item.region.slug === slug))
      .find((item): item is LugarIndexItem => Boolean(item)) ?? items[0]
  );
}

function excerpt(text: string): string {
  if (text.length <= 220) return text;
  return `${text.slice(0, 217).trimEnd()}...`;
}

function imageLabel(count: number): string {
  if (count === 0) return "Sin galeria";
  if (count === 1) return "1 imagen";
  return `${count} imagenes`;
}

function placeTransitionStyle(slug: string): CSSProperties {
  return {
    viewTransitionName: `av2-place-${slug}`,
  } as CSSProperties;
}

export default function LugaresPage() {
  const items = buildLugarItems();
  const featured = pickFeatured(items);
  const visibleItems = items.filter(
    (item) => item.region.slug !== featured.region.slug
  );

  return (
    <section className="av2-p-wrap">
      <div className="av2-p-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/atlas-v2/backgrounds/hero.png"
          alt=""
          className="av2-p-bg-img"
        />
      </div>

      <header className="av2-page-head av2-page-head--lugares">
        <p className="av2-page-eyebrow">Atlas de Eyira</p>
        <h1 className="av2-page-title">Lugares</h1>
      </header>

      <main className="av2-lugares-index">
        <article
          className="av2-lugares-feature"
          data-tone={featured.region.tone}
        >
          <Link
            href={`/lugares/${featured.region.slug}`}
            className="av2-lugares-feature-media-wrap"
          >
            {featured.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="av2-lugares-feature-bleed"
                src={featured.imageSrc}
                alt=""
                aria-hidden="true"
              />
            ) : null}

            <div className="av2-lugares-feature-media" aria-hidden="true">
              {featured.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.imageSrc}
                  alt=""
                  style={placeTransitionStyle(featured.region.slug)}
                />
              ) : (
                <span>{featured.region.glyph}</span>
              )}
            </div>
          </Link>

          <div className="av2-lugares-feature-body">
            <Link
              href="/mapa"
              className="av2-lugares-map-link av2-lugares-map-link--feature"
            >
              Abrir mapa
              <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
                <path
                  d="M5 12h14M13 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </Link>

            <Link
              href={`/lugares/${featured.region.slug}`}
              className="av2-lugares-feature-content"
            >
              <p className="av2-lugares-card-kicker">
                {featured.region.category}
                {featured.region.hideFromMap ? " / fuera del mapa" : ""}
              </p>
              <h2>{featured.region.nombre}</h2>
              <p className="av2-lugares-feature-tagline">
                {featured.region.tagline}
              </p>
              <p className="av2-lugares-feature-desc">
                {featured.region.descripcion}
              </p>
              <dl className="av2-lugares-feature-meta">
                <div>
                  <dt>Influencia</dt>
                  <dd>{featured.region.meta.influencia}</dd>
                </div>
                <div>
                  <dt>Industria</dt>
                  <dd>{featured.region.meta.industria}</dd>
                </div>
                <div>
                  <dt>Visuales</dt>
                  <dd>{imageLabel(featured.imageCount)}</dd>
                </div>
              </dl>
            </Link>
          </div>
        </article>

        <section className="av2-lugares-grid" aria-label="Lugares registrados">
          {visibleItems.map((item) => (
            <Link
              key={item.region.slug}
              href={`/lugares/${item.region.slug}`}
              className="av2-lugar-card"
              data-tone={item.region.tone}
            >
              <div className="av2-lugar-card-media" aria-hidden="true">
                {item.imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageSrc}
                    alt=""
                    style={placeTransitionStyle(item.region.slug)}
                  />
                ) : (
                  <span>{item.region.glyph}</span>
                )}
              </div>
              <div className="av2-lugar-card-body">
                <p className="av2-lugares-card-kicker">
                  {item.region.category}
                  {item.region.hideFromMap ? " / fuera del mapa" : ""}
                </p>
                <h3>{item.region.nombre}</h3>
                <p>{excerpt(item.region.descripcion)}</p>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </section>
  );
}
