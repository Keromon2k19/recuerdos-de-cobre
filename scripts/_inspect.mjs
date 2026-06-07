// Temporal: computed-style audit for V2 material surfaces.
import { chromium } from "playwright";

const base = process.env.V2_BASE_URL || "http://localhost:3000";
const channel = process.env.V2_BROWSER_CHANNEL?.trim() || undefined;
const browser = await chromium.launch(channel ? { channel } : undefined);
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();

const ROUTES = {
  home: {
    route: "/v2",
    selectors: [".av2-latest", ".av2-cast", ".av2-cast-card", ".av2-feature"],
  },
  kit: {
    route: "/v2/objetos",
    selectors: [".av2-narrative-frame", ".av2-domain-index", ".av2-domain-expediente"],
  },
  dioses: {
    route: "/v2/dioses",
    selectors: [".av2-gods-index", ".av2-god-profile", ".av2-god-detail", ".av2-god-symbol", ".av2-god-domain"],
  },
  facciones: {
    route: "/v2/facciones",
    selectors: [".av2-faction-index", ".av2-faction-stage", ".av2-faction-detail", ".av2-faction-node", ".av2-faction-detail-meta div"],
  },
  personajes: {
    route: "/v2/personajes",
    selectors: [".av2-filters", ".av2-personajes-main", ".av2-detail", ".av2-card", ".av2-grid-empty"],
  },
};

function compact(value) {
  if (!value || value === "none") return value || "none";
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

async function inspect(name, config) {
  await page.goto(base + config.route, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(600);
  const data = await page.evaluate((selectors) => {
    function fmt(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const before = getComputedStyle(el, "::before");
      const after = getComputedStyle(el, "::after");
      return {
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        radius: cs.borderTopLeftRadius,
        backdropFilter: cs.backdropFilter,
        webkitBackdropFilter: cs.webkitBackdropFilter,
        boxShadow: cs.boxShadow,
        before: before.content === "none"
          ? null
          : {
              borderTop: before.borderTopColor,
              borderLeft: before.borderLeftColor,
              width: before.width,
              height: before.height,
              background: before.backgroundImage,
            },
        after: after.content === "none"
          ? null
          : {
              borderRight: after.borderRightColor,
              borderBottom: after.borderBottomColor,
              width: after.width,
              height: after.height,
              background: after.backgroundImage,
            },
      };
    }
    return Object.fromEntries(selectors.map((selector) => [selector, fmt(selector)]));
  }, config.selectors);

  console.log(`\n=== ${name.toUpperCase()} ${config.route} ===`);
  for (const [selector, styles] of Object.entries(data)) {
    if (!styles) {
      console.log(`${selector}: missing`);
      continue;
    }
    console.log(selector);
    console.log({
      bg: styles.backgroundColor,
      bgImg: compact(styles.backgroundImage),
      border: styles.border,
      radius: styles.radius,
      blur: styles.backdropFilter,
      webkitBlur: styles.webkitBackdropFilter,
      shadow: compact(styles.boxShadow),
      before: styles.before,
      after: styles.after,
    });
  }
}

for (const [name, config] of Object.entries(ROUTES)) {
  await inspect(name, config);
}

await browser.close();
