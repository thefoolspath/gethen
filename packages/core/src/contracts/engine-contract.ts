import type { CellValue, ColumnId } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./grid-types.js";
import type {
  GridAggregateDescriptor,
  GridComparisonType,
  GridDataShapingOptions,
  GridDataShapingResult,
  GridFilterDescriptor,
  GridGroupDescriptor,
  GridSortDescriptor
} from "../shaping/grid-data-shaping.js";
import { shapeGridData, shapeGridDataInStages } from "../shaping/grid-data-shaping.js";
import { readGridColumnarValue } from "../shaping/grid-value-semantics.js";

export type GridColumnarStorage = "float64" | "boolean" | "utf8";

export interface GridColumnarSchemaColumn {
  readonly columnId: ColumnId;
  readonly storage: GridColumnarStorage;
}

export interface GridColumnarNumericColumn extends GridColumnarSchemaColumn {
  readonly storage: "float64";
  readonly values: Float64Array;
  readonly validity: Uint8Array;
}

export interface GridColumnarBooleanColumn extends GridColumnarSchemaColumn {
  readonly storage: "boolean";
  readonly values: Uint8Array;
  readonly validity: Uint8Array;
}

export interface GridColumnarTextColumn extends GridColumnarSchemaColumn {
  readonly storage: "utf8";
  readonly offsets: Uint32Array;
  readonly bytes: Uint8Array;
  readonly validity: Uint8Array;
}

export type GridColumnarColumn =
  | GridColumnarNumericColumn
  | GridColumnarBooleanColumn
  | GridColumnarTextColumn;

export interface GridColumnarBuffer {
  readonly rowCount: number;
  readonly rowIds: readonly string[];
  readonly columns: readonly GridColumnarColumn[];
}

export interface GridColumnarInputColumn {
  readonly columnId: ColumnId;
  readonly storage: GridColumnarStorage;
}

export interface GridPortableAggregateDescriptor
  extends Omit<GridAggregateDescriptor, "reducer"> {
  readonly operation: Exclude<GridAggregateDescriptor["operation"], "custom">;
}

export interface GridWorkerShapeDefinition {
  readonly filter: readonly GridFilterDescriptor[];
  readonly sort: readonly GridSortDescriptor[];
  readonly group: readonly GridGroupDescriptor[];
  readonly aggregate: readonly GridPortableAggregateDescriptor[];
  readonly expandedGroupIds: readonly string[] | "all";
  readonly viewport?: { readonly start: number; readonly count: number };
}

export interface GridEngineShapeRequest {
  readonly type: "shape";
  readonly requestId: string;
  readonly data: GridColumnarBuffer;
  readonly definition: GridWorkerShapeDefinition;
}

export interface GridEngineCancelRequest {
  readonly type: "cancel";
  readonly requestId: string;
}

export type GridEngineWorkerRequest = GridEngineShapeRequest | GridEngineCancelRequest;

export type GridEngineProgressStage =
  | "accepted"
  | "decode"
  | "filter"
  | "sort"
  | "group"
  | "aggregate"
  | "flatten"
  | "complete";

export type GridEngineWorkerResponse =
  | {
      readonly type: "progress";
      readonly requestId: string;
      readonly stage: GridEngineProgressStage;
      readonly completed: number;
      readonly total: number;
    }
  | {
      readonly type: "result";
      readonly requestId: string;
      readonly result: GridDataShapingResult;
    }
  | {
      readonly type: "cancelled";
      readonly requestId: string;
    }
  | {
      readonly type: "error";
      readonly requestId: string;
      readonly code: "invalid-request" | "engine-failure";
      readonly message: string;
    };

export interface GridEngineStagedExecutionOptions {
  readonly onProgress?: (
    stage: GridEngineProgressStage,
    completed: number,
    total: number
  ) => void;
  readonly yieldControl?: () => Promise<void>;
}

export function createGridColumnarBuffer(
  rows: readonly GridRow[],
  columns: readonly GridColumnarInputColumn[]
): GridColumnarBuffer {
  assertColumnarInput(rows, columns);
  return {
    rowCount: rows.length,
    rowIds: rows.map((row) => row.id),
    columns: columns.map((column) => encodeColumn(rows, column))
  };
}

