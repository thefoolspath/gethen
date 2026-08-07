import { describe, expect, it } from "vitest";

import { calculateVirtualViewport } from "./viewport.js";

describe("calculateVirtualViewport", () => {
  it("calculates visible rows and columns with overscan", () => {
    expect(
      calculateVirtualViewport({
        rowCount: 100000,
        columnCount: 50,
        rowHeight: 32,
        columnWidth: 132,
        viewportHeight: 320,
        viewportWidth: 528,
        scrollTop: 320,
        scrollLeft: 264,
        overscanRows: 2,
        overscanColumns: 1
      })
    ).toMatchObject({
      firstRow: 8,
      lastRow: 22,
      firstColumn: 1,
      lastColumn: 7,
      rowOffset: 256,
      columnOffset: 132,
      renderedCellCount: 105
    });
  });

  it("clamps ranges at dataset bounds", () => {
    expect(
      calculateVirtualViewport({
        rowCount: 10,
        columnCount: 3,
        rowHeight: 20,
        columnWidth: 80,
        viewportHeight: 400,
        viewportWidth: 400,
        scrollTop: 0,
        scrollLeft: 0,
        overscanRows: 5,
        overscanColumns: 5
      })
    ).toMatchObject({
      firstRow: 0,
      lastRow: 9,
      firstColumn: 0,
      lastColumn: 2,
      renderedCellCount: 30
    });
  });
});
