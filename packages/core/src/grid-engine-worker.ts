import type { GridEngineWorkerRequest, GridEngineWorkerResponse } from "./grid-engine-contract.js";
import { executeGridEngineShapeRequest } from "./grid-engine-contract.js";

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
    setTimeout(() => {
      if (cancelled.delete(request.requestId)) return;
      try {
        scope.postMessage({
          type: "progress",
          requestId: request.requestId,
          stage: "decode",
          completed: 0,
          total: request.data.rowCount
        });
        const result = executeGridEngineShapeRequest(request);
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
