import { performance } from "node:perf_hooks";
import { Worker } from "node:worker_threads";

const rowCount = 100_000;
const warmupIterations = 5;
const measuredIterations = 15;
const values = Float64Array.from({ length: rowCount }, (_, index) => index * 5);
const validity = new Uint8Array(rowCount).fill(1);
const expected = { sum: 18_749_625_000, aboveThreshold: 49_999 };

async function startWorker(url) {
  const started = performance.now();
  const worker = new Worker(url);
  await new Promise((resolve, reject) => {
    const ready = (message) => {
      if (message.type === "ready") resolve();
    };
    worker.on("message", ready);
    worker.once("error", reject);
  });
  return { worker, startupMs: performance.now() - started };
}

async function runCandidate(name, url, rust) {
  const { worker, startupMs } = await startWorker(url);
  let requestId = 0;
  async function runOnce() {
    const id = ++requestId;
    const copyStarted = performance.now();
    const valuesBuffer = values.buffer.slice(0);
    const validityBuffer = validity.buffer.slice(0);
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
      if (rust) {
        worker.postMessage({ id, valuesBuffer, validityBuffer }, [valuesBuffer, validityBuffer]);
      } else {
        worker.postMessage({ id, buffer: valuesBuffer }, [valuesBuffer]);
      }
    });
    if (result.sum !== expected.sum || result.aboveThreshold !== expected.aboveThreshold) {
      throw new Error(`${name} returned a parity mismatch.`);
    }
    return { copyMs, roundTripMs: performance.now() - roundTripStarted };
  }
  for (let index = 0; index < warmupIterations; index += 1) await runOnce();
  const samples = [];
  for (let index = 0; index < measuredIterations; index += 1) samples.push(await runOnce());
  await worker.terminate();
  const percentile = (key, value) => {
    const sorted = samples.map((sample) => sample[key]).sort((left, right) => left - right);
    return sorted[Math.min(sorted.length - 1, Math.ceil(value * sorted.length) - 1)];
  };
  return {
    name,
    startupMs,
    warmupIterations,
    measuredIterations,
    copyMedianMs: percentile("copyMs", 0.5),
    roundTripMedianMs: percentile("roundTripMs", 0.5),
    roundTripP75Ms: percentile("roundTripMs", 0.75),
    roundTripP95Ms: percentile("roundTripMs", 0.95)
  };
}

const typescriptWorker = await runCandidate(
  "typescript-worker",
  new URL("./typescript-worker.mjs", import.meta.url),
  false
);
const rustWasmWorker = await runCandidate(
  "rust-wasm-worker",
  new URL("./rust-wasm-worker.mjs", import.meta.url),
  true
);

console.log(JSON.stringify({
  status: "Alpha 4 numeric worker boundary comparison; not final engine-selection evidence",
  dataset: { rowCount, columnCount: 1, schema: "Float64Array plus Uint8Array validity" },
  parity: expected,
  candidates: [typescriptWorker, rustWasmWorker],
  medianDifferencePercent: Math.abs(
    typescriptWorker.roundTripMedianMs - rustWasmWorker.roundTripMedianMs
  ) / Math.min(typescriptWorker.roundTripMedianMs, rustWasmWorker.roundTripMedianMs) * 100,
  selectionRule: "If full end-to-end candidates differ by no more than 10%, select Rust.",
  limitations: [
    "This comparison covers a transferable numeric filter/aggregate kernel and startup only.",
    "Final selection also requires ingestion, sort, text/null/date/JSON semantics, group, aggregate, formula, pivot, cancellation, browser memory, and bundle evidence."
  ]
}, null, 2));
