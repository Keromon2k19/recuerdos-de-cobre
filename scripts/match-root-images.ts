#!/usr/bin/env node
/**
 * Solo lectura. Clasifica las imagenes que estan en la RAIZ de
 * "imagenes para la pagina/" (no recursivo) contra las entidades del vault.
 * No copia ni modifica nada: solo imprime el matching para decidir la
 * integracion. Match exacto por nombre/slug/alias + match aproximado
 * (Levenshtein <= 2) para detectar variantes ortograficas.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";

const IMAGE_EXTENSIONS = new Set([".apng", ".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const GENERIC_PATTERNS = [
  /^image(?:[-_ ]?\d+)?$/i,
  /^img[-_ ]?\d+/i,
  /^screenshot/i,
  /^chatgpt image/i,
  /^latest(?:[-_ ]?\d+)?$/i,
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  /^nino-is-elder-brain/i,
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function titleFromFilename(filename: string): string {
  return path.basename(filename, path.extname(filename)).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function candidates(filename: string): string[] {
  const base = titleFromFilename(filename);
  const out = new Set<string>([normalize(base)]);
  out.add(normalize(base.replace(/(?<=[a-zA-Z])\d+$/i, "").trim()));
  out.add(normalize(base.replace(/\s+\d+$/i, "").trim()));
  return [...out].filter(Boolean);
}

function isGeneric(filename: string): boolean {
  const base = titleFromFilename(filename);
  const n = normalize(base);
  return GENERIC_PATTERNS.some((re) => re.test(base) || re.test(n));
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[m][n];
}

type Entity = { tipo: string; slug: string; nombre: string; image?: string; keys: string[] };

function readEntities(vaultDir: string): Entity[] {
  const out: Entity[] = [];
  for (const dir of fs.readdirSync(vaultDir, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name.startsWith("_") || dir.name.startsWith(".")) continue;
    const absDir = path.join(vaultDir, dir.name);
    for (const file of fs.readdirSync(absDir).filter((f) => f.endsWith(".md"))) {
      const parsed = matter(fs.readFileSync(path.join(absDir, file), "utf-8"));
      const slug = path.basename(file, ".md");
      const nombre = typeof parsed.data.nombre === "string" ? parsed.data.nombre : slug;
      const aliases = Array.isArray(parsed.data.alias) ? parsed.data.alias.filter((a: unknown) => typeof a === "string") : [];
      const image = typeof parsed.data.image === "string" && parsed.data.image.trim() ? parsed.data.image.trim() : undefined;
      const keys = [...new Set([normalize(nombre), normalize(slug), ...aliases.map(normalize)])].filter(Boolean);
      out.push({ tipo: dir.name, slug, nombre, image, keys });
    }
  }
  return out;
}

function main(): void {
  const projectDir = process.cwd();
  const imageDir = path.join(projectDir, "imagenes para la pagina");
  const vaultDir = path.join(projectDir, "vault-mysha");
  const entities = readEntities(vaultDir);

  const byKey = new Map<string, Entity[]>();
  for (const e of entities) for (const k of e.keys) (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(e);

  const files = fs
    .readdirSync(imageDir, { withFileTypes: true })
    .filter((d) => d.isFile() && IMAGE_EXTENSIONS.has(path.extname(d.name).toLowerCase()))
    .map((d) => d.name);

  const exact: string[] = [];
  const exactHasImage: string[] = [];
  const approx: string[] = [];
  const none: string[] = [];
  const generic: string[] = [];

  for (const file of files) {
    if (isGeneric(file)) { generic.push(file); continue; }

    let matched: Entity | undefined;
    for (const c of candidates(file)) {
      const list = byKey.get(c);
      if (list?.length) { matched = list[0]; break; }
    }

    if (matched) {
      const line = `${file}  ->  ${matched.tipo}/${matched.slug}${matched.image ? `  [YA: ${matched.image}]` : ""}`;
      (matched.image ? exactHasImage : exact).push(line);
      continue;
    }

    // aproximado
    const primary = candidates(file)[0];
    let best: { e: Entity; d: number } | undefined;
    for (const e of entities)
      for (const k of e.keys) {
        const d = lev(primary, k);
        if (!best || d < best.d) best = { e, d };
      }
    if (best && best.d <= 2) {
      approx.push(`${file}  ~~  ${best.e.tipo}/${best.e.slug} (dist ${best.d})${best.e.image ? `  [YA: ${best.e.image}]` : ""}`);
    } else {
      none.push(file);
    }
  }

  const section = (title: string, arr: string[]) => {
    console.log(`\n=== ${title} (${arr.length}) ===`);
    for (const l of [...arr].sort()) console.log(l);
  };
  console.log(`Imagenes en raiz: ${files.length} | Entidades en vault: ${entities.length}`);
  section("MATCH EXACTO - sin image (integrar)", exact);
  section("MATCH EXACTO - ya tienen image", exactHasImage);
  section("MATCH APROXIMADO - revisar variante ortografica", approx);
  section("SIN MATCH - no existe en vault o nombre distinto", none);
  section("GENERICAS - ignorar", generic);
}

main();
