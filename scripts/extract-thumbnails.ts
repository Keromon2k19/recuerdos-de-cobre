#!/usr/bin/env node
/**
 * Recuerdos de Cobre — Extractor de miniaturas de YouTube.
 *
 * Lee vault-recuerdos-de-cobre/_playlist.json y baja la miniatura de cada
 * episodio a public/images/episodios/epNN.jpg.
 *
 * Estrategia de calidad: probamos en orden maxresdefault → sddefault →
 * hqdefault. YouTube responde 404 en maxresdefault para algunos videos
 * viejos / privados de baja resolución, por eso el fallback.
 *
 * Uso:
 *   npx tsx scripts/extract-thumbnails.ts            # todos los del playlist
 *   npx tsx scripts/extract-thumbnails.ts 1 5 12     # solo esos números
 *   FORCE=1 npx tsx scripts/extract-thumbnails.ts    # re-descarga aunque exista
 */

import fs from "node:fs";
import path from "node:path";

type PlaylistItem = {
  numero: number;
  titulo: string;
  videoId: string;
  url: string;
  publicado_en: string;
};

type Playlist = {
  playlist_id: string;
  sincronizado_en: string;
  items: PlaylistItem[];
};

const QUALITIES = ["maxresdefault", "sddefault", "hqdefault"] as const;

async function downloadThumbnail(
  videoId: string,
  destPath: string
): Promise<{ quality: string; bytes: number } | null> {
  for (const quality of QUALITIES) {
    const url = `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
    const res = await fetch(url);
    if (!res.ok) continue;

    // YouTube devuelve 200 con una imagen "no disponible" de 120x90 cuando
    // el thumb pedido no existe. La detectamos por tamaño: el placeholder
    // pesa ~1.5KB, las miniaturas reales >10KB.
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) continue;

    fs.writeFileSync(destPath, buf);
    return { quality, bytes: buf.length };
  }
  return null;
}

async function main() {
  const vaultPath = path.resolve(
    process.env.VAULT_PATH || "vault-recuerdos-de-cobre"
  );
  const playlistPath = path.join(vaultPath, "_playlist.json");
  if (!fs.existsSync(playlistPath)) {
    console.error(`No se encontró ${playlistPath}`);
    process.exit(1);
  }

  const playlist = JSON.parse(
    fs.readFileSync(playlistPath, "utf-8")
  ) as Playlist;

  const outDir = path.join(process.cwd(), "public", "images", "episodios");
  fs.mkdirSync(outDir, { recursive: true });

  const filter = process.argv.slice(2).map((s) => parseInt(s, 10));
  const items =
    filter.length > 0
      ? playlist.items.filter((i) => filter.includes(i.numero))
      : playlist.items;

  const force = process.env.FORCE === "1";

  console.log(`\n🖼️  Miniaturas — ${items.length} episodios → ${outDir}\n`);

  let ok = 0;
  let skipped = 0;
  let failed: number[] = [];

  for (const item of items) {
    const padded = String(item.numero).padStart(2, "0");
    const destPath = path.join(outDir, `ep${padded}.jpg`);

    // Videos eliminados o privados llegan con titulo "Deleted video" / "Private
    // video" desde la API de YouTube. No tienen miniatura disponible: los
    // marcamos como skip en vez de fallo para no ensuciar el exit code.
    if (/^(deleted|private) video$/i.test(item.titulo)) {
      console.log(`   ⏭️  ep${padded} — ${item.titulo} (sin miniatura)`);
      skipped++;
      continue;
    }

    if (!force && fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      console.log(`   ⏭️  ep${padded} ya existe — skip`);
      skipped++;
      continue;
    }

    try {
      const result = await downloadThumbnail(item.videoId, destPath);
      if (!result) {
        console.log(`   ❌ ep${padded} (${item.videoId}) — sin miniatura usable`);
        failed.push(item.numero);
        continue;
      }
      const kb = (result.bytes / 1024).toFixed(0);
      console.log(
        `   ✅ ep${padded} ${result.quality.padEnd(14)} ${kb.padStart(4)} KB`
      );
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`   ❌ ep${padded} — ${msg}`);
      failed.push(item.numero);
    }
  }

  console.log(
    `\n📊 ${ok} descargados · ${skipped} ya existían · ${failed.length} fallaron`
  );
  if (failed.length > 0) {
    console.log(`   Fallaron: ${failed.join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fallo inesperado:", err);
  process.exit(1);
});
