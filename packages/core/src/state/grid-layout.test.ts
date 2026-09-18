import { describe, expect, it } from "vitest";

import {
  applyGridLayoutState,
  createGridLayoutState,
  freezeGridPanes,
  getGridColumnOffsets,
  getGridLayoutWidth,
  projectVisibleGridLayoutState,
  reorderGridColumn,
  reorderGridColumnByVisibleIndex,
  resizeGridColumn
} from "./grid-layout.js";

describe("GridLayoutState", () => {
  it("round-trips order, widths, and bounded frozen panes", () => {
    const saved = {
      version: 1,
      columns: [
        { columnId: "score", width: 90 },
        { columnId: "name", width: 180 }
      ],
      frozenRowCount: 3,
      frozenColumnCount: 9
    } as const;

    expect(applyGridLayoutState({
      columnIds: ["name", "score", "active"],
      state: saved,
      rowCount: 2
    })).toEqual({
      version: 1,
      columns: [
        { columnId: "score", width: 90 },
        { columnId: "name", width: 180 },
        { columnId: "active", width: 132 }
      ],
      frozenRowCount: 2,
      frozenColumnCount: 3
    });
  });

  it("drops stale columns and appends new columns deterministically", () => {
    const state = applyGridLayoutState({
      columnIds: ["a", "c"],
      state: {
        version: 1,
        columns: [{ columnId: "missing", width: 50 }, { columnId: "a", width: 80 }],
        frozenRowCount: 0,
        frozenColumnCount: 0
      }
    });
    expect(state.columns).toEqual([
      { columnId: "a", width: 80 },
      { columnId: "c", width: 132 }
    ]);
  });

  it("uses declared widths for new columns while persisted widths take precedence", () => {
    expect(applyGridLayoutState({
      columnIds: ["saved", "declared", "fallback"],
      defaultColumnWidth: 140,
      columnWidths: { saved: 100, declared: 239.6 },
      state: {
        version: 1,
        columns: [{ columnId: "saved", width: 180 }],
        frozenRowCount: 0,
        frozenColumnCount: 0
      }
    }).columns).toEqual([
      { columnId: "saved", width: 180 },
      { columnId: "declared", width: 240 },
      { columnId: "fallback", width: 140 }
    ]);
  });

  it("resizes, reorders, freezes, and calculates offsets", () => {
    let state = createGridLayoutState({ columnIds: ["a", "b", "c"], defaultColumnWidth: 100 });
    state = resizeGridColumn(state, "b", 160);
    state = reorderGridColumn(state, "c", 0);
    state = freezeGridPanes(state, 4, 2, 10);

    expect(state.columns.map((column) => column.columnId)).toEqual(["c", "a", "b"]);
    expect(getGridColumnOffsets(state)).toEqual([0, 100, 200]);
    expect(getGridLayoutWidth(state)).toBe(360);
    expect(state).toMatchObject({ frozenRowCount: 4, frozenColumnCount: 2 });
  });

  it("projects full persisted order into visible geometry without consuming hidden frozen slots", () => {
    const state = createGridLayoutState({
      columnIds: ["a", "hidden", "b", "c"],
      columnWidths: { a: 80, hidden: 40, b: 120, c: 160 },
      frozenColumnCount: 2
    });

    expect(projectVisibleGridLayoutState(state, ["a", "b", "c"])).toEqual({
      version: 1,
      columns: [
        { columnId: "a", width: 80 },
        { columnId: "b", width: 120 },
        { columnId: "c", width: 160 }
      ],
      frozenRowCount: 0,
      frozenColumnCount: 2
    });
  });

  it("reorders visible columns while retaining hidden column identity in full order", () => {
    const state = createGridLayoutState({ columnIds: ["a", "hidden", "b", "c"] });

    expect(
      reorderGridColumnByVisibleIndex(state, "c", 0, ["a", "b", "c"])
        .columns.map((column) => column.columnId)
    ).toEqual(["c", "a", "hidden", "b"]);
    expect(
      reorderGridColumnByVisibleIndex(state, "a", 2, ["a", "b", "c"])
        .columns.map((column) => column.columnId)
    ).toEqual(["hidden", "b", "c", "a"]);
  });

  it("moves hidden columns to visible boundaries without changing the visible projection", () => {
    const state = createGridLayoutState({ columnIds: ["a", "hidden", "b", "c"] });
    const moved = reorderGridColumnByVisibleIndex(state, "hidden", 2, ["a", "b", "c"]);

    expect(moved.columns.map((column) => column.columnId)).toEqual(["a", "b", "hidden", "c"]);
    expect(projectVisibleGridLayoutState(moved, ["a", "b", "c"]).columns.map(
      (column) => column.columnId
    )).toEqual(["a", "b", "c"]);
  });

  it("rejects duplicate IDs and unsafe widths", () => {
    expect(() => createGridLayoutState({ columnIds: ["a", "a"] })).toThrow(/unique/);
    const state = createGridLayoutState({ columnIds: ["a"] });
    expect(() => resizeGridColumn(state, "a", 1)).toThrow(/24 through 4096/);
    for (const width of [23, 4097, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createGridLayoutState({
        columnIds: ["a"],
        columnWidths: { a: width }
      })).toThrow(/24 through 4096/);
    }
  });
});
