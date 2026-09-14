import { describe, expect, it } from "vitest";

import {
  canonicalGridJson,
  readGridColumnarValue,
  resolveGridColumnarColumn,
  stableGridValueKey
} from "./grid-value-semantics.js";

describe("canonical grid value semantics", () => {
  it("keeps canonical JSON and stable keys deterministic across object key order", () => {
    expect(canonicalGridJson('{"b":1,"a":{"d":2,"c":3}}'))
      .toBe('{"a":{"c":3,"d":2},"b":1}');
    expect(stableGridValueKey('{"b":1,"a":2}', "json"))
      .toBe(stableGridValueKey('{"a":2,"b":1}', "json"));
    expect(stableGridValueKey("{invalid", "json")).toBe("json:!invalid:{invalid");
  });

  it.each([
    [null, "text", "null"],
    [42, "number", "number:42"],
    [true, "boolean", "boolean:true"],
    ["2026-09-08", "date", "date:2026-09-08"],
    ["Ada", "text", "text:Ada"]
  ] as const)("keys %s values using %s semantics", (value, type, expected) => {
    expect(stableGridValueKey(value, type)).toBe(expected);
  });

  it("uses one null-column and decoding behavior for missing columns", () => {
    const buffer = {
      rowCount: 2,
      rowIds: ["r1", "r2"],
      columns: []
    } as const;
    const column = resolveGridColumnarColumn(buffer, "missing");

    expect(readGridColumnarValue(column, 0)).toBeNull();
    expect(readGridColumnarValue(column, 1)).toBeNull();
  });
});
