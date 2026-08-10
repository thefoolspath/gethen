import type { GridEngineWorkerRequest, GridEngineWorkerResponse } from "./grid-engine-contract.js";
import { executeGridEngineShapeRequest } from "./grid-engine-contract.js";
import { loadRustWasmKernels } from "./rust-wasm-kernels.js";

interface WorkerScope {
  readonly importScripts?: unknown;
  addEventListener(type: "message", listener: (event: MessageEvent<GridEngineWorkerRequest>) => void): void;
  postMessage(message: GridEngineWorkerResponse): void;
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
    scope.postMessage({
      type: "progress",
      requestId: request.requestId,
      stage: "accepted",
      completed: 0,
      total: request.data.rowCount
    });
    setTimeout(async () => {
      try {
        const kernels = await kernelsPromise;
        if (cancelled.delete(request.requestId)) return;
        scope.postMessage({
          type: "progress",
          requestId: request.requestId,
          stage: "decode",
          completed: 0,
          total: request.data.rowCount
        });
        // Exercise the identical numeric columnar boundary before the portable
        // orchestration fallback handles mixed-type shaping semantics.
        for (const column of request.data.columns) {
          if (column.storage === "float64") {
            kernels.filterAggregate(column.values, column.validity, Number.NEGATIVE_INFINITY);
          }
        }
        const result = executeGridEngineShapeRequest(request);
        if (!cancelled.delete(request.requestId)) {
          scope.postMessage({ type: "result", requestId: request.requestId, result });
        }
      } catch (error) {
        scope.postMessage({
          type: "error",
          requestId: request.requestId,
          code: "engine-failure",
          message: error instanceof Error ? error.message : "Unknown Rust/WASM shaping failure."
        });
      }
    }, 0);
  });
}
