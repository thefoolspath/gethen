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
  readonly gethen_assign_group_ids_u32: (
    parentIdsPointer: number,
    keyIdsPointer: number,
    length: number,
    rowGroupIdsPointer: number,
    groupParentIdsPointer: number,
    groupKeyIdsPointer: number,
    groupFirstRowsPointer: number,
    groupCountsPointer: number
  ) => number;
  readonly gethen_aggregate_groups_f64: (
    valuesPointer: number,
    validityPointer: number,
    groupIdsPointer: number,
    rowCount: number,
    groupCount: number,
    operation: number,
    countAll: number,
    outputValuesPointer: number,
    outputValidityPointer: number
  ) => void;
  readonly gethen_flatten_group_tokens: (
    rowGroupIdsPointer: number,
    rowCount: number,
    levelCount: number,
    groupOffsetsPointer: number,
    groupParentIdsPointer: number,
    expandedPointer: number,
    viewportStart: number,
    viewportCount: number,
    outputKindsPointer: number,
    outputLevelsPointer: number,
    outputIndicesPointer: number,
    outputCountPointer: number
  ) => number;
}

export interface RustWasmFilterAggregateResult {
  readonly count: number;
  readonly sum: number;
}

export interface RustWasmGroupAssignmentResult {
  readonly rowGroupIds: Uint32Array;
  readonly groupParentIds: Uint32Array;
  readonly groupKeyIds: Uint32Array;
  readonly groupFirstRows: Uint32Array;
  readonly groupCounts: Uint32Array;
}

export interface RustWasmGroupAggregateResult {
  readonly values: Float64Array;
  readonly validity: Uint8Array;
}

export interface RustWasmFlattenResult {
  readonly totalViewRowCount: number;
  readonly kinds: Uint8Array;
  readonly levels: Uint32Array;
  readonly indices: Uint32Array;
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

  assignGroups(parentIds: Uint32Array, keyIds: Uint32Array): RustWasmGroupAssignmentResult {
    requireEqualLength(parentIds, keyIds);
    const allocationLength = Math.max(1, parentIds.length);
    const parentIdsPointer = this.exports.gethen_alloc_u32(allocationLength);
    const keyIdsPointer = this.exports.gethen_alloc_u32(allocationLength);
    const rowGroupIdsPointer = this.exports.gethen_alloc_u32(allocationLength);
    const groupParentIdsPointer = this.exports.gethen_alloc_u32(allocationLength);
    const groupKeyIdsPointer = this.exports.gethen_alloc_u32(allocationLength);
    const groupFirstRowsPointer = this.exports.gethen_alloc_u32(allocationLength);
    const groupCountsPointer = this.exports.gethen_alloc_u32(allocationLength);
    try {
      new Uint32Array(this.exports.memory.buffer, parentIdsPointer, parentIds.length).set(parentIds);
      new Uint32Array(this.exports.memory.buffer, keyIdsPointer, keyIds.length).set(keyIds);
      const groupCount = this.exports.gethen_assign_group_ids_u32(
        parentIdsPointer,
        keyIdsPointer,
        parentIds.length,
        rowGroupIdsPointer,
        groupParentIdsPointer,
        groupKeyIdsPointer,
        groupFirstRowsPointer,
        groupCountsPointer
      );
      return {
        rowGroupIds: new Uint32Array(
          this.exports.memory.buffer,
          rowGroupIdsPointer,
          parentIds.length
        ).slice(),
        groupParentIds: new Uint32Array(
          this.exports.memory.buffer,
          groupParentIdsPointer,
          groupCount
        ).slice(),
        groupKeyIds: new Uint32Array(
          this.exports.memory.buffer,
          groupKeyIdsPointer,
          groupCount
        ).slice(),
        groupFirstRows: new Uint32Array(
          this.exports.memory.buffer,
          groupFirstRowsPointer,
          groupCount
        ).slice(),
        groupCounts: new Uint32Array(
          this.exports.memory.buffer,
          groupCountsPointer,
          groupCount
        ).slice()
      };
    } finally {
      this.exports.gethen_dealloc_u32(parentIdsPointer, allocationLength);
      this.exports.gethen_dealloc_u32(keyIdsPointer, allocationLength);
      this.exports.gethen_dealloc_u32(rowGroupIdsPointer, allocationLength);
      this.exports.gethen_dealloc_u32(groupParentIdsPointer, allocationLength);
      this.exports.gethen_dealloc_u32(groupKeyIdsPointer, allocationLength);
      this.exports.gethen_dealloc_u32(groupFirstRowsPointer, allocationLength);
      this.exports.gethen_dealloc_u32(groupCountsPointer, allocationLength);
    }
  }

