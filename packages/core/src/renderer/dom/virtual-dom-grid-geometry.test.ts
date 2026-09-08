import { describe, expect, it } from "vitest";

import {
  getRenderedGridColumnIndexes,
  getRenderedGridRowIndexes,
  orderGridColumns
} from "./virtual-dom-grid-geometry.js";

describe("virtual DOM grid geometry", () => {
  it("keeps frozen rows while virtualizing the scrolled range", () => {
    expect(getRenderedGridRowIndexes(100, 20, 200, 60, 2, 1)).toEqual([
      0, 1, 9, 10, 11, 12, 13, 14
    ]);
  });

  it("uses variable column widths and keeps frozen columns", () => {
    const layout = {
      version: 1 as const,
      columns: [
        { columnId: "a", width: 50 },
        { columnId: "b", width: 100 },
        { columnId: "c", width: 200 },
        { columnId: "d", width: 80 }
      ],
      frozenRowCount: 0,
      frozenColumnCount: 1
    };
    expect(getRenderedGridColumnIndexes(layout, [0, 50, 150, 350], 160, 100, 0))
      .toEqual([0, 2]);
  });

  it("orders view columns from layout identity", () => {
    const columns = [
      { id: "a", title: "A", dataType: "text" as const },
      { id: "b", title: "B", dataType: "text" as const }
    ];
    const layout = {
      version: 1 as const,
      columns: [{ columnId: "b", width: 80 }, { columnId: "a", width: 80 }],
      frozenRowCount: 0,
      frozenColumnCount: 0
    };
    expect(orderGridColumns(columns, layout).map((column) => column.id)).toEqual(["b", "a"]);
  });
});
