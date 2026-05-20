#!/usr/bin/env node
/**
 * Detecta texto en el mapa (public/mapa/eyira.webp) usando Google Cloud Vision
 * y vuelca el resultado a output/eyira-ocr.json. Cada label viene con texto,
 * coordenadas porcentuales (x%, y%), angulo de rotacion y tamano en px.
 *
 * Setup:
 *   1) Console GCP → Library → habilitar "Cloud Vision API" en el proyecto.
 *   2) Console GCP → Credentials → API key (la de YouTube sirve si no esta
 *      restringida a una API especifica).
 *   3) En .env.local agregar: GOOGLE_VISION_API_KEY=AIza...
 *
 * Uso: npx tsx scripts/ocr-map.ts
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnv(): void {
  const p = path.join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv();

const API_KEY = process.env.GOOGLE_VISION_API_KEY ?? process.env.GOOGLE_API_KEY;
const IMAGE_PATH = path.resolve("public/mapa/eyira.webp");
const OUTPUT_DIR = path.resolve("output");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "eyira-ocr.json");

if (!API_KEY) {
  console.error("Falta GOOGLE_VISION_API_KEY en .env.local");
  console.error("Habilita Cloud Vision API en GCP y agrega el API key al .env.local");
  process.exit(1);
}

if (!existsSync(IMAGE_PATH)) {
  console.error(`No existe ${IMAGE_PATH}`);
  process.exit(1);
}

type Vertex = { x?: number; y?: number };

function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function centroid(verts: Vertex[]): { x: number; y: number } {
  return {
    x: avg(verts.map((v) => v.x ?? 0)),
    y: avg(verts.map((v) => v.y ?? 0)),
  };
}

function rotationDeg(verts: Vertex[]): number {
  // Vision devuelve los 4 vertices del bounding box rotado en orden:
  // 0 = top-left, 1 = top-right, 2 = bottom-right, 3 = bottom-left
  // El angulo del borde superior (0 → 1) respecto a la horizontal es la rotacion.
  const dx = (verts[1]?.x ?? 0) - (verts[0]?.x ?? 0);
  const dy = (verts[1]?.y ?? 0) - (verts[0]?.y ?? 0);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function textFromParagraph(para: {
  words: Array<{
    symbols: Array<{
      text: string;
      property?: { detectedBreak?: { type?: string } };
    }>;
  }>;
}): string {
  return para.words
    .map((word) => {
      const t = word.symbols.map((s) => s.text).join("");
      const lastBreak =
        word.symbols[word.symbols.length - 1]?.property?.detectedBreak?.type;
      const needsSpace =
        lastBreak === "SPACE" || lastBreak === "EOL_SURE_SPACE";
      return t + (needsSpace ? " " : "");
    })
    .join("")
    .trim();
}

async function main(): Promise<void> {
  const imageBuffer = await readFile(IMAGE_PATH);
  const imageBase64 = imageBuffer.toString("base64");

  console.log(`Enviando ${(imageBuffer.length / 1024).toFixed(0)} KB a Vision API…`);

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            imageContext: { languageHints: ["es", "en"] },
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    console.error(`Vision API fallo (${response.status})`);
    console.error(await response.text());
    process.exit(1);
  }

  const json = (await response.json()) as {
    responses?: Array<{
      fullTextAnnotation?: {
        pages?: Array<{
          width: number;
          height: number;
          blocks?: Array<{
            paragraphs?: Array<{
              boundingBox?: { vertices?: Vertex[] };
              confidence?: number;
              words: Array<{
                symbols: Array<{
                  text: string;
                  property?: { detectedBreak?: { type?: string } };
                }>;
              }>;
            }>;
          }>;
        }>;
      };
      error?: { message?: string };
    }>;
  };

  const top = json.responses?.[0];
  if (top?.error?.message) {
    console.error(`Vision API error: ${top.error.message}`);
    process.exit(1);
  }

  const page = top?.fullTextAnnotation?.pages?.[0];
  if (!page) {
    console.error("Sin texto detectado en la imagen.");
    process.exit(1);
  }

  const { width, height } = page;

  type DetectedLabel = {
    text: string;
    x: number;
    y: number;
    angle: number;
    size: number;
    confidence: number;
  };

  const labels: DetectedLabel[] = [];

  for (const block of page.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      const text = textFromParagraph(para);
      if (!text) continue;
      const verts = para.boundingBox?.vertices ?? [];
      if (verts.length < 4) continue;
      const c = centroid(verts);
      const angle = rotationDeg(verts);
      const sizePx = Math.hypot(
        (verts[3]?.x ?? 0) - (verts[0]?.x ?? 0),
        (verts[3]?.y ?? 0) - (verts[0]?.y ?? 0),
      );
      labels.push({
        text,
        x: Number(((c.x / width) * 100).toFixed(2)),
        y: Number(((c.y / height) * 100).toFixed(2)),
        angle: Number(angle.toFixed(1)),
        size: Math.round(sizePx),
        confidence: Number((para.confidence ?? 0).toFixed(2)),
      });
    }
  }

  labels.sort((a, b) => b.confidence - a.confidence);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    JSON.stringify({ width, height, labels }, null, 2),
    "utf8",
  );

  console.log(`✓ ${labels.length} textos detectados`);
  console.log(`✓ Imagen: ${width}x${height}px`);
  console.log(`✓ Guardado en: ${path.relative(process.cwd(), OUTPUT_PATH)}`);

  console.log("\nTop 10 por confianza:");
  for (const lbl of labels.slice(0, 10)) {
    const ang = lbl.angle.toFixed(0).padStart(4);
    console.log(
      `  · "${lbl.text}" → (${lbl.x}%, ${lbl.y}%) @ ${ang}° · size ${lbl.size}px · conf ${lbl.confidence}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
