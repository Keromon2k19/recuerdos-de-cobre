import fs from "node:fs";
import path from "node:path";
import { slugify } from "../lib/slugify";

const VAULT = path.resolve(__dirname, "..", "vault-recuerdos-de-cobre");

function walkMd(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(abs));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(abs);
  }
  return out;
}

function rel(abs: string): string {
  return path.relative(VAULT, abs).replace(/\\/g, "/");
}

function targetPath(target: string): string {
  return target.trim().replace(/\\/g, "/").replace(/\.md$/i, "");
}

function main() {
  const files = walkMd(VAULT);
  const bySlug = new Map<string, string[]>();

  for (const abs of files) {
    const fileRel = rel(abs);
    const slug = path.basename(fileRel, ".md");
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), fileRel]);
  }

  const duplicateEntries = [...bySlug.entries()]
    .filter(([, paths]) => paths.length > 1)
    .sort(([a], [b]) => a.localeCompare(b));
  const duplicateSlugs = new Set(duplicateEntries.map(([slug]) => slug));
  const rawLinksBySlug = new Map<string, number>();
  const wiki = /\[\[([^\]\|#]+)(#[^\]\|]+)?(?:\|([^\]]+))?\]\]/g;

  for (const abs of files) {
    const text = fs.readFileSync(abs, "utf8");
    for (const match of text.matchAll(wiki)) {
      const target = targetPath(match[1] ?? "");
      if (!target || target.includes("/")) continue;
      const slug = slugify(target);
      if (!duplicateSlugs.has(slug)) continue;
      rawLinksBySlug.set(slug, (rawLinksBySlug.get(slug) ?? 0) + 1);
    }
  }

  const topAmbiguous = [...rawLinksBySlug.entries()]
    .map(([slug, links]) => ({
      slug,
      links,
      files: bySlug.get(slug) ?? [],
    }))
    .sort((a, b) => b.links - a.links || a.slug.localeCompare(b.slug))
    .slice(0, 25);
  const topDuplicateBasenames = duplicateEntries
    .map(([slug, paths]) => ({ slug, files: paths }))
    .slice(0, 50);

  const ambiguousLinks = [...rawLinksBySlug.values()].reduce((sum, n) => sum + n, 0);

  console.log(
    JSON.stringify(
      {
        files: files.length,
        duplicateBasenames: duplicateEntries.length,
        ambiguousDuplicateTargets: rawLinksBySlug.size,
        ambiguousLinks,
        topAmbiguous,
        topDuplicateBasenames,
      },
      null,
      2
    )
  );
}

main();
