// scripts/v2-screenshot.mjs
//
// QA visual de la UI V2. Captura todas las rutas a todos los viewports
// oficiales y guarda en artifacts/screenshots/ui-v2/.
//
// Setup (una vez):
//   npm install -D playwright
//   npx playwright install chromium
//
// Browser:
//   Por defecto usa Chromium gestionado por Playwright.
//   Para usar Edge/Chrome instalado:
//     $env:V2_BROWSER_CHANNEL="msedge"; node scripts/v2-screenshot.mjs
//     $env:V2_BROWSER_CHANNEL="chrome"; node scripts/v2-screenshot.mjs
//
// Uso:
//   node scripts/v2-screenshot.mjs                 # todas las rutas, todos los viewports
//   node scripts/v2-screenshot.mjs --priority      # solo prioridad: 1440, 2048, 390
//   node scripts/v2-screenshot.mjs --routes /v2,/v2/personajes
//   node scripts/v2-screenshot.mjs --full-page     # capturar página completa (no solo viewport)
//
// Pre-condición: el dev server tiene que estar corriendo en BASE_URL.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "artifacts", "screenshots", "ui-v2");
const BASE_URL = process.env.V2_BASE_URL || "http://localhost:3000";
const BROWSER_CHANNEL = process.env.V2_BROWSER_CHANNEL?.trim() || "";

/** Viewports oficiales en CSS pixels. */
const VIEWPORTS = [
  { name: "390x844_mobile",       width: 390,  height: 844,  priority: true  },
  { name: "768x1024_tablet",      width: 768,  height: 1024, priority: false },
  { name: "1440x900_laptop",      width: 1440, height: 900,  priority: true  },
  { name: "2048x1152_desktop_2k", width: 2048, height: 1152, priority: true  },
  { name: "2560x1440_desktop_2k", width: 2560, height: 1440, priority: false },
];

/** Rutas V2 a capturar. */
const ROUTES = [
  "/v2",
  "/v2/personajes",
  "/v2/capitulos",
  "/v2/mapa",
  "/v2/dioses",
  "/v2/archivos",
];

const args = new Set(process.argv.slice(2));
const PRIORITY_ONLY = args.has("--priority");
const FULL_PAGE = args.has("--full-page");

const routesArg = process.argv.find((a) => a.startsWith("--routes="));
const ROUTES_FILTERED = routesArg
  ? routesArg.slice("--routes=".length).split(",")
  : ROUTES;

const viewports = PRIORITY_ONLY ? VIEWPORTS.filter((v) => v.priority) : VIEWPORTS;

function slugify(route) {
  return route.replace(/^\//, "").replace(/\//g, "_") || "home";
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`→ Screenshots a ${OUT_DIR}`);
  console.log(`→ Base URL: ${BASE_URL}`);
  console.log(`→ Viewports: ${viewports.map((v) => v.name).join(", ")}`);
  console.log(`→ Rutas: ${ROUTES_FILTERED.join(", ")}`);
  console.log(`→ Full page: ${FULL_PAGE}\n`);

  console.log(`→ Browser: ${BROWSER_CHANNEL || "playwright-chromium"}\n`);

  const browser = await chromium.launch(
    BROWSER_CHANNEL ? { channel: BROWSER_CHANNEL } : undefined
  );
  const results = [];

  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();

    for (const route of ROUTES_FILTERED) {
      const file = join(OUT_DIR, `${slugify(route)}_${vp.name}.png`);
      try {
        const resp = await page.goto(`${BASE_URL}${route}`, {
          waitUntil: "networkidle",
          timeout: 15000,
        });
        const status = resp ? resp.status() : 0;
        // Espera estable para fuentes / hidratación
        await page.waitForTimeout(400);
        await page.screenshot({ path: file, fullPage: FULL_PAGE });
        results.push({ route, vp: vp.name, status, ok: true });
        console.log(`  ✓ ${vp.name.padEnd(24)} ${route.padEnd(18)} (HTTP ${status})`);
      } catch (err) {
        results.push({ route, vp: vp.name, ok: false, error: err.message });
        console.log(`  ✗ ${vp.name.padEnd(24)} ${route.padEnd(18)} ${err.message}`);
      }
    }

    await ctx.close();
  }

  await browser.close();

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  console.log(`\n✓ ${ok} ok · ✗ ${failed} fallidos · total ${results.length}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