export function decodeGridColumnarBuffer(
  buffer: GridColumnarBuffer,
  includedColumnIds?: ReadonlySet<string>
): readonly GridRow[] {
  validateGridColumnarBuffer(buffer);
  const decodedColumns = buffer.columns
    .filter((column) => !includedColumnIds || includedColumnIds.has(column.columnId))
    .map((column) => decodeColumn(column, buffer.rowCount));
  return buffer.rowIds.map((id, rowIndex) => ({
    id,
    cells: Object.fromEntries(decodedColumns.map(({ columnId, values }) => [columnId, values[rowIndex]!]))
  }));
}

export function createGridWorkerShapeDefinition(
  options: Omit<GridDataShapingOptions, "rows">
): GridWorkerShapeDefinition {
  const aggregate = (options.aggregate ?? []).map((descriptor) => {
    if (descriptor.operation === "custom" || descriptor.reducer) {
      throw new Error("Custom reducer callbacks are client-only and cannot enter the worker protocol.");
    }
    return descriptor as GridPortableAggregateDescriptor;
  });
  return {
    filter: options.filter ?? [],
    sort: options.sort ?? [],
    group: options.group ?? [],
    aggregate,
    expandedGroupIds: options.expandedGroupIds === "all" || options.expandedGroupIds === undefined
      ? "all"
      : [...options.expandedGroupIds],
    ...(options.viewport ? { viewport: options.viewport } : {})
  };
}

export function executeGridEngineShapeRequest(request: GridEngineShapeRequest): GridDataShapingResult {
  validateGridEngineShapeRequest(request);
  const computationColumnIds = getComputationColumnIds(request.definition);
  const result = shapeGridData({
    rows: decodeGridColumnarBuffer(request.data, computationColumnIds),
    filter: request.definition.filter,
    sort: request.definition.sort,
    group: request.definition.group,
    aggregate: request.definition.aggregate,
    expandedGroupIds: request.definition.expandedGroupIds === "all"
      ? "all"
      : new Set(request.definition.expandedGroupIds),
    ...(request.definition.viewport ? { viewport: request.definition.viewport } : {})
  });
  return hydrateGridEngineResult(request, result);
}

export async function executeGridEngineShapeRequestInStages(
  request: GridEngineShapeRequest,
  options: GridEngineStagedExecutionOptions = {}
): Promise<GridDataShapingResult> {
  validateGridEngineShapeRequest(request);
  const total = request.data.rowCount;
  options.onProgress?.("decode", 0, total);
  await options.yieldControl?.();
  const computationColumnIds = getComputationColumnIds(request.definition);
  const rows = decodeGridColumnarBuffer(request.data, computationColumnIds);
  options.onProgress?.("decode", total, total);
  await options.yieldControl?.();
  const result = await shapeGridDataInStages({
    rows,
    filter: request.definition.filter,
    sort: request.definition.sort,
    group: request.definition.group,
    aggregate: request.definition.aggregate,
    expandedGroupIds: request.definition.expandedGroupIds === "all"
      ? "all"
      : new Set(request.definition.expandedGroupIds),
    ...(request.definition.viewport ? { viewport: request.definition.viewport } : {})
  }, {
    ...(options.onProgress ? { onProgress: options.onProgress } : {}),
    ...(options.yieldControl ? { yieldControl: options.yieldControl } : {})
  });
  const hydrated = hydrateGridEngineResult(request, result);
  options.onProgress?.("complete", total, total);
  await options.yieldControl?.();
  return hydrated;
}

function hydrateGridEngineResult(
  request: GridEngineShapeRequest,
  result: GridDataShapingResult
): GridDataShapingResult {
  const rowIndexes = new Map(request.data.rowIds.map((id, index) => [id, index]));
  return {
    ...result,
    rows: result.rows.map((row) => {
      if (row.kind !== "source") return row;
      const rowIndex = rowIndexes.get(row.sourceRowId);
      if (rowIndex === undefined) throw new Error(`Source row '${row.sourceRowId}' is missing from the columnar buffer.`);
      return {
        ...row,
        cells: Object.fromEntries(request.data.columns.map((column) => [
          column.columnId,
          readGridColumnarValue(column, rowIndex)
        ]))
      };
    })
  };
}

