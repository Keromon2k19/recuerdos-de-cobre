// scripts/normalize-entity.ts — Normaliza una grafía de entidad que está partida en
// nombre + slug + prosa de muchas fichas derivadas (patrón Aerion/Uthuk/Arya).
// Reemplaza <from> por <to> en el CONTENIDO (palabra completa) y renombra los ARCHIVOS
// cuyo slug contiene la versión minúscula. Preserva el alias <from> en la ficha canónica.
//
// Uso:  npx tsx scripts/normalize-entity.ts <From> <To> <preserveRelPath>            # dry-run
//       npx tsx scripts/normalize-entity.ts <From> <To> <preserveRelPath> --apply    # aplica
// Ej:   npx tsx scripts/normalize-entity.ts Arya Aria personajes/aria.md --apply
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.resolve(__dirname, "..", "vault-recuerdos-de-cobre");
const FOLDERS = ["episodios", "personajes", "facciones", "lugares", "objetos", "misterios", "eventos", "decisiones", "worldbuilding", "quotes"];
const FROM = process.argv[2];
const TO = process.argv[3];
const PRESERVE = process.argv[4] || "";
const APPLY = process.argv.includes("--apply");
if (!FROM || !TO) { console.log("Uso: normalize-entity <From> <To> <preserveRelPath> [--apply]"); process.exit(1); }

const fromLower = FROM.toLowerCase();
const toLower = TO.toLowerCase();
const wordRe = new RegExp(`\\b${FROM}\\b`, "g");

let contentChanged = 0, renamed = 0;
const collisions: string[] = [];
const renames: string[] = [];
for (const folder of FOLDERS) {
  const dir = path.join(VAULT, folder);
  let entries: string[] = [];
  try { entries = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }
  for (const f of entries) {
    const relId = `${folder}/${f}`;
    const p = path.join(dir, f);
    // 1) contenido (palabra completa), salvo la ficha preservada
    if (relId !== PRESERVE) {
      const raw = fs.readFileSync(p, "utf-8");
      if (wordRe.test(raw)) {
        contentChanged++;
        if (APPLY) fs.writeFileSync(p, raw.replace(wordRe, TO), "utf-8");
      }
    }
    // 2) rename de archivo si el slug contiene la versión minúscula
    if (f.includes(fromLower)) {
      const newName = f.split(fromLower).join(toLower);
      const newPath = path.join(dir, newName);
      if (fs.existsSync(newPath)) { collisions.push(`${folder}/${f} ⟂ ${folder}/${newName} (YA EXISTE)`); continue; }
      renames.push(`${folder}/${f} -> ${folder}/${newName}`);
      renamed++;
      if (APPLY) fs.renameSync(p, newPath);
    }
  }
}
console.log(`${APPLY ? "APPLY ✍️" : "DRY-RUN 👀"} — "${FROM}"→"${TO}": contenido en ${contentChanged} fichas; archivos a renombrar ${renamed}; colisiones ${collisions.length}`);
for (const c of collisions) console.log(`  ⚠️ COLISIÓN: ${c}`);
for (const r of renames.slice(0, 15)) console.log(`  ${r}`);
if (renames.length > 15) console.log(`  … y ${renames.length - 15} más`);
