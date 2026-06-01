// Convierte todas las imagenes de public/Lugares - planos/ a webp.
// Sin flags: convierte + verifica + reporta. NO borra originales.
// Con --delete: tambien borra originales si todas las verificaciones pasaron.

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/Lugares - planos");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".jfif", ".avif"]);
const QUALITY = 85;
const EFFORT = 4;
const CONCURRENCY = 4;
const DELETE_ORIGINALS = process.argv.includes("--delete");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function classify(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".webp") return "skip-already-webp";
  if (ext === ".lnk") return "skip-shortcut";
  if (IMAGE_EXTS.has(ext)) return "convert";
  return "skip-unknown";
}

async function convertOne(input) {
  const webpPath = input.replace(/\.[^.]+$/, ".webp");

  // Conflicto: ya existe un .webp con ese nombre base (poco probable pero posible).
  try {
    await fs.access(webpPath);
    if (path.extname(input).toLowerCase() !== ".webp") {
      throw new Error(`Ya existe ${path.basename(webpPath)} — colision de nombres`);
    }
  } catch (e) {
    if (e.code !== "ENOENT" && !e.message.startsWith("Ya existe")) throw e;
    if (e.message?.startsWith("Ya existe")) throw e;
  }

  const origMeta = await sharp(input).metadata();
  await sharp(input)
    .webp({ quality: QUALITY, effort: EFFORT })
    .toFile(webpPath);

  // Verificacion: el .webp escrito se puede releer y tiene mismas dimensiones.
  const newMeta = await sharp(webpPath).metadata();
  const origStat = await fs.stat(input);
  const newStat = await fs.stat(webpPath);

  if (newMeta.width !== origMeta.width || newMeta.height !== origMeta.height) {
    throw new Error(
      `Dimensiones distintas: orig ${origMeta.width}x${origMeta.height} vs webp ${newMeta.width}x${newMeta.height}`
    );
  }
  if (newStat.size === 0) {
    throw new Error("Webp escrito de 0 bytes");
  }

  return {
    input,
    webpPath,
    origSize: origStat.size,
    newSize: newStat.size,
    width: origMeta.width,
    height: origMeta.height,
  };
}

async function withConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      const item = items[idx];
      try {
        results[idx] = { ok: true, ...(await fn(item)) };
        process.stdout.write(".");
      } catch (e) {
        results[idx] = { ok: false, input: item, error: e.message };
        process.stdout.write("X");
      }
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");
  return results;
}

function fmtMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function rel(p) {
  return path.relative(ROOT, p);
}

// ---- Main ----

const allFiles = await walk(ROOT);
const groups = {
  convert: [],
  "skip-already-webp": [],
  "skip-shortcut": [],
  "skip-unknown": [],
};
for (const f of allFiles) groups[classify(f)].push(f);

console.log(`Archivos totales en ${path.relative(process.cwd(), ROOT)}: ${allFiles.length}`);
console.log(`  A convertir:     ${groups.convert.length}`);
console.log(`  Ya son webp:     ${groups["skip-already-webp"].length}`);
console.log(`  Shortcuts .lnk:  ${groups["skip-shortcut"].length}`);
console.log(`  Desconocidos:    ${groups["skip-unknown"].length}`);
if (groups["skip-unknown"].length) {
  console.log("\n  Extensiones desconocidas (no se tocan):");
  for (const f of groups["skip-unknown"]) console.log("    " + rel(f));
}
console.log("");

if (groups.convert.length === 0) {
  console.log("Nada que convertir. Listo.");
  process.exit(0);
}

console.log(`Convirtiendo (calidad ${QUALITY}, effort ${EFFORT}, concurrencia ${CONCURRENCY})...`);
const t0 = Date.now();
const results = await withConcurrency(groups.convert, CONCURRENCY, convertOne);
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

const successes = results.filter((r) => r.ok);
const failures = results.filter((r) => !r.ok);

const origTotal = successes.reduce((s, r) => s + r.origSize, 0);
const newTotal = successes.reduce((s, r) => s + r.newSize, 0);
const savedTotal = origTotal - newTotal;
const savedPct = origTotal ? ((savedTotal / origTotal) * 100).toFixed(1) : "0";

console.log("");
console.log(`Convertidos OK: ${successes.length}/${groups.convert.length} en ${elapsed}s`);
console.log(`Originales:     ${fmtMB(origTotal)}`);
console.log(`Webp:           ${fmtMB(newTotal)}`);
console.log(`Ahorro:         ${fmtMB(savedTotal)} (${savedPct}% menos)`);

// Mostrar los 5 mas grandes para que se vea que la calidad esta bien.
const top = [...successes].sort((a, b) => b.origSize - a.origSize).slice(0, 5);
console.log("\nTop 5 mas pesados (orig -> webp):");
for (const r of top) {
  const pct = ((r.newSize / r.origSize) * 100).toFixed(0);
  console.log(`  ${rel(r.input)}: ${fmtMB(r.origSize)} -> ${fmtMB(r.newSize)} (${pct}%)`);
}

if (failures.length > 0) {
  console.log(`\nFALLAS (${failures.length}) — NO se borra nada:`);
  for (const f of failures) {
    console.log(`  ${rel(f.input)} -> ${f.error}`);
  }
  process.exit(1);
}

if (!DELETE_ORIGINALS) {
  console.log("\nVerificacion OK. Originales NO borrados.");
  console.log("Para borrarlos correr:");
  console.log("  node scripts/convert-lugares-to-webp.mjs --delete");
  process.exit(0);
}

console.log("\nBorrando originales...");
let deleted = 0;
for (const r of successes) {
  await fs.unlink(r.input);
  deleted++;
}
console.log(`Borrados: ${deleted} archivos originales.`);
console.log("Listo.");
