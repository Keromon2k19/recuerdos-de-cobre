// scripts/vault-fix.ts — Remediación auditada del vault Recuerdos de Cobre.
//
// DRY-RUN POR DEFECTO. Nada se escribe sin --apply.
//
// Uso:
//   npx tsx scripts/vault-fix.ts mojibake          # preview de re-decodificación latin1→utf8
//   npx tsx scripts/vault-fix.ts mojibake --apply  # aplica (solo archivos SAFE)
//   npx tsx scripts/vault-fix.ts merge             # preview de fusiones confirmadas
//   npx tsx scripts/vault-fix.ts merge --apply     # aplica fusiones + reescribe wikilinks + borra dups
//   npx tsx scripts/vault-fix.ts all               # ambos previews
//
// Reutiliza la lógica real del proyecto: gray-matter (parse/serialize) y slugify.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { slugify, episodeFilename } from "../lib/slugify";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.resolve(__dirname, "..", "vault-recuerdos-de-cobre");

const ENTITY_FOLDERS = [
  "personajes", "facciones", "lugares", "objetos", "misterios",
  "eventos", "decisiones", "worldbuilding", "quotes",
];
const ALL_FOLDERS = ["episodios", ...ENTITY_FOLDERS];

// ─── utilidades de FS ───
function listMd(folder: string): string[] {
  const dir = path.join(VAULT, folder);
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => path.join(dir, f));
  } catch { return []; }
}
function allMdFiles(): string[] {
  return ALL_FOLDERS.flatMap(listMd);
}
function rel(p: string): string {
  return path.relative(VAULT, p).replace(/\\/g, "/");
}

const APPLY = process.argv.includes("--apply");
const CMD = process.argv[2];

// ════════════════════════════════════════════════════════════════════
//  MOJIBAKE — fix dirigido por runs (mini-ftfy), seguro para texto mixto
// ════════════════════════════════════════════════════════════════════
// Los archivos tienen contenido mixto: UTF-8 correcto + mojibake. NO se
// puede re-decodificar el buffer entero (manglearía los acentos legítimos).
// El daño es siempre: lead 0xC3/0xC2 + continuación(es) 0x80–0xBF — la firma
// de UTF-8 occidental mal leído como Latin-1. Buscamos esos runs (anclados en
// C2/C3), los decodificamos con UTF-8 ESTRICTO, y solo reemplazamos si decodifica
// limpio. Todo lo demás (ñ suelta, runs que no decodifican) queda intacto.
const strictUtf8 = new TextDecoder("utf-8", { fatal: true });
const isLead = (c: number) => c === 0xc2 || c === 0xc3;
const isCont = (c: number) => c >= 0x80 && c <= 0xbf;
const isRunChar = (c: number) => isLead(c) || isCont(c);

// Devuelve {fixed, fixedRuns, residual} donde residual = runs que parecen
// mojibake (empiezan en C2/C3) pero NO decodifican → sospechosos.
function fixMojibakeRuns(s: string): { fixed: string; fixedRuns: number; residual: number } {
  let out = "";
  let fixedRuns = 0;
  let residual = 0;
  let i = 0;
  while (i < s.length) {
    const c = s.charCodeAt(i);
    if (isLead(c)) {
      let j = i + 1;
      while (j < s.length && isRunChar(s.charCodeAt(j))) j++;
      const run = s.slice(i, j);
      const bytes = Uint8Array.from([...run].map((ch) => ch.charCodeAt(0)));
      try {
        const decoded = strictUtf8.decode(bytes);
        if (decoded !== run && !decoded.includes("�")) {
          out += decoded;
          fixedRuns++;
          i = j;
          continue;
        }
      } catch {
        residual++; // run con C2/C3 que no decodifica → revisar
      }
    }
    out += s[i];
    i++;
  }
  return { fixed: out, fixedRuns, residual };
}

// Marcadores residuales que parecen mojibake (lead seguido de continuación).
function residualMojibake(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length - 1; i++) {
    if (isLead(s.charCodeAt(i)) && isCont(s.charCodeAt(i + 1))) n++;
  }
  return n;
}

type MojibakeResult = {
  file: string;
  fixedRuns: number;
  residualAfter: number;
  safe: boolean;
  reason?: string;
  fixed: string;
  original: string;
};

function analyzeMojibake(): MojibakeResult[] {
  const out: MojibakeResult[] = [];
  for (const file of allMdFiles()) {
    const original = fs.readFileSync(file, "utf-8");
    if (residualMojibake(original) === 0 && !original.includes("�")) continue;

    const { fixed, fixedRuns, residual } = fixMojibakeRuns(original);
    const residualAfter = residualMojibake(fixed);

    // SAFE: arreglamos ≥1 run, no quedan runs mojibake sin resolver,
    // y no introdujimos replacement chars nuevos.
    let safe = true;
    let reason: string | undefined;
    if (fixedRuns === 0) { safe = false; reason = "no se pudo decodificar ningún run"; }
    else if (residualAfter > 0) { safe = false; reason = `quedan ${residualAfter} runs mojibake sin resolver`; }
    else if (residual > 0) { safe = false; reason = `${residual} runs con C2/C3 no decodificaron`; }
    else if (fixed.includes("�") && !original.includes("�")) { safe = false; reason = "introduce U+FFFD"; }

    out.push({ file, fixedRuns, residualAfter, safe, reason, fixed, original });
  }
  return out;
}

