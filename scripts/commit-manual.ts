#!/usr/bin/env node
/**
 * Commitea al vault una extracción HECHA A MANO por Claude/Codex (sin LLM).
 * Lee output/epNN.resumen.md y output/epNN.extraccion.json (ExtractionResult
 * que escribí yo), valida con Zod, fuerza el episodio y commitea
 * (commitEpisode es idempotente). El resumen también lo hago yo a mano
 * siguiendo PROMPT_RESUMEN.md.
 *
 * Uso: npx tsx scripts/commit-manual.ts <numero> "<titulo>" [fechaISO]
 */
import fs from "node:fs";
import path from "node:path";

function loadEnv(): void {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

function pick(numero: number, ext: string): string {
  const pad2 = String(numero).padStart(2, "0");
  const p = [`ep${numero}.${ext}`, `ep${pad2}.${ext}`]
    .map((f) => path.join(process.cwd(), "output", f))
    .find((x) => fs.existsSync(x));
  if (!p) throw new Error(`Falta output/ep${pad2}.${ext}`);
  return p;
}

async function main(): Promise<void> {
  loadEnv();
  const numero = parseInt(process.argv[2] ?? "", 10);
  const titulo = process.argv[3] ?? "";
  const fecha = process.argv[4];
  if (!Number.isFinite(numero) || !titulo) {
    console.error('Uso: npx tsx scripts/commit-manual.ts <numero> "<titulo>" [fechaISO]');
    process.exit(1);
  }

  const resumen = fs.readFileSync(pick(numero, "resumen.md"), "utf-8");
  const raw = JSON.parse(fs.readFileSync(pick(numero, "extraccion.json"), "utf-8"));

  const { ExtractionResultSchema, normalizeExtraction } = await import(
    "../lib/schema"
  );
  const parsed = ExtractionResultSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("❌ La extracción no pasó Zod:\n" + parsed.error.message);
    process.exit(1);
  }
  const extraido = normalizeExtraction(parsed.data, numero);

  const vaultPath = path.resolve(process.env.VAULT_PATH || "vault-recuerdos-de-cobre");
  const { commitEpisode } = await import("../lib/commit");
  const { readJob, writeJob } = await import("../lib/vault");
  const r = await commitEpisode({
    vaultPath,
    numero,
    titulo,
    resumen,
    extraido,
    fechaGrabacion: fecha,
  });

  const job = await readJob(vaultPath, numero);
  if (job) {
    await writeJob(vaultPath, { ...job, estado: "done", etapa_actual: "Commiteado al vault" });
  }

  console.log(`✅ ep${numero} "${titulo}" → ${r.filesWritten} archivos en ${vaultPath}`);
  console.log(
    `   personajes ${extraido.personajes.length} · lugares ${extraido.lugares.length} · ` +
      `eventos ${extraido.eventos.length} · objetos ${extraido.objetos.length} · ` +
      `facciones ${extraido.facciones.length} · world ${extraido.worldbuilding.length} · ` +
      `rel ${extraido.relaciones.length} · misterios ${extraido.misterios.length} · ` +
      `quotes ${extraido.quotes.length} · decisiones ${extraido.decisiones.length}`
  );
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
