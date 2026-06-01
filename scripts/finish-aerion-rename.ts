// scripts/finish-aerion-rename.ts — Completa el rename Aerion→Eryon en las fichas DERIVADAS.
// La prosa de los cuerpos ya se normalizó (normalize-aerion.ts) y los wikilinks [[Aerion]]
// exactos se reescribieron (vault-fix rename). Falta: el frontmatter (nombre/relaciones
// compuestas [[X de Aerion]]) y los NOMBRES DE ARCHIVO de las ~41 fichas derivadas
// (eventos/quotes/decisiones/misterios/objetos cuyo slug contiene "aerion").
//
// Preserva el alias "Aerion" SOLO en personajes/eryon.md (ahí sigue siendo alias válido).
//
// Uso:  npx tsx scripts/finish-aerion-rename.ts            # dry-run
//       npx tsx scripts/finish-aerion-rename.ts --apply    # aplica
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
const PRESERVE = new Set(["personajes/eryon.md"]); // mantiene "Aerion" como alias

let contentChanged = 0, renamed = 0;
const renames: string[] = [];
for (const folder of FOLDERS) {
  const dir = path.join(VAULT, folder);
  let entries: string[] = [];
  try { entries = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }
  for (const f of entries) {
    const relId = `${folder}/${f}`;
    const p = path.join(dir, f);
    let raw = fs.readFileSync(p, "utf-8");

    // 1) reemplazo de contenido (frontmatter incluido), salvo la ficha preservada
    if (!PRESERVE.has(relId) && /Aerion/.test(raw)) {
      const next = raw.replace(/Aerion/g, "Eryon");
      if (next !== raw) { raw = next; contentChanged++; if (APPLY) fs.writeFileSync(p, raw, "utf-8"); }
    }

    // 2) rename de archivo si el slug contiene "aerion"
    if (/aerion/.test(f)) {
      const newName = f.replace(/aerion/g, "eryon");
      renames.push(`${folder}/${f} -> ${folder}/${newName}`);
      renamed++;
      if (APPLY) fs.renameSync(p, path.join(dir, newName));
    }
  }
}
console.log(`${APPLY ? "APPLY ✍️" : "DRY-RUN 👀"} — fichas con contenido "Aerion"→"Eryon": ${contentChanged}; archivos a renombrar: ${renamed}`);
for (const r of renames.slice(0, 50)) console.log(`  ${r}`);
if (renames.length > 50) console.log(`  … y ${renames.length - 50} más`);
