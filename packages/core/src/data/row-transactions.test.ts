import { describe, expect, it } from "vitest";

import { createRowTransactionManager } from "./row-transactions.js";

interface OrderDto {
  readonly id: string;
  readonly customer: string;
  readonly amount: number;
}

const orders: readonly OrderDto[] = [
  { id: "order-1", customer: "Ada", amount: 10 },
  { id: "order-2", customer: "Grace", amount: 20 }
];

function createManager() {
  return createRowTransactionManager({ rows: orders, getRowId: (row) => row.id });
}

describe("RowTransactionManager", () => {
  it("tracks dirty fields and emits an edit save payload", () => {
    const manager = createManager();

    manager.beginEdit("order-1");
    manager.updateField("amount", 15);

    expect(manager.save()).toEqual({
      mode: "edit",
      rowId: "order-1",
      row: { id: "order-1", customer: "Ada", amount: 15 },
      originalRow: { id: "order-1", customer: "Ada", amount: 10 },
      changes: { amount: 15 }
    });
    expect(manager.getRow("order-1")?.amount).toBe(15);
    expect(manager.getTransaction()).toBeNull();
  });

  it("removes a dirty field when it returns to the original value", () => {
    const manager = createManager();

    manager.beginEdit("order-1");
    manager.updateField("amount", 15);
    expect(manager.updateField("amount", 10).changes).toEqual({});
  });

  it("cancels edits without changing the authoritative row", () => {
    const manager = createManager();

    manager.beginEdit("order-2");
    manager.updateField("customer", "Hopper");
    manager.cancel();

    expect(manager.getRow("order-2")).toEqual(orders[1]);
    expect(manager.getTransaction()).toBeNull();
  });

  it("inserts and saves only the new row", () => {
    const manager = createManager();
    const inserted = { id: "order-3", customer: "Linus", amount: 30 };

    manager.beginInsert(inserted);

    expect(manager.save()).toEqual({
      mode: "insert",
      rowId: "order-3",
      row: inserted,
      changes: inserted
    });
    expect(manager.getRows()).toHaveLength(3);
  });

  it("protects stable identity and permits only one active transaction", () => {
    const manager = createManager();

    manager.beginEdit("order-1");
    expect(() => manager.updateField("id", "changed")).toThrow(/stable row identity/);
    expect(() => manager.beginEdit("order-2")).toThrow(/active row transaction/);
  });
});

describe("RowTransactionManager history", () => {
  it("undoes and redoes saved edits as new local changes", () => {
    const events: unknown[] = [];
    const manager = createRowTransactionManager({
      rows: [{ id: "r1", name: "Ada" }],
      getRowId: (row) => row.id,
      onHistoryChange: (change) => events.push(change)
    });
    manager.beginEdit("r1");
    manager.updateField("name", "Grace");
    manager.save();

    expect(manager.undo()).toEqual([{
      rowId: "r1",
      oldRow: { id: "r1", name: "Grace" },
      newRow: { id: "r1", name: "Ada" }
    }]);
    expect(manager.getRow("r1")?.name).toBe("Ada");
    expect(manager.redo()).toEqual([{
      rowId: "r1",
      oldRow: { id: "r1", name: "Ada" },
      newRow: { id: "r1", name: "Grace" }
    }]);
    expect(manager.getRow("r1")?.name).toBe("Grace");
    expect(events).toHaveLength(2);
  });

  it("undoes an insert by removing the locally inserted row", () => {
    const manager = createRowTransactionManager({
      rows: [{ id: "r1", name: "Ada" }],
      getRowId: (row) => row.id
    });
    manager.beginInsert({ id: "r2", name: "Grace" });
    manager.save();
    manager.undo();
    expect(manager.getRows()).toEqual([{ id: "r1", name: "Ada" }]);
  });
});
