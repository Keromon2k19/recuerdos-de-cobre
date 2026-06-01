// scripts/missing-perfil.ts — Lista entidades de alto tráfico que NO tienen sección "## Perfil".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.resolve(__dirname, "..", "vault-recuerdos-de-cobre");
const FOLDERS = ["personajes", "facciones", "lugares"];
const MIN = Number(process.argv[2] ?? 6);

type Row = { folder: string; slug: string; nombre: string; n: number };
const rows: Row[] = [];
for (const folder of FOLDERS) {
  const dir = path.join(VAULT, folder);
  let entries: string[] = [];
  try { entries = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }
  for (const f of entries) {
    const raw = fs.readFileSync(path.join(dir, f), "utf-8");
    const { data, content } = matter(raw);
    const n = Array.isArray((data as any).apariciones) ? (data as any).apariciones.length : 0;
    const hasPerfil = /^##\s+Perfil\b/m.test(content) || /^##\s+Lugar físico\b/m.test(content);
    if (n >= MIN && !hasPerfil) rows.push({ folder, slug: f.replace(/\.md$/, ""), nombre: String((data as any).nombre ?? f), n });
  }
}
rows.sort((a, b) => b.n - a.n);
console.log(`Entidades con >= ${MIN} apariciones y SIN Perfil: ${rows.length}`);
for (const r of rows) console.log(`  ${r.n.toString().padStart(3)}  ${r.folder}/${r.slug}  (${r.nombre})`);
