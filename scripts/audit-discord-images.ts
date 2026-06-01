#!/usr/bin/env node
/**
 * Clasifica imagenes descargadas desde Discord contra entidades registradas
 * en vault-mysha. Copia los archivos a carpetas de revision sin tocar los
 * originales.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";

type EntityRecord = {
  tipo: string;
  nombre: string;
  file: string;
  image?: string;
  keys: string[];
};

type ImageMatch = {
  file: string;
  category: "registradas" | "con-nombre-sin-registro" | "genericas";
  entity?: EntityRecord;
  reason: string;
};

const IMAGE_EXTENSIONS = new Set([".apng", ".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const ENTITY_DIRS = ["personajes", "lugares", "facciones", "objetos", "misterios", "worldbuilding"];
const GENERIC_PATTERNS = [
  /^image(?:[-_ ]?\d+)?$/i,
  /^image\d+$/i,
  /^img[-_ ]?\d+/i,
  /^dsc[-_ ]?\d+/i,
  /^screenshot/i,
  /^smartselect/i,
  /^whatsapp image/i,
  /^chatgpt image/i,
  /^embed[-_ ]?\d+/i,
  /^latest(?:[-_ ]?\d+)?$/i,
  /^oig\d*$/i,
  /^unknown$/i,
  /^descargar(?:[-_ ]?\d+)?/i,
  /^[a-z0-9]{10,16}$/i,
  /^[a-f0-9]{24,}$/i,
  /^[0-9]{12,}$/i,
  /^[0-9]+(?:[-_ ][0-9]+)?$/i,
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
];

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function titleFromFilename(filename: string): string {
  return path.basename(filename, path.extname(filename)).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function filenameCandidates(filename: string): string[] {
  const base = titleFromFilename(filename);
  const out = new Set<string>([normalize(base)]);

  const withoutCopySuffix = base.replace(/\s+\(\d+\)$/i, "").replace(/\s+-\s+\d+$/i, "");
  out.add(normalize(withoutCopySuffix));

  const withoutTrailingNumber = base.replace(/(?<=[a-zA-Z])\d+$/i, "").trim();
  if (withoutTrailingNumber !== base) out.add(normalize(withoutTrailingNumber));

  const withoutTrailingSpacedNumber = base.replace(/\s+\d+$/i, "").trim();
  if (withoutTrailingSpacedNumber !== base) out.add(normalize(withoutTrailingSpacedNumber));

  return [...out].filter(Boolean);
}

function isGenericName(filename: string): boolean {
  const base = titleFromFilename(filename);
  const normalized = normalize(base);
  return GENERIC_PATTERNS.some((re) => re.test(base) || re.test(normalized));
}

function safeSegment(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]+/g, "-").trim().slice(0, 120) || "archivo";
}

function copyUnique(src: string, destDir: string): string {
  fs.mkdirSync(destDir, { recursive: true });
  const parsed = path.parse(path.basename(src));
  let dest = path.join(destDir, path.basename(src));
  let n = 2;
  while (fs.existsSync(dest)) {
    dest = path.join(destDir, `${parsed.name}-${n}${parsed.ext}`);
    n++;
  }
  fs.copyFileSync(src, dest);
  return dest;
}

function readEntities(vaultDir: string): EntityRecord[] {
  const records: EntityRecord[] = [];
  for (const dir of ENTITY_DIRS) {
    const absDir = path.join(vaultDir, dir);
    if (!fs.existsSync(absDir)) continue;
    for (const file of fs.readdirSync(absDir).filter((f) => f.endsWith(".md"))) {
      const abs = path.join(absDir, file);
      const parsed = matter(fs.readFileSync(abs, "utf-8"));
      const nombre = typeof parsed.data.nombre === "string" ? parsed.data.nombre : path.basename(file, ".md");
      const aliases = Array.isArray(parsed.data.alias) ? parsed.data.alias.filter((a) => typeof a === "string") : [];
      const image = typeof parsed.data.image === "string" ? parsed.data.image : undefined;
      const keys = new Set([
        normalize(nombre),
        normalize(path.basename(file, ".md")),
        ...aliases.map(normalize),
      ]);
      records.push({ tipo: dir, nombre, file: abs, image, keys: [...keys].filter(Boolean) });
    }
  }
  return records;
}

function classifyImages(imageDir: string, records: EntityRecord[]): ImageMatch[] {
  const byKey = new Map<string, EntityRecord[]>();
  for (const record of records) {
    for (const key of record.keys) {
      const list = byKey.get(key) ?? [];
      list.push(record);
      byKey.set(key, list);
    }
  }

  const files = fs
    .readdirSync(imageDir)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(imageDir, f));

  return files.map((file) => {
    if (isGenericName(path.basename(file))) {
      return { file, category: "genericas", reason: "nombre generico o tecnico" };
    }

    for (const candidate of filenameCandidates(path.basename(file))) {
      const matches = byKey.get(candidate);
      if (matches?.length) {
        const entity = matches[0];
        return {
          file,
          category: "registradas",
          entity,
          reason: matches.length > 1 ? `nombre coincide con ${matches.length} registros; usando el primero` : "nombre coincide con registro",
        };
      }
    }

    return { file, category: "con-nombre-sin-registro", reason: "tiene nombre legible pero no coincide con el vault" };
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeReport(outDir: string, matches: ImageMatch[], projectDir: string): void {
  const byCategory = new Map<string, ImageMatch[]>();
  for (const match of matches) {
    const list = byCategory.get(match.category) ?? [];
    list.push(match);
    byCategory.set(match.category, list);
  }

  const registered = matches.filter((m) => m.category === "registradas" && m.entity);
  const duplicates = new Map<string, ImageMatch[]>();
  for (const match of registered) {
    const key = `${match.entity!.tipo}/${match.entity!.nombre}`;
    const list = duplicates.get(key) ?? [];
    list.push(match);
    duplicates.set(key, list);
  }

  const lines: string[] = [
    "# Auditoria de imagenes de Discord",
    "",
    `Generado: ${new Date().toISOString()}`,
    "",
    "## Totales",
    "",
    `- Registradas: ${byCategory.get("registradas")?.length ?? 0}`,
    `- Con nombre sin registro: ${byCategory.get("con-nombre-sin-registro")?.length ?? 0}`,
    `- Genericas: ${byCategory.get("genericas")?.length ?? 0}`,
    `- Registros con varias imagenes candidatas: ${[...duplicates.values()].filter((v) => v.length > 1).length}`,
    "",
  ];

  for (const category of ["registradas", "con-nombre-sin-registro", "genericas"] as const) {
    lines.push(`## ${category}`);
    lines.push("");
    const items = [...(byCategory.get(category) ?? [])].sort((a, b) => path.basename(a.file).localeCompare(path.basename(b.file)));
    for (const item of items) {
      const rel = path.relative(outDir, item.file).replace(/\\/g, "/");
      const sourceRel = path.relative(projectDir, item.file).replace(/\\/g, "/");
      if (item.entity) {
        const entityRel = path.relative(projectDir, item.entity.file).replace(/\\/g, "/");
        const current = item.entity.image ? `; image actual: ${item.entity.image}` : "; sin image actual";
        lines.push(`- [${path.basename(item.file)}](${rel}) -> ${item.entity.tipo}: ${item.entity.nombre} (${entityRel})${current}`);
      } else {
        lines.push(`- [${path.basename(item.file)}](${rel}) (${sourceRel}) - ${item.reason}`);
      }
    }
    lines.push("");
  }

  lines.push("## duplicadas por registro");
  lines.push("");
  for (const [key, items] of [...duplicates.entries()].filter(([, v]) => v.length > 1).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`- ${key}: ${items.map((i) => path.basename(i.file)).join(", ")}`);
  }
  lines.push("");

  fs.writeFileSync(path.join(outDir, "reporte.md"), lines.join("\n"), "utf-8");
}

function writeGallery(outDir: string, matches: ImageMatch[]): void {
  const groups = ["registradas", "con-nombre-sin-registro", "genericas"] as const;
  const cards = groups
    .map((group) => {
      const items = matches
        .filter((m) => m.category === group)
        .sort((a, b) => path.basename(a.file).localeCompare(path.basename(b.file)))
        .map((item) => {
          const rel = path.relative(outDir, item.file).replace(/\\/g, "/");
          const label = item.entity
            ? `${item.entity.tipo}: ${item.entity.nombre}`
            : item.reason;
          return `<article class="card">
  <a href="${escapeHtml(rel)}"><img src="${escapeHtml(rel)}" loading="lazy" alt="${escapeHtml(path.basename(item.file))}"></a>
  <h3>${escapeHtml(path.basename(item.file))}</h3>
  <p>${escapeHtml(label)}</p>
</article>`;
        })
        .join("\n");
      return `<section>
<h2>${group} (${matches.filter((m) => m.category === group).length})</h2>
<div class="grid">
${items}
</div>
</section>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Revision de imagenes Discord</title>
  <style>
    body { margin: 24px; font-family: Arial, sans-serif; background: #111; color: #eee; }
    h1, h2 { font-weight: 700; }
    section { margin-top: 32px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
    .card { background: #1b1b1b; border: 1px solid #333; border-radius: 8px; padding: 10px; }
    img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; background: #050505; border-radius: 5px; }
    h3 { margin: 8px 0 4px; font-size: 13px; overflow-wrap: anywhere; }
    p { margin: 0; color: #aaa; font-size: 12px; line-height: 1.35; }
    a { color: inherit; }
  </style>
</head>
<body>
  <h1>Revision de imagenes Discord</h1>
  <p>Abri cada miniatura para ver el archivo original.</p>
  ${cards}
</body>
</html>
`;

  fs.writeFileSync(path.join(outDir, "galeria.html"), html, "utf-8");
}

function main(): void {
  const projectDir = process.cwd();
  const imageDir = path.resolve(argValue("--images") ?? path.join("imagenes para la pagina", "discord"));
  const vaultDir = path.resolve(argValue("--vault") ?? "vault-mysha");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.resolve(argValue("--out") ?? path.join("imagenes para la pagina", `discord-review-${stamp}`));

  if (!fs.existsSync(imageDir)) throw new Error(`No existe la carpeta de imagenes: ${imageDir}`);
  if (!fs.existsSync(vaultDir)) throw new Error(`No existe el vault: ${vaultDir}`);

  fs.mkdirSync(outDir, { recursive: true });
  const records = readEntities(vaultDir);
  const matches = classifyImages(imageDir, records);

  const registeredByEntity = new Map<string, ImageMatch[]>();
  for (const match of matches) {
    let destDir = path.join(outDir, match.category);
    if (match.entity) {
      destDir = path.join(destDir, safeSegment(match.entity.tipo));
      const key = `${match.entity.tipo}/${match.entity.nombre}`;
      const list = registeredByEntity.get(key) ?? [];
      list.push(match);
      registeredByEntity.set(key, list);
    }
    copyUnique(match.file, destDir);
  }

  for (const matchesForEntity of registeredByEntity.values()) {
    if (matchesForEntity.length <= 1) continue;
    const entity = matchesForEntity[0].entity!;
    const destDir = path.join(outDir, "duplicadas-por-registro", safeSegment(entity.tipo), safeSegment(entity.nombre));
    for (const match of matchesForEntity) copyUnique(match.file, destDir);
  }

  writeReport(outDir, matches, projectDir);
  writeGallery(outDir, matches);

  const count = (category: ImageMatch["category"]) => matches.filter((m) => m.category === category).length;
  console.log(`Listo. Imagenes revisadas: ${matches.length}`);
  console.log(`Registradas: ${count("registradas")}`);
  console.log(`Con nombre sin registro: ${count("con-nombre-sin-registro")}`);
  console.log(`Genericas: ${count("genericas")}`);
  console.log(`Carpeta de revision: ${outDir}`);
  console.log(`Reporte: ${path.join(outDir, "reporte.md")}`);
  console.log(`Galeria: ${path.join(outDir, "galeria.html")}`);
}

main();
