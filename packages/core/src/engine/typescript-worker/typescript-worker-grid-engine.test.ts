import { describe, expect, it, vi } from "vitest";

import { createGridColumnarBuffer, createGridWorkerShapeDefinition } from "../../contracts/engine-contract.js";
import { TypeScriptWorkerGridEngine } from "./typescript-worker-grid-engine.js";

class FakeWorker {
  readonly messages: unknown[] = [];
  readonly #listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const listeners = this.#listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.#listeners.get(type)?.delete(listener);
  }

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  terminate = vi.fn();
}

describe("TypeScriptWorkerGridEngine", () => {
  it("rejects an aborted request immediately and sends a cancellation message", async () => {
    const worker = new FakeWorker();
    const engine = new TypeScriptWorkerGridEngine({ workerFactory: () => worker as unknown as Worker });
    const controller = new AbortController();
    const started = performance.now();
    const operation = engine.shape({
      data: createGridColumnarBuffer([{ id: "r1", cells: { value: 1 } }], [
        { columnId: "value", storage: "float64" }
      ]),
      definition: createGridWorkerShapeDefinition({}),
      signal: controller.signal
    });

    controller.abort();

    await expect(operation).rejects.toMatchObject({ name: "AbortError" });
    expect(performance.now() - started).toBeLessThan(100);
    expect(worker.messages).toHaveLength(2);
    expect(worker.messages[1]).toMatchObject({ type: "cancel", requestId: "shape-1" });
    engine.destroy();
  });
});
