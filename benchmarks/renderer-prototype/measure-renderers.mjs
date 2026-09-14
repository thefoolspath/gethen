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
  throw new Error("Unable to determine renderer benchmark server address.");
}

const origin = `http://127.0.0.1:${address.port}`;
const scenarios = [
  {
    name: "virtualized_dom",
    url: `${origin}/apps/renderer-prototype/index.html`,
    countSelector: "#mountedCells",
    timeSelector: "#renderTime"
  },
  {
    name: "canvas_2d",
    url: `${origin}/apps/renderer-canvas-prototype/index.html`,
    countSelector: "#drawnCells",
    timeSelector: "#drawTime"
  }
];

function parseMs(text) {
  return Number(text.replace(" ms", ""));
}

async function readMetrics(page, scenario, label) {
  await page.waitForFunction(
    (selector) => Number(document.querySelector(selector)?.textContent ?? "0") > 0,
    scenario.countSelector
  );

  return {
    label,
    visibleCells: Number(await page.locator(scenario.countSelector).textContent()),
    renderMs: parseMs((await page.locator(scenario.timeSelector).textContent()) ?? "0 ms")
  };
}

async function measureScenario(browser, scenario) {
  const page = await browser.newPage({
    viewport: {
      width: 1280,
      height: 720
    }
  });
  const metrics = [];

  await page.goto(scenario.url);
  metrics.push(await readMetrics(page, scenario, "initial"));

  await page.locator("#grid").evaluate((grid) => {
    grid.scrollTop = 24000;
    grid.scrollLeft = 600;
    grid.dispatchEvent(new Event("scroll"));
  });
  await page.waitForTimeout(100);
  metrics.push(await readMetrics(page, scenario, "scroll_mid"));

  await page.locator("#grid").focus();
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(100);
  metrics.push(await readMetrics(page, scenario, "keyboard_move"));

  await page.close();

  return {
    name: scenario.name,
    metrics
  };
}

const browser = await chromium.launch();

try {
  const results = [];

  for (const scenario of scenarios) {
    results.push(await measureScenario(browser, scenario));
  }

  console.log(
    JSON.stringify(
      {
        status: "single local browser run; not accepted decision evidence",
        generatedAt: new Date().toISOString(),
        browser: "chromium",
        viewport: {
          width: 1280,
          height: 720
        },
        dataset: {
          rowCount: 100000,
          columnCount: 50
        },
        results,
        limitations: [
          "Single Chromium run only.",
          "Uses on-screen prototype counters instead of browser trace frame timing.",
          "Screen-reader and edit overlay behavior are not measured."
        ]
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}
