#!/usr/bin/env node
/**
 * Recuerdos de Cobre - Indice de busqueda lite (sin embeddings).
 *
 * Lee vault-recuerdos-de-cobre/_search-index.json (el full, con vectores
 * de 3072 dims, ~5MB) y escribe public/search-index.json sin el campo
 * `embedding`. Resultado: ~50KB, cacheable por el browser, consumible por
 * el SearchPalette para hacer substring en el cliente (cero roundtrip).
 *
 * No re-embebe: deriva del indice ya construido. Se puede usar standalone
 * o encadenado: build-search-index.ts llama a buildLiteIndex() al terminar.
 *
 * Uso standalone:
 *   npx tsx scripts/build-lite-index.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SearchIndex } from "../lib/embeddings";

function loadEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/**
 * Deriva public/search-index.json desde el indice full de `vaultPath`.
 * Devuelve un resumen para loguear; lanza si el full no existe.
 */
export function buildLiteIndex(vaultPath: string): {
  entries: number;
  liteKB: number;
  fullKB: number;
  outPath: string;
} {
  const fullPath = path.join(vaultPath, "_search-index.json");
  if (!fs.existsSync(fullPath)) {
    throw new Error(
      `No existe ${fullPath}. Corre antes: npx tsx scripts/build-search-index.ts`
    );
  }

  const raw = fs.readFileSync(fullPath, "utf-8");
  const full = JSON.parse(raw) as SearchIndex;

  const lite = {
    built_at: full.built_at,
    entries: full.entries.map((e) => ({
      tipo: e.tipo,
      slug: e.slug,
      nombre: e.nombre,
      alias: e.alias,
      snippet: e.snippet,
    })),
  };

  const serialized = JSON.stringify(lite);
  const outPath = path.join(process.cwd(), "public", "search-index.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, serialized, "utf-8");

  return {
    entries: lite.entries.length,
    liteKB: Math.round(Buffer.byteLength(serialized) / 1024),
    fullKB: Math.round(Buffer.byteLength(raw) / 1024),
    outPath,
  };
}

function main() {
  const env = { ...process.env, ...loadEnv() };
  const vaultPath = path.resolve(env.VAULT_PATH || "vault-recuerdos-de-cobre");
  try {
    const r = buildLiteIndex(vaultPath);
    console.log(
      `lite: ${r.entries} entradas - ${r.liteKB} KB (full: ${r.fullKB} KB) -> ${r.outPath}`
    );
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

// Solo corre main() si se invoca directo, no cuando build-search-index lo importa.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