  aggregateGroups(
    values: Float64Array,
    validity: Uint8Array,
    groupIds: Uint32Array,
    groupCount: number,
    operation: number,
    countAll: boolean
  ): RustWasmGroupAggregateResult {
    requireEqualLength(values, validity, groupIds);
    requireUint32("group count", groupCount);
    if (groupIds.some((groupId) => groupId >= groupCount)) {
      throw new Error("Rust/WASM aggregate group IDs must reference an existing group.");
    }
    const rowAllocationLength = Math.max(1, values.length);
    const groupAllocationLength = Math.max(1, groupCount);
    const valuesPointer = this.exports.gethen_alloc_f64(rowAllocationLength);
    const validityPointer = this.exports.gethen_alloc(rowAllocationLength);
    const groupIdsPointer = this.exports.gethen_alloc_u32(rowAllocationLength);
    const outputValuesPointer = this.exports.gethen_alloc_f64(groupAllocationLength);
    const outputValidityPointer = this.exports.gethen_alloc(groupAllocationLength);
    try {
      new Float64Array(this.exports.memory.buffer, valuesPointer, values.length).set(values);
      new Uint8Array(this.exports.memory.buffer, validityPointer, validity.length).set(validity);
      new Uint32Array(this.exports.memory.buffer, groupIdsPointer, groupIds.length).set(groupIds);
      this.exports.gethen_aggregate_groups_f64(
        valuesPointer,
        validityPointer,
        groupIdsPointer,
        values.length,
        groupCount,
        operation,
        countAll ? 1 : 0,
        outputValuesPointer,
        outputValidityPointer
      );
      return {
        values: new Float64Array(
          this.exports.memory.buffer,
          outputValuesPointer,
          groupCount
        ).slice(),
        validity: new Uint8Array(
          this.exports.memory.buffer,
          outputValidityPointer,
          groupCount
        ).slice()
      };
    } finally {
      this.exports.gethen_dealloc_f64(valuesPointer, rowAllocationLength);
      this.exports.gethen_dealloc(validityPointer, rowAllocationLength);
      this.exports.gethen_dealloc_u32(groupIdsPointer, rowAllocationLength);
      this.exports.gethen_dealloc_f64(outputValuesPointer, groupAllocationLength);
      this.exports.gethen_dealloc(outputValidityPointer, groupAllocationLength);
    }
  }

