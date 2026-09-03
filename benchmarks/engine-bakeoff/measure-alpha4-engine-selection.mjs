import { statSync } from "node:fs";
import os from "node:os";

import { chromium } from "@playwright/test";

import { createStaticServer } from "../../scripts/serve-static.mjs";

const profile = readProfile(process.argv.slice(2));
const measuredIterations = profile === "small" ? 3 : profile === "fallback" ? 2 : 1;
const kernelRowCount = profile === "small" ? 100_000 : profile === "fallback" ? 500_000 : 1_000_000;
const server = createStaticServer(0);
await listen(server);
const address = server.address();
if (!address || typeof address === "string") throw new Error("Unable to determine benchmark server address.");

const browser = await chromium.launch({ args: ["--js-flags=--expose-gc"] });
let evidence;
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}/apps/core-demo/index.html`);
  evidence = await page.evaluate(async ({ profileName, iterations, primitiveRows }) => {
    const [{ createAlpha4MixedTypeFixture }, core] = await Promise.all([
      import("/benchmarks/engine-bakeoff/alpha4-mixed-type-fixtures.mjs"),
      import("/packages/core/dist/index.js")
    ]);
    const definition = core.createGridWorkerShapeDefinition({
      filter: [
        { columnId: "number-02", operator: "greaterThan", value: -7_500, comparisonType: "number" },
        { columnId: "text-00", operator: "contains", value: "a", comparisonType: "text" },
        { columnId: "date-00", operator: "greaterThanOrEqual", value: "2021-01-01", comparisonType: "date" }
      ],
      sort: [
        { columnId: "json-00", direction: "asc", comparisonType: "json", nulls: "last" },
        { columnId: "number-03", direction: "desc", comparisonType: "number", nulls: "last" }
      ],
      group: [
        { columnId: "boolean-01", comparisonType: "boolean" },
        { columnId: "text-02", comparisonType: "text" }
      ],
      aggregate: [
        { id: "rowCount", operation: "count" },
        { id: "valueSum", operation: "sum", columnId: "number-04" },
        { id: "valueAverage", operation: "average", columnId: "number-04" }
      ],
      expandedGroupIds: "all",
      viewport: { start: 0, count: 100 }
    });

    const candidateFactories = [
      ["typescript-worker", core.createTypeScriptWorkerGridEngine],
      ["rust-wasm-worker", core.createRustWasmWorkerGridEngine]
    ];
    const candidates = [];
    for (const [name, createEngine] of candidateFactories) {
      globalThis.gc?.();
      const heapBeforeBytes = performance.memory?.usedJSHeapSize ?? null;
      const engine = createEngine();
      const runs = [];
      let canonicalResult;
      try {
        for (let index = 0; index < iterations + 1; index += 1) {
          const fixtureStarted = performance.now();
          const fixture = createAlpha4MixedTypeFixture(profileName);
          const fixtureMs = performance.now() - fixtureStarted;
          const progress = [];
          const responsiveness = startResponsivenessProbe();
          const started = performance.now();
          const result = await engine.shape({
            data: fixture.data,
            definition,
            onProgress: ({ stage, completed, total }) => progress.push(`${stage}:${completed}/${total}`)
          });
          const elapsedMs = performance.now() - started;
          const responsivenessResult = await responsiveness.stop();
          const serialized = JSON.stringify(result);
          canonicalResult ??= serialized;
          if (serialized !== canonicalResult) throw new Error(`${name} returned a non-deterministic result.`);
          runs.push({
            warmup: index === 0,
            fixtureMs,
            elapsedMs,
            progress,
            responsiveness: responsivenessResult,
            resultSummary: summarizeShapeResult(result)
          });
        }
      } finally {
        engine.destroy();
      }
      globalThis.gc?.();
      const heapAfterBytes = performance.memory?.usedJSHeapSize ?? null;
      candidates.push({
        name,
        heapBeforeBytes,
        heapAfterBytes,
        retainedHeapDeltaBytes: heapBeforeBytes === null || heapAfterBytes === null
          ? null
          : heapAfterBytes - heapBeforeBytes,
        runs,
        canonicalResult
      });
    }

    const cancellation = [];
    for (const [name, createEngine] of candidateFactories) {
      const engine = createEngine();
      const controller = new AbortController();
      const fixture = createAlpha4MixedTypeFixture(profileName === "primary" ? "fallback" : profileName);
      const progress = [];
      const started = performance.now();
      let outcome = "resolved";
      try {
        await engine.shape({
          data: fixture.data,
          definition,
          signal: controller.signal,
          onProgress: ({ stage }) => {
            progress.push(stage);
            if (stage === "accepted") controller.abort();
          }
        });
      } catch (error) {
        outcome = error instanceof DOMException && error.name === "AbortError" ? "aborted" : `error:${String(error)}`;
      } finally {
        engine.destroy();
      }
      cancellation.push({ name, outcome, elapsedMs: performance.now() - started, progress });
    }

    const kernels = await measureKernels(primitiveRows, iterations);
    const measuredCandidates = candidates.map((candidate) => ({
      ...candidate,
      canonicalResult: undefined,
      measuredMedianMs: median(candidate.runs.filter((run) => !run.warmup).map((run) => run.elapsedMs))
    }));
    return {
      candidates: measuredCandidates,
      shapeParity: candidates[0].canonicalResult === candidates[1].canonicalResult,
      progressParity: JSON.stringify(candidates[0].runs.at(-1)?.progress)
        === JSON.stringify(candidates[1].runs.at(-1)?.progress),
      cancellation,
      cancellationParity: cancellation.every((result) => result.outcome === "aborted")
        && JSON.stringify(cancellation[0].progress) === JSON.stringify(cancellation[1].progress),
      kernels
    };

    async function measureKernels(rowCount, runCount) {
      const workerUrls = [
        ["typescript-worker", "/packages/core/dist/engine/typescript-worker/typescript-kernel-worker.js"],
        ["rust-wasm-worker", "/packages/core/dist/engine/rust-wasm-worker/rust-wasm-engine-worker.js"]
      ];
      const results = [];
      for (const [name, url] of workerUrls) {
        const worker = new Worker(url, { type: "module" });
        let sequence = 0;
        const workloads = [];
        try {
          for (const operation of ["filterAggregate", "groupSum", "formulaSumProduct"]) {
            const runs = [];
            let expected;
            for (let index = 0; index < runCount + 1; index += 1) {
              const requestId = `${name}-${operation}-${++sequence}`;
              const request = createKernelRequest(operation, requestId, rowCount);
              const started = performance.now();
              const response = await postWorkerRequest(worker, request.message, request.transfer, requestId);
              const elapsedMs = performance.now() - started;
              expected ??= JSON.stringify(response.result);
              if (JSON.stringify(response.result) !== expected) {
                throw new Error(`${name} returned non-deterministic ${operation} output.`);
              }
              runs.push({ warmup: index === 0, elapsedMs, progress: response.progress, result: response.result });
            }
            workloads.push({ operation, runs, medianMs: median(runs.filter((run) => !run.warmup).map((run) => run.elapsedMs)) });
          }
        } finally {
          worker.terminate();
        }
        results.push({ name, workloads });
      }
      return {
        rowCount,
        candidates: results,
        parity: results[0].workloads.every((workload, index) =>
          JSON.stringify(workload.runs.at(-1)?.result)
            === JSON.stringify(results[1].workloads[index].runs.at(-1)?.result)
        ),
        progressParity: results[0].workloads.every((workload, index) =>
          JSON.stringify(workload.runs.at(-1)?.progress)
            === JSON.stringify(results[1].workloads[index].runs.at(-1)?.progress)
        )
      };
    }

    function createKernelRequest(type, requestId, rowCount) {
      const values = Float64Array.from({ length: rowCount }, (_, index) => index % 1_001 - 500);
      const validity = Uint8Array.from({ length: rowCount }, (_, index) => index % 23 === 0 ? 0 : 1);
      if (type === "filterAggregate") {
        return { message: { type, requestId, values, validity, threshold: 125 }, transfer: [values.buffer, validity.buffer] };
      }
      if (type === "groupSum") {
        const groups = Uint32Array.from({ length: rowCount }, (_, index) => index % 64);
        return { message: { type, requestId, values, validity, groups, selectedGroup: 7 }, transfer: [values.buffer, validity.buffer, groups.buffer] };
      }
      const right = Float64Array.from({ length: rowCount }, (_, index) => index % 17 + 1);
      return { message: { type, requestId, left: values, right, validity }, transfer: [values.buffer, right.buffer, validity.buffer] };
    }

    function postWorkerRequest(worker, message, transfer, requestId) {
      return new Promise((resolve, reject) => {
        const progress = [];
        const onMessage = (event) => {
          if (event.data.requestId !== requestId) return;
          if (event.data.type === "progress") {
            progress.push(event.data.stage);
            return;
          }
          cleanup();
          if (event.data.type === "result") resolve({ result: event.data.result, progress });
          else reject(new Error(event.data.message ?? "Kernel Worker request failed."));
        };
        const onError = (event) => {
          cleanup();
          reject(new Error(event.message));
        };
        const cleanup = () => {
          worker.removeEventListener("message", onMessage);
          worker.removeEventListener("error", onError);
        };
        worker.addEventListener("message", onMessage);
        worker.addEventListener("error", onError);
        worker.postMessage(message, transfer);
      });
    }

    function startResponsivenessProbe() {
      let active = true;
      let frameCount = 0;
      let maximumFrameGapMs = 0;
      let previous = performance.now();
      const tick = (timestamp) => {
        maximumFrameGapMs = Math.max(maximumFrameGapMs, timestamp - previous);
        previous = timestamp;
        frameCount += 1;
        if (active) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return {
        async stop() {
          active = false;
          await new Promise((resolve) => requestAnimationFrame(resolve));
          return { frameCount, maximumFrameGapMs };
        }
      };
    }

    function summarizeShapeResult(result) {
      return {
        sourceRowCount: result.sourceRowCount,
        filteredRowCount: result.filteredRowCount,
        totalViewRowCount: result.totalViewRowCount,
        returnedRowCount: result.rows.length,
        groupRowCount: result.rows.filter((row) => row.kind === "group").length
      };
    }

    function median(values) {
      const sorted = [...values].sort((left, right) => left - right);
      return sorted[Math.floor(sorted.length / 2)] ?? 0;
    }
  }, { profileName: profile, iterations: measuredIterations, primitiveRows: kernelRowCount });
} finally {
  await browser.close();
  await close(server);
}

const typescriptMs = evidence.candidates.find((candidate) => candidate.name === "typescript-worker").measuredMedianMs;
const rustMs = evidence.candidates.find((candidate) => candidate.name === "rust-wasm-worker").measuredMedianMs;
const differencePercent = Math.abs(typescriptMs - rustMs) / Math.min(typescriptMs, rustMs) * 100;
const gatesPass = evidence.shapeParity
  && evidence.progressParity
  && evidence.cancellationParity
  && evidence.kernels.parity
  && evidence.kernels.progressParity;
const recommendation = profile === "small"
  ? "No production selection: run the fallback or primary profile."
  : !gatesPass
    ? "No production selection: one or more parity gates failed."
    : differencePercent <= 10
      ? "rust-wasm-worker"
      : rustMs < typescriptMs
        ? "rust-wasm-worker"
        : "typescript-worker";

console.log(JSON.stringify({
  status: profile === "small" ? "Alpha 4 diagnostic" : "Alpha 4 engine-selection evidence",
  generatedAt: new Date().toISOString(),
  environment: {
    platform: process.platform,
    release: os.release(),
    arch: process.arch,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    node: process.version,
    browser: browser.version()
  },
  dataset: { profile, rowCount: evidence.candidates[0].runs[0].resultSummary.sourceRowCount, columnCount: 50 },
  measuredIterations,
  assets: readAssetSizes(),
  evidence,
  decision: { gatesPass, differencePercent, rule: "Select Rust at <=10% difference; otherwise select the faster candidate.", recommendation },
  limitations: [
    "Peak browser memory is not portable across Chromium versions; retained JS heap is reported when performance.memory is available.",
    "Formula and pivot-style evidence uses numeric sum-product and grouped-sum kernels; Alpha 6/7 feature semantics remain milestone-owned.",
    "Bundle sizes list candidate-specific entry assets and WASM, not shared Core modules or compressed network transfer size."
  ]
}, null, 2));

function readProfile(args) {
  const value = args.find((argument) => argument.startsWith("--profile="))?.split("=")[1] ?? "small";
  if (!["small", "fallback", "primary"].includes(value)) throw new Error("Expected --profile=small, fallback, or primary.");
  return value;
}

function readAssetSizes() {
  const assets = [
    "packages/core/dist/engine/typescript-worker/grid-engine-worker.js",
    "packages/core/dist/engine/typescript-worker/typescript-kernel-worker.js",
    "packages/core/dist/engine/rust-wasm-worker/rust-wasm-shape-worker.js",
    "packages/core/dist/engine/rust-wasm-worker/rust-wasm-engine-worker.js",
    "packages/core/dist/engine/rust-wasm-worker/gethen_engine.wasm"
  ];
  return Object.fromEntries(assets.map((path) => [path, statSync(path).size]));
}

function listen(target) {
  return new Promise((resolve, reject) => {
    target.once("error", reject);
    target.listen(0, "127.0.0.1", resolve);
  });
}

function close(target) {
  return new Promise((resolve, reject) => target.close((error) => error ? reject(error) : resolve()));
}
