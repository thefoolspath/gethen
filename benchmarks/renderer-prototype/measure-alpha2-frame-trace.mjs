import os from "node:os";
import { performance } from "node:perf_hooks";

import { chromium } from "@playwright/test";

import { createStaticServer } from "../../scripts/serve-static.mjs";

const measuredRuns = 3;
const measuredAnimationFrames = 120;
const server = createStaticServer(0);
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();

if (!address || typeof address === "string") {
  server.close();
  throw new Error("Unable to determine Alpha 2 frame-trace server address.");
}

const origin = `http://127.0.0.1:${address.port}`;
const scenarios = [
  { name: "customization_off", query: "?customization=off" },
  { name: "customization_on", query: "" }
];
const results = [];
let browserVersion = "unknown";

try {
  for (const scenario of scenarios) {
    const runs = [];

    for (let runIndex = 0; runIndex < measuredRuns; runIndex += 1) {
      const browser = await chromium.launch();
      browserVersion = browser.version();

      try {
        runs.push(await measureRun(browser, scenario, runIndex));
      } finally {
        await browser.close();
      }
    }

    results.push(summarizeScenario(scenario.name, runs));
  }

  console.log(JSON.stringify({
    status: "repeat-process local Chromium DevTools-style trace; not a cross-hardware release claim",
    generatedAt: new Date().toISOString(),
    environment: {
      platform: process.platform,
      release: os.release(),
      arch: process.arch,
      cpu: os.cpus()[0]?.model ?? "unknown",
      logicalCores: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      node: process.version,
      browser: browserVersion
    },
    viewport: { width: 1280, height: 720 },
    dataset: { rowCount: 100000, visibleColumnCount: 50 },
    method: {
      measuredRuns,
      warmupAnimationFrames: 30,
      measuredAnimationFrames,
      traceCategories: [
        "devtools.timeline",
        "toplevel",
        "benchmark",
        "cc",
        "disabled-by-default-devtools.timeline.frame"
      ]
    },
    provisionalBudget: {
      medianFrameIntervalMs: 16.7,
      repeatedLongTaskThresholdMs: 50
    },
    results,
    limitations: [
      "Local headless Chromium only; hardware and headed-browser matrices remain future release evidence.",
      "Frame intervals are derived from DevTools trace DrawFrame events and include scheduler variability.",
      "Heap metrics are point-in-time Chromium Performance-domain values, not retained-heap snapshots.",
      "The benchmark scrolls a fixed-size-cell demo and does not include framework change detection."
    ]
  }, null, 2));
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

async function measureRun(browser, scenario, runIndex) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await page.goto(`${origin}/apps/core-demo/index.html${scenario.query}`);
  await page.waitForFunction(() => Number(document.querySelector("#renderedCells")?.textContent) > 0);
  await animateScroll(page, 30, 192);
  await session.send("Performance.enable");
  const heapBefore = metricValue(await session.send("Performance.getMetrics"), "JSHeapUsedSize");
  const traceEvents = [];
  session.on("Tracing.dataCollected", ({ value }) => traceEvents.push(...value));
  await session.send("Tracing.start", {
    categories: [
      "devtools.timeline",
      "toplevel",
      "benchmark",
      "cc",
      "disabled-by-default-devtools.timeline.frame"
    ].join(","),
    options: "record-as-much-as-possible",
    transferMode: "ReportEvents"
  });
  const started = performance.now();
  await animateScroll(page, measuredAnimationFrames, 256);
  const animationDurationMs = performance.now() - started;
  const tracingComplete = new Promise((resolve) => session.once("Tracing.tracingComplete", resolve));
  await session.send("Tracing.end");
  await tracingComplete;
  const heapAfter = metricValue(await session.send("Performance.getMetrics"), "JSHeapUsedSize");
  await session.send("Performance.disable");
  await session.detach();
  await context.close();

  const frameIntervalsMs = frameIntervals(traceEvents);
  const taskDurationsMs = traceEvents
    .filter((event) => event.name?.endsWith("RunTask") && event.ph === "X" && typeof event.dur === "number")
    .map((event) => event.dur / 1000);
  const orderedFrames = [...frameIntervalsMs].sort((left, right) => left - right);
  const orderedTasks = [...taskDurationsMs].sort((left, right) => left - right);

  return {
    run: runIndex + 1,
    animationDurationMs: round(animationDurationMs),
    tracedFrameCount: frameIntervalsMs.length,
    medianFrameIntervalMs: percentile(orderedFrames, 0.5),
    p75FrameIntervalMs: percentile(orderedFrames, 0.75),
    p95FrameIntervalMs: percentile(orderedFrames, 0.95),
    maxFrameIntervalMs: maximum(orderedFrames),
    taskCount: taskDurationsMs.length,
    p95TaskDurationMs: percentile(orderedTasks, 0.95),
    maxTaskDurationMs: maximum(orderedTasks),
    longTaskCount: taskDurationsMs.filter((duration) => duration > 50).length,
    heapBeforeBytes: heapBefore,
    heapAfterBytes: heapAfter,
    heapDeltaBytes: heapAfter - heapBefore
  };
}

async function animateScroll(page, frameCount, pixelsPerFrame) {
  await page.getByRole("grid").evaluate(
    async (grid, input) => {
      for (let frame = 0; frame < input.frameCount; frame += 1) {
        grid.scrollTop = (grid.scrollTop + input.pixelsPerFrame) % Math.max(1, grid.scrollHeight - grid.clientHeight);
        grid.scrollLeft = frame % 12 * 132;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    },
    { frameCount, pixelsPerFrame }
  );
}

function frameIntervals(events) {
  const drawFrameTimestamps = events
    .filter((event) => event.name === "DrawFrame" && typeof event.ts === "number")
    .map((event) => event.ts)
    .sort((left, right) => left - right);
  const intervals = [];

  for (let index = 1; index < drawFrameTimestamps.length; index += 1) {
    const intervalMs = (drawFrameTimestamps[index] - drawFrameTimestamps[index - 1]) / 1000;

    if (intervalMs > 0 && intervalMs < 1000) {
      intervals.push(intervalMs);
    }
  }

  return intervals;
}

function summarizeScenario(name, runs) {
  const medians = runs.map((run) => run.medianFrameIntervalMs).sort((left, right) => left - right);
  const p95Values = runs.map((run) => run.p95FrameIntervalMs).sort((left, right) => left - right);
  return {
    name,
    medianOfRunMediansMs: percentile(medians, 0.5),
    medianOfRunP95sMs: percentile(p95Values, 0.5),
    totalLongTaskCount: runs.reduce((total, run) => total + run.longTaskCount, 0),
    heapDeltaRangeBytes: {
      min: Math.min(...runs.map((run) => run.heapDeltaBytes)),
      max: Math.max(...runs.map((run) => run.heapDeltaBytes))
    },
    runs
  };
}

function metricValue(result, name) {
  return result.metrics.find((metric) => metric.name === name)?.value ?? 0;
}

function percentile(ordered, fraction) {
  if (ordered.length === 0) {
    return 0;
  }

  return round(ordered[Math.floor((ordered.length - 1) * fraction)]);
}

function maximum(ordered) {
  return ordered.length === 0 ? 0 : round(ordered.at(-1));
}

function round(value) {
  return Number(value.toFixed(4));
}
