import type { GridEngineWorkerRequest, GridEngineWorkerResponse } from "../../contracts/engine-contract.js";
import { prepareRustWasmFilterSortRequest } from "./rust-wasm-filter-sort.js";
import { executeRustWasmGroupShape } from "./rust-wasm-group-shaping.js";
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
        scope.postMessage({
          type: "progress",
          requestId: request.requestId,
          stage: "decode",
          completed: 0,
          total: request.data.rowCount
        });
        const kernels = await kernelsPromise;
        if (cancelled.delete(request.requestId)) return;
        scope.postMessage({
          type: "progress",
          requestId: request.requestId,
          stage: "decode",
          completed: request.data.rowCount,
          total: request.data.rowCount
        });
        const prepared = prepareRustWasmFilterSortRequest(request, kernels, (stage, completed, total) => {
          if (cancelled.has(request.requestId)) return;
          scope.postMessage({ type: "progress", requestId: request.requestId, stage, completed, total });
        });
        const result = executeRustWasmGroupShape(
          prepared.request,
          kernels,
          request.data.rowCount,
          prepared.filteredRowCount,
          (stage, completed, total) => {
            if (cancelled.has(request.requestId)) return;
            scope.postMessage({ type: "progress", requestId: request.requestId, stage, completed, total });
          }
        );
        if (!cancelled.delete(request.requestId)) {
          scope.postMessage({
            type: "progress",
            requestId: request.requestId,
            stage: "complete",
            completed: request.data.rowCount,
            total: request.data.rowCount
          });
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
