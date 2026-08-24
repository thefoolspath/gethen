export interface RustWasmKernelExports extends WebAssembly.Exports {
  readonly memory: WebAssembly.Memory;
  readonly gethen_alloc: (byteLength: number) => number;
  readonly gethen_dealloc: (pointer: number, byteLength: number) => void;
  readonly gethen_alloc_f64: (length: number) => number;
  readonly gethen_dealloc_f64: (pointer: number, length: number) => void;
  readonly gethen_alloc_u32: (length: number) => number;
  readonly gethen_dealloc_u32: (pointer: number, length: number) => void;
  readonly gethen_filter_count_f64: (
    valuesPointer: number,
    validityPointer: number,
    length: number,
    threshold: number
  ) => number;
  readonly gethen_filter_sum_f64: (
    valuesPointer: number,
    validityPointer: number,
    length: number,
    threshold: number
  ) => number;
  readonly gethen_group_sum_f64: (
    valuesPointer: number,
    validityPointer: number,
    groupsPointer: number,
    length: number,
    selectedGroup: number
  ) => number;
  readonly gethen_formula_sum_product_f64: (
    leftPointer: number,
    rightPointer: number,
    validityPointer: number,
    length: number
  ) => number;
  readonly gethen_filter_mask_f64: (
    valuesPointer: number,
    validityPointer: number,
    length: number,
    operation: number,
    expected: number,
    expectedValid: number,
    outputPointer: number
  ) => number;
  readonly gethen_filter_mask_utf8: (
    offsetsPointer: number,
    bytesPointer: number,
    bytesLength: number,
    validityPointer: number,
    length: number,
    expectedPointer: number,
    expectedLength: number,
    operation: number,
    outputPointer: number
  ) => number;
  readonly gethen_stable_sort_indices_f64: (
    valuesPointer: number,
    validityPointer: number,
    indicesPointer: number,
    indicesLength: number,
    direction: number,
    nullsFirst: number
  ) => void;
}

export interface RustWasmFilterAggregateResult {
  readonly count: number;
  readonly sum: number;
}

export class RustWasmKernels {
  constructor(private readonly exports: RustWasmKernelExports) {}

  filterAggregate(
    values: Float64Array,
    validity: Uint8Array,
    threshold: number
  ): RustWasmFilterAggregateResult {
    requireEqualLength(values, validity);
    const valuesPointer = this.exports.gethen_alloc_f64(values.length);
    const validityPointer = this.exports.gethen_alloc(validity.length);
    try {
      new Float64Array(this.exports.memory.buffer, valuesPointer, values.length).set(values);
      new Uint8Array(this.exports.memory.buffer, validityPointer, validity.length).set(validity);
      return {
        count: this.exports.gethen_filter_count_f64(valuesPointer, validityPointer, values.length, threshold),
        sum: this.exports.gethen_filter_sum_f64(valuesPointer, validityPointer, values.length, threshold)
      };
    } finally {
      this.exports.gethen_dealloc_f64(valuesPointer, values.length);
      this.exports.gethen_dealloc(validityPointer, validity.length);
    }
  }

  groupSum(
    values: Float64Array,
    validity: Uint8Array,
    groups: Uint32Array,
    selectedGroup: number
  ): number {
    requireEqualLength(values, validity, groups);
    const valuesPointer = this.exports.gethen_alloc_f64(values.length);
    const validityPointer = this.exports.gethen_alloc(validity.length);
    const groupsPointer = this.exports.gethen_alloc_u32(groups.length);
    try {
      new Float64Array(this.exports.memory.buffer, valuesPointer, values.length).set(values);
      new Uint8Array(this.exports.memory.buffer, validityPointer, validity.length).set(validity);
      new Uint32Array(this.exports.memory.buffer, groupsPointer, groups.length).set(groups);
      return this.exports.gethen_group_sum_f64(
        valuesPointer,
        validityPointer,
        groupsPointer,
        values.length,
        selectedGroup
      );
    } finally {
      this.exports.gethen_dealloc_f64(valuesPointer, values.length);
      this.exports.gethen_dealloc(validityPointer, validity.length);
      this.exports.gethen_dealloc_u32(groupsPointer, groups.length);
    }
  }

  formulaSumProduct(
    left: Float64Array,
    right: Float64Array,
    validity: Uint8Array
  ): number {
    requireEqualLength(left, right, validity);
    const leftPointer = this.exports.gethen_alloc_f64(left.length);
    const rightPointer = this.exports.gethen_alloc_f64(right.length);
    const validityPointer = this.exports.gethen_alloc(validity.length);
    try {
      new Float64Array(this.exports.memory.buffer, leftPointer, left.length).set(left);
      new Float64Array(this.exports.memory.buffer, rightPointer, right.length).set(right);
      new Uint8Array(this.exports.memory.buffer, validityPointer, validity.length).set(validity);
      return this.exports.gethen_formula_sum_product_f64(
        leftPointer,
        rightPointer,
        validityPointer,
        left.length
      );
    } finally {
      this.exports.gethen_dealloc_f64(leftPointer, left.length);
      this.exports.gethen_dealloc_f64(rightPointer, right.length);
      this.exports.gethen_dealloc(validityPointer, validity.length);
    }
  }

