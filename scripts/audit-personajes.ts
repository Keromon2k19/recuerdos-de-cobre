/**
 * Auditoría de personajes del vault — Semana 1 del GOAL "El Regalo".
 *
 * Recorre VAULT/personajes/*.md y reporta:
 *   P0 — info incorrecta: mojibake en nombre/alias, nombres dudosos,
 *        nombres/alias duplicados entre archivos.
 *   P1 — se muestra mal: mojibake en cuerpo/relaciones, imagen rota,
 *        personaje sin imagen.
 *   P2 — cosmético: imagen placeholder, sin imageAlt, sin sección Perfil,
 *        sin apariciones.
 *
 * Uso: npx tsx scripts/audit-personajes.ts [rutaVault]
 * Salida: output/auditoria-personajes.md + resumen en consola.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PJS = new Set(
  ["mysha", "borok", "layra", "narcissa", "david ilcard", "io campbell"]
);
const FAMILIARES = new Set(["champi"]);

// UTF-8 leído como Latin-1: Ã/Â/â€ no aparecen en castellano legítimo.
const MOJIBAKE = /[ÃÂ�]|â€/;

function vaultFromEnvLocal(): string | null {
  try {
    const env = fs.readFileSync(".env.local", "utf-8");
    const m = env.match(/^VAULT_PATH=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

const VAULT =
  process.argv[2] ??
  process.env.VAULT_PATH ??
  vaultFromEnvLocal() ??
  "vault-recuerdos-de-cobre";
const DIR = path.join(VAULT, "personajes");
const PUBLIC_DIR = path.join(process.cwd(), "public");

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function asArray(v: unknown): string[] {
  if (typeof v === "string" && v.trim()) return [v.trim()];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((x) => x.trim());
}

type Hallazgo = { archivo: string; nombre: string; detalle: string };
const p0: Hallazgo[] = [];
const p1: Hallazgo[] = [];
const p2: Hallazgo[] = [];

const ocupados = new Map<string, string[]>(); // nombre/alias normalizado -> archivos

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
let conImagen = 0;

for (const f of files) {
  const raw = fs.readFileSync(path.join(DIR, f), "utf-8");
  let data: Record<string, unknown>;
  let body: string;
  try {
    const parsed = matter(raw);
    data = parsed.data as Record<string, unknown>;
    body = parsed.content;
  } catch (e) {
    p0.push({ archivo: f, nombre: "?", detalle: `frontmatter ilegible (${e})` });
    continue;
  }

  const nombre = typeof data.nombre === "string" ? data.nombre.trim() : "";
  const alias = asArray(data.alias ?? data.aliases);
  const etiqueta =
    PJS.has(normalizar(nombre)) ? " (PJ)" :
    FAMILIARES.has(normalizar(nombre)) ? " (familiar)" : "";
  const quien = (nombre || f) + etiqueta;

  // ── P0: nombre ──
  if (!nombre) {
    p0.push({ archivo: f, nombre: quien, detalle: "sin campo `nombre`" });
  } else {
    if (MOJIBAKE.test(nombre))
      p0.push({ archivo: f, nombre: quien, detalle: `mojibake en nombre: "${nombre}"` });
    if (/[\d?#]/.test(nombre))
      p0.push({ archivo: f, nombre: quien, detalle: `nombre dudoso (dígitos/símbolos): "${nombre}"` });
    if (nombre.length < 3)
      p0.push({ archivo: f, nombre: quien, detalle: `nombre demasiado corto: "${nombre}"` });
  }
  for (const a of alias) {
    if (MOJIBAKE.test(a))
      p0.push({ archivo: f, nombre: quien, detalle: `mojibake en alias: "${a}"` });
  }

  // ── P0: colisiones de nombre/alias entre archivos ──
  for (const clave of [nombre, ...alias].filter(Boolean).map(normalizar)) {
    const lista = ocupados.get(clave) ?? [];
    lista.push(f);
    ocupados.set(clave, lista);
  }

  // ── P1: mojibake visible (cuerpo o frontmatter serializado) ──
  const fmSinBody = JSON.stringify(data);
  if (MOJIBAKE.test(body))
    p1.push({ archivo: f, nombre: quien, detalle: "mojibake en el cuerpo" });
  else if (MOJIBAKE.test(fmSinBody))
    p1.push({ archivo: f, nombre: quien, detalle: "mojibake en frontmatter (relaciones/otros)" });

  // ── P1/P2: imagen ──
  const image = typeof data.image === "string" ? data.image.trim() : "";
  const imageAlt = typeof data.imageAlt === "string" ? data.imageAlt.trim() : "";
  if (!image) {
    p1.push({ archivo: f, nombre: quien, detalle: "sin imagen" });
  } else {
    conImagen++;
    if (image.includes("placeholder"))
      p2.push({ archivo: f, nombre: quien, detalle: `imagen placeholder: ${image}` });
    if (image.startsWith("/")) {
      const onDisk = path.join(PUBLIC_DIR, image.replace(/^\//, ""));
      if (!fs.existsSync(onDisk))
        p1.push({ archivo: f, nombre: quien, detalle: `imagen rota (no existe): ${image}` });
    }
    if (!imageAlt)
      p2.push({ archivo: f, nombre: quien, detalle: "imagen sin imageAlt" });
  }

  // ── P2: contenido ──
  if (!/^## Perfil\b/m.test(body))
    p2.push({ archivo: f, nombre: quien, detalle: "sin sección `## Perfil`" });
  const apariciones = Array.isArray(data.apariciones) ? data.apariciones : [];
  if (apariciones.length === 0)
    p2.push({ archivo: f, nombre: quien, detalle: "sin apariciones (¿huérfano?)" });
}

// Colisiones: misma clave en 2+ archivos distintos
for (const [clave, lista] of ocupados) {
  const unicos = [...new Set(lista)];
  if (unicos.length > 1)
    p0.push({
      archivo: unicos.join(", "),
      nombre: clave,
      detalle: `nombre/alias "${clave}" repetido en ${unicos.length} archivos`,
    });
}

// ── Reporte ──
function tabla(items: Hallazgo[]): string {
  if (!items.length) return "_Sin hallazgos._\n";
  const rows = items
    .map((h) => `| ${h.nombre} | ${h.detalle} | \`${h.archivo}\` |`)
    .join("\n");
  return `| Personaje | Problema | Archivo |\n|---|---|---|\n${rows}\n`;
}

const fecha = new Date().toISOString().slice(0, 10);
const reporte = `# Auditoría de personajes — ${fecha}

Vault: \`${VAULT}\` · ${files.length} archivos · ${conImagen} con imagen (${files.length - conImagen} sin)

Resumen: **P0: ${p0.length}** · **P1: ${p1.length}** · **P2: ${p2.length}**

## P0 — Información incorrecta (arreglar primero)

${tabla(p0)}
## P1 — Se muestra mal

${tabla(p1)}
## P2 — Cosmético

${tabla(p2)}
`;

fs.mkdirSync("output", { recursive: true });
const out = "output/auditoria-personajes.md";
fs.writeFileSync(out, reporte, "utf-8");

console.log(`Auditados ${files.length} personajes (${conImagen} con imagen).`);
console.log(`P0: ${p0.length} · P1: ${p1.length} · P2: ${p2.length}`);
console.log(`Reporte: ${out}`);
