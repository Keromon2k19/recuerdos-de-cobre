#!/usr/bin/env node
/**
 * Construye el índice de búsqueda semántica del vault.
 *
 * Recorre todas las entidades (.md) + episodios, embebe cada una con
 * Gemini text-embedding-004 (free tier) y guarda vault-mysha/_search-index.json.
 *
 * Uso:
 *   npx tsx scripts/build-search-index.ts
 *   npx tsx scripts/build-search-index.ts --only personaje   (un solo tipo)
 *
 * Idempotente: re-embebe todo. ~150 entidades = ~150 requests (free tier
 * aguanta 1500/día). Toma ~1-2 min.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { embedText, type SearchIndex, type SearchIndexEntry } from "../lib/embeddings";
import { ENTITY_FOLDERS, type EntityType } from "../lib/types";

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

function plainText(md: string, maxLen = 1200): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{2,}/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Free tier embeddings: 100 req/min. 700ms entre requests = ~85/min (margen).
const RATE_LIMIT_MS = 700;

/** Embebe con retry-backoff si pega contra el quota (429). */
async function embedWithRetry(
  apiKey: string,
  text: string
): Promise<number[]> {
  let attempt = 0;
  while (true) {
    try {
      return await embedText(apiKey, text, "RETRIEVAL_DOCUMENT");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isQuota = msg.includes("Quota exceeded") || msg.includes("429");
      if (!isQuota || attempt >= 5) throw err;
      attempt++;
      const m = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
      const waitMs = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1000 : attempt * 15000;
      process.stdout.write(`\r  ⏳ quota — esperando ${Math.round(waitMs / 1000)}s...        `);
      await sleep(waitMs);
    }
  }
}

async function main() {
  const onlyArg = process.argv.indexOf("--only");
  const onlyTipo =
    onlyArg >= 0 ? (process.argv[onlyArg + 1] as EntityType) : null;

  const env = { ...process.env, ...loadEnv() };
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY no está en .env.local");
    process.exit(1);
  }
  const vaultPath = path.resolve(env.VAULT_PATH || "vault-mysha");
  if (!fs.existsSync(vaultPath)) {
    console.error(`Error: VAULT_PATH no existe: ${vaultPath}`);
    process.exit(1);
  }

  const indexPath = path.join(vaultPath, "_search-index.json");

  // Reutilizar embeddings previos si el snippet no cambió (ahorra requests)
  let prev: SearchIndex | null = null;
  try {
    prev = JSON.parse(fs.readFileSync(indexPath, "utf-8")) as SearchIndex;
  } catch {
    prev = null;
  }
  const prevByKey = new Map<string, SearchIndexEntry>();
  if (prev) {
    for (const e of prev.entries) prevByKey.set(`${e.tipo}/${e.slug}`, e);
  }

  const tipos = onlyTipo
    ? [onlyTipo]
    : (Object.keys(ENTITY_FOLDERS) as EntityType[]);

  const entries: SearchIndexEntry[] = [];
  let embedded = 0;
  let reused = 0;

  // Entidades
  for (const tipo of tipos) {
    const dir = path.join(vaultPath, ENTITY_FOLDERS[tipo]);
    let files: string[];
    try {
      files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    } catch {
      continue;
    }
    for (const filename of files) {
      const slug = filename.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(dir, filename), "utf-8");
      const { data: fm, content } = matter(raw);
      const nombre = (fm.nombre as string) ?? slug;
      const alias = (fm.alias as string[]) ?? [];
      const snippet = plainText(content);
      const indexedText = `${nombre}. ${alias.join(", ")}. ${snippet}`;
      const key = `${tipo}/${slug}`;

      const prevEntry = prevByKey.get(key);
      if (prevEntry && prevEntry.snippet === snippet && prevEntry.nombre === nombre) {
        entries.push(prevEntry);
        reused++;
        continue;
      }

      try {
        const embedding = await embedWithRetry(apiKey, indexedText);
        entries.push({ tipo, slug, nombre, alias, snippet, embedding });
        embedded++;
        process.stdout.write(`\r  embebidas: ${embedded}  reusadas: ${reused}        `);
        await sleep(RATE_LIMIT_MS);
      } catch (err) {
        console.error(
          `\n  ⚠ fallo embebiendo ${key}: ${err instanceof Error ? err.message : err}`
        );
      }
    }
  }

  const index: SearchIndex = {
    model: "gemini-embedding-001",
    built_at: new Date().toISOString(),
    entries,
  };
  const tmp = indexPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(index), "utf-8");
  fs.renameSync(tmp, indexPath);

  console.log(
    `\n\n✅ Índice construido: ${entries.length} entradas (${embedded} nuevas, ${reused} reusadas)`
  );
  console.log(`   → ${indexPath}`);
}

main().catch((err) => {
  console.error("\n❌ Error fatal:", err);
  process.exit(1);
});
