"use server";

// app/actions/extract.ts — Server action: resumen curado → lore extraído.
//
// Proveedor configurable por env EXTRACTION_PROVIDER:
//   "auto"   (default) → Ollama local si está disponible; si no, Gemini.
//   "ollama"            → fuerza Ollama (sin fallback, surface del error).
//   "gemini"            → fuerza Gemini (comportamiento histórico).
//
// GOAL.md: Ollama es el proveedor local preferido; Gemini queda como
// fallback. El resumen lo hace Codex/Claude a mano (no pasa por acá).
// Claude API sigue disponible en lib/claude.ts si hay créditos.

import { loadConfig } from "@/lib/config";
import {
  extractLoreWithGemini,
  retryExtractLoreWithGemini,
} from "@/lib/gemini";
import {
  extractLoreWithOllama,
  retryExtractLoreWithOllama,
  ollamaReachable,
} from "@/lib/ollama";
import type { ExtractionResult } from "@/lib/types";

export type ExtractResult =
  | { success: true; data: ExtractionResult }
  | { success: false; error: string; rawJson?: string };

/**
 * Datos mock para testing sin API/modelo. Basados en el episodio 1 real.
 */
function getMockExtraction(episodio: number): ExtractionResult {
  return {
    personajes: [
      { nombre: "Mysha", descripcion: "Una de las protagonistas, llega a la Metrópolis de Cobre tras cruzar el desierto", alias: [] },
      { nombre: "Borok", descripcion: "Un semiorco, compañero de viaje de Mysha. Llegan juntos a la Metrópolis de Cobre", alias: [] },
      { nombre: "Annora", descripcion: "Líder de la Hermandad de Cobre. Propone el voto de confianza y el contrato de sangre al grupo", alias: [] },
      { nombre: "Layyra", descripcion: "Una enigmática dracónica que el grupo conoce en el casino Plumas Doradas", alias: [] },
      { nombre: "Lords", descripcion: "Presentador del casino Plumas Doradas, interactúa con el grupo a su llegada", alias: [] },
      { nombre: "Doctora Margarita", descripcion: "Supervisa el contrato de sangre entre el grupo y la Hermandad de Cobre", alias: ["Margarita"] },
      { nombre: "David Ilcard", descripcion: "Un centinela de la Hermandad de Cobre con quien el grupo debe coordinar", alias: [] },
      { nombre: "Narcissa", descripcion: "Boticaria del gremio, humana con afición por las arañas y los brebajes", alias: [] },
      { nombre: "Señor Johnson", descripcion: "Un civil al que el grupo debe interceptar en las alcantarillas para asegurar su cooperación", alias: ["Johnson"] },
    ],
    lugares: [
      { nombre: "Metrópolis de Cobre", descripcion: "Gran ciudad con tecnología avanzada y arquitectura imponente, destino del grupo tras cruzar el desierto" },
      { nombre: "Plumas Doradas", descripcion: "Casino en la Metrópolis de Cobre donde el grupo busca refugio y comida al llegar" },
      { nombre: "Alcantarillas de la Metrópolis", descripcion: "Antiguas alcantarillas oscuras y peligrosas, equipadas con tuberías de cobre que emiten gases" },
    ],
    eventos: [
      { nombre: "Llegada a la Metrópolis de Cobre", descripcion: "Borok y Mysha llegan a la ciudad tras un agotador viaje por el desierto" },
      { nombre: "Emboscada en Plumas Doradas", descripcion: "El grupo cae inconsciente tras consumir un licor azul de cortesía en el casino" },
      { nombre: "Contrato de sangre", descripcion: "Annora propone un voto de confianza sellado con contrato de sangre, formalizando el ingreso del grupo a la Hermandad" },
      { nombre: "Enfrentamiento con trogloditas", descripcion: "Combate feroz en las alcantarillas contra trogloditas que emboscan al grupo desde la oscuridad" },
    ],
    objetos: [
      { nombre: "Licor azul", descripcion: "Bebida de cortesía en el casino que deja inconsciente a quien la consume" },
      { nombre: "Contrato de sangre", descripcion: "Documento mágico que sella el voto de confianza entre el grupo y la Hermandad de Cobre" },
    ],
    facciones: [
      { nombre: "Hermandad de Cobre", descripcion: "Gremio liderado por Annora que opera en la Metrópolis de Cobre. Recluta al grupo como iniciados mediante un contrato de sangre" },
      { nombre: "Mates y Mazmorras", descripcion: "Canal que dirige la campaña de rol 'Recuerdos de Cobre'" },
    ],
    worldbuilding: [
      { tema: "Tecnología de cobre", descripcion: "La Metrópolis de Cobre tiene tecnología avanzada basada en cobre, incluyendo tuberías en las alcantarillas que emiten gases" },
      { tema: "Sistema de gremios", descripcion: "Existen organizaciones como la Hermandad de Cobre que reclutan miembros mediante contratos de sangre y votos de confianza" },
    ],
    relaciones: [
      { de: "Mysha", a: "Borok", tipo: "compañeros de viaje", episodio },
      { de: "Annora", a: "Hermandad de Cobre", tipo: "líder de la facción", episodio },
      { de: "Narcissa", a: "Hermandad de Cobre", tipo: "boticaria del gremio", episodio },
      { de: "David Ilcard", a: "Hermandad de Cobre", tipo: "centinela del gremio", episodio },
      { de: "Doctora Margarita", a: "Hermandad de Cobre", tipo: "supervisora de contratos", episodio },
    ],
    misterios: [
      "¿Qué información delicada debe recibir el señor Johnson?",
      "¿Por qué la Hermandad de Cobre necesita reclutar forasteros como iniciados?",
      "¿Qué relación tiene Layyra con el casino o la Hermandad?",
    ],
    quotes: [
      { texto: "Un voto de confianza mutuo", autor: "Annora" },
    ],
    decisiones: [
      { descripcion: "El grupo acepta el contrato de sangre y se une a la Hermandad de Cobre como iniciados", protagonistas: ["Mysha", "Borok"] },
      { descripcion: "Aceptan la misión de interceptar al señor Johnson en las alcantarillas", protagonistas: ["Mysha", "Borok"] },
    ],
  };
}

