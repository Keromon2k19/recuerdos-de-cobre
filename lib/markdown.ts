// lib/markdown.ts — Parse/serialize entre objetos TS y archivos .md con frontmatter
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type { Episodio, Entity, ExtractionResult, Relacion } from "./types";
import { episodeFilename } from "./slugify";

/**
 * Raíz del proyecto, derivada de la ubicación de este archivo
 * (no de process.cwd(), que varía según quién invoque el código).
 */
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Si existe public/images/episodios/epNN.jpg (poblado por
 * scripts/extract-thumbnails.ts), devuelve la ruta web; si no, null.
 * Se chequea en commit-time, no en render, así que el coste es despreciable.
 */
function thumbnailPathFor(numero: number): string | null {
  const padded = String(numero).padStart(2, "0");
  const abs = path.join(PROJECT_ROOT, "public", "images", "episodios", `ep${padded}.jpg`);
  return fs.existsSync(abs) ? `/images/episodios/ep${padded}.jpg` : null;
}

// ─── Parsing genérico ───

export type ParsedMarkdown = {
  frontmatter: Record<string, unknown>;
  body: string;
};

export function parseMarkdown(content: string): ParsedMarkdown {
  const { data, content: body } = matter(content);
  return { frontmatter: data, body: body.trim() };
}

export function serializeMarkdown(
  frontmatter: Record<string, unknown>,
  body: string
): string {
  return matter.stringify("\n" + body + "\n", frontmatter);
}

// ─── Episodio ───

/**
 * Genera el contenido .md completo para un episodio procesado.
 */
export function buildEpisodeMarkdown(ep: Episodio): string {
  const fm: Record<string, unknown> = {
    tipo: "episodio",
    numero: ep.numero,
    titulo: ep.titulo,
    procesado: ep.procesado,
    menciones: {
      personajes: ep.extraido.personajes.map((p) => `[[${p.nombre}]]`),
      lugares: ep.extraido.lugares.map((l) => `[[${l.nombre}]]`),
      facciones: ep.extraido.facciones.map((f) => `[[${f.nombre}]]`),
      eventos: ep.extraido.eventos.map((e) => `[[${e.nombre}]]`),
      objetos: ep.extraido.objetos.map((o) => `[[${o.nombre}]]`),
      misterios: ep.extraido.misterios.length,
      quotes: ep.extraido.quotes.length,
      decisiones: ep.extraido.decisiones.length,
      worldbuilding: ep.extraido.worldbuilding.length,
    },
  };

  if (ep.fecha_grabacion) {
    fm.fecha_grabacion = ep.fecha_grabacion;
  }

  // Auto-inyecta `image:` desde public/images/episodios/ por convención
  // (epNN.jpg). Mantiene los frontmatters sincronizados sin tocar la lógica
  // de extracción ni el flujo de Codex. Si no hay miniatura, el resolver
  // cae a placeholder. Re-correr scripts/extract-thumbnails.ts repuebla.
  const thumb = thumbnailPathFor(ep.numero);
  if (thumb) {
    fm.image = thumb;
  }

  let body = "";

  body += "## Resumen\n\n";
  body += ep.resumen_original + "\n\n";

  body += "## Lore extraído\n\n";

  // Personajes
  if (ep.extraido.personajes.length > 0) {
    body += "### Personajes\n";
    for (const p of ep.extraido.personajes) {
      body += `- **[[${p.nombre}]]** — ${p.descripcion}\n`;
    }
    body += "\n";
  }

  // Lugares
  if (ep.extraido.lugares.length > 0) {
    body += "### Lugares\n";
    for (const l of ep.extraido.lugares) {
      body += `- **[[${l.nombre}]]** — ${l.descripcion}\n`;
    }
    body += "\n";
  }

  // Eventos
  if (ep.extraido.eventos.length > 0) {
    body += "### Eventos\n";
    for (const e of ep.extraido.eventos) {
      body += `- **[[${e.nombre}]]** — ${e.descripcion}\n`;
    }
    body += "\n";
  }

  // Objetos
  if (ep.extraido.objetos.length > 0) {
    body += "### Objetos\n";
    for (const o of ep.extraido.objetos) {
      body += `- **[[${o.nombre}]]** — ${o.descripcion}\n`;
    }
    body += "\n";
  }

  // Facciones
  if (ep.extraido.facciones.length > 0) {
    body += "### Facciones\n";
    for (const f of ep.extraido.facciones) {
      body += `- **[[${f.nombre}]]** — ${f.descripcion}\n`;
    }
    body += "\n";
  }

  // Worldbuilding
  if (ep.extraido.worldbuilding.length > 0) {
    body += "### Worldbuilding\n";
    for (const w of ep.extraido.worldbuilding) {
      body += `- **${w.tema}** — ${w.descripcion}\n`;
    }
    body += "\n";
  }

  // Relaciones
  if (ep.extraido.relaciones.length > 0) {
    body += "### Relaciones\n";
    for (const r of ep.extraido.relaciones) {
      body += `- [[${r.de}]] ↔ [[${r.a}]] — ${r.tipo}\n`;
    }
    body += "\n";
  }

  // Misterios
  if (ep.extraido.misterios.length > 0) {
    body += "### Misterios\n";
    for (const m of ep.extraido.misterios) {
      body += `- ${m}\n`;
    }
    body += "\n";
  }

  // Quotes
  if (ep.extraido.quotes.length > 0) {
    body += "### Quotes\n";
    for (const q of ep.extraido.quotes) {
      const attr = q.autor ? ` — ${q.autor}` : "";
      body += `> "${q.texto}"${attr}\n\n`;
    }
  }

  // Decisiones
  if (ep.extraido.decisiones.length > 0) {
    body += "### Decisiones clave\n";
    for (const d of ep.extraido.decisiones) {
      body += `- ${d.descripcion} (${d.protagonistas.map((p) => `[[${p}]]`).join(", ")})\n`;
    }
    body += "\n";
  }

  return serializeMarkdown(fm, body.trim());
}

