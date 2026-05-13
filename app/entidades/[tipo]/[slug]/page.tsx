// app/entidades/[tipo]/[slug]/page.tsx — Ficha individual de entidad
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import { parseMarkdown } from "@/lib/markdown";
import { ENTITY_TYPES, ENTITY_FOLDERS, type EntityType } from "@/lib/types";

type Props = {
  params: Promise<{ tipo: string; slug: string }>;
};

export default async function EntityDetailPage({ params }: Props) {
  const { tipo, slug } = await params;

  if (!ENTITY_TYPES.includes(tipo as EntityType)) notFound();

  const vaultPath = process.env.VAULT_PATH?.trim();
  if (!vaultPath) notFound();

  const entityType = tipo as EntityType;
  const folder = ENTITY_FOLDERS[entityType];
  const filePath = path.join(vaultPath, folder, slug + ".md");

  let content: string;
  try {
    content = await fs.readFile(filePath, "utf-8");
  } catch {
    notFound();
  }

  const { frontmatter, body } = parseMarkdown(content);

  const nombre = (frontmatter.nombre as string) ?? slug;
  const alias = (frontmatter.alias as string[]) ?? [];
  const apariciones = (frontmatter.apariciones as number[]) ?? [];
  const relaciones =
    (frontmatter.relaciones as Array<{ con: string; tipo: string; episodio: number }>) ?? [];
  const ultima = frontmatter.ultima_actualizacion as string | undefined;

  const htmlBody = markdownToHtml(body);

  return (
    <>
      <div className="page-header">
        <h1>{nombre}</h1>
        <p style={{ textTransform: "capitalize" }}>{tipo}</p>
      </div>

      <table className="frontmatter-table">
        <tbody>
          {alias.length > 0 && (
            <tr>
              <th>Alias</th>
              <td>{alias.join(", ")}</td>
            </tr>
          )}
          <tr>
            <th>Apariciones</th>
            <td>
              {apariciones.length > 0
                ? apariciones.map((n) => (
                    <Link key={n} href={`/episodios/${n}`} style={{ marginRight: "0.5rem" }}>
                      Ep. {n}
                    </Link>
                  ))
                : "—"}
            </td>
          </tr>
          {relaciones.length > 0 && (
            <tr>
              <th>Relaciones</th>
              <td>
                {relaciones.map((r, i) => (
                  <span key={i} style={{ display: "block", marginBottom: "0.25rem" }}>
                    ↔ {r.con.replace(/\[\[|\]\]/g, "")} — {r.tipo} (ep. {r.episodio})
                  </span>
                ))}
              </td>
            </tr>
          )}
          {ultima && (
            <tr>
              <th>Última actualización</th>
              <td>{new Date(ultima).toLocaleString("es-AR")}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="md-content" dangerouslySetInnerHTML={{ __html: htmlBody }} />

      <div style={{ marginTop: "2rem" }}>
        <Link href={`/entidades/${tipo}`} className="btn-secondary">
          ← Todos los {tipo}s
        </Link>
      </div>
    </>
  );
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '<a href="#" title="$1">$2</a>')
    .replace(/\[\[([^\]]+)\]\]/g, '<a href="#" title="$1">$1</a>')
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>");

  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<li")
      ) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  return html;
}
