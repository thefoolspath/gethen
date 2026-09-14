import type { RustWasmFilterAggregateResult } from "./rust-wasm-kernels.js";

export type RustWasmWorkerRequest =
  | {
      readonly type: "filterAggregate";
      readonly requestId: string;
      readonly values: Float64Array;
      readonly validity: Uint8Array;
      readonly threshold: number;
    }
  | {
      readonly type: "groupSum";
      readonly requestId: string;
      readonly values: Float64Array;
      readonly validity: Uint8Array;
      readonly groups: Uint32Array;
      readonly selectedGroup: number;
    }
  | {
      readonly type: "formulaSumProduct";
      readonly requestId: string;
      readonly left: Float64Array;
      readonly right: Float64Array;
      readonly validity: Uint8Array;
    }
  | { readonly type: "cancel"; readonly requestId: string };

export type RustWasmWorkerResponse =
  | {
      readonly type: "progress";
      readonly requestId: string;
      readonly stage: "accepted" | "loading" | "compute";
    }
  | {
      readonly type: "result";
      readonly requestId: string;
      readonly result: RustWasmFilterAggregateResult | number;
    }
  | { readonly type: "cancelled"; readonly requestId: string }
  | { readonly type: "error"; readonly requestId: string; readonly message: string };

type RustWasmWorkerOperation =
  | Omit<Extract<RustWasmWorkerRequest, { type: "filterAggregate" }>, "requestId">
  | Omit<Extract<RustWasmWorkerRequest, { type: "groupSum" }>, "requestId">
  | Omit<Extract<RustWasmWorkerRequest, { type: "formulaSumProduct" }>, "requestId">;

export interface RustWasmWorkerEngineOptions {
  readonly workerFactory?: () => Worker;
}

export interface RustWasmWorkerCallOptions {
  readonly signal?: AbortSignal;
  readonly onProgress?: (stage: Extract<RustWasmWorkerResponse, { type: "progress" }>["stage"]) => void;
}

interface Pending {
  readonly resolve: (value: RustWasmFilterAggregateResult | number) => void;
  readonly reject: (error: Error) => void;
  readonly onProgress: RustWasmWorkerCallOptions["onProgress"];
  readonly removeAbort?: () => void;
}

export class RustWasmWorkerEngine {
  readonly #worker: Worker;
  readonly #pending = new Map<string, Pending>();
  #sequence = 0;
  #disposed = false;

  constructor(options: RustWasmWorkerEngineOptions = {}) {
    this.#worker = options.workerFactory?.()
      ?? new Worker(new URL("./rust-wasm-engine-worker.js", import.meta.url), {
        type: "module",
        name: "gethen-rust-wasm-engine"
      });
    this.#worker.addEventListener("message", this.handleMessage);
    this.#worker.addEventListener("error", this.handleError);
  }

  filterAggregate(
    values: Float64Array,
    validity: Uint8Array,
    threshold: number,
    options?: RustWasmWorkerCallOptions
  ): Promise<RustWasmFilterAggregateResult> {
    return this.execute({ type: "filterAggregate", values, validity, threshold }, options) as Promise<RustWasmFilterAggregateResult>;
  }

  groupSum(
    values: Float64Array,
    validity: Uint8Array,
    groups: Uint32Array,
    selectedGroup: number,
    options?: RustWasmWorkerCallOptions
  ): Promise<number> {
    return this.execute({ type: "groupSum", values, validity, groups, selectedGroup }, options) as Promise<number>;
  }

  formulaSumProduct(
    left: Float64Array,
    right: Float64Array,
    validity: Uint8Array,
    options?: RustWasmWorkerCallOptions
  ): Promise<number> {
    return this.execute({ type: "formulaSumProduct", left, right, validity }, options) as Promise<number>;
  }

  destroy(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#worker.removeEventListener("message", this.handleMessage);
    this.#worker.removeEventListener("error", this.handleError);
    this.#worker.terminate();
    for (const pending of this.#pending.values()) {
      pending.removeAbort?.();
      pending.reject(new Error("The Rust/WASM Worker engine was destroyed."));
    }
    this.#pending.clear();
  }

  private execute(
    input: RustWasmWorkerOperation,
    options: RustWasmWorkerCallOptions = {}
  ): Promise<RustWasmFilterAggregateResult | number> {
    if (this.#disposed) return Promise.reject(new Error("The Rust/WASM Worker engine is disposed."));
    if (options.signal?.aborted) return Promise.reject(createAbortError());
    const requestId = `kernel-${++this.#sequence}`;
    return new Promise((resolve, reject) => {
      const abort = (): void => {
        const pending = this.#pending.get(requestId);
        if (!pending) return;
        this.#pending.delete(requestId);
        pending.removeAbort?.();
        this.#worker.postMessage({ type: "cancel", requestId } satisfies RustWasmWorkerRequest);
        pending.reject(createAbortError());
      };
      options.signal?.addEventListener("abort", abort, { once: true });
      this.#pending.set(requestId, {
        resolve,
        reject,
        onProgress: options.onProgress,
        ...(options.signal ? { removeAbort: () => options.signal!.removeEventListener("abort", abort) } : {})
      });
      const request = { ...input, requestId } as RustWasmWorkerRequest;
      const arrays: readonly ArrayBufferView[] = input.type === "filterAggregate"
        ? [input.values, input.validity]
        : input.type === "groupSum"
          ? [input.values, input.validity, input.groups]
          : [input.left, input.right, input.validity];
      const transfer = arrays.map((array) => array.buffer).filter((buffer): buffer is ArrayBuffer => buffer instanceof ArrayBuffer);
      this.#worker.postMessage(request, [...new Set(transfer)]);
    });
  }

  private readonly handleMessage = (event: MessageEvent<RustWasmWorkerResponse>): void => {
    const response = event.data;
    const pending = this.#pending.get(response.requestId);
    if (!pending) return;
    if (response.type === "progress") {
      pending.onProgress?.(response.stage);
      return;
    }
    this.#pending.delete(response.requestId);
    pending.removeAbort?.();
    if (response.type === "result") pending.resolve(response.result);
    else if (response.type === "cancelled") pending.reject(createAbortError());
    else pending.reject(new Error(response.message));
  };

  private readonly handleError = (event: ErrorEvent): void => {
    for (const pending of this.#pending.values()) pending.reject(new Error(event.message));
    this.#pending.clear();
  };
}

export function createRustWasmWorkerEngine(options?: RustWasmWorkerEngineOptions): RustWasmWorkerEngine {
  return new RustWasmWorkerEngine(options);
}

function createAbortError(): Error {
  return new DOMException("The Rust/WASM request was cancelled.", "AbortError");
}
