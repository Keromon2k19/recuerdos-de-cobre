#!/usr/bin/env node
/**
 * Valida la extracción con Ollama LOCAL de forma NO destructiva: lee un
 * resumen ya curado de output/epNN.resumen.md, corre extractLoreWithOllama
 * y reporta conteos + latencia. No escribe en el vault ni necesita job.
 *
 * Uso: npx tsx scripts/try-ollama.ts [numero]   (default 12)
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

async function main(): Promise<void> {
  loadEnv(); // setear OLLAMA_MODEL/HOST ANTES de importar lib/ollama
  const numero = parseInt(process.argv[2] ?? "12", 10);
  const file = [
    `ep${numero}.resumen.md`,
    `ep${String(numero).padStart(2, "0")}.resumen.md`,
  ]
    .map((n) => path.join(process.cwd(), "output", n))
    .find((p) => fs.existsSync(p));
  if (!file) {
    throw new Error(`No existe output/ep${numero}.resumen.md (probé con y sin padding)`);
  }
  const resumen = fs.readFileSync(file, "utf-8");

  const { extractLoreWithOllama, retryExtractLoreWithOllama, ollamaReachable } =
    await import("../lib/ollama");

  console.log("Modelo :", process.env.OLLAMA_MODEL || "llama3.1 (default)");
  console.log("Host   :", process.env.OLLAMA_HOST || "http://localhost:11434");
  const reach = await ollamaReachable();
  console.log("Alcanzable:", reach);
  if (!reach) throw new Error("Ollama no responde en el host configurado");

  const t0 = Date.now();
  let data;
  try {
    data = await extractLoreWithOllama(resumen, numero, `Episodio ${numero}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Primer intento falló:", msg);
    if (msg.includes("no pasó validación")) {
      console.log("Reintentando determinista (temp 0)…");
      data = await retryExtractLoreWithOllama(
        resumen,
        numero,
        msg,
        `Episodio ${numero}`
      );
    } else {
      throw err;
    }
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const counts = {
    personajes: data.personajes.length,
    lugares: data.lugares.length,
    eventos: data.eventos.length,
    objetos: data.objetos.length,
    facciones: data.facciones.length,
    worldbuilding: data.worldbuilding.length,
    relaciones: data.relaciones.length,
    misterios: data.misterios.length,
    quotes: data.quotes.length,
    decisiones: data.decisiones.length,
  };
  console.log(`\n✅ Extracción OK en ${secs}s — Zod validó el output.`);
  console.table(counts);
  console.log("\nLugares (nombre — descripción de ESTE episodio):");
  for (const l of data.lugares) console.log(`  • ${l.nombre} — ${l.descripcion}`);
  console.log("\nPersonajes (primeros 5, nombre — descripción):");
  for (const p of data.personajes.slice(0, 5))
    console.log(`  • ${p.nombre} — ${p.descripcion}`);
  console.log("\nRelaciones (muestra):", data.relaciones.slice(0, 3));
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
