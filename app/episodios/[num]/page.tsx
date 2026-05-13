// app/episodios/[num]/page.tsx — Ficha de un episodio
import Link from "next/link";
import { readEpisode } from "@/lib/vault";
import { parseMarkdown } from "@/lib/markdown";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ num: string }>;
};

export default async function EpisodioPage({ params }: Props) {
  const { num } = await params;
  const numero = parseInt(num, 10);
  if (isNaN(numero)) notFound();

  const vaultPath = process.env.VAULT_PATH?.trim();
  if (!vaultPath) notFound();

  const content = await readEpisode(vaultPath, numero);
  if (!content) notFound();

  const { frontmatter, body } = parseMarkdown(content);
  const titulo = (frontmatter.titulo as string) ?? `Episodio ${numero}`;
  const procesado = frontmatter.procesado as string | undefined;
  const menciones = frontmatter.menciones as Record<string, unknown> | undefined;

  // Renderizar el body Markdown como HTML simple
  const htmlBody = markdownToHtml(body);

  return (
    <>
      <div className="page-header">
        <h1>
          Ep. {numero} — {titulo}
        </h1>
        {procesado && (
          <p>Procesado: {new Date(procesado).toLocaleString("es-AR")}</p>
        )}
      </div>

      {menciones && (
        <table className="frontmatter-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Menciones</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(menciones).map(([key, val]) => (
              <tr key={key}>
                <td style={{ textTransform: "capitalize" }}>{key}</td>
                <td>
                  {Array.isArray(val)
                    ? val.map((v: string) => v.replace(/\[\[|\]\]/g, "")).join(", ")
                    : String(val)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div
        className="md-content"
        dangerouslySetInnerHTML={{ __html: htmlBody }}
      />

      <div style={{ marginTop: "2rem" }}>
        <Link href="/episodios" className="btn-secondary">
          ← Todos los episodios
        </Link>
      </div>
    </>
  );
}

/**
 * Conversión minimalista de Markdown a HTML para renderizar.
 * Soporta: headers, bold, italic, lists, blockquotes, wikilinks.
 */
function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Wikilinks: [[slug|display]] → link
    .replace(
      /\[\[([^|\]]+)\|([^\]]+)\]\]/g,
      '<a href="#" title="$1">$2</a>'
    )
    // Wikilinks: [[name]] → link
    .replace(/\[\[([^\]]+)\]\]/g, '<a href="#" title="$1">$1</a>')
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // List items
    .replace(/^- (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Paragraphs for remaining lines
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
