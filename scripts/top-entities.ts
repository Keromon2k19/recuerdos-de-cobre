// scripts/top-entities.ts — Lista entidades por nº de apariciones (para enfocar el audit de coherencia).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.resolve(__dirname, "..", "vault-recuerdos-de-cobre");
const FOLDERS = ["personajes", "facciones", "lugares", "objetos", "misterios"];
const MIN = Number(process.argv[2] ?? 5);

type Row = { folder: string; slug: string; nombre: string; rol: string; n: number };
const rows: Row[] = [];
for (const folder of FOLDERS) {
  const dir = path.join(VAULT, folder);
  let entries: string[] = [];
  try { entries = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }
  for (const f of entries) {
    const { data } = matter(fs.readFileSync(path.join(dir, f), "utf-8"));
    const ap = Array.isArray((data as any).apariciones) ? (data as any).apariciones.length : 0;
    rows.push({ folder, slug: f.replace(/\.md$/, ""), nombre: String((data as any).nombre ?? f), rol: String((data as any).rol ?? ""), n: ap });
  }
}
rows.sort((a, b) => b.n - a.n);
const pjs = rows.filter((r) => r.rol === "PJ");
console.log(`\n=== PJs ===`);
for (const r of pjs) console.log(`  ${r.n.toString().padStart(3)}  ${r.folder}/${r.slug}  (${r.nombre})`);
console.log(`\n=== Top entidades con >= ${MIN} apariciones (excl. PJs) ===`);
for (const r of rows.filter((r) => r.rol !== "PJ" && r.n >= MIN)) {
  console.log(`  ${r.n.toString().padStart(3)}  ${r.folder}/${r.slug}  (${r.nombre})`);
}