export function getGridColumnarTransferables(buffer: GridColumnarBuffer): readonly ArrayBuffer[] {
  const transferables: ArrayBuffer[] = [];
  for (const column of buffer.columns) {
    transferables.push(
      toArrayBuffer(column.validity.buffer),
      ...(column.storage === "utf8"
        ? [toArrayBuffer(column.offsets.buffer), toArrayBuffer(column.bytes.buffer)]
        : [toArrayBuffer(column.values.buffer)])
    );
  }
  return [...new Set(transferables)];
}

function encodeColumn(rows: readonly GridRow[], column: GridColumnarInputColumn): GridColumnarColumn {
  const validity = Uint8Array.from(rows, (row) => row.cells[column.columnId] === null ? 0 : 1);
  if (column.storage === "float64") {
    return {
      columnId: column.columnId,
      storage: "float64",
      validity,
      values: Float64Array.from(rows, (row) => {
        const value = row.cells[column.columnId] ?? null;
        if (value === null) return 0;
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new Error(`Column '${column.columnId}' requires finite numeric values or null.`);
        }
        return value;
      })
    };
  }
  if (column.storage === "boolean") {
    return {
      columnId: column.columnId,
      storage: "boolean",
      validity,
      values: Uint8Array.from(rows, (row) => {
        const value = row.cells[column.columnId] ?? null;
        if (value === null) return 0;
        if (typeof value !== "boolean") {
          throw new Error(`Column '${column.columnId}' requires boolean values or null.`);
        }
        return value ? 1 : 0;
      })
    };
  }
  const encoder = new TextEncoder();
  const encoded = rows.map((row) => {
    const value = row.cells[column.columnId] ?? null;
    if (value === null) return new Uint8Array();
    if (typeof value !== "string") {
      throw new Error(`Column '${column.columnId}' requires string values or null.`);
    }
    return encoder.encode(value);
  });
  const offsets = new Uint32Array(rows.length + 1);
  let byteLength = 0;
  encoded.forEach((value, index) => {
    byteLength += value.byteLength;
    offsets[index + 1] = byteLength;
  });
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const value of encoded) {
    bytes.set(value, offset);
    offset += value.byteLength;
  }
  return { columnId: column.columnId, storage: "utf8", validity, offsets, bytes };
}

function decodeColumn(
  column: GridColumnarColumn,
  rowCount: number
): { columnId: string; values: readonly CellValue[] } {
  if (column.storage === "float64" || column.storage === "boolean") {
    return {
      columnId: column.columnId,
      values: Array.from({ length: rowCount }, (_, index) =>
        column.validity[index] === 0
          ? null
          : column.storage === "float64"
            ? column.values[index]!
            : column.values[index] === 1
      )
    };
  }
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return {
    columnId: column.columnId,
    values: Array.from({ length: rowCount }, (_, index) =>
      column.validity[index] === 0
        ? null
        : decoder.decode(column.bytes.subarray(column.offsets[index]!, column.offsets[index + 1]!))
    )
  };
}

export function validateGridEngineShapeRequest(request: GridEngineShapeRequest): void {
  if (request.type !== "shape" || typeof request.requestId !== "string" || request.requestId.length === 0) {
    throw new Error("Grid engine shape requests require a non-empty requestId.");
  }
  validateGridColumnarBuffer(request.data);
  for (const descriptor of request.definition.sort) {
    if (!isOneOf(descriptor.direction, ["asc", "desc"])) {
      throw new Error("Grid engine sort direction is invalid.");
    }
    validateComparisonType(descriptor.comparisonType);
    if (descriptor.nulls !== undefined && !isOneOf(descriptor.nulls, ["first", "last"])) {
      throw new Error("Grid engine null placement is invalid.");
    }
  }
  for (const descriptor of request.definition.filter) {
    if (!isOneOf(descriptor.operator, [
      "equals", "notEquals", "contains", "startsWith", "greaterThan",
      "greaterThanOrEqual", "lessThan", "lessThanOrEqual", "in", "isNull", "isNotNull"
    ])) {
      throw new Error("Grid engine filter operation is invalid.");
    }
    validateComparisonType(descriptor.comparisonType);
  }
  for (const descriptor of request.definition.group) {
    validateComparisonType(descriptor.comparisonType);
  }
  for (const descriptor of request.definition.aggregate) {
    if (!isOneOf(descriptor.operation, ["count", "sum", "min", "max", "average"])) {
      throw new Error("Grid engine aggregate operation is invalid.");
    }
  }
  validateViewport(request.definition.viewport);
}