function reportMojibake(results: MojibakeResult[]) {
  const safe = results.filter((r) => r.safe);
  const review = results.filter((r) => !r.safe);

  console.log("\n══════════ MOJIBAKE — dry-run ══════════");
  console.log(`Archivos con mojibake: ${results.length}`);
  console.log(`  ✅ SAFE (fix dirigido limpio, auto): ${safe.length}`);
  console.log(`  ⚠️  NEEDS_REVIEW (no auto): ${review.length}`);

  // por carpeta
  const byFolder = new Map<string, { safe: number; review: number }>();
  for (const r of results) {
    const folder = rel(r.file).split("/")[0];
    const e = byFolder.get(folder) ?? { safe: 0, review: 0 };
    r.safe ? e.safe++ : e.review++;
    byFolder.set(folder, e);
  }
  console.log("\n  Por carpeta (safe / review):");
  for (const [f, e] of [...byFolder].sort()) {
    console.log(`    ${f.padEnd(14)} ${e.safe} / ${e.review}`);
  }

  // muestra de diffs SAFE
  console.log("\n  ── Muestra de correcciones SAFE (primer cambio de 3 archivos) ──");
  for (const r of safe.slice(0, 3)) {
    const ob = r.original.split("\n");
    const fb = r.fixed.split("\n");
    for (let i = 0; i < ob.length; i++) {
      if (ob[i] !== fb[i]) {
        console.log(`    ${rel(r.file)}`);
        console.log(`      - ${ob[i].trim().slice(0, 90)}`);
        console.log(`      + ${fb[i].trim().slice(0, 90)}`);
        break;
      }
    }
  }

  if (review.length) {
    console.log("\n  ── NEEDS_REVIEW (NO se tocan en --apply) ──");
    for (const r of review) console.log(`    ${rel(r.file)} — ${r.reason}`);
  }

  // slugs de filename con mojibake (eps 8/9)
  const badSlugs = results.filter((r) => /Ã|Â/.test(path.basename(r.file)) || /mansian/.test(path.basename(r.file)));
  if (badSlugs.length) {
    console.log("\n  ── Filenames con slug corrupto (rename cosmético; el resolver usa el N°) ──");
    for (const r of badSlugs) console.log(`    ${path.basename(r.file)}`);
  }
}

function applyMojibake(results: MojibakeResult[]) {
  const safe = results.filter((r) => r.safe);
  // 1) escribir contenido corregido
  for (const r of safe) fs.writeFileSync(r.file, r.fixed, "utf-8");

  // 2) renombrar episodios cuyo slug cambió tras corregir el título
  //    (eps 8/9: 'mansian' → 'mansion'). El resolver navega por número, así
  //    que esto es cosmético, pero deja los slugs consistentes.
  const renames: { from: string; to: string }[] = [];
  for (const r of safe) {
    if (!rel(r.file).startsWith("episodios/")) continue;
    const { data } = matter(r.fixed);
    const numero = Number((data as FM).numero);
    const titulo = String((data as FM).titulo ?? "");
    if (!numero || !titulo) continue;
    const newName = episodeFilename(numero, titulo);
    const curName = path.basename(r.file);
    if (newName !== curName) {
      const newPath = path.join(path.dirname(r.file), newName);
      fs.renameSync(r.file, newPath);
      renames.push({ from: curName.replace(/\.md$/, ""), to: newName.replace(/\.md$/, "") });
    }
  }

  // 3) reescribir wikilinks que apuntan al slug viejo del episodio (match por
  //    prefijo de slug dentro de [[...]]: cubre [[slug]] y [[slug|label]]).
  let linkFiles = 0, linkCount = 0;
  if (renames.length) {
    for (const file of allMdFiles()) {
      let txt = fs.readFileSync(file, "utf-8");
      let n = 0;
      for (const rn of renames) {
        const re = new RegExp(`(\\[\\[)${rn.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[|\\]])`, "g");
        txt = txt.replace(re, (_m, open) => { n++; return open + rn.to; });
      }
      if (n > 0) { fs.writeFileSync(file, txt, "utf-8"); linkFiles++; linkCount += n; }
    }
  }

  console.log(`\n✅ Mojibake: ${safe.length} archivos corregidos. ${results.length - safe.length} para revisión manual.`);
  for (const rn of renames) console.log(`   ↳ renombrado: ${rn.from} → ${rn.to}`);
  if (renames.length) console.log(`   ↳ ${linkCount} wikilinks de slug reescritos en ${linkFiles} archivos.`);
}

