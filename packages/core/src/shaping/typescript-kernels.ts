import type { RustWasmFilterAggregateResult } from "../engine/rust-wasm-worker/rust-wasm-kernels.js";

export function typescriptFilterAggregate(
  values: Float64Array,
  validity: Uint8Array,
  threshold: number
): RustWasmFilterAggregateResult {
  requireEqualLength(values, validity);
  let count = 0;
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]!;
    if (validity[index] !== 0 && value > threshold) {
      count += 1;
      sum += value;
    }
  }
  return { count, sum };
}

export function typescriptGroupSum(
  values: Float64Array,
  validity: Uint8Array,
  groups: Uint32Array,
  selectedGroup: number
): number {
  requireEqualLength(values, validity, groups);
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    if (validity[index] !== 0 && groups[index] === selectedGroup) sum += values[index]!;
  }
  return sum;
}

export function typescriptFormulaSumProduct(
  left: Float64Array,
  right: Float64Array,
  validity: Uint8Array
): number {
  requireEqualLength(left, right, validity);
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (validity[index] !== 0) sum += left[index]! * right[index]!;
  }
  return sum;
}

function requireEqualLength(...arrays: readonly ArrayLike<unknown>[]): void {
  if (arrays.some((array) => array.length !== arrays[0]?.length)) {
    throw new Error("TypeScript kernel columns must have equal lengths.");
  }
}
