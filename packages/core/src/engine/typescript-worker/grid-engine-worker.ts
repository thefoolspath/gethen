import type { GridEngineWorkerRequest, GridEngineWorkerResponse } from "../../contracts/engine-contract.js";
import { executeGridEngineShapeRequestInStages } from "../../contracts/engine-contract.js";

interface PortableWorkerScope {
  addEventListener(type: "message", listener: (event: MessageEvent<GridEngineWorkerRequest>) => void): void;
  postMessage(message: GridEngineWorkerResponse): void;
  readonly importScripts?: unknown;
}

const scope = globalThis as unknown as PortableWorkerScope;
const cancelled = new Set<string>();

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
      if (cancelled.delete(request.requestId)) return;
      try {
        const result = await executeGridEngineShapeRequestInStages(request, {
          onProgress: (stage, completed, total) => {
            if (cancelled.has(request.requestId)) return;
            scope.postMessage({
              type: "progress",
              requestId: request.requestId,
              stage,
              completed,
              total
            });
          },
          yieldControl: yieldToWorkerEventLoop
        });
        if (cancelled.delete(request.requestId)) return;
        scope.postMessage({ type: "result", requestId: request.requestId, result });
      } catch (error) {
        scope.postMessage({
          type: "error",
          requestId: request.requestId,
          code: "engine-failure",
          message: error instanceof Error ? error.message : "Unknown TypeScript Worker failure."
        });
      }
    }, 0);
  });
}

function yieldToWorkerEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
