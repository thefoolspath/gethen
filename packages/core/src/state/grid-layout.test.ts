import { describe, expect, it } from "vitest";

import {
  applyGridLayoutState,
  createGridLayoutState,
  freezeGridPanes,
  getGridColumnOffsets,
  getGridLayoutWidth,
  reorderGridColumn,
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

  it("rejects duplicate IDs and unsafe widths", () => {
    expect(() => createGridLayoutState({ columnIds: ["a", "a"] })).toThrow(/unique/);
    const state = createGridLayoutState({ columnIds: ["a"] });
    expect(() => resizeGridColumn(state, "a", 1)).toThrow(/24 through 4096/);
  });
});
