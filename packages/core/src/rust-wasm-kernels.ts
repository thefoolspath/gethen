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
