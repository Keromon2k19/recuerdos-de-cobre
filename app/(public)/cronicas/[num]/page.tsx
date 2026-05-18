// app/(public)/cronicas/[num]/page.tsx — Expediente del episodio. Cada
// crónica es un registro de archivo: portada atmosférica, resumen
// cronológico cómodo de leer en panel de papel, y un riel de datos
// (reparto, lugares, facciones, misterios) con navegación prev/next.
import Link from "next/link";
import { notFound } from "next/navigation";
import { readEpisode } from "@/lib/vault";
import { cachedListEpisodes } from "@/lib/public-cache";
import { parseMarkdown } from "@/lib/markdown";
import { splitEpisodeSections } from "@/lib/episode-sections";
import { renderMarkdown } from "@/lib/markdown-render";
import { buildWikiResolver } from "@/lib/wiki-resolver";
import { resolveImage } from "@/lib/images";
import { buildEpisodeMetadata } from "@/lib/public-meta";
import AtlasImage from "@/components/public/AtlasImage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ num: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildEpisodeMetadata(parseInt((await params).num, 10));
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

function clean(s: string): string {
  return s.replace(/\[\[|\]\]/g, "").replace(/^([^|]+)\|(.+)$/, "$2").trim();
}

const RAIL_CATS: Array<{ key: string; label: string }> = [
  { key: "personajes", label: "Reparto" },
  { key: "lugares", label: "Lugares" },
  { key: "facciones", label: "Facciones" },
  { key: "eventos", label: "Eventos" },
  { key: "objetos", label: "Objetos" },
];

export default async function ExpedientePage({ params }: Props) {
  const { num } = await params;
  const numero = parseInt(num, 10);
  if (isNaN(numero)) notFound();

  const vp = process.env.VAULT_PATH?.trim() || "";
  if (!vp) notFound();

  const [content, episodes, resolve] = await Promise.all([
    readEpisode(vp, numero),
    cachedListEpisodes(vp),
    buildWikiResolver(vp),
  ]);
  if (!content) notFound();

  const { frontmatter, body } = parseMarkdown(content);
  const titulo = (frontmatter.titulo as string) || `Registro ${numero}`;
  const procesado = frontmatter.procesado as string | undefined;
  const menciones =
    (frontmatter.menciones as Record<string, string[]> | undefined) ?? {};

  const sections = splitEpisodeSections(body);

  const idx = episodes.findIndex((e) => e.numero === numero);
  const prev = idx > 0 ? episodes[idx - 1] : null;
  const next = idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1] : null;

  const castSec = sections.find((s) => /cast/i.test(s.title));
  const castN = castSec ? castSec.body.match(/^- /gm)?.length ?? 0 : 0;

  const cover = resolveImage(frontmatter as Record<string, unknown>, "episodios", `Atmósfera del registro ${numero}: ${titulo}`);

  return (
    <section className="section">
      <div className="wrap">
        <div className="doc-head">
          <p className="crumb">
            <Link href="/">Archivo</Link> /{" "}
            <Link href="/cronicas">Crónicas</Link> / Registro{" "}
            {String(numero).padStart(3, "0")}
          </p>
          <p className="eyebrow">
            Registro {String(numero).padStart(3, "0")}
            {procesado && (
              <>
                {"  ·  "}
                <span className="dim">archivado {fmtDate(procesado)}</span>
              </>
            )}
          </p>
          <h1>
            <span className="reg-no">№ {String(numero).padStart(3, "0")} — </span>
            {titulo}
          </h1>
        </div>

        <div className="dossier-cover rise">
          <AtlasImage img={cover} priority />
        </div>

        <div className="expediente">
          <div className="exp-meta rise">
            <div className="exp-id">
              <span className="exp-id-key">Registro</span>
              <span>№ {String(numero).padStart(3, "0")}</span>
              {castN > 0 && <span>· {castN} en escena</span>}
              {procesado && <span>· archivado {fmtDate(procesado)}</span>}
            </div>
            <div className="exp-drops">
              {RAIL_CATS.map(({ key, label }) => {
                const items = menciones[key];
                if (!Array.isArray(items) || items.length === 0) return null;
                return (
                  <details className="meta-drop" name="exp-drop" key={key}>
                    <summary>
                      <span>{label}</span>
                      <b>{items.length}</b>
                    </summary>
                    <div className="meta-pop">
                      <div className="rail-chips">
                        {items.map((raw, i) => {
                          const name = clean(raw);
                          const href = resolve(name);
                          return href ? (
                            <Link key={i} href={href}>
                              {name}
                            </Link>
                          ) : (
                            <span key={i}>{name}</span>
                          );
                        })}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>

          <article className="read-panel rise" style={{ "--i": 1 } as React.CSSProperties}>
            <div className="prose">
              {sections.length === 0 && <p>Este registro todavía no tiene contenido.</p>}
              {sections.map((s, i) => (
                <div key={i}>
                  {s.title && <h2>{s.title}</h2>}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(s.body, resolve),
                    }}
                  />
                </div>
              ))}
            </div>
          </article>
        </div>

        <nav className="prevnext" aria-label="Navegación entre registros">
          {prev ? (
            <Link href={`/cronicas/${prev.numero}`}>
              ← № {String(prev.numero).padStart(3, "0")} · {prev.titulo}
            </Link>
          ) : (
            <span className="disabled">← Inicio del archivo</span>
          )}
          {next ? (
            <Link href={`/cronicas/${next.numero}`}>
              № {String(next.numero).padStart(3, "0")} · {next.titulo} →
            </Link>
          ) : (
            <span className="disabled">Fin del archivo →</span>
          )}
        </nav>
      </div>
    </section>
  );
}
