import type { CellValue } from "@thefoolspath/gethen-protocol";

import { compareGridValues } from "../../shaping/grid-data-shaping.js";
import type { GridFilterDescriptor, GridSortDescriptor } from "../../shaping/grid-data-shaping.js";
import type {
  GridColumnarBuffer,
  GridColumnarColumn,
  GridEngineShapeRequest
} from "../../contracts/engine-contract.js";
import type { RustWasmKernels } from "./rust-wasm-kernels.js";

type RustFilterSortKernels = Pick<
  RustWasmKernels,
  "filterNumeric" | "filterUtf8" | "stableSortNumeric"
>;

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

export interface RustWasmFilterSortPreparation {
  readonly request: GridEngineShapeRequest;
  readonly filteredRowCount: number;
}

export function prepareRustWasmFilterSortRequest(
  request: GridEngineShapeRequest,
  kernels: RustFilterSortKernels,
  onProgress?: (stage: "filter" | "sort", completed: number, total: number) => void
): RustWasmFilterSortPreparation {
  const rowCount = request.data.rowCount;
  let combinedMask = new Uint8Array(rowCount).fill(1);
  onProgress?.("filter", 0, rowCount);
  for (const descriptor of request.definition.filter) {
    const column = resolveColumn(request.data, descriptor.columnId);
    const descriptorMask = filterColumn(column, descriptor, kernels);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      combinedMask[rowIndex] = combinedMask[rowIndex]! & descriptorMask[rowIndex]!;
    }
  }
  const filteredRowCount = combinedMask.reduce((count, included) => count + included, 0);
  const filteredIndices = new Uint32Array(filteredRowCount);
  let outputIndex = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    if (combinedMask[rowIndex] === 0) continue;
    filteredIndices[outputIndex] = rowIndex;
    outputIndex += 1;
  }
  onProgress?.("filter", rowCount, rowCount);

  onProgress?.("sort", 0, filteredIndices.length);
  let sortedIndices: Uint32Array<ArrayBufferLike> = filteredIndices;
  for (const descriptor of [...request.definition.sort].reverse()) {
    const column = resolveColumn(request.data, descriptor.columnId);
    const ranks = createComparisonRankColumn(column, descriptor.comparisonType ?? "text", []);
    sortedIndices = kernels.stableSortNumeric(
      ranks.values,
      ranks.validity,
      sortedIndices,
      descriptor.direction,
      descriptor.nulls ?? "last"
    );
  }
  onProgress?.("sort", sortedIndices.length, sortedIndices.length);

  return {
    filteredRowCount: sortedIndices.length,
    request: {
      ...request,
      data: selectColumnarRows(request.data, sortedIndices),
      definition: {
        ...request.definition,
        filter: [],
        sort: []
      }
    }
  };
}

function filterColumn(
  column: GridColumnarColumn,
  descriptor: GridFilterDescriptor,
  kernels: RustFilterSortKernels
): Uint8Array {
  if (descriptor.operator === "contains" || descriptor.operator === "startsWith") {
    if (isCellValueArray(descriptor.value) || descriptor.value === undefined) {
      throw new Error(`Filter '${descriptor.operator}' requires one scalar value.`);
    }
    const normalized = createNormalizedUtf8Column(column, descriptor.caseSensitive ?? false);
    const expectedText = normalizeText(descriptor.value, descriptor.caseSensitive ?? false);
    return kernels.filterUtf8(
      normalized.offsets,
      normalized.bytes,
      normalized.validity,
      new TextEncoder().encode(expectedText),
      descriptor.operator === "contains" ? 8 : 9
    );
  }

  if (descriptor.operator === "in") {
    if (!isCellValueArray(descriptor.value)) throw new Error("The 'in' filter requires an array value.");
    const ranks = createComparisonRankColumn(
      column,
      descriptor.comparisonType ?? "text",
      descriptor.value
    );
    const output = new Uint8Array(column.validity.length);
    for (const expected of descriptor.value) {
      const expectedRank = expected === null ? 0 : requireRank(ranks.ranks, expected);
      const mask = kernels.filterNumeric(
        ranks.values,
        ranks.validity,
        0,
        expectedRank,
        expected !== null
      );
      for (let rowIndex = 0; rowIndex < output.length; rowIndex += 1) {
        output[rowIndex] = output[rowIndex]! | mask[rowIndex]!;
      }
    }
    return output;
  }

  const operation = filterOperationCode(descriptor.operator);
  const expected = descriptor.operator === "isNull" || descriptor.operator === "isNotNull"
    ? null
    : descriptor.value;
  if (expected === undefined || isCellValueArray(expected)) {
    throw new Error(`Filter '${descriptor.operator}' requires one scalar value.`);
  }
  const ranks = createComparisonRankColumn(
    column,
    descriptor.comparisonType ?? "text",
    expected === null ? [] : [expected]
  );
  return kernels.filterNumeric(
    ranks.values,
    ranks.validity,
    operation,
    expected === null ? 0 : requireRank(ranks.ranks, expected),
    expected !== null
  );
}

