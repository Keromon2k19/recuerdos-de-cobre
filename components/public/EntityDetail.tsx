// components/public/EntityDetail.tsx — Ficha pública de entidad como
// tarjeta de personaje: retrato + identidad + rasgos narrativos arriba,
// narrativa episódica ancha al centro (mismo lenguaje que el expediente),
// y relaciones agrupadas por el tipo de entidad a la que apuntan
// (Jugadores / NPCs / Facciones / Lugares / …) y deduplicadas por entidad,
// para que no sea una lista interminable.
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { parseMarkdown } from "@/lib/markdown";
import { renderMarkdown } from "@/lib/markdown-render";
import { buildWikiResolver } from "@/lib/wiki-resolver";
import { resolveImage, resolveImages, type ResolvedImage } from "@/lib/images";
import { slugify } from "@/lib/slugify";
import { cachedListByType } from "@/lib/public-cache";
import { PUBLIC_ENTITIES, BY_TIPO } from "@/lib/entity-public";
import { ENTITY_FOLDERS, type EntityType } from "@/lib/types";
import AtlasImage from "@/components/public/AtlasImage";

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

  // Resolutor de wikilinks (para la narrativa) + índice nombre/slug →
  // {tipo, href, isPJ} para clasificar relaciones por el tipo de entidad
  // a la que apuntan. Ambos cacheados con TTL corto.
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

  // Identidad: filas etiqueta → valor (la "descripción" del personaje).
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
    ] as Array<{ k: string; v: ReactNode } | false | "" | undefined>
  ).filter(Boolean) as Array<{ k: string; v: ReactNode }>;

  // Rasgos narrativos opcionales — se completan a mano en el .md. Si no
  // existen no se muestra nada. Pensados como descripción, no como hoja
  // de stats táctica (nivel/vida/etc. son texto libre, no números).
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

  // Presentación de imagen según el tipo: personaje = retrato 3:4 en
  // tarjeta; lugar/facción/etc. = hero ancho + galería con lightbox.
  const isHero = cfg.media === "hero";
  const fallbackAlt = `${cfg.singular}: ${nombre}`;
  const portrait = !isHero ? resolveImage(fm, cfg.img, fallbackAlt) : null;
  const gallery = isHero ? resolveImages(fm, cfg.img, fallbackAlt) : [];
  const hero = gallery[0];
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

  const hasMeta =
    identidad.length > 0 || rasgos.length > 0 || rasgosLibres.length > 0;

  // Identidad + rasgos: mismo contenido para la tarjeta de personaje y
  // para el panel de metadata del hero (lugares/facciones).
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
      {(rasgos.length > 0 || rasgosLibres.length > 0) && (
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

        {isHero ? (
          <>
            <span id="cerrar" className="lb-anchor" aria-hidden="true" />
            <figure className="place-hero rise">
              {hero?.kind === "img" ? (
                <a
                  className="hero-zoom"
                  href="#shot-0"
                  aria-label={`Ampliar imagen: ${hero.alt}`}
                >
                  <AtlasImage img={hero} priority />
                </a>
              ) : (
                <AtlasImage img={hero} priority />
              )}
            </figure>

            {shots.length > 1 && (
              <div className="gallery-strip rise" aria-label="Más imágenes">
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

            {hasMeta && <div className="place-meta rise">{metaBlock}</div>}
          </>
        ) : (
          portrait && (
            <div className="char-card rise">
              <div className="char-portrait">
                <AtlasImage img={portrait} priority />
              </div>
              <div className="char-meta">{metaBlock}</div>
            </div>
          )
        )}

        {apariciones.length > 0 && (
          <div className="appear-band">
            <span className="block-label">
              Aparece en · {apariciones.length}
            </span>
            <div className="rail-chips">
              {apariciones.map((n) => (
                <Link key={n} href={`/cronicas/${n}`}>
                  № {String(n).padStart(3, "0")}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Narrativa episódica: el grande del medio */}
        <div className="expediente">
          <article className="read-panel rise">
            <div className="prose">
              {body.trim() ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(body, resolve),
                  }}
                />
              ) : (
                <p>
                  Esta ficha todavía no tiene narrativa más allá de su
                  metadata.
                </p>
              )}
            </div>
          </article>
        </div>

        {relCount > 0 && (
          <div className="rel-grouped">
            <div className="rel-head">
              <p className="block-label">Relaciones</p>
              <span className="rel-total">
                {relCount} vínculos · {[...groups.values()].reduce(
                  (n, b) => n + b.size,
                  0
                )}{" "}
                entidades
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
        )}

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
