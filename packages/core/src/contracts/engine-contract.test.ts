import { describe, expect, it } from "vitest";

import {
  createGridColumnarBuffer,
  createGridWorkerShapeDefinition,
  decodeGridColumnarBuffer,
  executeGridEngineShapeRequest,
  executeGridEngineShapeRequestInStages,
  getGridColumnarTransferables
} from "./engine-contract.js";

const rows = [
  { id: "r1", cells: { amount: 10, active: true, name: "Ada", nullable: null } },
  { id: "r2", cells: { amount: 5, active: false, name: "เกรซ", nullable: "value" } }
] as const;

describe("grid engine columnar contract", () => {
  it("round-trips number, boolean, UTF-8, and null columns", () => {
    const buffer = createGridColumnarBuffer(rows, [
      { columnId: "amount", storage: "float64" },
      { columnId: "active", storage: "boolean" },
      { columnId: "name", storage: "utf8" },
      { columnId: "nullable", storage: "utf8" }
    ]);
    expect(decodeGridColumnarBuffer(buffer)).toEqual(rows);
    expect(getGridColumnarTransferables(buffer)).toHaveLength(10);
  });

  it("executes portable shaping from the columnar boundary", () => {
    const data = createGridColumnarBuffer(rows, [
      { columnId: "amount", storage: "float64" },
      { columnId: "active", storage: "boolean" },
      { columnId: "name", storage: "utf8" }
    ]);
    const result = executeGridEngineShapeRequest({
      type: "shape",
      requestId: "test",
      data,
      definition: createGridWorkerShapeDefinition({
        filter: [{ columnId: "active", operator: "equals", value: true, comparisonType: "boolean" }],
        sort: [{ columnId: "amount", direction: "desc", comparisonType: "number" }]
      })
    });
    expect(result.rows.map((row) => row.id)).toEqual(["r1"]);
  });

  it("executes the canonical pipeline in ordered progress stages without changing results", async () => {
    const data = createGridColumnarBuffer(rows, [
      { columnId: "amount", storage: "float64" },
      { columnId: "active", storage: "boolean" },
      { columnId: "name", storage: "utf8" }
    ]);
    const request = {
      type: "shape" as const,
      requestId: "staged-test",
      data,
      definition: createGridWorkerShapeDefinition({
        filter: [{ columnId: "amount", operator: "greaterThan", value: 0, comparisonType: "number" }],
        sort: [{ columnId: "amount", direction: "desc", comparisonType: "number" }],
        group: [{ columnId: "active", comparisonType: "boolean" }],
        aggregate: [{ id: "total", operation: "sum", columnId: "amount" }]
      })
    };
    const progress: string[] = [];
    let yields = 0;
    const staged = await executeGridEngineShapeRequestInStages(request, {
      onProgress: (stage, completed, total) => progress.push(`${stage}:${completed}/${total}`),
      yieldControl: () => {
        yields += 1;
        return Promise.resolve();
      }
    });

    expect(staged).toEqual(executeGridEngineShapeRequest(request));
    expect(progress).toEqual([
      "decode:0/2",
      "decode:2/2",
      "filter:0/2",
      "filter:2/2",
      "sort:0/2",
      "sort:2/2",
      "group:0/2",
      "group:2/2",
      "aggregate:0/2",
      "aggregate:2/2",
      "flatten:0/2",
      "flatten:2/2",
      "complete:2/2"
    ]);
    expect(yields).toBe(13);
  });

  it("reports filtered work totals for downstream shaping stages", async () => {
    const data = createGridColumnarBuffer(rows, [
      { columnId: "amount", storage: "float64" },
      { columnId: "active", storage: "boolean" }
    ]);
    const progress: string[] = [];

    await executeGridEngineShapeRequestInStages({
      type: "shape",
      requestId: "filtered-progress-test",
      data,
      definition: createGridWorkerShapeDefinition({
        filter: [{ columnId: "active", operator: "equals", value: true, comparisonType: "boolean" }],
        sort: [{ columnId: "amount", direction: "desc", comparisonType: "number" }],
        group: [{ columnId: "active", comparisonType: "boolean" }],
        aggregate: [{ id: "total", operation: "sum", columnId: "amount" }]
      })
    }, {
      onProgress: (stage, completed, total) => progress.push(`${stage}:${completed}/${total}`)
    });

    expect(progress).toEqual([
      "decode:0/2",
      "decode:2/2",
      "filter:0/2",
      "filter:2/2",
      "sort:0/1",
      "sort:1/1",
      "group:0/1",
      "group:1/1",
      "aggregate:0/1",
      "aggregate:1/1",
      "flatten:0/1",
      "flatten:1/1",
      "complete:2/2"
    ]);
  });

  it("rejects callbacks at the worker boundary", () => {
    expect(() => createGridWorkerShapeDefinition({
      aggregate: [{ id: "custom", operation: "custom", reducer: () => 1 }]
    })).toThrow(/client-only/);
  });

  it("rejects malformed column buffers", () => {
    const buffer = createGridColumnarBuffer(rows, [{ columnId: "amount", storage: "float64" }]);
    expect(() => decodeGridColumnarBuffer({ ...buffer, rowCount: 3 })).toThrow(/rowIds length/);
  });

  it.each([
    new Uint32Array([1, 1, 2]),
    new Uint32Array([0, 2, 1]),
    new Uint32Array([0, 1, 3]),
    new Uint32Array([0, 1, 1])
  ])("rejects malformed UTF-8 offsets before decoding or engine execution", (offsets) => {
    const malformed = {
      rowCount: 2,
      rowIds: ["r1", "r2"],
      columns: [{
        columnId: "name",
        storage: "utf8" as const,
        validity: new Uint8Array([1, 1]),
        offsets,
        bytes: new TextEncoder().encode("ab")
      }]
    };
    expect(() => decodeGridColumnarBuffer(malformed)).toThrow(/UTF-8 offsets/);
  });

  it("rejects malformed runtime operations at the worker trust boundary", () => {
    const data = createGridColumnarBuffer(rows, [{ columnId: "amount", storage: "float64" }]);
    const request = {
      type: "shape" as const,
      requestId: "malformed-operation",
      data,
      definition: {
        ...createGridWorkerShapeDefinition({}),
        sort: [{ columnId: "amount", direction: "sideways" }]
      }
    };

    expect(() => executeGridEngineShapeRequest(
      request as unknown as Parameters<typeof executeGridEngineShapeRequest>[0]
    )).toThrow(/sort direction/);
  });
});