function createComparisonRankColumn(
  column: GridColumnarColumn,
  comparisonType: NonNullable<GridSortDescriptor["comparisonType"]>,
  extraValues: readonly CellValue[]
): {
  readonly values: Float64Array;
  readonly validity: Uint8Array;
  readonly ranks: ReadonlyMap<string, number>;
} {
  const direct = createDirectComparisonColumn(column, comparisonType, extraValues);
  if (direct) return direct;
  const distinct = new Map<string, CellValue>();
  for (let rowIndex = 0; rowIndex < column.validity.length; rowIndex += 1) {
    if (column.validity[rowIndex] === 0) continue;
    const value = readColumnValue(column, rowIndex);
    distinct.set(rawValueKey(value), value);
  }
  for (const value of extraValues) {
    if (value !== null) distinct.set(rawValueKey(value), value);
  }
  const ordered = [...distinct.entries()].sort((left, right) =>
    compareGridValues(left[1], right[1], comparisonType)
  );
  const ranks = new Map<string, number>();
  let rank = -1;
  let previous: CellValue | undefined;
  for (const [key, value] of ordered) {
    if (previous === undefined || compareGridValues(previous, value, comparisonType) !== 0) rank += 1;
    ranks.set(key, rank);
    previous = value;
  }
  const values = new Float64Array(column.validity.length);
  for (let rowIndex = 0; rowIndex < values.length; rowIndex += 1) {
    if (column.validity[rowIndex] === 0) continue;
    values[rowIndex] = requireRank(ranks, readColumnValue(column, rowIndex));
  }
  return { values, validity: column.validity, ranks };
}

function createDirectComparisonColumn(
  column: GridColumnarColumn,
  comparisonType: NonNullable<GridSortDescriptor["comparisonType"]>,
  extraValues: readonly CellValue[]
): {
  readonly values: Float64Array;
  readonly validity: Uint8Array;
  readonly ranks: ReadonlyMap<string, number>;
} | undefined {
  if (comparisonType !== "number" && comparisonType !== "boolean" && comparisonType !== "date") {
    return undefined;
  }
  const convert = (value: CellValue): number => comparisonType === "boolean"
    ? Number(Boolean(value))
    : comparisonType === "number"
      ? Number(value)
      : Date.parse(String(value));
  const values = new Float64Array(column.validity.length);
  for (let rowIndex = 0; rowIndex < values.length; rowIndex += 1) {
    if (column.validity[rowIndex] === 0) continue;
    const converted = convert(readColumnValue(column, rowIndex));
    if (!Number.isFinite(converted)) return undefined;
    values[rowIndex] = converted;
  }
  const ranks = new Map<string, number>();
  for (const value of extraValues) {
    if (value === null) continue;
    const converted = convert(value);
    if (!Number.isFinite(converted)) return undefined;
    ranks.set(rawValueKey(value), converted);
  }
  return { values, validity: column.validity, ranks };
}

