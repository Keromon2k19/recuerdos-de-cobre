import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { commitEpisode } from "@/lib/commit";
import type { ExtractionResult } from "@/lib/types";

const emptyExtraction: ExtractionResult = {
  personajes: [],
  lugares: [],
  eventos: [],
  objetos: [],
  facciones: [],
  worldbuilding: [],
  relaciones: [],
  misterios: [],
  quotes: [],
  decisiones: [],
};

function tmpVault(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "recuerdos-commit-test-"));
}

describe("commitEpisode resumen validation", () => {
  it("rechaza resumenes que empiezan directamente con una seccion", async () => {
    const vaultPath = tmpVault();
    try {
      await expect(
        commitEpisode({
          vaultPath,
          numero: 68,
          titulo: "En la oscuridad",
          resumen:
            "## Cast del episodio\n\n**Mysha**: Viaja al Coven Negro.\n\n## Resumen cronologico\n\nEl grupo avanza.",
          extraido: emptyExtraction,
        }),
      ).rejects.toThrow(/resumen narrativo/i);
    } finally {
      fs.rmSync(vaultPath, { recursive: true, force: true });
    }
  });

  it("acepta resumenes con intro narrativa antes de las secciones", async () => {
    const vaultPath = tmpVault();
    try {
      const intro =
        "La sesion funciona como puente entre la preparacion politica y la entrada al territorio del coven. " +
        "El grupo ordena sus prioridades, recibe informacion nueva, prepara objetos importantes y termina " +
        "entrando en un bosque hostil donde la oscuridad magica cambia por completo las reglas de exploracion. " +
        "Ese cierre deja planteado el combate siguiente sin perder el hilo principal de la mision.";

      const result = await commitEpisode({
        vaultPath,
        numero: 68,
        titulo: "En la oscuridad",
        resumen: `${intro}\n\n## Cast del episodio\n\n**Mysha**: Viaja al Coven Negro.`,
        extraido: emptyExtraction,
      });

      expect(result.filesWritten).toBe(1);
    } finally {
      fs.rmSync(vaultPath, { recursive: true, force: true });
    }
  });
});
