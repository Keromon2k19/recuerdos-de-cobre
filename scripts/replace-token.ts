// scripts/replace-token.ts — Reemplazo de token literal en todo el vault (body + frontmatter).
// Para arreglos mecánicos de grafía/slug que NO son alias (caada→caida, Bishak→Bijak, Jhonson→Johnson…).
// NO usar para tokens que sean alias de una entidad (ej. Uthuk): para esos, usar `vault-fix relink`.
//
// Uso:  npx tsx scripts/replace-token.ts <from> <to>            # dry-run
//       npx tsx scripts/replace-token.ts <from> <to> --apply    # aplica
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.resolve(__dirname, "..", "vault-recuerdos-de-cobre");
const FOLDERS = [
  "episodios", "personajes", "facciones", "lugares", "objetos",
  "misterios", "eventos", "decisiones", "worldbuilding", "quotes",
];
const FROM = process.argv[2];
const TO = process.argv[3];
const APPLY = process.argv.includes("--apply");
if (!FROM || !TO) { console.log("Uso: replace-token <from> <to> [--apply]"); process.exit(1); }

let files = 0, hits = 0;
const touched: string[] = [];
for (const folder of FOLDERS) {
  const dir = path.join(VAULT, folder);
  let entries: string[] = [];
  try { entries = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }
  for (const f of entries) {
    const p = path.join(dir, f);
    const raw = fs.readFileSync(p, "utf-8");
    const n = raw.split(FROM).length - 1;
    if (n === 0) continue;
    files++; hits += n; touched.push(`${folder}/${f} (${n})`);
    if (APPLY) fs.writeFileSync(p, raw.split(FROM).join(TO), "utf-8");
  }
}
console.log(`${APPLY ? "APPLY ✍️" : "DRY-RUN 👀"} — "${FROM}"→"${TO}": ${hits} ocurrencias en ${files} archivos.`);
for (const t of touched.slice(0, 12)) console.log(`  ${t}`);
if (touched.length > 12) console.log(`  … y ${touched.length - 12} más`);
