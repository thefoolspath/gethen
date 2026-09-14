import { chromium } from "@playwright/test";

import { createStaticServer } from "../../scripts/serve-static.mjs";

const server = createStaticServer(0);
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();

if (!address || typeof address === "string") {
  server.close();
  throw new Error("Unable to determine Alpha 2 benchmark server address.");
}

const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch();

try {
  const results = [];

  for (const scenario of [
    { name: "customization_off", query: "?customization=off" },
    { name: "customization_on", query: "" }
  ]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(`${origin}/apps/core-demo/index.html${scenario.query}`);
    await page.waitForFunction(() => Number(document.querySelector("#renderedCells")?.textContent) > 0);
    const samplesMs = [];

    for (let iteration = 0; iteration < 20; iteration += 1) {
      await page.getByRole("grid").evaluate((grid, scrollTop) => {
        grid.scrollTop = scrollTop;
        grid.scrollLeft = (scrollTop / 32) % 5 * 132;
      }, (iteration + 1) * 3200);
      await page.waitForTimeout(25);
      const renderText = await page.locator("#renderTime").textContent();
      samplesMs.push(Number((renderText ?? "0 ms").replace(" ms", "")));
    }

    const ordered = [...samplesMs].sort((left, right) => left - right);
    results.push({
      name: scenario.name,
      measuredScrollRenders: samplesMs.length,
      medianMs: percentile(ordered, 0.5),
      p75Ms: percentile(ordered, 0.75),
      minMs: round(ordered[0]),
      maxMs: round(ordered.at(-1)),
      samplesMs
    });
    await page.close();
  }

  console.log(JSON.stringify({
    status: "repeat-scroll local Chromium Alpha 2 baseline; not release decision evidence",
    generatedAt: new Date().toISOString(),
    browser: "chromium",
    viewport: { width: 1280, height: 720 },
    dataset: { rowCount: 100000, visibleColumnCount: 50 },
    results,
    limitations: [
      "Uses renderer onRender timings rather than a DevTools frame trace.",
      "Single local Chromium process with repeated scroll positions.",
      "Does not measure framework change detection or low-end hardware."
    ]
  }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

function percentile(ordered, fraction) {
  return round(ordered[Math.floor((ordered.length - 1) * fraction)]);
}

function round(value) {
  return Number(value.toFixed(4));
}
