"use server";

// app/actions/commit.ts — Server action: episodio revisado → vault.
// Delega a lib/commit (lógica pura, compartida con el script de cola).

import { loadConfig } from "@/lib/config";
import { commitEpisode } from "@/lib/commit";
import { readJob, writeJob } from "@/lib/vault";
import type { ExtractionResult } from "@/lib/types";

export type CommitResult =
  | { success: true; filesWritten: number }
  | { success: false; error: string };

export async function commitEpisodeAction(
  numero: number,
  titulo: string,
  resumen: string,
  extraido: ExtractionResult,
  fechaGrabacion?: string
): Promise<CommitResult> {
  try {
    const config = loadConfig();
    const result = await commitEpisode({
      vaultPath: config.vaultPath,
      numero,
      titulo,
      resumen,
      extraido,
      fechaGrabacion,
    });
    const job = await readJob(config.vaultPath, numero);
    if (job) {
      await writeJob(config.vaultPath, { ...job, estado: "done", etapa_actual: "Commiteado al vault" });
    }
    return { success: true, filesWritten: result.filesWritten };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
