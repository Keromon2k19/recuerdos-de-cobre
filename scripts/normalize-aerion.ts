// scripts/normalize-aerion.ts — Normaliza prosa "Aerion" → "Eryon" SOLO en el cuerpo.
// El rename del vault (vault-fix rename) reescribió los wikilinks [[Aerion]]→[[Eryon]],
// pero quedó texto plano "Aerion" en las menciones. Esto lo normaliza preservando
// BYTE A BYTE el frontmatter (donde "Aerion" sigue siendo un alias válido de Eryon).
//
// Uso:  npx tsx scripts/normalize-aerion.ts            # dry-run
//       npx tsx scripts/normalize-aerion.ts --apply    # aplica
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.resolve(__dirname, "..", "vault-recuerdos-de-cobre");
const FOLDERS = [
  "episodios", "personajes", "facciones", "lugares", "objetos",
  "misterios", "eventos", "decisiones", "worldbuilding", "quotes",
];
const APPLY = process.argv.includes("--apply");

let files = 0, hits = 0;
const touched: { file: string; n: number }[] = [];
for (const folder of FOLDERS) {
  const dir = path.join(VAULT, folder);
  let entries: string[] = [];
  try { entries = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }
  for (const f of entries) {
    const p = path.join(dir, f);
    const raw = fs.readFileSync(p, "utf-8");
    // Aísla el frontmatter (--- ... ---) sin re-serializarlo (cero ruido de formato).
    const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
    const head = m ? raw.slice(0, m[0].length) : "";
    const body = m ? raw.slice(m[0].length) : raw;
    const n = (body.match(/\bAerion\b/g) || []).length;
    if (n === 0) continue;
    files++; hits += n;
    touched.push({ file: `${folder}/${f}`, n });
    if (APPLY) fs.writeFileSync(p, head + body.replace(/\bAerion\b/g, "Eryon"), "utf-8");
  }
}
console.log(`${APPLY ? "APPLY ✍️" : "DRY-RUN 👀"} — "Aerion"→"Eryon" en cuerpo: ${hits} ocurrencias en ${files} archivos.`);
for (const t of touched.sort((a, b) => b.n - a.n).slice(0, 20)) console.log(`  ${t.n.toString().padStart(3)}  ${t.file}`);
if (touched.length > 20) console.log(`  … y ${touched.length - 20} archivos más`);
