// lib/schema.ts — Zod schemas para validar output del LLM
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const RelacionSchema = z.object({
  de: z.string().min(1, "Nombre de origen requerido"),
  a: z.string().min(1, "Nombre de destino requerido"),
  tipo: z.string().min(1, "Tipo de relación requerido"),
  episodio: z.number().int().positive(),
});

export const ExtractionResultSchema = z.object({
  personajes: z.array(
    z.object({
      nombre: z.string().min(1),
      descripcion: z.string().min(1),
      alias: z.array(z.string()).optional().default([]),
    })
  ),
  lugares: z.array(
    z.object({
      nombre: z.string().min(1),
      descripcion: z.string().min(1),
    })
  ),
  eventos: z.array(
    z.object({
      nombre: z.string().min(1),
      descripcion: z.string().min(1),
    })
  ),
  objetos: z.array(
    z.object({
      nombre: z.string().min(1),
      descripcion: z.string().min(1),
    })
  ),
  facciones: z.array(
    z.object({
      nombre: z.string().min(1),
      descripcion: z.string().min(1),
    })
  ),
  worldbuilding: z.array(
    z.object({
      tema: z.string().min(1),
      descripcion: z.string().min(1),
    })
  ),
  relaciones: z.array(RelacionSchema),
  misterios: z.array(z.string().min(1)),
  quotes: z.array(
    z.object({
      texto: z.string().min(1),
      autor: z.string().optional(),
    })
  ),
  decisiones: z.array(
    z.object({
      descripcion: z.string().min(1),
      protagonistas: z.array(z.string().min(1)),
    })
  ),
});

export type ExtractionResultParsed = z.infer<typeof ExtractionResultSchema>;

/**
 * JSON Schema para usar como input_schema de la tool de Claude.
 * Se genera automáticamente desde el zod schema.
 */
export const extractionJsonSchema = zodToJsonSchema(
  ExtractionResultSchema,
  "ExtractionResult"
);
