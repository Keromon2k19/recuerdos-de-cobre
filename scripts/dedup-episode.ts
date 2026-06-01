// scripts/dedup-episode.ts — Consolida una sesión duplicada en dos archivos de episodio.
// Caso: 031 y 032 son la MISMA sesión "RdC 24"; 031 (GOOD) es correcto, 032 (BAD) tiene errores.
// Acción: en TODAS las fichas (no-episodios), fusiona las referencias de BAD en GOOD:
//   - apariciones: 32 -> 31 (dedup)
//   - relaciones: las de episodio 32 se relabelean a 31, PERO se descartan si ya existe
//     una relación con el mismo `con` en episodio 31 (prefiere la versión GOOD/correcta).
//   - menciones: la sección "### [[032-...]]" se BORRA si ya existe la de 031; si solo
//     existe la de 032, se relabela a 031.
// Luego: borra el archivo 032 y reescribe cualquier [[032-...]] residual a [[031-...]].
//
// Uso:  npx tsx scripts/dedup-episode.ts            # dry-run
//       npx tsx scripts/dedup-episode.ts --apply    # aplica
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.resolve(__dirname, "..", "vault-recuerdos-de-cobre");
const FOLDERS = ["personajes", "facciones", "lugares", "objetos", "misterios", "eventos", "decisiones", "worldbuilding", "quotes"];
const APPLY = process.argv.includes("--apply");

const BAD = { n: 32, slug: "032-recuerdos-de-cobre-24-la-gata-rompehogares", label: "Ep. 32 — Recuerdos de Cobre 24" };
const GOOD = { n: 31, slug: "031-recuerdos-de-cobre-24-la-gata-rompehogares", label: "Ep. 31 — Recuerdos de Cobre 24" };

function dedupRelaciones(rels: any[]): { rels: any[]; changed: boolean } {
  if (!Array.isArray(rels)) return { rels, changed: false };
  const goodCon = new Set(rels.filter((r) => Number(r?.episodio) === GOOD.n).map((r) => String(r?.con)));
  const out: any[] = [];
  let changed = false;
  const relabeledCon = new Set<string>();
  for (const r of rels) {
    const ep = Number(r?.episodio);
    if (ep === BAD.n) {
      const con = String(r?.con);
      if (goodCon.has(con) || relabeledCon.has(con)) { changed = true; continue; } // ya existe la buena (o ya relabeleé esta con)
      relabeledCon.add(con);
      out.push({ ...r, episodio: GOOD.n });
      changed = true;
    } else {
      out.push(r);
    }
  }
  return { rels: out, changed };
}

function dedupBody(body: string): { body: string; changed: boolean } {
  const parts = body.split(/(?=^### )/m);
  const hasGood = parts.some((s) => s.startsWith(`### [[${GOOD.slug}`));
  let changed = false;
  const out: string[] = [];
  for (const s of parts) {
    if (s.startsWith(`### [[${BAD.slug}`)) {
      changed = true;
      if (hasGood) continue; // borrar: ya está la sección de 031
      out.push(s.split(BAD.slug).join(GOOD.slug).split(BAD.label).join(GOOD.label)); // relabel 32->31
    } else {
      out.push(s);
    }
  }
  return { body: out.join(""), changed };
}

let touched = 0;
const report: string[] = [];
for (const folder of FOLDERS) {
  const dir = path.join(VAULT, folder);
  let entries: string[] = [];
  try { entries = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }
  for (const f of entries) {
    const p = path.join(dir, f);
    const raw = fs.readFileSync(p, "utf-8");
    if (!raw.includes("032-recuerdos-de-cobre-24") && !/episodio: 32\b/.test(raw) && !/^\s*-\s*32\s*$/m.test(raw)) continue;
    const parsed = matter(raw);
    const data: any = parsed.data;
    let changed = false;
    // apariciones
    if (Array.isArray(data.apariciones)) {
      const before = data.apariciones.length;
      const ap = [...new Set(data.apariciones.map((x: any) => (Number(x) === BAD.n ? GOOD.n : Number(x))))] as number[];
      ap.sort((a, b) => a - b);
      data.apariciones = ap;
      if (data.apariciones.length !== before || JSON.stringify(data.apariciones) !== JSON.stringify(parsed.data.apariciones)) changed = true;
    }
    // relaciones
    if (Array.isArray(data.relaciones)) {
      const r = dedupRelaciones(data.relaciones);
      if (r.changed) { data.relaciones = r.rels; changed = true; }
    }
    // body
    const b = dedupBody(parsed.content);
    let body = parsed.content;
    if (b.changed) { body = b.body; changed = true; }
    if (changed) {
      touched++;
      report.push(`${folder}/${f}`);
      if (APPLY) fs.writeFileSync(p, matter.stringify(body, data), "utf-8");
    }
  }
}

// borrar el archivo BAD + reescribir residuales
const badPath = path.join(VAULT, "episodios", BAD.slug + ".md");
if (APPLY) {
  if (fs.existsSync(badPath)) fs.rmSync(badPath);
  // residuales [[032-...]] en cualquier archivo (incl. otros episodios)
  for (const folder of [...FOLDERS, "episodios"]) {
    const dir = path.join(VAULT, folder);
    let entries: string[] = [];
    try { entries = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { continue; }
    for (const f of entries) {
      const p = path.join(dir, f);
      const t = fs.readFileSync(p, "utf-8");
      if (!t.includes(BAD.slug) && !t.includes(BAD.label)) continue;
      fs.writeFileSync(p, t.split(BAD.slug).join(GOOD.slug).split(BAD.label).join(GOOD.label), "utf-8");
    }
  }
}

console.log(`${APPLY ? "APPLY ✍️" : "DRY-RUN 👀"} — fichas con referencias a ep32 consolidadas en ep31: ${touched}`);
for (const r of report.slice(0, 25)) console.log(`  ${r}`);
if (report.length > 25) console.log(`  … y ${report.length - 25} más`);
console.log(`Archivo a borrar: episodios/${BAD.slug}.md ${fs.existsSync(badPath) ? "(existe)" : "(no existe)"}`);