  filterNumeric(
    values: Float64Array,
    validity: Uint8Array,
    operation: number,
    expected: number,
    expectedValid: boolean
  ): Uint8Array {
    requireEqualLength(values, validity);
    const valuesPointer = this.exports.gethen_alloc_f64(values.length);
    const validityPointer = this.exports.gethen_alloc(validity.length);
    const outputPointer = this.exports.gethen_alloc(validity.length);
    try {
      new Float64Array(this.exports.memory.buffer, valuesPointer, values.length).set(values);
      new Uint8Array(this.exports.memory.buffer, validityPointer, validity.length).set(validity);
      this.exports.gethen_filter_mask_f64(
        valuesPointer,
        validityPointer,
        values.length,
        operation,
        expected,
        expectedValid ? 1 : 0,
        outputPointer
      );
      return new Uint8Array(this.exports.memory.buffer, outputPointer, values.length).slice();
    } finally {
      this.exports.gethen_dealloc_f64(valuesPointer, values.length);
      this.exports.gethen_dealloc(validityPointer, validity.length);
      this.exports.gethen_dealloc(outputPointer, validity.length);
    }
  }

  filterUtf8(
    offsets: Uint32Array,
    bytes: Uint8Array,
    validity: Uint8Array,
    expected: Uint8Array,
    operation: number
  ): Uint8Array {
    if (offsets.length !== validity.length + 1 || offsets.at(-1) !== bytes.length) {
      throw new Error("Rust/WASM UTF-8 filter offsets are invalid.");
    }
    const offsetsPointer = this.exports.gethen_alloc_u32(offsets.length);
    const bytesAllocationLength = Math.max(1, bytes.length);
    const bytesPointer = this.exports.gethen_alloc(bytesAllocationLength);
    const validityPointer = this.exports.gethen_alloc(validity.length);
    const expectedAllocationLength = Math.max(1, expected.length);
    const expectedPointer = this.exports.gethen_alloc(expectedAllocationLength);
    const outputPointer = this.exports.gethen_alloc(validity.length);
    try {
      new Uint32Array(this.exports.memory.buffer, offsetsPointer, offsets.length).set(offsets);
      new Uint8Array(this.exports.memory.buffer, bytesPointer, bytes.length).set(bytes);
      new Uint8Array(this.exports.memory.buffer, validityPointer, validity.length).set(validity);
      new Uint8Array(this.exports.memory.buffer, expectedPointer, expected.length).set(expected);
      this.exports.gethen_filter_mask_utf8(
        offsetsPointer,
        bytesPointer,
        bytes.length,
        validityPointer,
        validity.length,
        expectedPointer,
        expected.length,
        operation,
        outputPointer
      );
      return new Uint8Array(this.exports.memory.buffer, outputPointer, validity.length).slice();
    } finally {
      this.exports.gethen_dealloc_u32(offsetsPointer, offsets.length);
      this.exports.gethen_dealloc(bytesPointer, bytesAllocationLength);
      this.exports.gethen_dealloc(validityPointer, validity.length);
      this.exports.gethen_dealloc(expectedPointer, expectedAllocationLength);
      this.exports.gethen_dealloc(outputPointer, validity.length);
    }
  }

  stableSortNumeric(
    values: Float64Array,
    validity: Uint8Array,
    indices: Uint32Array,
    direction: "asc" | "desc",
    nulls: "first" | "last"
  ): Uint32Array {
    requireEqualLength(values, validity);
    if (indices.length === 0) return indices.slice();
    if (indices.some((index) => index >= values.length)) {
      throw new Error("Rust/WASM sort indices must reference the supplied rank column.");
    }
    const valuesPointer = this.exports.gethen_alloc_f64(values.length);
    const validityPointer = this.exports.gethen_alloc(validity.length);
    const indicesPointer = this.exports.gethen_alloc_u32(indices.length);
    try {
      new Float64Array(this.exports.memory.buffer, valuesPointer, values.length).set(values);
      new Uint8Array(this.exports.memory.buffer, validityPointer, validity.length).set(validity);
      new Uint32Array(this.exports.memory.buffer, indicesPointer, indices.length).set(indices);
      this.exports.gethen_stable_sort_indices_f64(
        valuesPointer,
        validityPointer,
        indicesPointer,
        indices.length,
        direction === "asc" ? 0 : 1,
        nulls === "first" ? 1 : 0
      );
      return new Uint32Array(this.exports.memory.buffer, indicesPointer, indices.length).slice();
    } finally {
      this.exports.gethen_dealloc_f64(valuesPointer, values.length);
      this.exports.gethen_dealloc(validityPointer, validity.length);
      this.exports.gethen_dealloc_u32(indicesPointer, indices.length);
    }
  }
}

export async function loadRustWasmKernels(
  source: URL | Response | ArrayBuffer | WebAssembly.Module = new URL("./gethen_engine.wasm", import.meta.url)
): Promise<RustWasmKernels> {
  let instance: WebAssembly.Instance;
  if (source instanceof WebAssembly.Module) {
    instance = await WebAssembly.instantiate(source, {});
  } else if (source instanceof ArrayBuffer) {
    ({ instance } = await WebAssembly.instantiate(source, {}));
  } else {
    const response = source instanceof Response ? source : await fetch(source);
    if (!response.ok) throw new Error(`Unable to load Rust/WASM engine: HTTP ${response.status}.`);
    const bytes = await response.arrayBuffer();
    ({ instance } = await WebAssembly.instantiate(bytes, {}));
  }
  return new RustWasmKernels(instance.exports as RustWasmKernelExports);
}

function requireEqualLength(...arrays: readonly ArrayLike<unknown>[]): void {
  const length = arrays[0]?.length ?? 0;
  if (arrays.some((array) => array.length !== length)) {
    throw new Error("Rust/WASM kernel columns must have equal lengths.");
  }
}
