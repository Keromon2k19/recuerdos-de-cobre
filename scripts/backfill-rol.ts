#!/usr/bin/env node
/**
 * Pasada única: normaliza `rol` + `tags` en todos los personajes del vault
 * para que el grafo de Obsidian pueda colorearlos (pj/npc/antagonista/familiar).
 * Idempotente. Reusa la lógica canónica de lib/commit.
 *
 * Uso: npx tsx scripts/backfill-rol.ts
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { rolDePersonaje } from "../lib/commit";

const ROL_TAGS = ["pj", "npc", "antagonista", "familiar"];
function rolTag(rol: string): string {
  if (rol === "PJ") return "pj";
  if (rol === "familiar") return "familiar";
  if (rol === "antagonista") return "antagonista";
  return "npc";
}

function loadEnv(): Record<string, string> {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(p, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...process.env, ...loadEnv() };
const vaultPath = path.resolve(env.VAULT_PATH || "vault-mysha");
const dir = path.join(vaultPath, "personajes");

let changed = 0;
const counts: Record<string, number> = { PJ: 0, NPC: 0, antagonista: 0, familiar: 0 };

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
  const full = path.join(dir, file);
  const raw = fs.readFileSync(full, "utf-8");
  const parsed = matter(raw);
  const fm = parsed.data as Record<string, unknown>;

  const canon = rolDePersonaje(String(fm.nombre ?? file.replace(/\.md$/, "")));
  const existing = typeof fm.rol === "string" ? fm.rol : undefined;

  let finalRol: string;
  if (canon === "PJ" || canon === "familiar") {
    finalRol = canon;
  } else if (
    existing === "antagonista" ||
    existing === "PJ" ||
    existing === "familiar"
  ) {
    finalRol = existing;
  } else {
    finalRol = "NPC";
  }

  const prevTags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
  const newTags = [
    ...prevTags.filter((t) => !ROL_TAGS.includes(t)),
    rolTag(finalRol),
  ];

  const sameRol = existing === finalRol;
  const sameTags =
    prevTags.length === newTags.length &&
    prevTags.every((t, i) => t === newTags[i]);
  counts[finalRol] = (counts[finalRol] ?? 0) + 1;
  if (sameRol && sameTags) continue;

  fm.rol = finalRol;
  fm.tags = newTags;
  fs.writeFileSync(full, matter.stringify(parsed.content, fm), "utf-8");
  changed++;
}

console.log(
  `Backfill rol: ${changed} archivos actualizados. ` +
    `Totales → PJ:${counts.PJ} NPC:${counts.NPC} ` +
    `antagonista:${counts.antagonista} familiar:${counts.familiar}`
);