  flattenGroupTokens(
    rowGroupIdsByLevel: readonly Uint32Array[],
    groupParentIdsByLevel: readonly Uint32Array[],
    expandedByLevel: readonly Uint8Array[],
    rowCount: number,
    viewport?: { readonly start: number; readonly count: number }
  ): RustWasmFlattenResult {
    requireUint32("row count", rowCount);
    if (
      rowGroupIdsByLevel.length !== groupParentIdsByLevel.length
      || rowGroupIdsByLevel.length !== expandedByLevel.length
    ) {
      throw new Error("Rust/WASM flatten levels must have matching group metadata.");
    }
    for (let level = 0; level < rowGroupIdsByLevel.length; level += 1) {
      if (rowGroupIdsByLevel[level]!.length !== rowCount) {
        throw new Error("Rust/WASM flatten row group levels must match rowCount.");
      }
      requireEqualLength(groupParentIdsByLevel[level]!, expandedByLevel[level]!);
    }
    const rowGroupIds = concatenateUint32(rowGroupIdsByLevel);
    const groupParentIds = concatenateUint32(groupParentIdsByLevel);
    const expanded = concatenateUint8(expandedByLevel);
    const groupOffsets = new Uint32Array(groupParentIdsByLevel.length + 1);
    for (let level = 0; level < groupParentIdsByLevel.length; level += 1) {
      groupOffsets[level + 1] = groupOffsets[level]! + groupParentIdsByLevel[level]!.length;
    }
    const maximumTotal = rowCount + groupParentIds.length;
    requireUint32("maximum flattened row count", maximumTotal);
    const normalizedViewport = normalizeViewport(viewport, maximumTotal);
    const outputCapacity = normalizedViewport
      ? Math.min(normalizedViewport.count, maximumTotal)
      : maximumTotal;
    const rowGroupAllocationLength = Math.max(1, rowGroupIds.length);
    const groupAllocationLength = Math.max(1, groupParentIds.length);
    const offsetsPointer = this.exports.gethen_alloc_u32(groupOffsets.length);
    const rowGroupIdsPointer = this.exports.gethen_alloc_u32(rowGroupAllocationLength);
    const groupParentIdsPointer = this.exports.gethen_alloc_u32(groupAllocationLength);
    const expandedPointer = this.exports.gethen_alloc(groupAllocationLength);
    const outputAllocationLength = Math.max(1, outputCapacity);
    const outputKindsPointer = this.exports.gethen_alloc(outputAllocationLength);
    const outputLevelsPointer = this.exports.gethen_alloc_u32(outputAllocationLength);
    const outputIndicesPointer = this.exports.gethen_alloc_u32(outputAllocationLength);
    const outputCountPointer = this.exports.gethen_alloc_u32(1);
    try {
      new Uint32Array(this.exports.memory.buffer, rowGroupIdsPointer, rowGroupIds.length).set(rowGroupIds);
      new Uint32Array(this.exports.memory.buffer, offsetsPointer, groupOffsets.length).set(groupOffsets);
      new Uint32Array(this.exports.memory.buffer, groupParentIdsPointer, groupParentIds.length).set(groupParentIds);
      new Uint8Array(this.exports.memory.buffer, expandedPointer, expanded.length).set(expanded);
      const totalViewRowCount = this.exports.gethen_flatten_group_tokens(
        rowGroupIdsPointer,
        rowCount,
        rowGroupIdsByLevel.length,
        offsetsPointer,
        groupParentIdsPointer,
        expandedPointer,
        normalizedViewport?.start ?? 0,
        outputCapacity,
        outputKindsPointer,
        outputLevelsPointer,
        outputIndicesPointer,
        outputCountPointer
      );
      const outputCount = new Uint32Array(this.exports.memory.buffer, outputCountPointer, 1)[0]!;
      return {
        totalViewRowCount,
        kinds: new Uint8Array(this.exports.memory.buffer, outputKindsPointer, outputCount).slice(),
        levels: new Uint32Array(this.exports.memory.buffer, outputLevelsPointer, outputCount).slice(),
        indices: new Uint32Array(this.exports.memory.buffer, outputIndicesPointer, outputCount).slice()
      };
    } finally {
      this.exports.gethen_dealloc_u32(rowGroupIdsPointer, rowGroupAllocationLength);
      this.exports.gethen_dealloc_u32(offsetsPointer, groupOffsets.length);
      this.exports.gethen_dealloc_u32(groupParentIdsPointer, groupAllocationLength);
      this.exports.gethen_dealloc(expandedPointer, groupAllocationLength);
      this.exports.gethen_dealloc(outputKindsPointer, outputAllocationLength);
      this.exports.gethen_dealloc_u32(outputLevelsPointer, outputAllocationLength);
      this.exports.gethen_dealloc_u32(outputIndicesPointer, outputAllocationLength);
      this.exports.gethen_dealloc_u32(outputCountPointer, 1);
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

function requireUint32(label: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new Error(`Rust/WASM ${label} must be an unsigned 32-bit integer.`);
  }
}

function normalizeViewport(
  viewport: { readonly start: number; readonly count: number } | undefined,
  total: number
): { readonly start: number; readonly count: number } | undefined {
  if (!viewport) return undefined;
  if (
    !Number.isSafeInteger(viewport.start)
    || viewport.start < 0
    || !Number.isSafeInteger(viewport.count)
    || viewport.count < 0
  ) {
    throw new Error("Rust/WASM viewport start and count must be non-negative safe integers.");
  }
  return {
    start: Math.min(viewport.start, total),
    count: Math.min(viewport.count, total)
  };
}

function concatenateUint32(arrays: readonly Uint32Array[]): Uint32Array {
  const result = new Uint32Array(arrays.reduce((length, array) => length + array.length, 0));
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

function concatenateUint8(arrays: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(arrays.reduce((length, array) => length + array.length, 0));
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}
