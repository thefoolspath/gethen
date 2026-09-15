import { describe, expect, it } from "vitest";

import { gethenReadOnlyGridPreset } from "./virtual-dom-grid.js";

describe("gethenReadOnlyGridPreset", () => {
  it("provides a frozen opt-in preset without changing the editable default", () => {
    expect(gethenReadOnlyGridPreset).toEqual({ readOnly: true });
    expect(Object.isFrozen(gethenReadOnlyGridPreset)).toBe(true);
  });
});
