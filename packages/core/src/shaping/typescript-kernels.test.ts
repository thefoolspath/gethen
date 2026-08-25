import { describe, expect, it } from "vitest";

import {
  typescriptFilterAggregate,
  typescriptFormulaSumProduct,
  typescriptGroupSum
} from "./typescript-kernels.js";

describe("TypeScript parity kernels", () => {
  it("uses the same validity, grouping, and formula semantics as Rust fixtures", () => {
    const values = new Float64Array([1, 2, 3, 4]);
    const validity = new Uint8Array([1, 0, 1, 1]);
    expect(typescriptFilterAggregate(values, validity, 1.5)).toEqual({ count: 2, sum: 7 });
    expect(typescriptGroupSum(values, validity, new Uint32Array([0, 0, 1, 1]), 1)).toBe(7);
    expect(typescriptFormulaSumProduct(
      values,
      new Float64Array([2, 2, 2, 2]),
      validity
    )).toBe(16);
  });
});
