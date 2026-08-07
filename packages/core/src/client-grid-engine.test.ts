import { describe, expect, it } from "vitest";

import { createClientGridEngine } from "./client-grid-engine.js";
import type { ClientGridEngineOptions } from "./client-grid-engine.js";

const options: ClientGridEngineOptions = {
  columns: [
    { id: "name", title: "Name", dataType: "text" },
    { id: "score", title: "Score", dataType: "number" },
    { id: "active", title: "Active", dataType: "boolean" }
  ],
  rows: [
    {
      id: "row-1",
      cells: {
        name: "Ada",
        score: 41,
        active: true
      }
    },
    {
      id: "row-2",
      cells: {
        name: "Grace",
        score: 39,
        active: false
      }
    }
  ]
};

describe("ClientGridEngine", () => {
  it("accesses rows and cells by stable identity", () => {
    const engine = createClientGridEngine(options);

    expect(engine.getRowCount()).toBe(2);
    expect(engine.getRow(0)?.id).toBe("row-1");
    expect(engine.getCell("row-2", "name")).toBe("Grace");
  });

  it("tracks single-cell selection", () => {
    const engine = createClientGridEngine(options);

    expect(engine.selectCell("row-1", "score")).toEqual({
      rowId: "row-1",
      columnId: "score"
    });
    expect(engine.getSelection()).toEqual({
      rowId: "row-1",
      columnId: "score"
    });
  });

  it("tracks edit state and commits a typed change event", () => {
    const engine = createClientGridEngine(options);

    expect(engine.startEdit("row-1", "score")).toEqual({
      rowId: "row-1",
      columnId: "score",
      initialValue: 41,
      draftValue: 41
    });

    engine.updateDraftValue(42);

    expect(engine.commitEdit()).toEqual({
      rowId: "row-1",
      columnId: "score",
      oldValue: 41,
      newValue: 42
    });
    expect(engine.getCell("row-1", "score")).toBe(42);
    expect(engine.getEditState()).toBeNull();
  });

  it("cancels edits without mutating cells", () => {
    const engine = createClientGridEngine(options);

    engine.startEdit("row-2", "active");
    engine.updateDraftValue(true);
    engine.cancelEdit();

    expect(engine.getCell("row-2", "active")).toBe(false);
    expect(engine.getEditState()).toBeNull();
  });

  it("rejects stale updates", () => {
    const engine = createClientGridEngine(options);

    expect(() =>
      engine.applyCellUpdate({
        rowId: "row-1",
        columnId: "name",
        oldValue: "Not Ada",
        newValue: "Ada Lovelace"
      })
    ).toThrow(/Stale cell update/);
  });

  it("rejects duplicate row identities", () => {
    expect(() =>
      createClientGridEngine({
        columns: options.columns,
        rows: [options.rows[0]!, options.rows[0]!]
      })
    ).toThrow(/Duplicate rowId/);
  });
});
