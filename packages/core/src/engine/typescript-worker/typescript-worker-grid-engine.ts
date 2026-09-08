import type { GridEngineWorkerRequest, GridEngineWorkerResponse } from "../../contracts/engine-contract.js";
import { getGridColumnarTransferables } from "../../contracts/engine-contract.js";
import type { GridDataShapingResult } from "../../shaping/grid-data-shaping.js";
import type { GridWorkerEngine, GridWorkerExecutionOptions } from "../grid-worker-engine.js";

export interface TypeScriptWorkerGridEngineOptions {
  readonly workerFactory?: () => Worker;
}

interface PendingRequest {
  readonly resolve: (result: GridDataShapingResult) => void;
  readonly reject: (error: Error) => void;
  readonly onProgress: GridWorkerExecutionOptions["onProgress"];
  readonly removeAbortListener?: () => void;
}

export class TypeScriptWorkerGridEngine implements GridWorkerEngine {
  readonly #worker: Worker;
  readonly #pending = new Map<string, PendingRequest>();
  #nextRequestId = 0;
  #disposed = false;

  constructor(options: TypeScriptWorkerGridEngineOptions = {}) {
    this.#worker = options.workerFactory?.()
      ?? new Worker(new URL("./grid-engine-worker.js", import.meta.url), { type: "module", name: "gethen-typescript-engine" });
    this.#worker.addEventListener("message", this.handleMessage);
    this.#worker.addEventListener("error", this.handleWorkerError);
  }

  shape(options: GridWorkerExecutionOptions): Promise<GridDataShapingResult> {
    if (this.#disposed) return Promise.reject(new Error("The TypeScript Worker engine is disposed."));
    if (options.signal?.aborted) return Promise.reject(createAbortError());
    const requestId = `shape-${++this.#nextRequestId}`;
    return new Promise((resolve, reject) => {
      const abort = (): void => {
        const pending = this.#pending.get(requestId);
        if (!pending) return;
        this.#pending.delete(requestId);
        pending.removeAbortListener?.();
        this.#worker.postMessage({ type: "cancel", requestId } satisfies GridEngineWorkerRequest);
        pending.reject(createAbortError());
      };
      options.signal?.addEventListener("abort", abort, { once: true });
      this.#pending.set(requestId, {
        resolve,
        reject,
        onProgress: options.onProgress,
        ...(options.signal ? { removeAbortListener: () => options.signal!.removeEventListener("abort", abort) } : {})
      });
      const request: GridEngineWorkerRequest = {
        type: "shape",
        requestId,
        data: options.data,
        definition: options.definition
      };
      this.#worker.postMessage(request, [...getGridColumnarTransferables(options.data)]);
    });
  }

  destroy(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#worker.removeEventListener("message", this.handleMessage);
    this.#worker.removeEventListener("error", this.handleWorkerError);
    this.#worker.terminate();
    for (const pending of this.#pending.values()) {
      pending.removeAbortListener?.();
      pending.reject(new Error("The TypeScript Worker engine was destroyed."));
    }
    this.#pending.clear();
  }

  private readonly handleMessage = (event: MessageEvent<GridEngineWorkerResponse>): void => {
    const response = event.data;
    const pending = this.#pending.get(response.requestId);
    if (!pending) return;
    if (response.type === "progress") {
      pending.onProgress?.(response);
      return;
    }
    this.#pending.delete(response.requestId);
    pending.removeAbortListener?.();
    if (response.type === "result") pending.resolve(response.result);
    else if (response.type === "cancelled") pending.reject(createAbortError());
    else pending.reject(new Error(`${response.code}: ${response.message}`));
  };

  private readonly handleWorkerError = (event: ErrorEvent): void => {
    for (const pending of this.#pending.values()) {
      pending.removeAbortListener?.();
      pending.reject(new Error(event.message || "The TypeScript Worker engine failed."));
    }
    this.#pending.clear();
  };
}

export function createTypeScriptWorkerGridEngine(
  options?: TypeScriptWorkerGridEngineOptions
): TypeScriptWorkerGridEngine {
  return new TypeScriptWorkerGridEngine(options);
}

function createAbortError(): Error {
  return new DOMException("The grid engine request was cancelled.", "AbortError");
}
