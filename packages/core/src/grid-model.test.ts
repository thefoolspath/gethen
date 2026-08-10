import { describe, expect, it } from "vitest";

import { createGridModel } from "./grid-model.js";

interface OrderDto {
  readonly id: string;
  readonly customerName: string;
  readonly amount: number;
  readonly note: string | null;
}

const columns = [
  { field: "id", dataType: "text", key: true, hidden: true },
  { field: "customerName", title: "Customer", dataType: "text" },
  { field: "amount", dataType: "number", align: "right" },
  { field: "note", dataType: "text", nullable: true }
] as const;

describe("createGridModel", () => {
  it("maps DTO fields while preserving a hidden key as stable row identity", () => {
    const order: OrderDto = { id: "order-1", customerName: "Ada", amount: 42, note: null };
    const model = createGridModel({ columns, rows: [order] });

    expect(model.rows).toEqual([
      {
        id: "order-1",
        cells: { id: "order-1", customerName: "Ada", amount: 42, note: null },
        source: order
      }
    ]);
    expect(model.columns[0]).toMatchObject({ id: "id", hidden: true, key: true, readonly: true });
    expect(model.sourceRowsById.get("order-1")).toBe(order);
    expect(model.getRowId(order)).toBe("order-1");
  });

  it("requires exactly one key column", () => {
    expect(() =>
      createGridModel({
        columns: [{ field: "customerName", dataType: "text" }] as const,
        rows: [] as readonly OrderDto[]
      })
    ).toThrow(/exactly one key column/);
  });

  it("rejects duplicate identities and values that contradict column metadata", () => {
    const order: OrderDto = { id: "order-1", customerName: "Ada", amount: 42, note: null };

    expect(() => createGridModel({ columns, rows: [order, { ...order }] })).toThrow(
      /Duplicate row identity/
    );
    expect(() =>
      createGridModel({
        columns,
        rows: [{ ...order, amount: Number.NaN }]
      })
    ).toThrow(/finite number/);
  });
});
