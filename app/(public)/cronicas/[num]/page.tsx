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
import { cachedBuildWikiResolver } from "@/lib/wiki-resolver";
import { resolveImage } from "@/lib/images";
import { buildEpisodeMetadata } from "@/lib/public-meta";
import { episodioLabel, episodioLabelCorto } from "@/lib/episode-number";
import AtlasImage from "@/components/public/AtlasImage";
import EpisodeBook, { type EpisodeBookPage } from "@/components/public/EpisodeBook";
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

function capLabel(numero: number): string {
  return `Cap. ${String(numero).padStart(3, "0")}`;
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

function sectionId(title: string, index: number): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `parte-${index + 1}-${slug || "registro"}`;
}

function shortSectionTitle(title: string): string {
  if (/cast|reparto/i.test(title)) return "Reparto";
  if (/crono/i.test(title)) return "Cronología";
  if (/decisiones|misterios/i.test(title)) return "Misterios";
  if (/lore extra/i.test(title)) return "Archivo";
  if (/lore|objetos/i.test(title)) return "Lore y objetos";
  return title;
}

function sectionIcon(title: string): EpisodeBookPage["icon"] {
  if (/cast|reparto/i.test(title)) return "cast";
  if (/crono/i.test(title)) return "chronology";
  if (/decisiones|misterios/i.test(title)) return "mystery";
  if (/lore extra/i.test(title)) return "archive";
  if (/lore|objetos/i.test(title)) return "relic";
  return "page";
}

function sectionTone(title: string): EpisodeBookPage["tone"] {
  if (/cast|reparto/i.test(title)) return "copper";
  if (/crono/i.test(title)) return "petrol";
  if (/decisiones|misterios/i.test(title)) return "wine";
  if (/lore extra/i.test(title)) return "ink";
  if (/lore|objetos/i.test(title)) return "gold";
  return "moss";
}

function summaryExcerpt(md: string): string {
  const blocks = md
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks.length > 0 ? blocks.slice(0, 2).join("\n\n") : md;
}

export default async function ExpedientePage({ params }: Props) {
  const { num } = await params;
  const numero = parseInt(num, 10);
  if (isNaN(numero)) notFound();

  const vp = process.env.VAULT_PATH?.trim() || "";
  if (!vp) notFound();

  const [content, episodes, resolve] = await Promise.all([
    readEpisode(vp, numero),
    cachedListEpisodes(vp),
    cachedBuildWikiResolver(vp),
  ]);
  if (!content) notFound();

  const { frontmatter, body } = parseMarkdown(content);
  const titulo = (frontmatter.titulo as string) || `Registro ${numero}`;
  const epLabel = episodioLabel(titulo, numero);
  const cap = capLabel(numero);
  const procesado = frontmatter.procesado as string | undefined;
  const menciones =
    (frontmatter.menciones as Record<string, string[]> | undefined) ?? {};

  const sections = splitEpisodeSections(body);
  const exactSummary = sections.find((s) => /^resumen$/i.test(s.title)) || null;
  const chronologicalSummary = sections.find((s) => /crono/i.test(s.title)) || null;
  const technicalSection = sections.find((s) => /lore extra/i.test(s.title)) || null;
  const summarySource = exactSummary || chronologicalSummary;
  const summaryHtml = summarySource
    ? renderMarkdown(
        exactSummary ? summarySource.body : summaryExcerpt(summarySource.body),
        resolve,
      )
    : "";
  const technicalHtml = technicalSection
    ? renderMarkdown(technicalSection.body, resolve)
    : "";
  const bookPages: EpisodeBookPage[] = sections
    .filter((s) => s !== exactSummary && s !== technicalSection)
    .map((s, i) => ({
      id: sectionId(s.title || `parte-${i + 1}`, i),
      title: s.title || `Parte ${i + 1}`,
      shortTitle: shortSectionTitle(s.title || `Parte ${i + 1}`),
      eyebrow: `Parte ${String(i + 1).padStart(2, "0")}`,
      icon: sectionIcon(s.title),
      tone: sectionTone(s.title),
      html: renderMarkdown(s.body, resolve),
      mode: /crono/i.test(s.title) ? "wide" : "paged",
    }));

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
            <Link href="/cronicas">Crónicas</Link> / {epLabel}
          </p>
          <p className="eyebrow">
            {cap} ·{" "}
            {epLabel}
            {procesado && (
              <>
                {"  ·  "}
                <span className="dim">archivado {fmtDate(procesado)}</span>
              </>
            )}
          </p>
          <h1>
            <span className="reg-no">{cap} · </span>
            <span className="reg-no">{epLabel} — </span>
            {titulo}
          </h1>
        </div>

        <div className="dossier-cover rise">
          <AtlasImage img={cover} priority sizes="min(1200px, 100vw)" />
        </div>

        <div className="expediente">
          <div className="exp-meta rise">
            <div className="exp-id">
              <span className="exp-id-key">Registro</span>
              <span>{cap}</span>
              <span>{epLabel}</span>
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

          <EpisodeBook
            summaryTitle={exactSummary?.title || "Resumen"}
            summaryHtml={summaryHtml}
            pages={bookPages}
          />
          {technicalSection && (
            <details className="technical-archive">
              <summary>
                <span>Datos técnicos del archivo</span>
                <b>Entidades extraídas</b>
              </summary>
              <div className="technical-archive-body read-panel">
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: technicalHtml }}
                />
              </div>
            </details>
          )}
        </div>

        <nav className="prevnext" aria-label="Navegación entre registros">
          {prev ? (
            <Link href={`/cronicas/${prev.numero}`}>
              ← {episodioLabelCorto(prev.titulo, prev.numero)} · {prev.titulo}
            </Link>
          ) : (
            <span className="disabled">← Inicio del archivo</span>
          )}
          {next ? (
            <Link href={`/cronicas/${next.numero}`}>
              {episodioLabelCorto(next.titulo, next.numero)} · {next.titulo} →
            </Link>
          ) : (
            <span className="disabled">Fin del archivo →</span>
          )}
        </nav>
      </div>
    </section>
  );
}
