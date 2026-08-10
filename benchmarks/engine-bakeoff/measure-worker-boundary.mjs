import { performance } from "node:perf_hooks";
import { Worker } from "node:worker_threads";

const rowCount = 100_000;
const warmupIterations = 5;
const measuredIterations = 15;
const values = Float64Array.from({ length: rowCount }, (_, index) => index * 5);
const workerUrl = new URL("./typescript-worker.mjs", import.meta.url);

const startupStarted = performance.now();
const worker = new Worker(workerUrl);
await new Promise((resolve, reject) => {
  worker.once("online", resolve);
  worker.once("error", reject);
});
const startupMs = performance.now() - startupStarted;
let requestId = 0;

async function runOnce() {
  const id = ++requestId;
  const copyStarted = performance.now();
  const buffer = values.buffer.slice(0);
  const copyMs = performance.now() - copyStarted;
  const roundTripStarted = performance.now();
  const result = await new Promise((resolve, reject) => {
    const onMessage = (message) => {
      if (message.id !== id) return;
      worker.off("error", onError);
      resolve(message);
    };
    const onError = (error) => {
      worker.off("message", onMessage);
      reject(error);
    };
    worker.once("message", onMessage);
    worker.once("error", onError);
    worker.postMessage({ id, buffer }, [buffer]);
  });
  if (result.sum !== 24_999_750_000 || result.aboveThreshold !== 49_999) {
    throw new Error("TypeScript Worker returned a non-deterministic result.");
  }
  return { copyMs, roundTripMs: performance.now() - roundTripStarted };
}

for (let index = 0; index < warmupIterations; index += 1) await runOnce();
const samples = [];
for (let index = 0; index < measuredIterations; index += 1) samples.push(await runOnce());
await worker.terminate();

function percentile(key, value) {
  const sorted = samples.map((sample) => sample[key]).sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(value * sorted.length) - 1)];
}

console.log(JSON.stringify({
  status: "Alpha 3 boundary harness; not engine-selection evidence",
  dataset: { rowCount, columnCount: 1, schema: "Float64Array transferable column" },
  typescriptWorker: {
    startupMs,
    warmupIterations,
    measuredIterations,
    copyMedianMs: percentile("copyMs", 0.5),
    roundTripMedianMs: percentile("roundTripMs", 0.5),
    roundTripP75Ms: percentile("roundTripMs", 0.75),
    roundTripP95Ms: percentile("roundTripMs", 0.95)
  },
  rustWasmWorker: {
    status: "pending Alpha 4 implementation against this boundary"
  },
  limitations: [
    "This harness validates transferable columnar buffers and repeatable distributions only.",
    "It does not yet include ingestion, sort, group, aggregate, formula, pivot, browser Worker, memory, bundle, or cancellation evidence."
  ]
}, null, 2));
