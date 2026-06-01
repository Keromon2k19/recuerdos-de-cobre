// components/public/EntityDetail.tsx — Ficha pública de entidad.
// Identidad arriba (galería de imágenes + datos), y abajo un lector por
// secciones con índice lateral: la narrativa, las menciones por episodio y
// las relaciones dejan de estar apiladas en un scroll interminable y pasan
// a verse de a una, navegables desde el índice.
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { parseMarkdown } from "@/lib/markdown";
import { renderMarkdown } from "@/lib/markdown-render";
import { splitEpisodeSections } from "@/lib/episode-sections";
import { buildWikiResolver } from "@/lib/wiki-resolver";
import { resolveImages, type ResolvedImage } from "@/lib/images";
import { slugify } from "@/lib/slugify";
import { cachedListByType } from "@/lib/public-cache";
import { PUBLIC_ENTITIES, BY_TIPO } from "@/lib/entity-public";
import { ENTITY_FOLDERS, type EntityType } from "@/lib/types";
import AtlasImage from "@/components/public/AtlasImage";
import EntityReader, { type ReaderSection } from "@/components/public/EntityReader";

type Relacion = { con?: string; a?: string; tipo: string; episodio?: number };

// Grupos de relaciones, en orden de aparición en la ficha.
const REL_GROUPS = [
  { key: "jugadores", label: "Jugadores" },
  { key: "npcs", label: "NPCs" },
  { key: "facciones", label: "Facciones" },
  { key: "lugares", label: "Lugares" },
  { key: "objetos", label: "Objetos" },
  { key: "otros", label: "Otras fichas" },
  {
    key: "sin-clasificar",
    label: "Sin clasificar",
    note: "Todavía sin ficha propia. Se reagrupan solas cuando la entidad se cree.",
  },
] as const;
type RelGroupKey = (typeof REL_GROUPS)[number]["key"];

type ClassRef = { tipo: EntityType; href: string; isPJ: boolean };

function relTargetName(r: Relacion): string {
  return (r.con ?? r.a ?? "")
    .toString()
    .replace(/\[\[|\]\]/g, "")
    .replace(/^([^|]+)\|(.+)$/, "$2")
    .trim();
}

function groupFor(ref: ClassRef | undefined): RelGroupKey {
  if (!ref) return "sin-clasificar";
  switch (ref.tipo) {
    case "personaje":
      return ref.isPJ ? "jugadores" : "npcs";
    case "faccion":
      return "facciones";
    case "lugar":
      return "lugares";
    case "objeto":
      return "objetos";
    default:
      return "otros";
  }
}

function episodiosLabel(eps: number[]): string {
  if (eps.length === 0) return "";
  if (eps.length <= 4) return "ep. " + eps.join(", ");
  return `ep. ${eps[0]}–${eps[eps.length - 1]} · ${eps.length}×`;
}

/** Resumen compacto de apariciones: "46 episodios · ep. 1–62". */
function aparicionesResumen(eps: number[]): string | null {
  if (eps.length === 0) return null;
  const n = `${eps.length} ${eps.length === 1 ? "episodio" : "episodios"}`;
  if (eps.length === 1) return `${n} · ep. ${eps[0]}`;
  return `${n} · ep. ${eps[0]}–${eps[eps.length - 1]}`;
}

type Mencion = { num: number | null; title: string; body: string };

/**
 * Parte la sección "Menciones por episodio" en entradas por episodio.
 * Cada `### [[slug|Ep. N — Título]]` seguido de sus bullets es una entrada;
 * así se renderiza como lista colapsable en vez de un muro de prosa.
 */
function parseMentions(md: string): Mencion[] {
  return md
    .split(/^###[ \t]+/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const nl = part.indexOf("\n");
      const headingRaw = (nl >= 0 ? part.slice(0, nl) : part).trim();
      const body = (nl >= 0 ? part.slice(nl + 1) : "").trim();
      let label = headingRaw.replace(/^\[\[/, "").replace(/\]\]$/, "");
      const pipe = label.indexOf("|");
      if (pipe >= 0) label = label.slice(pipe + 1);
      label = label.trim();
      const numMatch = label.match(/ep\.?\s*(\d+)/i);
      const num = numMatch ? parseInt(numMatch[1], 10) : null;
      const dash = label.split(/\s[—–-]\s/);
      const title = dash.length > 1 ? dash.slice(1).join(" — ") : label;
      return { num, title, body };
    });
}

