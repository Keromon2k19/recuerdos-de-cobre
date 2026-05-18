#!/usr/bin/env node
/**
 * Extrae lore (Gemini) del resumen ya inyectado en un job y lo commitea al
 * vault. Reemplaza limpio si el episodio ya estaba (commitEpisode es idempotente).
 *
 * Uso: npx tsx scripts/extract-commit.ts <numero>
 *
 * Precondición: vault-mysha/_jobs/<numero>.json debe existir y tener `resumen`.
 */

import fs from "node:fs";
import path from "node:path";

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

type Job = {
  numero: number;
  titulo: string;
  publicado_en?: string;
  estado: string;
  etapa_actual: string;
  resumen?: string;
  committed_entities?: number;
  actualizado_en: string;
  [k: string]: unknown;
};

function jobFile(vaultPath: string, numero: number): string {
  return path.join(vaultPath, "_jobs", `${String(numero).padStart(3, "0")}.json`);
}
function readJob(vaultPath: string, numero: number): Job {
  return JSON.parse(fs.readFileSync(jobFile(vaultPath, numero), "utf-8")) as Job;
}
function writeJob(vaultPath: string, job: Job): void {
  job.actualizado_en = new Date().toISOString();
  fs.writeFileSync(jobFile(vaultPath, job.numero), JSON.stringify(job, null, 2), "utf-8");
}

async function main() {
  const numero = parseInt(process.argv[2] ?? "", 10);
  if (!Number.isFinite(numero)) {
    console.error("Uso: npx tsx scripts/extract-commit.ts <numero>");
    process.exit(1);
  }

  const env = { ...process.env, ...loadEnv() } as Record<string, string>;
  const vaultPath = path.resolve(env.VAULT_PATH || "vault-mysha");
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no está en .env.local");

  const job = readJob(vaultPath, numero);
  if (!job.resumen?.trim()) {
    throw new Error(`Job ${numero} no tiene resumen inyectado todavía`);
  }

  writeJob(vaultPath, {
    ...job,
    estado: "extracting",
    etapa_actual: "Extrayendo lore con Gemini...",
  });

  const { extractLoreWithGemini, retryExtractLoreWithGemini } = await import(
    "../lib/gemini"
  );
  let extraido;
  try {
    extraido = await extractLoreWithGemini(apiKey, job.resumen, numero, job.titulo);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("no pasó validación")) {
      extraido = await retryExtractLoreWithGemini(
        apiKey,
        job.resumen,
        numero,
        msg,
        job.titulo
      );
    } else {
      writeJob(vaultPath, {
        ...readJob(vaultPath, numero),
        estado: "error",
        etapa_actual: "Error en extracción",
        error: msg,
      });
      throw err;
    }
  }

  writeJob(vaultPath, {
    ...readJob(vaultPath, numero),
    estado: "committing",
    etapa_actual: "Guardando entidades en el vault...",
  });

  const { commitEpisode } = await import("../lib/commit");
  const result = await commitEpisode({
    vaultPath,
    numero,
    titulo: job.titulo,
    resumen: job.resumen,
    extraido,
    fechaGrabacion: job.publicado_en,
  });

  writeJob(vaultPath, {
    ...readJob(vaultPath, numero),
    estado: "done",
    etapa_actual: `Listo. ${result.filesWritten} entidades en el vault.`,
    committed_entities: result.filesWritten,
  });

  console.log(`✅ ep${numero}: ${result.filesWritten} archivos en el vault`);
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
