import type {
  RustWasmWorkerRequest,
  RustWasmWorkerResponse
} from "../rust-wasm-worker/rust-wasm-worker-engine.js";
import {
  typescriptFilterAggregate,
  typescriptFormulaSumProduct,
  typescriptGroupSum
} from "../../shaping/typescript-kernels.js";

interface WorkerScope {
  readonly importScripts?: unknown;
  addEventListener(type: "message", listener: (event: MessageEvent<RustWasmWorkerRequest>) => void): void;
  postMessage(message: RustWasmWorkerResponse): void;
}

const scope = globalThis as unknown as WorkerScope;
const cancelled = new Set<string>();

if (typeof scope.importScripts !== "undefined") {
  scope.addEventListener("message", (event) => {
    const request = event.data;
    if (request.type === "cancel") {
      cancelled.add(request.requestId);
      scope.postMessage({ type: "cancelled", requestId: request.requestId });
      return;
    }
    scope.postMessage({ type: "progress", requestId: request.requestId, stage: "accepted" });
    setTimeout(() => {
      try {
        scope.postMessage({ type: "progress", requestId: request.requestId, stage: "loading" });
        if (cancelled.delete(request.requestId)) return;
        scope.postMessage({ type: "progress", requestId: request.requestId, stage: "compute" });
        const result = request.type === "filterAggregate"
          ? typescriptFilterAggregate(request.values, request.validity, request.threshold)
          : request.type === "groupSum"
            ? typescriptGroupSum(request.values, request.validity, request.groups, request.selectedGroup)
            : typescriptFormulaSumProduct(request.left, request.right, request.validity);
        if (!cancelled.delete(request.requestId)) {
          scope.postMessage({ type: "result", requestId: request.requestId, result });
        }
      } catch (error) {
        scope.postMessage({
          type: "error",
          requestId: request.requestId,
          message: error instanceof Error ? error.message : "Unknown TypeScript Worker failure."
        });
      }
    }, 0);
  });
}
