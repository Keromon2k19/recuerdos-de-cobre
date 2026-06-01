#!/usr/bin/env node
/**
 * Recuerdos de Cobre — Backfill del campo `image` en frontmatter de episodios.
 *
 * Recorre vault-recuerdos-de-cobre/episodios/*.md. Para cada episodio cuyo
 * número tenga una miniatura en public/images/episodios/epNN.jpg, inyecta
 * (o reemplaza) `image: /images/episodios/epNN.jpg` en el frontmatter.
 *
 * Idempotente: si el campo ya apunta al mismo path, no toca el archivo.
 *
 * Uso:
 *   npx tsx scripts/backfill-episode-images.ts
 *   FORCE=1 npx tsx scripts/backfill-episode-images.ts   # re-escribe aunque no haya cambio
 *   DRY=1 npx tsx scripts/backfill-episode-images.ts     # solo muestra qué haría
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const VAULT_PATH = path.resolve(
  process.env.VAULT_PATH || "vault-recuerdos-de-cobre"
);
const EP_DIR = path.join(VAULT_PATH, "episodios");
const IMG_DIR = path.join(process.cwd(), "public", "images", "episodios");

const DRY = process.env.DRY === "1";
const FORCE = process.env.FORCE === "1";

function thumbPathFor(numero: number): string | null {
  const padded = String(numero).padStart(2, "0");
  const abs = path.join(IMG_DIR, `ep${padded}.jpg`);
  if (!fs.existsSync(abs)) return null;
  return `/images/episodios/ep${padded}.jpg`;
}

function numeroFromFilename(fileName: string): number | null {
  // Convención: NNN-<slug>.md (zero-padded a 3 dígitos).
  const m = fileName.match(/^(\d{3})-/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function main() {
  if (!fs.existsSync(EP_DIR)) {
    console.error(`No se encontró ${EP_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(EP_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  console.log(
    `\n🖼️  Backfill de image: en ${files.length} episodios · vault: ${VAULT_PATH}` +
      (DRY ? "  [DRY-RUN]" : "")
  );
  console.log();

  let updated = 0;
  let already = 0;
  let noThumb = 0;
  let skippedNoNumero = 0;

  for (const fileName of files) {
    const numero = numeroFromFilename(fileName);
    if (numero === null) {
      console.log(`   ⚠️  ${fileName} — no pude extraer número, skip`);
      skippedNoNumero++;
      continue;
    }
    const padded = String(numero).padStart(2, "0");
    const want = thumbPathFor(numero);
    if (!want) {
      console.log(`   ⏭️  ep${padded} — sin miniatura en public/`);
      noThumb++;
      continue;
    }

    const filePath = path.join(EP_DIR, fileName);
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = matter(raw);
    const current =
      typeof parsed.data.image === "string" ? parsed.data.image : undefined;

    if (current === want && !FORCE) {
      already++;
      continue;
    }

    parsed.data.image = want;
    const out = matter.stringify(parsed.content, parsed.data);

    if (DRY) {
      console.log(
        `   📝 ep${padded} — ${current ? `image: ${current} → ${want}` : `+ image: ${want}`}`
      );
    } else {
      fs.writeFileSync(filePath, out, "utf-8");
      console.log(
        `   ✅ ep${padded} — ${current ? `image: ${current} → ${want}` : `+ image: ${want}`}`
      );
    }
    updated++;
  }

  console.log(
    `\n📊 ${updated} actualizados · ${already} ya estaban · ${noThumb} sin miniatura · ${skippedNoNumero} sin numero`
  );
  if (DRY) console.log("   (dry-run: no se escribió nada)");
}

main();
