// Quick screenshot ad-hoc — bypassea el wait networkidle del script oficial.
// Uso: node scripts/quick-screenshot.mjs <out-path> [route] [selector]
import { chromium } from "playwright";
import { resolve } from "node:path";

const outPath = resolve(process.argv[2] || "tmp-shot.png");
const route = process.argv[3] || "/v2";
const selector = process.argv[4]; // optional CSS selector for element-only screenshot
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto(`http://localhost:3000${route}`, {
  waitUntil: "domcontentloaded",
  timeout: 30000,
});
await page.waitForTimeout(3000);

if (selector === "fullpage") {
  await page.screenshot({ path: outPath, fullPage: true });
} else if (selector) {
  const el = await page.locator(selector).first();
  await el.screenshot({ path: outPath });
} else {
  await page.screenshot({ path: outPath, fullPage: false });
}
await browser.close();
console.log(`saved ${outPath}`);
