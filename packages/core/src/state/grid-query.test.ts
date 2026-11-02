import { describe, expect, it } from "vitest";

import { GridSortingMode, nextHeaderSort, normalizeGridQueryState } from "./grid-query.js";

const columns = [
  { id: "name", dataType: "text" },
  { id: "score", dataType: "number" },
  { id: "hidden", dataType: "boolean" }
] as const;

describe("Grid query state", () => {
  it("disables header sorting in None mode without clearing filters", () => {
    const state = { sort: [{ columnId: "score", direction: "asc" as const }], filter: [
      { columnId: "score", operator: "greaterThan" as const, value: 10 }
    ] };
    expect(nextHeaderSort(state, "name", GridSortingMode.None, columns)).toEqual({
      sort: [], filter: [{ columnId: "score", operator: "greaterThan", value: 10, comparisonType: "number" }]
    });
  });

  it("Single mode toggles one column and replaces it when another is clicked", () => {
    const empty = { sort: [], filter: [] } as const;
    const first = nextHeaderSort(empty, "score", GridSortingMode.Single, columns);
    expect(first.sort).toEqual([{ columnId: "score", direction: "asc", comparisonType: "number", nulls: "last" }]);
    const descending = nextHeaderSort(first, "score", GridSortingMode.Single, columns);
    expect(descending.sort[0]?.direction).toBe("desc");
    expect(nextHeaderSort(descending, "score", GridSortingMode.Single, columns).sort[0]?.direction).toBe("asc");
    expect(nextHeaderSort(descending, "name", GridSortingMode.Single, columns).sort).toEqual([
      { columnId: "name", direction: "asc", comparisonType: "text", nulls: "last" }
    ]);
  });

  it("Multiple mode appends normal clicks and preserves priority when toggling either column", () => {
    const first = nextHeaderSort({ sort: [], filter: [] }, "score", GridSortingMode.Multiple, columns);
    const second = nextHeaderSort(first, "name", GridSortingMode.Multiple, columns);
    expect(second.sort.map((sort) => sort.columnId)).toEqual(["score", "name"]);
    const secondaryDescending = nextHeaderSort(second, "name", GridSortingMode.Multiple, columns);
    expect(secondaryDescending.sort.map((sort) => `${sort.columnId}:${sort.direction}`))
      .toEqual(["score:asc", "name:desc"]);
    const third = nextHeaderSort(secondaryDescending, "score", GridSortingMode.Multiple, columns);
    expect(third.sort.map((sort) => `${sort.columnId}:${sort.direction}`)).toEqual(["score:desc", "name:desc"]);
    expect(nextHeaderSort(third, "score", GridSortingMode.Multiple, columns).sort.map((sort) => `${sort.columnId}:${sort.direction}`))
      .toEqual(["score:asc", "name:desc"]);
    expect(nextHeaderSort(second, "name", GridSortingMode.Single, columns).sort).toEqual([
      { columnId: "name", direction: "asc", comparisonType: "text", nulls: "last" }
    ]);
  });

  it("keeps hidden columns and rejects unknown or duplicate sorts", () => {
    expect(normalizeGridQueryState({ sort: [{ columnId: "hidden", direction: "asc" }], filter: [] }, columns).sort)
      .toEqual([{ columnId: "hidden", direction: "asc", comparisonType: "boolean", nulls: "last" }]);
    expect(() => normalizeGridQueryState({ sort: [{ columnId: "missing", direction: "asc" }], filter: [] }, columns))
      .toThrow("Unknown sort column");
    expect(() => normalizeGridQueryState({ sort: [
      { columnId: "score", direction: "asc" }, { columnId: "score", direction: "desc" }
    ], filter: [] }, columns)).toThrow("Duplicate sort column");
  });
});
