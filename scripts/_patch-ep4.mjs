import fs from "node:fs";
import path from "node:path";

const jobPath = path.resolve("vault-recuerdos-de-cobre/_jobs/004.json");
const resumenPath = path.resolve("output/ep04.resumen.md");

const job = JSON.parse(fs.readFileSync(jobPath, "utf-8"));
const resumen = fs.readFileSync(resumenPath, "utf-8").trim();

job.estado = "done";
job.etapa_actual = "Listo. Resumen disponible para cargar al formulario.";
job.actualizado_en = new Date().toISOString();
job.auto_commit = false;
job.resumen = resumen;
delete job.error;
delete job.pid;

fs.writeFileSync(jobPath, JSON.stringify(job, null, 2) + "\n", "utf-8");
console.log("OK 004.json -> estado:", job.estado, "| resumen:", resumen.length, "chars");