export default async function EntityDetail({
  tipo,
  slug,
}: {
  tipo: EntityType;
  slug: string;
}) {
  const cfg = BY_TIPO[tipo];
  if (!cfg) notFound();

  const vp = process.env.VAULT_PATH?.trim() || "";
  if (!vp) notFound();

  const filePath = path.join(vp, ENTITY_FOLDERS[tipo], slug + ".md");
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch {
    notFound();
  }

  const { frontmatter, body } = parseMarkdown(raw);
  const fm = frontmatter as Record<string, unknown>;

  // Resolutor de wikilinks + índice nombre/slug → {tipo, href, isPJ} para
  // clasificar relaciones por el tipo de entidad a la que apuntan.
  const [resolve, lists] = await Promise.all([
    buildWikiResolver(vp),
    Promise.all(
      PUBLIC_ENTITIES.map((c) =>
        cachedListByType(vp, c.tipo).then((items) => ({ c, items }))
      )
    ),
  ]);

  const refIndex = new Map<string, ClassRef>();
  for (const { c, items } of lists) {
    for (const it of items) {
      const isPJ =
        c.tipo === "personaje" &&
        ((it.rol ?? "").toUpperCase() === "PJ" || Boolean(it.jugador));
      const ref: ClassRef = {
        tipo: c.tipo,
        href: `/${c.segment}/${it.slug}`,
        isPJ,
      };
      const nameKey = it.nombre.toLowerCase();
      if (!refIndex.has(nameKey)) refIndex.set(nameKey, ref);
      if (!refIndex.has(it.slug)) refIndex.set(it.slug, ref);
    }
  }
  const classify = (name: string): ClassRef | undefined =>
    refIndex.get(name.toLowerCase()) ?? refIndex.get(slugify(name));

  const nombre = (fm.nombre as string) || slug;
  const alias = (fm.alias as string[]) ?? [];
  const apariciones = ((fm.apariciones as number[]) ?? [])
    .slice()
    .sort((a, b) => a - b);
  const relaciones = (fm.relaciones as Relacion[]) ?? [];
  const rol = fm.rol as string | undefined;
  const jugador = fm.jugador as string | undefined;
  const facciones = (fm.facciones as string[]) ?? [];
  const region = fm.region as string | undefined;
  const categoria = fm.categoria as string | undefined;
  const origen = fm.origen as string | undefined;

  // Identidad: filas etiqueta → valor.
  const identidad: Array<{ k: string; v: ReactNode }> = (
    [
      rol && { k: "Rol", v: rol },
      jugador && { k: "Jugador", v: jugador },
      facciones.length > 0 && {
        k: facciones.length > 1 ? "Facciones" : "Facción",
        v: facciones.map((f, i) => {
          const ref = classify(f);
          return (
            <span key={i}>
              {i > 0 && ", "}
              {ref ? <Link href={ref.href}>{f}</Link> : f}
            </span>
          );
        }),
      },
      region && { k: "Región", v: region },
      categoria && { k: "Categoría", v: categoria },
      origen && { k: "Origen", v: origen },
      aparicionesResumen(apariciones) && {
        k: "Aparece en",
        v: aparicionesResumen(apariciones),
      },
    ] as Array<{ k: string; v: ReactNode } | false | "" | undefined>
  ).filter(Boolean) as Array<{ k: string; v: ReactNode }>;

  // Rasgos narrativos opcionales — se completan a mano en el .md.
  const RASGO_KEYS: Array<[string, string]> = [
    ["raza", "Raza"],
    ["clase", "Clase"],
    ["arquetipo", "Arquetipo"],
    ["nivel", "Nivel"],
    ["vida", "Vida"],
    ["alineamiento", "Alineamiento"],
  ];
  const rasgos = RASGO_KEYS.map(([key, label]) => {
    const val = fm[key];
    return typeof val === "string" && val.trim()
      ? { label, value: val.trim() }
      : null;
  }).filter(Boolean) as Array<{ label: string; value: string }>;
  const rasgosLibres = Array.isArray(fm.rasgos)
    ? (fm.rasgos as unknown[]).map(String).filter((s) => s.trim())
    : [];
  const descFisica =
    typeof fm.descripcion_fisica === "string" && fm.descripcion_fisica.trim()
      ? fm.descripcion_fisica.trim()
      : null;
  const rasgosIdiomas = Array.isArray(fm.idiomas)
    ? (fm.idiomas as unknown[]).map(String).filter((s) => s.trim())
    : typeof fm.idiomas === "string" && fm.idiomas.trim()
    ? [fm.idiomas.trim()]
    : [];
  const rasgosHabilidades = Array.isArray(fm.habilidades)
    ? (fm.habilidades as unknown[]).map(String).filter((s) => s.trim())
    : typeof fm.habilidades === "string" && fm.habilidades.trim()
    ? [fm.habilidades.trim()]
    : [];

  // Imágenes: galería para todos los tipos. Personaje = retratos verticales;
  // lugar/facción = hero ancho. Ambos abren lightbox al click.
  const isHero = cfg.media === "hero";
  const fallbackAlt = `${cfg.singular}: ${nombre}`;
  const gallery = resolveImages(fm, cfg.img, fallbackAlt);
  const shots = gallery.filter(
    (g): g is Extract<ResolvedImage, { kind: "img" }> => g.kind === "img"
  );

  // Relaciones agrupadas por tipo de entidad y deduplicadas por entidad.
  type Agg = {
    nombre: string;
    href: string | null;
    eps: Set<number>;
    kinds: string[];
  };
  const groups = new Map<RelGroupKey, Map<string, Agg>>();
  for (const r of relaciones) {
    const name = relTargetName(r);
    if (!name || name.toLowerCase() === nombre.toLowerCase()) continue;
    const ref = classify(name);
    const gkey = groupFor(ref);
    let bucket = groups.get(gkey);
    if (!bucket) {
      bucket = new Map();
      groups.set(gkey, bucket);
    }
    const agg: Agg =
      bucket.get(name) ?? {
        nombre: name,
        href: ref?.href ?? null,
        eps: new Set<number>(),
        kinds: [],
      };
    if (r.episodio) agg.eps.add(r.episodio);
    if (r.tipo && !agg.kinds.includes(r.tipo)) agg.kinds.push(r.tipo);
    bucket.set(name, agg);
  }
  const relCount = relaciones.length;
  const relEntities = [...groups.values()].reduce((n, b) => n + b.size, 0);

  const hasMeta =
    identidad.length > 0 ||
    rasgos.length > 0 ||
    rasgosLibres.length > 0 ||
    descFisica !== null ||
    rasgosIdiomas.length > 0 ||
    rasgosHabilidades.length > 0;

  // Identidad + rasgos: mismo contenido para personaje y hero.
  const metaBlock = (
    <>
      {identidad.length > 0 && (
        <div className="char-ident">
          {identidad.map((row, i) => (
            <div className="ident-row" key={i}>
              <span className="ident-k">{row.k}</span>
              <span className="ident-v">{row.v}</span>
            </div>
          ))}
        </div>
      )}
      {(rasgos.length > 0 ||
        rasgosLibres.length > 0 ||
        descFisica !== null ||
        rasgosIdiomas.length > 0 ||
        rasgosHabilidades.length > 0) && (
        <div className="char-rasgos">
          <p className="block-label">Rasgos</p>
          {rasgos.length > 0 && (
            <div className="rasgo-grid">
              {rasgos.map((r, i) => (
                <div className="rasgo" key={i}>
                  <span className="rasgo-k">{r.label}</span>
                  <span className="rasgo-v">{r.value}</span>
                </div>
              ))}
            </div>
          )}
          {descFisica && (
            <div className="rasgo-body">
              <span className="rasgo-k">Descripción física</span>
              {descFisica}
            </div>
          )}
          {rasgosIdiomas.length > 0 && (
            <div className="rasgo-section">
              <span className="rasgo-k">Idiomas</span>
              <div className="rasgo-chips">
                {rasgosIdiomas.map((r, i) => (
                  <span className="tag" key={i}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {rasgosHabilidades.length > 0 && (
            <div className="rasgo-section">
              <span className="rasgo-k">Habilidades</span>
              <div className="rasgo-chips">
                {rasgosHabilidades.map((r, i) => (
                  <span className="tag" key={i}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          {rasgosLibres.length > 0 && (
            <div className="rasgo-chips">
              {rasgosLibres.map((r, i) => (
                <span className="tag" key={i}>
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {!hasMeta && (
        <p className="char-empty">
          Todavía sin datos de identidad. Se completan a mano en el vault.
        </p>
      )}
    </>
  );

  // ── Secciones del lector ──────────────────────────────────────────────
  const readerSections: ReaderSection[] = [];
  for (const s of splitEpisodeSections(body)) {
    if (!s.body.trim()) continue;
    const esMenciones = /menci/i.test(s.title);
    // La sección de perfil (encabezado "Perfil"; o el viejo "Canon …") se
    // muestra como "Sobre {nombre}": es la intro + rasgos del personaje que
    // los jugadores van ampliando, no un canon cerrado del DM.
    const esPerfil = /^(perfil|canon)/i.test(s.title);
    const id = esPerfil ? "perfil" : slugify(s.title || "narrativa") || "narrativa";
    const label = esPerfil ? `Sobre ${nombre}` : s.title || "Narrativa";

    if (esMenciones) {
      // Lista compacta colapsable: 49 episodios dejan de ser un muro de prosa.
      const menciones = parseMentions(s.body).filter((m) => m.body || m.title);
      readerSections.push({
        id,
        label,
        meta: String(menciones.length || apariciones.length),
        content: (
          <div className="mencion-list">
            {menciones.map((m, i) => (
              <details className="mencion" key={i}>
                <summary>
                  <span className="mencion-ep">
                    {m.num != null ? `Ep ${m.num}` : "—"}
                  </span>
                  <span className="mencion-title">{m.title}</span>
                  <span className="mencion-chev" aria-hidden="true" />
                </summary>
                <div className="mencion-body">
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(m.body, resolve),
                    }}
                  />
                  {m.num != null && (
                    <Link
                      className="mencion-link"
                      href={`/cronicas/${m.num}`}
                    >
                      Ver expediente del episodio →
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        ),
      });
      continue;
    }

    readerSections.push({
      id,
      label,
      content: (
        <article className="read-panel">
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(s.body, resolve) }}
          />
        </article>
      ),
    });
  }
  if (readerSections.length === 0) {
    readerSections.push({
      id: "ficha",
      label: "Ficha",
      content: (
        <article className="read-panel">
          <div className="prose">
            <p>
              Esta ficha todavía no tiene narrativa más allá de su metadata.
            </p>
          </div>
        </article>
      ),
    });
  }

  if (relCount > 0) {
    readerSections.push({
      id: "relaciones",
      label: "Relaciones",
      meta: String(relEntities),
      content: (
        <div className="rel-grouped">
          <div className="rel-head">
            <p className="block-label">Relaciones</p>
            <span className="rel-total">
              {relCount} vínculos · {relEntities} entidades
            </span>
          </div>
          <div className="rel-cols">
            {REL_GROUPS.map((g) => {
              const { key, label } = g;
              const note = "note" in g ? g.note : undefined;
              const bucket = groups.get(key);
              if (!bucket || bucket.size === 0) return null;
              const entries = [...bucket.values()].sort(
                (a, b) => b.eps.size - a.eps.size
              );
              return (
                <section className="rel-group" key={key}>
                  <h3>
                    {label} <b>{entries.length}</b>
                  </h3>
                  {note && <p className="rel-note">{note}</p>}
                  <ul>
                    {entries.map((e, i) => {
                      const eps = [...e.eps].sort((a, b) => a - b);
                      return (
                        <li className="rel-entry" key={i}>
                          {e.href ? (
                            <Link className="rel-name" href={e.href}>
                              {e.nombre}
                            </Link>
                          ) : (
                            <span className="rel-name no-link">
                              {e.nombre}
                            </span>
                          )}
                          {e.kinds.length > 0 && (
                            <span className="rel-kinds">
                              {e.kinds.slice(0, 3).join(" · ")}
                              {e.kinds.length > 3
                                ? ` · +${e.kinds.length - 3}`
                                : ""}
                            </span>
                          )}
                          {eps.length > 0 && (
                            <span className="rel-eps">
                              {episodiosLabel(eps)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      ),
    });
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="doc-head">
          <p className="crumb">
            <Link href="/">Archivo</Link> /{" "}
            <Link href={`/${cfg.segment}`}>{cfg.plural}</Link> / {nombre}
          </p>
          <p className="eyebrow">
            {cfg.singular}
            {origen && <span className="dim"> · {origen}</span>}
          </p>
          <h1>{nombre}</h1>
          {alias.length > 0 && (
            <p className="sub">También conocido como {alias.join(" · ")}</p>
          )}
        </div>

        <span id="cerrar" className="lb-anchor" aria-hidden="true" />

        {isHero ? (
          <div className="ficha-identity rise">
            <figure className="place-hero">
              {shots.length > 0 ? (
                <a
                  className="hero-zoom"
                  href="#shot-0"
                  aria-label={`Ampliar imagen: ${shots[0].alt}`}
                >
                  <AtlasImage img={shots[0]} priority />
                </a>
              ) : (
                <AtlasImage img={gallery[0]} priority />
              )}
            </figure>
            {shots.length > 1 && (
              <div className="gallery-strip" aria-label="Más imágenes">
                {shots.map((im, i) => (
                  <a
                    key={i}
                    className="gthumb"
                    href={`#shot-${i}`}
                    aria-label={`Ampliar imagen ${i + 1} de ${shots.length}: ${im.alt}`}
                  >
                    <img src={im.src} alt="" loading="lazy" decoding="async" />
                  </a>
                ))}
              </div>
            )}
            {hasMeta && <div className="place-meta">{metaBlock}</div>}
          </div>
        ) : (
          <div className="char-card rise">
            <div className="char-gallery">
              <figure className="char-portrait">
                {shots.length > 0 ? (
                  <a
                    className="hero-zoom"
                    href="#shot-0"
                    aria-label={`Ampliar imagen: ${shots[0].alt}`}
                  >
                    <AtlasImage img={shots[0]} priority />
                  </a>
                ) : (
                  <AtlasImage img={gallery[0]} priority />
                )}
              </figure>
              {shots.length > 1 && (
                <div className="char-shots" aria-label="Más imágenes">
                  {shots.map((im, i) => (
                    <a
                      key={i}
                      className="char-shot"
                      href={`#shot-${i}`}
                      aria-label={`Ampliar imagen ${i + 1} de ${shots.length}: ${im.alt}`}
                    >
                      <img
                        src={im.src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="char-meta">{metaBlock}</div>
          </div>
        )}

        <EntityReader sections={readerSections} />

        <nav className="prevnext">
          <Link href={`/${cfg.segment}`}>← Todos · {cfg.plural}</Link>
          <Link href="/">Archivo →</Link>
        </nav>

        {shots.map((im, i) => {
          const n = shots.length;
          return (
            <div
              key={i}
              id={`shot-${i}`}
              className="lightbox"
              role="dialog"
              aria-label={im.alt}
            >
              <a className="lb-backdrop" href="#cerrar" aria-label="Cerrar" />
              <figure className="lb-fig">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.src} alt={im.alt} />
                {im.caption && <figcaption>{im.caption}</figcaption>}
              </figure>
              <a className="lb-close" href="#cerrar" aria-label="Cerrar imagen">
                ✕
              </a>
              {n > 1 && (
                <>
                  <a
                    className="lb-nav lb-prev"
                    href={`#shot-${(i - 1 + n) % n}`}
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </a>
                  <a
                    className="lb-nav lb-next"
                    href={`#shot-${(i + 1) % n}`}
                    aria-label="Imagen siguiente"
                  >
                    ›
                  </a>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
