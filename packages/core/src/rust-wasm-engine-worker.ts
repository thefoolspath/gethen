import type { RustWasmWorkerRequest, RustWasmWorkerResponse } from "./rust-wasm-worker-engine.js";
import { loadRustWasmKernels } from "./rust-wasm-kernels.js";

interface WorkerScope {
  readonly importScripts?: unknown;
  addEventListener(type: "message", listener: (event: MessageEvent<RustWasmWorkerRequest>) => void): void;
  postMessage(message: RustWasmWorkerResponse): void;
}

const scope = globalThis as unknown as WorkerScope;
const cancelled = new Set<string>();
const kernelsPromise = loadRustWasmKernels();

if (typeof scope.importScripts !== "undefined") {
  scope.addEventListener("message", (event) => {
    const request = event.data;
    if (request.type === "cancel") {
      cancelled.add(request.requestId);
      scope.postMessage({ type: "cancelled", requestId: request.requestId });
      return;
    }
    scope.postMessage({ type: "progress", requestId: request.requestId, stage: "accepted" });
    setTimeout(async () => {
      try {
        scope.postMessage({ type: "progress", requestId: request.requestId, stage: "loading" });
        const kernels = await kernelsPromise;
        if (cancelled.delete(request.requestId)) return;
        scope.postMessage({ type: "progress", requestId: request.requestId, stage: "compute" });
        const result = request.type === "filterAggregate"
          ? kernels.filterAggregate(request.values, request.validity, request.threshold)
          : request.type === "groupSum"
            ? kernels.groupSum(request.values, request.validity, request.groups, request.selectedGroup)
            : kernels.formulaSumProduct(request.left, request.right, request.validity);
        if (!cancelled.delete(request.requestId)) {
          scope.postMessage({ type: "result", requestId: request.requestId, result });
        }
      } catch (error) {
        scope.postMessage({
          type: "error",
          requestId: request.requestId,
          message: error instanceof Error ? error.message : "Unknown Rust/WASM Worker failure."
        });
      }
    }, 0);
  });
}
