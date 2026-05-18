// components/public/EntityDetail.tsx — Ficha pública genérica de entidad.
// Mismo lenguaje visual que el expediente: panel de lectura + riel de datos
// con apariciones enlazadas a crónicas y relaciones a otras fichas.
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import { parseMarkdown } from "@/lib/markdown";
import { renderMarkdown } from "@/lib/markdown-render";
import { buildWikiResolver } from "@/lib/wiki-resolver";
import { resolveImage } from "@/lib/images";
import { ENTITY_FOLDERS, type EntityType } from "@/lib/types";
import { BY_TIPO } from "@/lib/entity-public";
import AtlasImage from "@/components/public/AtlasImage";

type Relacion = { con?: string; a?: string; tipo: string; episodio?: number };

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
  const resolve = await buildWikiResolver(vp);

  const nombre = (frontmatter.nombre as string) || slug;
  const alias = (frontmatter.alias as string[]) ?? [];
  const apariciones = ((frontmatter.apariciones as number[]) ?? [])
    .slice()
    .sort((a, b) => a - b);
  const relaciones = (frontmatter.relaciones as Relacion[]) ?? [];
  const rol = frontmatter.rol as string | undefined;
  const jugador = frontmatter.jugador as string | undefined;
  const facciones = (frontmatter.facciones as string[]) ?? [];
  const region = frontmatter.region as string | undefined;
  const categoria = frontmatter.categoria as string | undefined;
  const origen = frontmatter.origen as string | undefined;

  const identidad = [
    rol && `Rol · ${rol}`,
    jugador && `Jugador · ${jugador}`,
    facciones.length > 0 && `Facción · ${facciones.join(", ")}`,
    region && `Región · ${region}`,
    categoria && `Categoría · ${categoria}`,
  ].filter(Boolean) as string[];

  const portrait = resolveImage(
    frontmatter as Record<string, unknown>,
    cfg.img,
    `${cfg.singular}: ${nombre}`
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

        <div className="dossier">
          <article className="read-panel rise">
            <div className="prose">
              {body.trim() ? (
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(body, resolve) }}
                />
              ) : (
                <p>Esta ficha todavía no tiene contenido más allá de su metadata.</p>
              )}
            </div>
          </article>

          <aside className="rail" aria-label={`Ficha de ${nombre}`}>
            <div
              className="dossier-cover"
              style={{ aspectRatio: "3 / 4", marginBottom: 0 }}
            >
              <AtlasImage img={portrait} priority />
            </div>

            {identidad.length > 0 && (
              <div className="rail-block">
                <p className="label">Identidad</p>
                <div className="rel-list">
                  {identidad.map((line, i) => (
                    <span className="rel" key={i}>
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {alias.length > 0 && (
              <div className="rail-block">
                <p className="label">Alias</p>
                <p className="val">{alias.join(" · ")}</p>
              </div>
            )}

            <div className="rail-block">
              <p className="label">
                Apariciones{apariciones.length > 0 && ` · ${apariciones.length}`}
              </p>
              {apariciones.length > 0 ? (
                <div className="rail-chips">
                  {apariciones.map((n) => (
                    <Link key={n} href={`/cronicas/${n}`}>
                      № {String(n).padStart(3, "0")}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="val">Solo en el canon del DM</p>
              )}
            </div>

            {relaciones.length > 0 && (
              <div className="rail-block">
                <p className="label">Relaciones · {relaciones.length}</p>
                <div className="rel-list">
                  {relaciones.map((r, i) => {
                    const con = (r.con || r.a || "").replace(/\[\[|\]\]/g, "");
                    const href = resolve(con);
                    return (
                      <span key={i} className="rel">
                        {href ? <Link href={href}>{con}</Link> : <strong>{con}</strong>}
                        <span className="dim"> · {r.tipo}</span>
                        {r.episodio ? (
                          <span className="dim">
                            {" "}
                            (№ {String(r.episodio).padStart(3, "0")})
                          </span>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>

        <nav className="prevnext">
          <Link href={`/${cfg.segment}`}>← Todos · {cfg.plural}</Link>
          <Link href="/">Archivo →</Link>
        </nav>
      </div>
    </section>
  );
}