/** Ejecuta Gemini con su reintento por validación (comportamiento histórico). */
async function runGemini(
  resumen: string,
  numero: number,
  titulo?: string
): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está definida en .env.local");
  }
  // loadConfig valida que el vault exista; no necesitamos anthropicApiKey acá.
  loadConfig();

  try {
    return await extractLoreWithGemini(apiKey, resumen, numero, titulo);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("no pasó validación")) {
      return await retryExtractLoreWithGemini(apiKey, resumen, numero, msg, titulo);
    }
    throw err;
  }
}

/** Ejecuta Ollama local con su reintento por validación. */
async function runOllama(
  resumen: string,
  numero: number,
  titulo?: string
): Promise<ExtractionResult> {
  try {
    return await extractLoreWithOllama(resumen, numero, titulo);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("no pasó validación")) {
      return await retryExtractLoreWithOllama(resumen, numero, msg, titulo);
    }
    throw err;
  }
}

/**
 * Server action: recibe el resumen curado + metadatos → lore estructurado.
 * El resultado NO se persiste hasta que el usuario confirme en /review.
 *
 * MOCK_EXTRACTION=true devuelve datos simulados sin llamar a ningún modelo.
 */
export async function extractLoreAction(
  resumen: string,
  numeroEpisodio: number,
  titulo?: string
): Promise<ExtractResult> {
  if (process.env.MOCK_EXTRACTION === "true") {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { success: true, data: getMockExtraction(numeroEpisodio) };
  }

  const provider = (process.env.EXTRACTION_PROVIDER?.trim() || "auto").toLowerCase();

  try {
    if (provider === "gemini") {
      return { success: true, data: await runGemini(resumen, numeroEpisodio, titulo) };
    }

    if (provider === "ollama") {
      return { success: true, data: await runOllama(resumen, numeroEpisodio, titulo) };
    }

    // auto: preferir Ollama local; si no está o falla, caer a Gemini.
    if (await ollamaReachable()) {
      try {
        return {
          success: true,
          data: await runOllama(resumen, numeroEpisodio, titulo),
        };
      } catch (ollamaErr) {
        console.warn(
          "[extract] Ollama falló, fallback a Gemini:",
          ollamaErr instanceof Error ? ollamaErr.message : ollamaErr
        );
      }
    }
    return { success: true, data: await runGemini(resumen, numeroEpisodio, titulo) };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}