// ════════════════════════════════════════════════════════════════════
//  MERGE
// ════════════════════════════════════════════════════════════════════
// Lista CONFIRMADA (canónico inequívoco). Lugares/objetos con dirección
// ambigua y casos 2C NO están acá: se deciden con el usuario.
type Merge = { folder: string; canonical: string; dups: string[]; note?: string };

// PASA 1 (ya aplicada): carl-johnson, rylen, amari-zaled, andrew-mironov(3w),
// safira-nierovic, talisa-talashon, uhtuk, zitzil, bijak, pat-pat(3w), el-ojon,
// githyanki, guardia-de-lorenza, hermandad-de-arcanis, nefarios, renegados,
// sonadores, shadar-kai, nueve-puntas-de-eira(←ira), tripulacion-del-diablillo,
// bag-of-holding, feywild.  ← NO repetir (sus dups ya no existen).
// PASA 2 (ya aplicada): drakan, letgeris, monte-celestia, montanas-del-frio-eterno,
// casa-del-te-de-medianoche, gema-del-constructo, poliformador-de-maldiciones,
// irma-alari, lefaye, el-corruptor(3w), anora(←annora), mysha(←combo), phelan,
// lebruktik(3w), aldan(←aldam), khelgrim(←hellgrim).
// PASA 3 (ya aplicada): aria ← arya.
const MERGES: Merge[] = [
  // ── PASA 4 ──
  // Mysha NO tiene serpiente (confirmado por el usuario): la "serpiente de Mysha"
  // del ep 28 fue mal atribuida; es la de Narcissa = Bijak.
  { folder: "personajes", canonical: "bijak", dups: ["mishak"], note: "Mysha no tiene serpiente; Mishak = la de Narcissa (Bijak)" },
  // ── PASA 5 (integración inbox-lore Eryon) ──
  // `erion` es un stub del ep 68 del mismo personaje que la ficha rica `aerion`
  // (eps 69-82). Fusionar el stub en aerion; el rename a "Eryon" va en RENAMES.
  { folder: "personajes", canonical: "aerion", dups: ["erion"], note: "stub ep68 = Aerion (PJ, jugador Miguel); luego rename a Eryon" },
  // ── PASA 5c (dedup post-triage de huérfanos, 2026-05-29) ──
  { folder: "personajes", canonical: "apolo-iorxan", dups: ["apolo-yorksand"], note: "mismo dragón metálico; iorxan absorbe variantes Yorksand/Yorksan" },
  { folder: "facciones", canonical: "concejales-de-metropolis", dups: ["concejales-de-la-metropolis-de-cobre", "concejales-de-metropolis-de-cobre"], note: "mismo concejo de la Metrópolis de Cobre" },
  { folder: "objetos", canonical: "texto-abisal", dups: ["mensaje-abisal"], note: "misma carta a Nacria; mensaje-abisal fue dup creado en pasa 5b" },
  { folder: "facciones", canonical: "te-de-medianoche", dups: ["el-grupo"], note: "El grupo = misma unidad, ya con nombre formal Té de Medianoche" },
  // ── PASA 6 (dedup del audit de coherencia, 2026-05-30) ──
  { folder: "personajes", canonical: "anora", dups: ["nora"], note: "Nora = residuo de transcripción de Anora (mismo arco revolucionario)" },
  { folder: "lugares", canonical: "khelgrim", dups: ["ciudad-subterranea-de-hellgrim"], note: "misma ciudad duergar (Último Bastión); khelgrim ya tiene alias Hellgrim" },
  { folder: "personajes", canonical: "el-emperador", dups: ["emperador"], note: "mismo personaje; [[Emperador]] → [[El Emperador]]" },
];

// ── RENAMES — cambiar nombre/slug de una entidad (no es merge) ──
type Rename = { folder: string; slug: string; newName: string; note?: string };
const RENAMES: Rename[] = [
  { folder: "personajes", slug: "layra-umbra", newName: "Señorita Umbra", note: "es sacerdotisa de Myrkul, NO la PJ Layra" },
  { folder: "personajes", slug: "padre-de-arya", newName: "Padre de Aria", note: "consistencia con Aria (no Arya)" },
  { folder: "objetos", slug: "collar-de-arya", newName: "Collar protector de Aria", note: "ítem distinto del collar-de-aria; nombre distintivo para evitar colisión" },
  // ── PASA 5 — canónico "Eryon" (grafía del jugador en el backstory del inbox) ──
  // Correr DESPUÉS del merge aerion←erion. Reescribe [[Aerion]]→[[Eryon]] en todo el vault.
  { folder: "personajes", slug: "aerion", newName: "Eryon", note: "grafía del jugador (Miguel); PJ. Aliases Aerion/Erion/Elyon" },
  { folder: "personajes", slug: "kuo-toa-seguidores-de-aerion", newName: "Kuo-toa seguidores de Eryon", note: "consistencia con rename Aerion→Eryon" },
];

