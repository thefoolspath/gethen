import { readFile } from "node:fs/promises";
import { parentPort } from "node:worker_threads";

import { RustWasmKernels } from "../../packages/core/dist/rust-wasm-kernels.js";

if (!parentPort) throw new Error("The Rust/WASM benchmark must run in a worker thread.");
const bytes = await readFile(new URL("../../packages/core/dist/gethen_engine.wasm", import.meta.url));
const { instance } = await WebAssembly.instantiate(bytes, {});
const kernels = new RustWasmKernels(instance.exports);

parentPort.on("message", ({ id, valuesBuffer, validityBuffer }) => {
  const result = kernels.filterAggregate(
    new Float64Array(valuesBuffer),
    new Uint8Array(validityBuffer),
    250_000
  );
  parentPort.postMessage({ id, sum: result.sum, aboveThreshold: result.count });
});

parentPort.postMessage({ type: "ready" });
