// Mide overflow vertical en todas las páginas de UI V2.
// Por defecto a 1920x1020 (1080p), pero acepta width/height por arg.
import { chromium } from "playwright";

const w = parseInt(process.argv[2] || "1920", 10);
const h = parseInt(process.argv[3] || "1020", 10);
const baseUrl = process.env.V2_BASE_URL || "http://localhost:3000";
const routes = [
  "/v2",
  "/v2/personajes",
  "/v2/personajes/mysha",
  "/v2/facciones",
  "/v2/facciones/coven-blanco",
  "/v2/lugares",
  "/v2/lugares/abismo",
  "/v2/dioses",
  "/v2/capitulos",
  "/v2/capitulos/80",
  "/v2/objetos",
  "/v2/objetos/carta-de-las-estrellas",
  "/v2/misterios",
  "/v2/mundo",
  "/v2/buscar",
  "/v2/mapa",
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const results = [];
for (const route of routes) {
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1800);
    const r = await page.evaluate(() => ({
      docH: document.documentElement.scrollHeight,
      winH: window.innerHeight,
    }));
    results.push({ route, viewport: r.winH, docHeight: r.docH, overflowPx: r.docH - r.winH });
  } catch (err) {
    results.push({ route, error: err.message.split("\n")[0] });
  }
}

console.log(`Viewport: ${w}x${h}\n`);
console.table(results);
await browser.close();
