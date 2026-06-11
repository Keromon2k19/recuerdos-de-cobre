// scripts/foundry-stats.ts
// I/O: lee exports crudos de foundry-export/<slug>.json y genera
// data/atlas/tdmn-stats.ts. El slug es el nombre del archivo (sin .json).
// Re-correr cuando cambie una hoja: `npx tsx scripts/foundry-stats.ts`.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { parseFoundryActor, type MemberStats } from "../lib/foundry-stats";

const SRC = "foundry-export";
const OUT = "data/atlas/tdmn-stats.ts";

if (!existsSync(SRC)) {
  console.error(`No existe la carpeta ${SRC}/. Creala y dejá ahí los exports (un <slug>.json por PJ).`);
  process.exit(1);
}

const files = readdirSync(SRC).filter((f) => f.toLowerCase().endsWith(".json")).sort();
const stats: Record<string, MemberStats> = {};
for (const f of files) {
  const slug = basename(f, extname(f));
  const actor = JSON.parse(readFileSync(join(SRC, f), "utf8"));
  stats[slug] = parseFoundryActor(actor);
  console.log(`  ✓ ${slug}: ${stats[slug].clase} · Nivel ${stats[slug].nivel}`);
}

const out =
  `// GENERADO por scripts/foundry-stats.ts — NO editar a mano.\n` +
  `// Fuente: exports de Foundry en foundry-export/ (gitignored).\n` +
  `import type { MemberStats } from "@/lib/foundry-stats";\n\n` +
  `export const TDMN_STATS: Record<string, MemberStats> = ${JSON.stringify(stats, null, 2)};\n`;

writeFileSync(OUT, out);
console.log(`\ntdmn-stats: ${files.length} actor(es) → ${OUT}`);
