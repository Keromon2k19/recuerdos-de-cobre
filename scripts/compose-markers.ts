#!/usr/bin/env node
/**
 * Fusiona fragmentos OCR cercanos (output/eyira-ocr.json) en markers
 * compuestos para el mapa. Junta detecciones que comparten angulo y estan
 * espacialmente cerca (nombres multi-linea o curvos).
 *
 * Salida:
 *   - output/eyira-markers.json (datos)
 *   - output/eyira-markers.ts   (snippet listo para pegar en CampaignMap.tsx)
 *
 * Uso: npx tsx scripts/compose-markers.ts
 *
 * Ajustes (heuristicos): pasarlos como env vars
 *   MAX_DIST=6  MAX_ANGLE=12  MIN_CONF=0.7
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Label = {
  text: string;
  x: number;
  y: number;
  angle: number;
  size: number;
  confidence: number;
};

type Composed = {
  id: string;
  text: string;
  x: number;
  y: number;
  angle: number;
  size: number;
  confidence: number;
  fragments: number;
  pieces: string[];
};

const MAX_DIST = Number(process.env.MAX_DIST ?? 6); // % de distancia
const MAX_ANGLE = Number(process.env.MAX_ANGLE ?? 12); // grados
const MIN_CONF = Number(process.env.MIN_CONF ?? 0.7);
const SIZE_RATIO = Number(process.env.SIZE_RATIO ?? 2.0);

async function main() {
const ocrPath = path.resolve("output/eyira-ocr.json");
const ocrJson = JSON.parse(await readFile(ocrPath, "utf-8")) as {
  width: number;
  height: number;
  labels: Label[];
};

const labels = ocrJson.labels.filter((l) => l.confidence >= MIN_CONF);

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function distance(a: Label, b: Label): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function compatible(a: Label, b: Label): boolean {
  if (distance(a, b) > MAX_DIST) return false;
  if (angleDiff(a.angle, b.angle) > MAX_ANGLE) return false;
  const sizeRatio = Math.max(a.size, b.size) / Math.min(a.size, b.size);
  if (sizeRatio > SIZE_RATIO) return false;
  return true;
}

// Union-find por proximidad
const parent: number[] = labels.map((_, i) => i);
function find(i: number): number {
  while (parent[i] !== i) {
    parent[i] = parent[parent[i]];
    i = parent[i];
  }
  return i;
}
function union(i: number, j: number): void {
  const ri = find(i);
  const rj = find(j);
  if (ri !== rj) parent[ri] = rj;
}

for (let i = 0; i < labels.length; i++) {
  for (let j = i + 1; j < labels.length; j++) {
    if (compatible(labels[i], labels[j])) union(i, j);
  }
}

const groups = new Map<number, Label[]>();
for (let i = 0; i < labels.length; i++) {
  const root = find(i);
  if (!groups.has(root)) groups.set(root, []);
  groups.get(root)!.push(labels[i]);
}

function composeText(group: Label[]): { text: string; pieces: string[] } {
  if (group.length === 1) {
    return { text: group[0].text, pieces: [group[0].text] };
  }
  // Reading order: proyectar cada label sobre la direccion del angulo promedio
  const avgAngleRad =
    (group.reduce((s, l) => s + l.angle, 0) / group.length) * (Math.PI / 180);
  const sorted = [...group].sort(
    (a, b) =>
      a.x * Math.cos(avgAngleRad) +
      a.y * Math.sin(avgAngleRad) -
      (b.x * Math.cos(avgAngleRad) + b.y * Math.sin(avgAngleRad)),
  );
  return {
    text: sorted.map((l) => l.text).join(" "),
    pieces: sorted.map((l) => l.text),
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

const composed: Composed[] = [];
for (const group of groups.values()) {
  const { text, pieces } = composeText(group);
  const x = group.reduce((s, l) => s + l.x, 0) / group.length;
  const y = group.reduce((s, l) => s + l.y, 0) / group.length;
  const angle = group.reduce((s, l) => s + l.angle, 0) / group.length;
  const size = Math.max(...group.map((l) => l.size));
  const confidence =
    group.reduce((s, l) => s + l.confidence, 0) / group.length;
  composed.push({
    id: slugify(text),
    text,
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    angle: Number(angle.toFixed(1)),
    size,
    confidence: Number(confidence.toFixed(2)),
    fragments: group.length,
    pieces,
  });
}

composed.sort((a, b) => b.size - a.size);

await writeFile(
  path.resolve("output/eyira-markers.json"),
  JSON.stringify({ width: ocrJson.width, height: ocrJson.height, markers: composed }, null, 2),
  "utf8",
);

// TS snippet
const lines: string[] = [];
lines.push("// Generado por scripts/compose-markers.ts — revisar y limpiar a mano.");
lines.push("// Asignar tone (copper | petrol | moss | gold | wine) y note segun region.");
lines.push("const BASE_MARKERS: MapMarker[] = [");
for (const m of composed) {
  const safeName = m.text.replace(/"/g, '\\"');
  lines.push("  {");
  lines.push(`    id: "${m.id}",`);
  lines.push(`    name: "${safeName}",`);
  lines.push(`    region: "",`);
  lines.push(`    x: ${m.x},`);
  lines.push(`    y: ${m.y},`);
  lines.push(`    tone: "copper",`);
  lines.push(`    note: "",`);
  lines.push(`  },`);
}
lines.push("];");

await writeFile(path.resolve("output/eyira-markers.ts"), lines.join("\n"), "utf8");

console.log(
  `✓ ${labels.length} fragmentos → ${composed.length} markers compuestos`,
);
console.log(`✓ output/eyira-markers.json  (datos)`);
console.log(`✓ output/eyira-markers.ts    (snippet TS)`);

const grouped = composed.filter((m) => m.fragments > 1);
console.log(
  `\n${grouped.length} markers se compusieron de >1 fragmento:`,
);
for (const m of grouped.slice(0, 20)) {
  console.log(`  · "${m.text}"  ←  [${m.pieces.map((p) => `"${p}"`).join(" + ")}]`);
}

console.log("\nTodos los markers (por tamaño tipográfico):");
for (const m of composed) {
  const angle = m.angle.toFixed(0).padStart(4);
  console.log(
    `  · "${m.text}" → (${m.x}%, ${m.y}%) @ ${angle}° · size ${m.size}px · conf ${m.confidence}`,
  );
}
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
