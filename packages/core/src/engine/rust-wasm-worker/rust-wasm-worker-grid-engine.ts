import { TypeScriptWorkerGridEngine } from "../typescript-worker/typescript-worker-grid-engine.js";

export function createRustWasmWorkerGridEngine(): TypeScriptWorkerGridEngine {
  return new TypeScriptWorkerGridEngine({
    workerFactory: () => new Worker(new URL("./rust-wasm-shape-worker.js", import.meta.url), {
      type: "module",
      name: "gethen-rust-wasm-shaping-engine"
    })
  });
}
