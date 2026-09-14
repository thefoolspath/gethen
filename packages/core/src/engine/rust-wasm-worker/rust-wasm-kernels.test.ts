import { describe, expect, it } from "vitest";

import { RustWasmKernels } from "./rust-wasm-kernels.js";
import type { RustWasmKernelExports } from "./rust-wasm-kernels.js";

const kernels = new RustWasmKernels({} as RustWasmKernelExports);

describe("RustWasmKernels trust-boundary validation", () => {
  it.each([
    new Uint32Array([1, 1]),
    new Uint32Array([0, 2]),
    new Uint32Array([0, 0])
  ])("rejects malformed UTF-8 offsets before allocating WASM memory", (offsets) => {
    expect(() => kernels.filterUtf8(
      offsets,
      new Uint8Array([97]),
      new Uint8Array([1]),
      new Uint8Array(),
      8
    )).toThrow(/UTF-8 offsets/);
  });

  it("rejects invalid operation codes, indices, group IDs, and viewport metadata", () => {
    expect(() => kernels.filterNumeric(
      new Float64Array([1]), new Uint8Array([1]), 99, 1, true
    )).toThrow(/operation/);
    expect(() => kernels.stableSortNumeric(
      new Float64Array([1]), new Uint8Array([1]), new Uint32Array([1]), "asc", "last"
    )).toThrow(/indices/);
    expect(() => kernels.aggregateGroups(
      new Float64Array([1]), new Uint8Array([1]), new Uint32Array([1]), 1, 0, false
    )).toThrow(/group IDs/);
    expect(() => kernels.flattenGroupTokens(
      [new Uint32Array([1])], [new Uint32Array([0])], [new Uint8Array([1])], 1
    )).toThrow(/row group IDs/);
    expect(() => kernels.flattenGroupTokens([], [], [], 0, { start: -1, count: 1 }))
      .toThrow(/viewport/);
  });
});
