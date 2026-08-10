import { describe, expect, it } from "vitest";

import {
  createGridColumnarBuffer,
  createGridWorkerShapeDefinition,
  decodeGridColumnarBuffer,
  executeGridEngineShapeRequest,
  getGridColumnarTransferables
} from "./grid-engine-contract.js";

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

  it("rejects callbacks at the worker boundary", () => {
    expect(() => createGridWorkerShapeDefinition({
      aggregate: [{ id: "custom", operation: "custom", reducer: () => 1 }]
    })).toThrow(/client-only/);
  });

  it("rejects malformed column buffers", () => {
    const buffer = createGridColumnarBuffer(rows, [{ columnId: "amount", storage: "float64" }]);
    expect(() => decodeGridColumnarBuffer({ ...buffer, rowCount: 3 })).toThrow(/rowIds length/);
  });
});