const JUNK_ALIASES = ["youtube", "aria spirit shovel", "spirit shovel"];

type FM = Record<string, unknown>;
function readEntity(folder: string, slug: string): { fm: FM; body: string; path: string } | null {
  const p = path.join(VAULT, folder, slug + ".md");
  if (!fs.existsSync(p)) return null;
  const { data, content } = matter(fs.readFileSync(p, "utf-8"));
  return { fm: data as FM, body: content.trim(), path: p };
}

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).map(String) : [];
}
function asNumArr(v: unknown): number[] {
  return Array.isArray(v) ? (v as unknown[]).map(Number).filter((n) => !Number.isNaN(n)) : [];
}

// Secciones "### [[...|Ep. N — ...]]" → mapa por nº de episodio
function splitMentions(body: string): { preamble: string; sections: Map<number, string> } {
  const idx = body.indexOf("### ");
  const preamble = idx === -1 ? body : body.slice(0, idx).trimEnd();
  const rest = idx === -1 ? "" : body.slice(idx);
  const sections = new Map<number, string>();
  const parts = rest.split(/(?=^### )/m).filter((s) => s.trim());
  for (const sec of parts) {
    const m = sec.match(/Ep\.\s*(\d+)/);
    const n = m ? parseInt(m[1], 10) : -1;
    if (!sections.has(n)) sections.set(n, sec.trimEnd());
  }
  return { preamble, sections };
}

type MergePlan = {
  m: Merge;
  ok: boolean;
  errors: string[];
  warnings: string[];
  aparBefore: number[];
  aparAfter: number[];
  aliasAdded: string[];
  relAdded: number;
  sectionsAdded: number[];
  mergedContent?: string;
  canonPath?: string;
  dupPaths: string[];
  // reescritura de wikilinks: target(dup) -> ocurrencias
  linkRewrites: { dupName: string; dupSlug: string; canonName: string }[];
};

function planMerge(m: Merge): MergePlan {
  const errors: string[] = [];
  const warnings: string[] = [];
  const canon = readEntity(m.folder, m.canonical);
  if (!canon) errors.push(`canónico no existe: ${m.folder}/${m.canonical}.md`);
  const dups = m.dups.map((d) => ({ slug: d, e: readEntity(m.folder, d) }));
  for (const d of dups) if (!d.e) errors.push(`dup no existe: ${m.folder}/${d.slug}.md`);

  const plan: MergePlan = {
    m, ok: errors.length === 0, errors, warnings,
    aparBefore: [], aparAfter: [], aliasAdded: [], relAdded: 0, sectionsAdded: [],
    dupPaths: dups.map((d) => d.e?.path).filter(Boolean) as string[],
    linkRewrites: [],
  };
  if (!plan.ok || !canon) return plan;

  const canonName = String(canon.fm.nombre ?? m.canonical);

  // ── frontmatter merge ──
  const fm: FM = { ...canon.fm };
  // apariciones
  const aparBefore = asNumArr(fm.apariciones);
  let apar = [...aparBefore];
  // alias
  const aliasSet = new Map<string, string>(); // lower -> casing
  for (const a of asArr(fm.alias)) aliasSet.set(a.toLowerCase(), a);
  // relaciones
  const rels = Array.isArray(fm.relaciones) ? [...(fm.relaciones as any[])] : [];
  const relKey = (r: any) => `${r.con}|${r.tipo}|${r.episodio}`;
  const relSeen = new Set(rels.map(relKey));
  // facciones
  const faccSet = new Set(asArr(fm.facciones));

  const aliasAdded: string[] = [];
  for (const d of dups) {
    const de = d.e!;
    const dName = String(de.fm.nombre ?? d.slug);
    // dup nombre como alias
    for (const cand of [dName, ...asArr(de.fm.alias)]) {
      const low = cand.toLowerCase();
      if (low === canonName.toLowerCase()) continue;
      if (JUNK_ALIASES.includes(low)) { warnings.push(`alias basura descartado: "${cand}"`); continue; }
      if (!aliasSet.has(low)) { aliasSet.set(low, cand); aliasAdded.push(cand); }
    }
    apar = apar.concat(asNumArr(de.fm.apariciones));
    for (const r of (Array.isArray(de.fm.relaciones) ? de.fm.relaciones as any[] : [])) {
      if (!relSeen.has(relKey(r))) { relSeen.add(relKey(r)); rels.push(r); plan.relAdded++; }
    }
    for (const f of asArr(de.fm.facciones)) faccSet.add(f);
    // conflictos de escalares
    for (const k of ["rol", "region", "jugador", "categoria", "acto"]) {
      if (de.fm[k] != null && fm[k] != null && String(de.fm[k]) !== String(fm[k]))
        warnings.push(`campo '${k}' difiere: canon="${fm[k]}" vs ${d.slug}="${de.fm[k]}" (se mantiene canon)`);
      if (de.fm[k] != null && fm[k] == null) { fm[k] = de.fm[k]; warnings.push(`campo '${k}' tomado de ${d.slug}="${de.fm[k]}"`); }
    }
    // body fuera de menciones (perfil) que se perdería
    const { preamble } = splitMentions(de.body);
    const cleanPre = preamble.replace(/^##\s*Menciones por episodio\s*/i, "").trim();
    if (cleanPre.length > 20) warnings.push(`${d.slug}: tiene ~${cleanPre.length} chars de cuerpo no-mención (perfil) → no se fusiona auto`);
  }

  const aparAfter = [...new Set(apar)].sort((a, b) => a - b);
  fm.apariciones = aparAfter;
  fm.alias = [...aliasSet.values()];
  if (rels.length) fm.relaciones = rels;
  if (faccSet.size) fm.facciones = [...faccSet];
  fm.ultima_actualizacion = new Date().toISOString();

  plan.aparBefore = aparBefore;
  plan.aparAfter = aparAfter;
  plan.aliasAdded = aliasAdded;

  // ── body merge (secciones de mención por episodio) ──
  const canonMen = splitMentions(canon.body);
  const merged = new Map(canonMen.sections);
  for (const d of dups) {
    const dm = splitMentions(d.e!.body);
    for (const [n, sec] of dm.sections) {
      if (!merged.has(n)) { merged.set(n, sec); plan.sectionsAdded.push(n); }
    }
  }
  const orderedSecs = [...merged.entries()].sort((a, b) => a[0] - b[0]).map(([, s]) => s);
  const preamble = canonMen.preamble || "## Menciones por episodio";
  const newBody = preamble + "\n\n" + orderedSecs.join("\n\n");
  plan.mergedContent = matter.stringify("\n" + newBody.trim() + "\n", fm);
  plan.canonPath = canon.path;

  // ── reescritura de wikilinks ──
  for (const d of dups) {
    plan.linkRewrites.push({
      dupName: String(d.e!.fm.nombre ?? d.slug),
      dupSlug: d.slug,
      canonName,
    });
  }
  return plan;
}

// Reescribe wikilinks [[target]] / [[target|label]] donde target ∈ {dupName, dupSlug}
// (match exacto, anclado) → canonName. NO toca compuestos como "Trato con X".
function rewriteWikilinksInText(
  text: string,
  rules: { dupName: string; dupSlug: string; canonName: string }[]
): { text: string; count: number } {
  let count = 0;
  const out = text.replace(/\[\[([^\]]+)\]\]/g, (full, inner: string) => {
    const pipe = inner.indexOf("|");
    const target = (pipe === -1 ? inner : inner.slice(0, pipe)).trim();
    const label = pipe === -1 ? null : inner.slice(pipe + 1);
    for (const r of rules) {
      const hit = target.toLowerCase() === r.dupName.toLowerCase() || slugify(target) === r.dupSlug;
      if (hit && slugify(target) !== slugify(r.canonName)) {
        count++;
        return label === null ? `[[${r.canonName}]]` : `[[${r.canonName}|${label}]]`;
      }
    }
    return full;
  });
  return { text: out, count };
}

function reportMerge(plans: MergePlan[]) {
  console.log("\n══════════ FUSIONES CONFIRMADAS — dry-run ══════════");
  const okPlans = plans.filter((p) => p.ok);
  const badPlans = plans.filter((p) => !p.ok);
  console.log(`Pares en lista: ${plans.length}  (válidos: ${okPlans.length}, con error: ${badPlans.length})`);

  if (badPlans.length) {
    console.log("\n  ⛔ ERRORES (no se procesan):");
    for (const p of badPlans) console.log(`    ${p.m.folder}/${p.m.canonical}: ${p.errors.join("; ")}`);
  }

  // Reescritura global de wikilinks: simulamos sobre TODO el vault
  const allRules = okPlans.flatMap((p) => p.linkRewrites);
  const dupPathsSet = new Set(okPlans.flatMap((p) => p.dupPaths).map(rel));
  let totalLinks = 0;
  const filesTouched = new Map<string, number>();
  for (const file of allMdFiles()) {
    if (dupPathsSet.has(rel(file))) continue; // se borran
    const txt = fs.readFileSync(file, "utf-8");
    const { count } = rewriteWikilinksInText(txt, allRules);
    if (count > 0) { totalLinks += count; filesTouched.set(rel(file), count); }
  }

  console.log("\n  ── Detalle por fusión ──");
  for (const p of okPlans) {
    const flag = p.m.note?.includes("MEDIA") ? " ⚠️" : "";
    console.log(`\n  • ${p.m.folder}/${p.m.canonical} ← ${p.m.dups.join(", ")}${flag}`);
    if (p.m.note) console.log(`      nota: ${p.m.note}`);
    console.log(`      apariciones: [${p.aparBefore.join(",")}] → [${p.aparAfter.join(",")}] (${p.aparAfter.length})`);
    if (p.aliasAdded.length) console.log(`      alias +: ${p.aliasAdded.join(", ")}`);
    if (p.relAdded) console.log(`      relaciones +: ${p.relAdded}`);
    if (p.sectionsAdded.length) console.log(`      secciones de episodio +: ${p.sectionsAdded.sort((a, b) => a - b).join(", ")}`);
    for (const w of p.warnings) console.log(`      ⚠️ ${w}`);
  }

  console.log("\n  ── Reescritura de wikilinks (todo el vault) ──");
  console.log(`    Total ocurrencias a reescribir: ${totalLinks} en ${filesTouched.size} archivos`);
  const top = [...filesTouched].sort((a, b) => b[1] - a[1]).slice(0, 12);
  for (const [f, c] of top) console.log(`      ${c.toString().padStart(3)}  ${f}`);
  if (filesTouched.size > 12) console.log(`      … y ${filesTouched.size - 12} archivos más`);

  console.log(`\n  ── Archivos a BORRAR: ${dupPathsSet.size} ──`);
  for (const d of [...dupPathsSet].sort()) console.log(`      ${d}`);
}

function applyMerge(plans: MergePlan[]) {
  const okPlans = plans.filter((p) => p.ok);
  const allRules = okPlans.flatMap((p) => p.linkRewrites);
  const dupPathsSet = new Set(okPlans.flatMap((p) => p.dupPaths).map(rel));

  // 1) escribir canónicos fusionados
  for (const p of okPlans) fs.writeFileSync(p.canonPath!, p.mergedContent!, "utf-8");
  // 2) borrar dups
  for (const p of okPlans) for (const dp of p.dupPaths) fs.rmSync(dp);
  // 3) reescribir wikilinks en todo el vault (sin los borrados)
  let touched = 0, links = 0;
  for (const file of allMdFiles()) {
    if (dupPathsSet.has(rel(file))) continue;
    const txt = fs.readFileSync(file, "utf-8");
    const { text, count } = rewriteWikilinksInText(txt, allRules);
    if (count > 0) { fs.writeFileSync(file, text, "utf-8"); touched++; links += count; }
  }
  console.log(`\n✅ Fusiones aplicadas: ${okPlans.length} canónicos, ${dupPathsSet.size} dups borrados, ${links} wikilinks reescritos en ${touched} archivos.`);
}

// ════════════════════════════════════════════════════════════════════
//  RENAME — cambia nombre+slug de una entidad y reescribe wikilinks
// ════════════════════════════════════════════════════════════════════
function planRename(r: Rename) {
  const e = readEntity(r.folder, r.slug);
  const errors: string[] = [];
  if (!e) errors.push(`no existe: ${r.folder}/${r.slug}.md`);
  const newSlug = slugify(r.newName);
  const collision = fs.existsSync(path.join(VAULT, r.folder, newSlug + ".md")) && newSlug !== r.slug;
  if (collision) errors.push(`colisión: ${r.folder}/${newSlug}.md ya existe`);
  if (errors.length || !e) return { r, ok: false, errors, oldName: "", newSlug, links: 0, files: new Map<string, number>() };

  const oldName = String(e.fm.nombre ?? r.slug);
  // contar wikilinks a reescribir
  const rule = [{ dupName: oldName, dupSlug: r.slug, canonName: r.newName }];
  let links = 0;
  const files = new Map<string, number>();
  for (const file of allMdFiles()) {
    const { count } = rewriteWikilinksInText(fs.readFileSync(file, "utf-8"), rule);
    if (count > 0) { links += count; files.set(rel(file), count); }
  }
  return { r, ok: true, errors, oldName, newSlug, links, files };
}

function doRenames(apply: boolean) {
  console.log(`\n══════════ RENAMES — ${apply ? "APPLY" : "dry-run"} ══════════`);
  for (const r of RENAMES) {
    const p = planRename(r);
    if (!p.ok) { console.log(`  ⛔ ${r.folder}/${r.slug}: ${p.errors.join("; ")}`); continue; }
    console.log(`\n  • ${r.folder}/${r.slug} → "${r.newName}" (slug ${p.newSlug})`);
    if (r.note) console.log(`      nota: ${r.note}`);
    console.log(`      wikilinks a reescribir: ${p.links} en ${p.files.size} archivos`);
    if (!apply) continue;

    // 1) actualizar frontmatter (nombre + aliases) y mover el archivo
    const e = readEntity(r.folder, r.slug)!;
    const fm: FM = { ...e.fm };
    const aliases = asArr(fm.alias).filter((a) => a.toLowerCase() !== r.newName.toLowerCase());
    if (!aliases.some((a) => a.toLowerCase() === p.oldName.toLowerCase())) aliases.push(p.oldName);
    fm.alias = aliases;
    fm.ultima_actualizacion = new Date().toISOString();
    fm.nombre = r.newName;
    const newPath = path.join(VAULT, r.folder, p.newSlug + ".md");
    fs.writeFileSync(newPath, matter.stringify("\n" + e.body.trim() + "\n", fm), "utf-8");
    if (p.newSlug !== r.slug) fs.rmSync(e.path);
    // 2) reescribir wikilinks (incluye el archivo recién escrito)
    const rule = [{ dupName: p.oldName, dupSlug: r.slug, canonName: r.newName }];
    for (const file of allMdFiles()) {
      const txt = fs.readFileSync(file, "utf-8");
      const { text, count } = rewriteWikilinksInText(txt, rule);
      if (count > 0) fs.writeFileSync(file, text, "utf-8");
    }
    console.log(`      ✅ renombrado y wikilinks reescritos.`);
  }
}

// ════════════════════════════════════════════════════════════════════
//  RELINK — reapunta [[orphan]] → [[canon]] (entidad existente), sin tocar archivos
// ════════════════════════════════════════════════════════════════════
// PASA 5b (triage de huérfanos): variantes/aliases que el resolver no resuelve por slug/nombre.
const RELINKS: { orphan: string; canon: string }[] = [
  { orphan: "Matriarca", canon: "Sina" },
  { orphan: "Reina Cuervo", canon: "Raven Queen" },
  { orphan: "Apolo", canon: "Apolo Iorxan" },
  { orphan: "Guardia del Cáliz", canon: "Demonio del Cáliz" },
  { orphan: "Dragón de Mortoris", canon: "Siólos, la Bruma de Jade" },
  { orphan: "Mapa del sótano", canon: "Mapa de Crenios Van Hart" },
  { orphan: "Atacantes de Breos", canon: "Grupo de Breos" },
  { orphan: "Niña genasi del Barrio Rojo", canon: "Niños del Barrio Rojo" },
  { orphan: "Barrera divina", canon: "Barrera de Solaria" },
  { orphan: "Arañas de la mansión", canon: "Arañas cazadoras venenosas" },
  { orphan: "Evento de subasta", canon: "Evento de té, ventas y subasta" },
  { orphan: "Campo de energía del templo", canon: "Destrucción del campo de energía" },
  { orphan: "Concejales capturados", canon: "Concejales de Metrópolis" },
  { orphan: "Mind flayers", canon: "Mind flayers de la colonia" },
  // CREATE "El grupo": reapuntar [[grupo]] (minúscula) a la ficha nueva.
  // ⚠️ Correr DESPUÉS de `unlink` (que elimina [[Grupo]] mayúscula); rewriteWikilinksInText
  // es case-insensitive, así que sin ese orden tomaría también [[Grupo]].
  { orphan: "grupo", canon: "El grupo" },
  // ── PASA 5d (coherencia): Leira Umbra (gnoma de Myrkul, catedral) NO es la PJ Layra.
  // La ficha canónica es leira-umbra.md; los [[Señorita Umbra]] viejos quedaron huérfanos.
  { orphan: "Señorita Umbra", canon: "Leira Umbra" },
];

function doRelink(apply: boolean) {
  console.log(`\n══════════ RELINK — ${apply ? "APPLY ✍️" : "dry-run 👀"} ══════════`);
  const rules = RELINKS.map((r) => ({ dupName: r.orphan, dupSlug: slugify(r.orphan), canonName: r.canon }));
  let totalLinks = 0;
  const filesTouched = new Map<string, number>();
  for (const file of allMdFiles()) {
    const txt = fs.readFileSync(file, "utf-8");
    const { text, count } = rewriteWikilinksInText(txt, rules);
    if (count > 0) {
      filesTouched.set(rel(file), count);
      totalLinks += count;
      if (apply) fs.writeFileSync(file, text, "utf-8");
    }
  }
  console.log(`  Reglas: ${RELINKS.length}. Ocurrencias reescritas: ${totalLinks} en ${filesTouched.size} archivos.`);
  const top = [...filesTouched].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [f, c] of top) console.log(`    ${c.toString().padStart(3)}  ${f}`);
  if (filesTouched.size > 15) console.log(`    … y ${filesTouched.size - 15} archivos más`);
}

// ════════════════════════════════════════════════════════════════════
//  UNLINK — [[target]] → texto plano (referencias genéricas, no entidades)
// ════════════════════════════════════════════════════════════════════
// Match EXACTO y sensible a mayúsculas: no toca [[grupo]] minúscula ni compuestos ([[Grupo de Mysha]]).
const UNLINKS: string[] = [
  "Grupo", "Araña gigante", "Guardias capturados", "Demonios bajo contrato",
  "Serpiente ilusoria de Mari", "Atacante inconsciente", "usuarios de magia espiritual",
  "humanidad", "Wyvern", "Estatuas del bosque", "Objetos confiscados del Emperador",
  "Hada cautiva", "Aliados de Feywild", "Historia antigua",
];

function stripWikilinks(text: string, targets: Set<string>): { text: string; count: number } {
  let count = 0;
  const out = text.replace(/\[\[([^\]]+)\]\]/g, (full, inner: string) => {
    const pipe = inner.indexOf("|");
    const target = (pipe === -1 ? inner : inner.slice(0, pipe)).trim();
    const label = pipe === -1 ? null : inner.slice(pipe + 1);
    if (targets.has(target)) { count++; return label === null ? target : label; }
    return full;
  });
  return { text: out, count };
}