function createNormalizedUtf8Column(
  column: GridColumnarColumn,
  caseSensitive: boolean
): { readonly offsets: Uint32Array; readonly bytes: Uint8Array; readonly validity: Uint8Array } {
  const encoder = new TextEncoder();
  const encodedByValue = new Map<string, Uint8Array>();
  const offsets = new Uint32Array(column.validity.length + 1);
  let byteLength = 0;
  for (let rowIndex = 0; rowIndex < column.validity.length; rowIndex += 1) {
    const value = normalizeText(readColumnValue(column, rowIndex), caseSensitive);
    let encoded = encodedByValue.get(value);
    if (!encoded) {
      encoded = encoder.encode(value);
      encodedByValue.set(value, encoded);
    }
    byteLength += encoded.byteLength;
    offsets[rowIndex + 1] = byteLength;
  }
  const bytes = new Uint8Array(byteLength);
  let byteOffset = 0;
  for (let rowIndex = 0; rowIndex < column.validity.length; rowIndex += 1) {
    const encoded = encodedByValue.get(normalizeText(readColumnValue(column, rowIndex), caseSensitive))!;
    bytes.set(encoded, byteOffset);
    byteOffset += encoded.byteLength;
  }
  return {
    offsets,
    bytes,
    validity: new Uint8Array(column.validity.length).fill(1)
  };
}

function selectColumnarRows(buffer: GridColumnarBuffer, indices: Uint32Array): GridColumnarBuffer {
  return {
    rowCount: indices.length,
    rowIds: Array.from(indices, (index) => buffer.rowIds[index]!),
    columns: buffer.columns.map((column) => selectColumnRows(column, indices))
  };
}

function selectColumnRows(column: GridColumnarColumn, indices: Uint32Array): GridColumnarColumn {
  const validity = Uint8Array.from(indices, (index) => column.validity[index]!);
  if (column.storage === "float64") {
    return {
      columnId: column.columnId,
      storage: "float64",
      validity,
      values: Float64Array.from(indices, (index) => column.values[index]!)
    };
  }
  if (column.storage === "boolean") {
    return {
      columnId: column.columnId,
      storage: "boolean",
      validity,
      values: Uint8Array.from(indices, (index) => column.values[index]!)
    };
  }
  const offsets = new Uint32Array(indices.length + 1);
  let byteLength = 0;
  indices.forEach((index, outputIndex) => {
    if (column.validity[index] !== 0) byteLength += column.offsets[index + 1]! - column.offsets[index]!;
    offsets[outputIndex + 1] = byteLength;
  });
  const bytes = new Uint8Array(byteLength);
  let byteOffset = 0;
  indices.forEach((index) => {
    if (column.validity[index] === 0) return;
    const value = column.bytes.subarray(column.offsets[index]!, column.offsets[index + 1]!);
    bytes.set(value, byteOffset);
    byteOffset += value.byteLength;
  });
  return { columnId: column.columnId, storage: "utf8", validity, offsets, bytes };
}

function resolveColumn(buffer: GridColumnarBuffer, columnId: string): GridColumnarColumn {
  return buffer.columns.find((column) => column.columnId === columnId) ?? {
    columnId,
    storage: "float64",
    values: new Float64Array(buffer.rowCount),
    validity: new Uint8Array(buffer.rowCount)
  };
}

function readColumnValue(column: GridColumnarColumn, rowIndex: number): CellValue {
  if (column.validity[rowIndex] === 0) return null;
  if (column.storage === "float64") return column.values[rowIndex]!;
  if (column.storage === "boolean") return column.values[rowIndex] === 1;
  return UTF8_DECODER.decode(
    column.bytes.subarray(column.offsets[rowIndex]!, column.offsets[rowIndex + 1]!)
  );
}

function normalizeText(value: CellValue, caseSensitive: boolean): string {
  const text = String(value ?? "");
  return caseSensitive ? text : text.toLocaleLowerCase("en");
}

function rawValueKey(value: CellValue): string {
  return `${value === null ? "null" : typeof value}:${String(value)}`;
}

function requireRank(ranks: ReadonlyMap<string, number>, value: CellValue): number {
  const rank = ranks.get(rawValueKey(value));
  if (rank === undefined) throw new Error(`Missing normalized comparison rank for '${String(value)}'.`);
  return rank;
}

function filterOperationCode(operator: GridFilterDescriptor["operator"]): number {
  switch (operator) {
    case "equals": return 0;
    case "notEquals": return 1;
    case "greaterThan": return 2;
    case "greaterThanOrEqual": return 3;
    case "lessThan": return 4;
    case "lessThanOrEqual": return 5;
    case "isNull": return 6;
    case "isNotNull": return 7;
    default: throw new Error(`Filter '${operator}' requires the UTF-8 or set filter path.`);
  }
}

function isCellValueArray(value: GridFilterDescriptor["value"]): value is readonly CellValue[] {
  return Array.isArray(value);
}
