import { describe, expect, it } from "vitest";

import { createGridAggregatePinnedRow, formatGridStatus } from "./grid-shell.js";

describe("grid shell", () => {
  it("creates a host-ready pinned summary row from Alpha 4 aggregates", () => {
    const row = createGridAggregatePinnedRow({
      rows: [
        { id: "r1", cells: { amount: 10 } },
        { id: "r2", cells: { amount: 15 } }
      ],
      aggregates: [
        { id: "count", operation: "count" },
        { id: "amount", operation: "sum", columnId: "amount" }
      ],
      labelColumnId: "name"
    });

    expect(row).toEqual({
      id: "gethen-summary",
      cells: { count: 2, amount: 25, name: "Total" }
    });
  });

  it("formats known, filtered, and unknown row totals without guessing", () => {
    expect(formatGridStatus(20, 1, undefined)).toBe("20 rows");
    expect(formatGridStatus(20, 4, { totalRowCount: 100, filteredRowCount: 20 }))
      .toBe("20 of 100 rows · 4 cells selected");
    expect(formatGridStatus(20, 1, { totalRowCount: null }))
      .toBe("20 rows loaded · total unknown");
  });
});