function doUnlink(apply: boolean) {
  console.log(`\n══════════ UNLINK — ${apply ? "APPLY ✍️" : "dry-run 👀"} ══════════`);
  const set = new Set(UNLINKS);
  let totalLinks = 0;
  const filesTouched = new Map<string, number>();
  for (const file of allMdFiles()) {
    const txt = fs.readFileSync(file, "utf-8");
    const { text, count } = stripWikilinks(txt, set);
    if (count > 0) {
      filesTouched.set(rel(file), count);
      totalLinks += count;
      if (apply) fs.writeFileSync(file, text, "utf-8");
    }
  }
  console.log(`  Targets: ${UNLINKS.length}. Ocurrencias deslinkeadas: ${totalLinks} en ${filesTouched.size} archivos.`);
  const top = [...filesTouched].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [f, c] of top) console.log(`    ${c.toString().padStart(3)}  ${f}`);
  if (filesTouched.size > 15) console.log(`    … y ${filesTouched.size - 15} archivos más`);
}

// ════════════════════════════════════════════════════════════════════
//  VERIFY — wikilinks huérfanos + mojibake residual (replica el resolver real)
// ════════════════════════════════════════════════════════════════════
function verify() {
  // Índice de destinos resolubles: slugs y nombres de entidades + episodios.
  const slugs = new Set<string>();
  const names = new Set<string>();
  for (const folder of ENTITY_FOLDERS) {
    for (const file of listMd(folder)) {
      const base = path.basename(file, ".md");
      slugs.add(base);
      const { data } = matter(fs.readFileSync(file, "utf-8"));
      const nombre = (data as FM).nombre;
      if (typeof nombre === "string") names.add(nombre.toLowerCase());
    }
  }
  const epNums = new Set<number>();
  for (const file of listMd("episodios")) {
    const m = path.basename(file).match(/^(\d{1,3})/);
    if (m) epNums.add(parseInt(m[1], 10));
  }

  const resolves = (target: string): boolean => {
    const raw = target.replace(/^([^|]+)\|.+$/, "$1").trim();
    const epM = raw.match(/^(\d{1,3})\b/);
    if (epM && /^\d{1,3}(-|$)/.test(raw)) return epNums.has(parseInt(epM[1], 10));
    return slugs.has(raw) || slugs.has(slugify(raw)) || names.has(raw.toLowerCase());
  };

  let total = 0;
  const orphans = new Map<string, Set<string>>(); // target -> archivos
  let mojibakeFiles = 0;
  for (const file of allMdFiles()) {
    const txt = fs.readFileSync(file, "utf-8");
    if (residualMojibake(txt) > 0 || txt.includes("�")) mojibakeFiles++;
    for (const m of txt.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const target = m[1].split("|")[0].trim();
      total++;
      if (!resolves(target)) {
        if (!orphans.has(target)) orphans.set(target, new Set());
        orphans.get(target)!.add(rel(file));
      }
    }
  }

  console.log("\n══════════ VERIFY ══════════");
  console.log(`Wikilinks totales: ${total}`);
  console.log(`Wikilinks huérfanos (target no resuelve): ${[...orphans.values()].reduce((a, s) => a + s.size, 0)} en ${orphans.size} targets distintos`);
  console.log(`Archivos con mojibake residual: ${mojibakeFiles}`);
  if (orphans.size) {
    console.log("\n  ── Targets huérfanos (todos) ──");
    for (const [t, files] of [...orphans].sort((a, b) => b[1].size - a[1].size)) console.log(`    [[${t}]] — ${files.size}× (ej. ${[...files][0]})`);
  }
}

function main() {
  console.log(`vault-fix · ${APPLY ? "APPLY ✍️" : "DRY-RUN 👀"} · ${VAULT}`);
  if (CMD === "mojibake" || CMD === "all") {
    const r = analyzeMojibake();
    reportMojibake(r);
    if (APPLY && CMD === "mojibake") applyMojibake(r);
  }
  if (CMD === "merge" || CMD === "all") {
    const plans = MERGES.map(planMerge);
    reportMerge(plans);
    if (APPLY && CMD === "merge") applyMerge(plans);
  }
  if (CMD === "rename") doRenames(APPLY);
  if (CMD === "relink") doRelink(APPLY);
  if (CMD === "unlink") doUnlink(APPLY);
  if (CMD === "verify") verify();
  if (!["mojibake", "merge", "all", "verify", "rename", "relink", "unlink"].includes(CMD ?? "")) {
    console.log("\nComando: mojibake | merge | all | verify | rename | relink | unlink   (+ --apply para escribir)");
  }
  if (APPLY && CMD === "all") console.log("\n⚠️ --apply con 'all' no escribe; corré cada comando por separado para aplicar.");
}
main();
