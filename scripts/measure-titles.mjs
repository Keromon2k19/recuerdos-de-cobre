import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1020 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const routes = [
  "/v2/personajes",
  "/v2/facciones",
  "/v2/lugares",
  "/v2/dioses",
  "/v2/capitulos",
  "/v2/archivos",
  "/v2/buscar",
  "/v2/mapa",
];

const out = [];
for (const r of routes) {
  await page.goto(`http://localhost:3000${r}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const head = document.querySelector(".av2-page-head");
    const title = document.querySelector(".av2-page-title");
    if (!head || !title) return { missing: true };
    return {
      title: title.textContent?.trim(),
      headHeight: Math.round(head.getBoundingClientRect().height * 100) / 100,
      titleHeight: Math.round(title.getBoundingClientRect().height * 100) / 100,
      fontSize: getComputedStyle(title).fontSize,
    };
  });
  out.push({ route: r, ...info });
}

console.table(out);
await browser.close();