// ─── Entidad ───

/**
 * Construye la sección de mención para un episodio dentro de un archivo de entidad.
 */
export function buildMentionSection(
  episodio: number,
  titulo: string,
  descripcion: string
): string {
  const filename = episodeFilename(episodio, titulo);
  const slug = filename.replace(".md", "");
  return `### [[${slug}|Ep. ${episodio} — ${titulo}]]\n- ${descripcion}\n`;
}

/**
 * Construye o actualiza un archivo de entidad .md.
 * Si existingContent es null, crea uno nuevo. Si existe, actualiza la sección del episodio.
 */
/** Tag de grafo (Obsidian) según el rol del personaje. */
function rolTag(rol: string): string {
  if (rol === "PJ") return "pj";
  if (rol === "familiar") return "familiar";
  if (rol === "antagonista") return "antagonista";
  return "npc";
}

const ROL_TAGS = ["pj", "npc", "antagonista", "familiar"];

/**
 * Aplica `rol` + `tags` al frontmatter de un personaje.
 * - PJ/familiar canónicos: se imponen (corrige etiquetados viejos).
 * - antagonista/PJ/familiar ya existentes: se preservan (override manual).
 * - resto: NPC.
 * Mantiene tags no relacionados al rol y dedupea.
 */
function applyRol(
  fm: Record<string, unknown>,
  desiredRol: string,
  existingRol?: string
): void {
  let finalRol: string;
  if (desiredRol === "PJ" || desiredRol === "familiar") {
    finalRol = desiredRol;
  } else if (
    existingRol === "antagonista" ||
    existingRol === "PJ" ||
    existingRol === "familiar"
  ) {
    finalRol = existingRol;
  } else {
    finalRol = "NPC";
  }
  fm.rol = finalRol;
  const prev = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
  const kept = prev.filter((t) => !ROL_TAGS.includes(t));
  fm.tags = [...kept, rolTag(finalRol)];
}

export function updateEntityMarkdown(
  existingContent: string | null,
  entity: {
    tipo: string;
    nombre: string;
    alias?: string[];
    relaciones?: Relacion[];
  },
  episodio: number,
  titulo: string,
  descripcion: string,
  personajeRol?: string
): string {
  const mentionSection = buildMentionSection(episodio, titulo, descripcion);

  if (existingContent === null) {
    // Crear nueva entidad
    const fm: Record<string, unknown> = {
      tipo: entity.tipo,
      nombre: entity.nombre,
      alias: entity.alias ?? [],
      apariciones: [episodio],
      ultima_actualizacion: new Date().toISOString(),
    };
    if (personajeRol) applyRol(fm, personajeRol);
    if (entity.relaciones && entity.relaciones.length > 0) {
      fm.relaciones = entity.relaciones.map((r) => ({
        con: `[[${r.de === entity.nombre ? r.a : r.de}]]`,
        tipo: r.tipo,
        episodio: r.episodio,
      }));
    }

    const body = "## Menciones por episodio\n\n" + mentionSection;
    return serializeMarkdown(fm, body);
  }

  // Actualizar entidad existente
  const parsed = parseMarkdown(existingContent);
  const fm = { ...parsed.frontmatter };

  if (personajeRol) {
    applyRol(fm, personajeRol, parsed.frontmatter.rol as string | undefined);
  }

  // Actualizar apariciones
  const apariciones = (fm.apariciones as number[]) ?? [];
  if (!apariciones.includes(episodio)) {
    apariciones.push(episodio);
    apariciones.sort((a, b) => a - b);
  }
  fm.apariciones = apariciones;
  fm.ultima_actualizacion = new Date().toISOString();

  // Actualizar alias si hay nuevos
  if (entity.alias && entity.alias.length > 0) {
    const existingAlias = (fm.alias as string[]) ?? [];
    for (const a of entity.alias) {
      if (!existingAlias.includes(a)) {
        existingAlias.push(a);
      }
    }
    fm.alias = existingAlias;
  }

  // Actualizar relaciones si hay nuevas
  if (entity.relaciones && entity.relaciones.length > 0) {
    const existingRel = (fm.relaciones as Array<{ con: string; tipo: string; episodio: number }>) ?? [];
    for (const r of entity.relaciones) {
      const con = `[[${r.de === entity.nombre ? r.a : r.de}]]`;
      const exists = existingRel.some(
        (er) => er.con === con && er.tipo === r.tipo && er.episodio === r.episodio
      );
      if (!exists) {
        existingRel.push({ con, tipo: r.tipo, episodio: r.episodio });
      }
    }
    fm.relaciones = existingRel;
  }

  // Reemplazar o agregar sección del episodio en el body.
  // Sin flag `g`: solo hay una sección por episodio en cada entidad, y el flag
  // hace que .test() avance lastIndex y rompa el .replace() siguiente.
  let body = parsed.body;
  const epSlug = episodeFilename(episodio, titulo).replace(".md", "");
  const sectionRegex = new RegExp(
    `### \\[\\[${escapeRegExp(epSlug)}\\|[^\\]]*\\]\\]\n(?:- [^\n]*\n?)*`,
  );

  if (sectionRegex.test(body)) {
    // Reemplazar sección existente (re-procesamiento)
    body = body.replace(sectionRegex, mentionSection);
  } else {
    // Append nueva sección
    body = body.trimEnd() + "\n\n" + mentionSection;
  }

  return serializeMarkdown(fm, body);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
