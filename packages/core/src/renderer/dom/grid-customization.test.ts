import { describe, expect, it } from "vitest";

import { getVisibleColumns, resolveGridClassNames } from "./grid-customization.js";

describe("grid customization", () => {
  it("normalizes utility class strings and removes duplicates", () => {
    expect(
      resolveGridClassNames("text-right tabular-nums", ["text-red-600", "tabular-nums"], undefined)
    ).toEqual(["text-right", "tabular-nums", "text-red-600"]);
  });

  it("keeps hidden columns in caller metadata but omits them from the rendered view", () => {
    const columns = [
      { id: "id", title: "ID", dataType: "text" as const, hidden: true },
      { id: "name", title: "Name", dataType: "text" as const }
    ];

    expect(getVisibleColumns(columns)).toEqual([columns[1]]);
    expect(columns).toHaveLength(2);
  });
});