export function validateGridColumnarBuffer(buffer: GridColumnarBuffer): void {
  if (!Number.isSafeInteger(buffer.rowCount) || buffer.rowCount < 0 || buffer.rowCount > 0xffff_ffff) {
    throw new Error("Columnar rowCount must be an unsigned 32-bit integer.");
  }
  if (buffer.rowIds.length !== buffer.rowCount) {
    throw new Error("Columnar rowIds length does not match rowCount.");
  }
  const columnIds = new Set<string>();
  for (const column of buffer.columns) {
    if (!column.columnId || columnIds.has(column.columnId)) {
      throw new Error(`Columnar column IDs must be non-empty and unique; received '${column.columnId}'.`);
    }
    columnIds.add(column.columnId);
    if (column.validity.length !== buffer.rowCount) {
      throw new Error(`Column '${column.columnId}' validity length does not match rowCount.`);
    }
    if (column.validity.some((value) => value > 1)) {
      throw new Error(`Column '${column.columnId}' validity values must be 0 or 1.`);
    }
    if (column.storage === "float64" || column.storage === "boolean") {
      if (column.values.length !== buffer.rowCount) {
        throw new Error(`Column '${column.columnId}' values length does not match rowCount.`);
      }
      if (column.storage === "boolean" && column.values.some((value) => value > 1)) {
        throw new Error(`Column '${column.columnId}' boolean values must be 0 or 1.`);
      }
      continue;
    }
    if (column.offsets.length !== buffer.rowCount + 1 || column.offsets[0] !== 0) {
      throw new Error(`Column '${column.columnId}' UTF-8 offsets are invalid.`);
    }
    let previous = 0;
    for (const offset of column.offsets) {
      if (offset < previous || offset > column.bytes.length) {
        throw new Error(`Column '${column.columnId}' UTF-8 offsets are invalid.`);
      }
      previous = offset;
    }
    if (previous !== column.bytes.length) {
      throw new Error(`Column '${column.columnId}' UTF-8 offsets are invalid.`);
    }
  }
}

function validateComparisonType(type: GridComparisonType | undefined): void {
  if (type !== undefined && !isOneOf(type, ["text", "number", "boolean", "date", "json"])) {
    throw new Error("Grid engine comparison type is invalid.");
  }
}

function validateViewport(viewport: GridWorkerShapeDefinition["viewport"]): void {
  if (
    viewport
    && (
      !Number.isSafeInteger(viewport.start)
      || viewport.start < 0
      || !Number.isSafeInteger(viewport.count)
      || viewport.count < 0
    )
  ) {
    throw new Error("Grid engine viewport start and count must be non-negative safe integers.");
  }
}

function isOneOf<T extends string>(value: unknown, accepted: readonly T[]): value is T {
  return typeof value === "string" && accepted.includes(value as T);
}

function getComputationColumnIds(definition: GridWorkerShapeDefinition): ReadonlySet<string> {
  return new Set([
    ...definition.filter.map((descriptor) => descriptor.columnId),
    ...definition.sort.map((descriptor) => descriptor.columnId),
    ...definition.group.map((descriptor) => descriptor.columnId),
    ...definition.aggregate.flatMap((descriptor) => descriptor.columnId ? [descriptor.columnId] : [])
  ]);
}

function assertColumnarInput(
  rows: readonly GridRow[],
  columns: readonly GridColumnarInputColumn[]
): void {
  const rowIds = new Set<string>();
  for (const row of rows) {
    if (!row.id || rowIds.has(row.id)) throw new Error(`Columnar row IDs must be non-empty and unique; received '${row.id}'.`);
    rowIds.add(row.id);
  }
  const columnIds = new Set<string>();
  for (const column of columns) {
    if (!column.columnId || columnIds.has(column.columnId)) throw new Error(`Columnar column IDs must be non-empty and unique; received '${column.columnId}'.`);
    columnIds.add(column.columnId);
  }
}

function toArrayBuffer(buffer: ArrayBufferLike): ArrayBuffer {
  if (!(buffer instanceof ArrayBuffer)) throw new Error("SharedArrayBuffer is not supported by the portable engine boundary.");
  return buffer;
}
