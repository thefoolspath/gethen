import os from "node:os";

import { chromium } from "@playwright/test";

import { createStaticServer } from "../../scripts/serve-static.mjs";

const server = createStaticServer(0);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Benchmark server did not bind.");

const browser = await chromium.launch({
  ...(process.env.GETHEN_BROWSER_CHANNEL === "chrome" ? { channel: "chrome" } : {}),
  args: ["--js-flags=--expose-gc", "--enable-precise-memory-info"]
});

try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}/apps/core-demo/index.html?sorting=none`);
  const runs = await page.evaluate(async () => {
    const [{ createAlpha4MixedTypeFixture }, core] = await Promise.all([
      import("/benchmarks/engine-bakeoff/alpha4-mixed-type-fixtures.mjs"),
      import("/packages/core/dist/index.js")
    ]);
    const engine = core.createGridWorkerEngine();
    const definition = core.createGridWorkerShapeDefinition({
      filter: [{ columnId: "number-02", operator: "greaterThan", value: -7_500, comparisonType: "number" }],
      viewport: { start: 0, count: 100 }
    });
    const observations = [];
    try {
      for (let iteration = 0; iteration < 4; iteration += 1) {
        globalThis.gc?.();
        const fixtureStart = performance.now();
        const fixture = createAlpha4MixedTypeFixture("fallback");
        const fixtureMs = performance.now() - fixtureStart;
        const progress = [];
        const started = performance.now();
        const result = await engine.shape({
          data: fixture.data,
          definition,
          onProgress: ({ stage }) => progress.push(stage)
        });
        const elapsedMs = performance.now() - started;
        if (result.filteredRowCount <= 0 || result.filteredRowCount >= 500_000 || result.rows.length !== 100
          || !progress.includes("filter")) throw new Error("Filter result or progress was incomplete.");
        observations.push({
          warmup: iteration === 0,
          fixtureMs,
          elapsedMs,
          filteredRowCount: result.filteredRowCount,
          returnedRowCount: result.rows.length,
          firstRowId: result.rows[0]?.id,
          heapBytes: performance.memory?.usedJSHeapSize ?? null
        });
      }
      if (new Set(observations.map((run) => `${run.filteredRowCount}:${run.firstRowId}`)).size !== 1) {
        throw new Error("Filter results differed between runs.");
      }
      return observations;
    } finally {
      engine.destroy();
    }
  });
  const measured = runs.filter((run) => !run.warmup).map((run) => run.elapsedMs).sort((a, b) => a - b);
  process.stdout.write(`${JSON.stringify({
    scenario: "Alpha 5 filter, 500,000 mixed-type rows by 50 columns, one number predicate, 100-row viewport",
    os: `${os.platform()} ${os.release()}`,
    cpu: os.cpus()[0]?.model,
    logicalCores: os.cpus().length,
    node: process.version,
    browser: browser.version(),
    warmupCount: 1,
    measuredCount: measured.length,
    medianMs: measured[1],
    rangeMs: [measured[0], measured.at(-1)],
    runs,
    limitations: "Local engine-only measurement. It excludes grid rendering, input latency, cancellation, long tasks, and cross-hardware evidence."
  }, null, 2)}\n`);
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
