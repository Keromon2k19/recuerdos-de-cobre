import { notFound } from "next/navigation";
import {
  resolveLocation,
  locationSlugsResolved,
} from "@/data/atlas/location-images";
import { getAllRegions, getAdditionSlugs } from "@/lib/map-overrides";
import HeroCarousel, {
  type CarouselSlide,
  type HeroStat,
} from "@/components/atlas/HeroCarousel";
import PageImmersiveBackground from "@/components/atlas/PageImmersiveBackground";
import LugarInfoDrawer, {
  type LugarSection,
} from "@/components/atlas/LugarInfoDrawer";
import AtlasVaultEntityPage, {
  buildAtlasEntityMetadata,
} from "@/components/atlas/AtlasVaultEntityPage";

// dynamicParams: true para que lugares nuevos (additions) sin pre-render
// también funcionen sin rebuild.
export const dynamicParams = true;

export function generateStaticParams() {
  return locationSlugsResolved().map((slug) => ({ slug }));
}

type RouteParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const region = getAllRegions().find((r) => r.slug === slug);
  if (!region) return buildAtlasEntityMetadata("lugar", slug);
  return {
    title: `${region.nombre} - Grimorio de Lore`,
  };
}

export default async function LugarDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const region = getAllRegions().find((r) => r.slug === slug);
  if (!region) {
    return (
      <AtlasVaultEntityPage
        kind="lugar"
        slug={slug}
        variant="world"
        backHref="/lugares"
        backLabel="Volver a lugares"
        eyebrow="Registro geográfico"
      />
    );
  }

  // Lugares nuevos (additions) o preexistentes sin imágenes: renderizamos un
  // placeholder elegante en lugar de 404.
  const resolved = resolveLocation(slug);

  const slides: CarouselSlide[] = resolved?.slides ?? [];

  const drawerSections: LugarSection[] = [
    {
      id: "descripcion",
      label: "Descripción",
      body: region.descripcion || "Sin descripción todavía.",
      empty: !region.descripcion,
    },
    {
      id: "historia",
      label: "Historia",
      body: "Próximamente — esta sección se llenará con la historia narrativa del lugar tomada de las extracciones del vault.",
      empty: true,
    },
    {
      id: "habitantes",
      label: "Habitantes notables",
      body: "Próximamente — referencias cruzadas con personajes que vivieron, visitaron o murieron acá.",
      empty: true,
    },
    {
      id: "facciones",
      label: "Facciones presentes",
      body: "Próximamente — facciones con presencia activa o histórica.",
      empty: true,
    },
    {
      id: "episodios",
      label: "Episodios donde aparece",
      body: "Próximamente — se llenará automáticamente cuando crucemos el índice de menciones del vault con cada lugar.",
      empty: true,
    },
  ];

  // Stats card de la ficha — mismo para ambas variantes
  const stats: HeroStat[] = [
    { label: "Gobierno", value: region.meta.gobierno },
    { label: "Población", value: region.meta.poblacion },
    { label: "Industria", value: region.meta.industria },
    { label: "Influencia", value: region.meta.influencia },
  ];

  // Variante placeholder: lugar creado desde la UI, sin imágenes mapeadas
  if (!resolved) {
    return (
      <section className="av2-lugar-detail av2-lugar-detail--fitviewport av2-lugar-detail--placeholder">
        <div className="av2-lugar-placeholder">
          <div className="av2-lugar-placeholder-overlay">
            <div className="av2-lugar-placeholder-text">
              <p className="av2-hc-eyebrow">{region.category} · Recuerdos de Cobre</p>
              <h1 className="av2-hc-title">{region.nombre}</h1>
              {region.tagline && (
                <p className="av2-hc-tagline">{region.tagline}</p>
              )}
              <p className="av2-lugar-placeholder-note">
                Aún no hay contenido visual para este lugar.
                <br />
                Las imágenes se mapean en <code>data/atlas/location-images.ts</code>.
              </p>
              <div className="av2-hc-cta">
                <LugarInfoDrawer
                  title={region.nombre}
                  eyebrow={`${region.category} · Recuerdos de Cobre`}
                  sections={drawerSections}
                />
              </div>
            </div>
            <dl className="av2-hc-stats av2-lugar-placeholder-stats">
              {stats.map((s) => (
                <div className="av2-hc-stat" key={s.label}>
                  <dt><span className="av2-hc-stat-bullet" aria-hidden="true">›</span>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageImmersiveBackground
        src={resolved.immersiveBgSrc}
        blur={36}
        intensity="strong"
      />

      <section className="av2-lugar-detail av2-lugar-detail--fitviewport">
        <HeroCarousel
          eyebrow={`${region.category} · Recuerdos de Cobre`}
          title={region.nombre}
          tagline={region.tagline}
          slides={slides}
          intervalMs={7500}
          stats={stats}
          viewTransitionName={`av2-place-${slug}`}
          cta={
            <LugarInfoDrawer
              title={region.nombre}
              eyebrow={`${region.category} · Recuerdos de Cobre`}
              sections={drawerSections}
            />
          }
        />

        {slides.map((s) => (
          <div
            key={s.lightboxId}
            id={s.lightboxId}
            className="av2-ld-lb"
            role="dialog"
            aria-label={s.alt}
          >
            <a href="#" className="av2-ld-lb-close" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M6 6L18 18M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={s.alt} />
            <p className="av2-ld-lb-cap">{s.alt}</p>
          </div>
        ))}
      </section>
    </>
  );
}
