// lib/markdown-render.ts — Render Markdown → HTML para la antología pública.
// Unifica el conversor que estaba duplicado en las páginas legacy. A
// diferencia de la versión local, los wikilinks pueden ser navegables:
// [[Nombre]] o [[slug|Display]] → <a> a una ficha pública cuando se pasa
// un resolutor de slugs.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type WikiResolver = (target: string) => string | null;

/**
 * Convierte Markdown acotado (el que produce el pipeline) a HTML.
 * Soporta: h2/h3, bold, italic, listas, blockquotes y wikilinks.
 * @param resolve  opcional: target → href. Si devuelve href, el wikilink
 *                 se renderiza como <a class="wikilink">; si null, como
 *                 <span class="wikilink-plain"> (texto resaltado, no link).
 */
export function renderMarkdown(md: string, resolve?: WikiResolver): string {
  const wiki = (raw: string): string => {
    const piped = raw.match(/^([^|]+)\|(.+)$/);
    const target = (piped ? piped[1] : raw).trim();
    const label = escapeHtml((piped ? piped[2] : raw).trim());
    const href = resolve ? resolve(target) : null;
    if (href) {
      return `<a class="wikilink" href="${href}">${label}</a>`;
    }
    return `<span class="wikilink-plain">${label}</span>`;
  };

  let html = escapeHtml(md)
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[\[([^\]]+)\]\]/g, (_, inner: string) => wiki(inner))
    .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>");

  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (
        t.startsWith("<h") ||
        t.startsWith("<ul") ||
        t.startsWith("<blockquote") ||
        t.startsWith("<li")
      ) {
        return t;
      }
      return `<p>${t}</p>`;
    })
    .join("\n");

  return html;
}
