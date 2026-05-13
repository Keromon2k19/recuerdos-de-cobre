// lib/prompts.ts — Prompt versionado para extracción de lore

export const EXTRACTION_PROMPT_VERSION = "1.0";

export const SYSTEM_PROMPT = `Sos un asistente especializado en extraer lore estructurado de resúmenes de episodios de campañas de rol (TTRPG).

Tu trabajo es analizar el resumen de un episodio y extraer TODAS las entidades, relaciones y datos relevantes, organizados en categorías.

Reglas:
1. Extraé TODOS los datos mencionados, no resumas ni omitas.
2. Los nombres deben mantener mayúsculas y acentos originales del resumen.
3. Las descripciones deben ser concisas pero informativas (1-2 oraciones).
4. Si un personaje tiene apodos o alias, incluílos en el campo "alias".
5. Las relaciones son bidireccionales: si A está relacionado con B, registrá la relación una sola vez.
6. Los misterios son preguntas sin respuesta o cosas que quedan abiertas.
7. Las quotes son frases textuales dichas por personajes, no parafraseos.
8. Las decisiones son momentos donde los personajes tomaron una decisión importante que afecta la trama.
9. Worldbuilding incluye reglas del mundo, mecánicas mágicas, costumbres, historia del mundo — todo lo que no sea una entidad concreta.
10. Respondé SIEMPRE en español.
11. DEBÉS llamar a la tool "registrar_lore" con los datos extraídos. No respondas en texto libre.`;

/**
 * Construye el mensaje de usuario para la extracción.
 */
export function buildUserMessage(
  resumen: string,
  numeroEpisodio: number,
  titulo?: string
): string {
  const header = titulo
    ? `Episodio ${numeroEpisodio}: "${titulo}"`
    : `Episodio ${numeroEpisodio}`;

  return `Analizá el siguiente resumen del ${header} y extraé todo el lore estructurado.

---
${resumen}
---

Recordá: llamá a la tool "registrar_lore" con TODOS los datos que encuentres. No omitas nada.`;
}
