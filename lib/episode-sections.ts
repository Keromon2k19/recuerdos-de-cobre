// lib/episode-sections.ts — Parte el cuerpo Markdown de un episodio en
// secciones nombradas (## Título) en orden de documento. El expediente las
// renderiza con jerarquía editorial. Tolerante: si el episodio no usa los
// títulos esperados, devuelve lo que haya.

export type EpisodeSection = { title: string; body: string };

const EMPTY = /^\s*$/;

export function splitEpisodeSections(md: string): EpisodeSection[] {
  const lines = md.split("\n");
  const sections: EpisodeSection[] = [];
  let current: EpisodeSection | null = null;
  let preamble: string[] = [];

  for (const line of lines) {
    const h2 = line.match(/^## +(.+?)\s*$/);
    if (h2) {
      if (current) sections.push(current);
      current = { title: h2[1].trim(), body: "" };
      continue;
    }
    if (current) {
      current.body += line + "\n";
    } else {
      preamble.push(line);
    }
  }
  if (current) sections.push(current);

  const pre = preamble.join("\n").trim();
  if (pre) sections.unshift({ title: "", body: pre });

  return sections
    .map((s) => ({ title: s.title, body: s.body.trim() }))
    .filter((s) => !(s.title === "" && EMPTY.test(s.body)) && !(s.title !== "" && s.body === ""));
}
