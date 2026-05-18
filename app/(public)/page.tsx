// app/(public)/page.tsx — Home de la antología. Portada narrativa: no es
// el formulario de carga. Invita a explorar la campaña.
import Link from "next/link";
import { readEpisode, getVaultStats } from "@/lib/vault";
import { cachedListEpisodes, cachedListByType } from "@/lib/public-cache";
import { parseMarkdown } from "@/lib/markdown";
import { splitEpisodeSections } from "@/lib/episode-sections";
import { resolveImage } from "@/lib/images";
import { PUBLIC_ENTITIES } from "@/lib/entity-public";
import AtlasImage from "@/components/public/AtlasImage";

export const dynamic = "force-dynamic";

function vault() {
  return process.env.VAULT_PATH?.trim() || "";
}

function plainExcerpt(md: string, max = 280): string {
  const txt = md
    .replace(/^#+ .*$/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/^[->]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (txt.length <= max) return txt;
  const cut = txt.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

export default async function HomePage() {
  const vp = vault();
  const [episodes, personajes, stats] = await Promise.all([
    vp ? cachedListEpisodes(vp) : Promise.resolve([]),
    vp ? cachedListByType(vp, "personaje") : Promise.resolve([]),
    vp ? getVaultStats(vp) : Promise.resolve({} as Record<string, number>),
  ]);

  const total = episodes.length;
  const latest = episodes[episodes.length - 1];

  let latestData:
    | { numero: number; titulo: string; excerpt: string; procesado?: string; castN: number }
    | null = null;
  if (latest) {
    const content = await readEpisode(vp, latest.numero);
    if (content) {
      const { body } = parseMarkdown(content);
      const secs = splitEpisodeSections(body);
      const crono =
        secs.find((s) => /crono/i.test(s.title)) ||
        secs.find((s) => /^resumen/i.test(s.title)) ||
        secs[0];
      const cast = secs.find((s) => /cast/i.test(s.title));
      latestData = {
        numero: latest.numero,
        titulo: latest.titulo || `Registro ${latest.numero}`,
        excerpt: plainExcerpt(crono?.body ?? ""),
        procesado: latest.procesado,
        castN: cast ? (cast.body.match(/^- /gm)?.length ?? 0) : 0,
      };
    }
  }

  const featured = [...personajes]
    .sort((a, b) => (b.apariciones?.length ?? 0) - (a.apariciones?.length ?? 0))
    .slice(0, 4);

  const index = [
    {
      label: "Crónicas",
      href: "/cronicas",
      n: stats.episodios ?? total,
      live: true,
      blurb: "El registro episodio por episodio.",
    },
    ...PUBLIC_ENTITIES.map((c) => ({
      label: c.plural,
      href: `/${c.segment}`,
      n: stats[c.tipo] ?? 0,
      live: true,
      blurb: c.blurb,
    })),
    {
      label: "Mapa",
      href: "/mapa",
      n: 0,
      live: true,
      blurb: "Memoria conectada del mundo.",
    },
  ];

  const heroImg = resolveImage(
    {},
    "episodios",
    "Atmósfera de la Metrópolis de Cobre al anochecer"
  );

  return (
    <>
      <section className="hero">
        <div className="hero-media">
          <AtlasImage img={heroImg} priority />
        </div>
        <div className="hero-inner">
          <div className="hero-rule rise" style={{ "--i": 0 } as React.CSSProperties} />
          <p className="eyebrow rise" style={{ "--i": 0 } as React.CSSProperties}>
            Archivo de campaña <span className="dim">·</span> {total} registros
          </p>
          <h1 className="rise" style={{ "--i": 1 } as React.CSSProperties}>
            Recuerdos <span className="accent">de Cobre</span>
          </h1>
          <p className="hero-sub rise" style={{ "--i": 2 } as React.CSSProperties}>
            La antología de lo que el grupo vivió: crónicas episodio por
            episodio, los personajes que cruzaron su camino y los misterios que
            siguen sin respuesta.
          </p>
          <div className="hero-cta rise" style={{ "--i": 3 } as React.CSSProperties}>
            <Link href="/cronicas" className="btn btn-primary">
              Explorar crónicas
            </Link>
            <Link href="/personajes" className="btn btn-ghost">
              Ver personajes
            </Link>
          </div>
        </div>
      </section>

      {latestData && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Último registro</p>
                <h2>Lo más reciente del archivo</h2>
              </div>
              <Link href="/cronicas" className="more">
                Todas las crónicas →
              </Link>
            </div>
            <div className="feature">
              <Link
                href={`/cronicas/${latestData.numero}`}
                className="feature-media"
                aria-label={`Abrir crónica ${latestData.numero}`}
              >
                <AtlasImage
                  img={resolveImage({}, "episodios", latestData.titulo)}
                />
              </Link>
              <div>
                <p className="eyebrow">
                  Registro {String(latestData.numero).padStart(3, "0")}
                </p>
                <h2>
                  <Link href={`/cronicas/${latestData.numero}`}>
                    {latestData.titulo}
                  </Link>
                </h2>
                <p className="excerpt">{latestData.excerpt}</p>
                <div className="meta">
                  {latestData.castN > 0 && <span>{latestData.castN} en escena</span>}
                  {latestData.procesado && (
                    <span>
                      Archivado{" "}
                      {new Date(latestData.procesado).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Índice del archivo</p>
              <h2>Por dónde entrar</h2>
            </div>
          </div>
          <div className="atlas-index">
            {index.map((c, i) => {
              const inner = (
                <>
                  <span className="num">
                    {c.n ? String(c.n).padStart(3, "0") : "—"}
                  </span>
                  <h3>{c.label}</h3>
                  <p>{c.blurb}</p>
                </>
              );
              return c.live ? (
                <Link
                  key={c.label}
                  href={c.href}
                  className="index-cell rise"
                  data-live="true"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={c.label}
                  className="index-cell rise"
                  data-live="false"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Figuras del archivo</p>
                <h2>Quién aparece más</h2>
                <p className="lead">
                  Los personajes con más apariciones en las crónicas cargadas.
                </p>
              </div>
              <Link href="/personajes" className="more">
                Todos los personajes →
              </Link>
            </div>
            <div className="card-grid">
              {featured.map((p, i) => (
                <Link
                  key={p.slug}
                  href={`/personajes/${p.slug}`}
                  className="entity-card rise"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <div className="portrait">
                    <AtlasImage img={resolveImage({}, "personajes", p.nombre)} />
                  </div>
                  <div className="body">
                    <span className="kicker">
                      {p.rol ? p.rol : "Personaje"}
                    </span>
                    <h3>{p.nombre}</h3>
                    {p.descripcion && <p className="desc">{p.descripcion}</p>}
                    <div className="tagrow">
                      <span className="tag">
                        {p.apariciones?.length
                          ? `${p.apariciones.length} apariciones`
                          : "Solo canon"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
