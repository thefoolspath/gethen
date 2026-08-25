import type { CellValue, ColumnId } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "../contracts/grid-types.js";

export type GridSortDirection = "asc" | "desc";
export type GridNullPlacement = "first" | "last";
export type GridComparisonType = "text" | "number" | "boolean" | "date" | "json";
export type GridFilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "startsWith"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "in"
  | "isNull"
  | "isNotNull";

export interface GridSortDescriptor {
  readonly columnId: ColumnId;
  readonly direction: GridSortDirection;
  readonly comparisonType?: GridComparisonType;
  readonly nulls?: GridNullPlacement;
}

export interface GridFilterDescriptor {
  readonly columnId: ColumnId;
  readonly operator: GridFilterOperator;
  readonly value?: CellValue | readonly CellValue[];
  readonly comparisonType?: GridComparisonType;
  readonly caseSensitive?: boolean;
}

export interface GridGroupDescriptor {
  readonly columnId: ColumnId;
  readonly comparisonType?: GridComparisonType;
}

export type GridBuiltInAggregate = "count" | "sum" | "min" | "max" | "average";

export interface GridCustomReducerContext {
  readonly aggregateId: string;
  readonly columnId?: ColumnId;
  readonly values: readonly CellValue[];
  readonly rows: readonly GridRow[];
}

export interface GridAggregateDescriptor {
  readonly id: string;
  readonly operation: GridBuiltInAggregate | "custom";
  readonly columnId?: ColumnId;
  readonly reducer?: (context: GridCustomReducerContext) => CellValue;
}

export interface GridSourceViewRow extends GridRow {
  readonly kind: "source";
  readonly sourceRowId: string;
  readonly readonly: false;
}

export interface GridGroupProvenance {
  readonly level: number;
  readonly parentId?: string;
  readonly columnId: ColumnId;
  readonly value: CellValue;
  readonly sourceRowIds: readonly string[];
}

export interface GridGroupRow extends GridRow {
  readonly kind: "group";
  readonly readonly: true;
  readonly expanded: boolean;
  readonly childCount: number;
  readonly provenance: GridGroupProvenance;
}

export type GridShapedRow = GridSourceViewRow | GridGroupRow;

export interface GridDataShapingOptions {
  readonly rows: readonly GridRow[];
  readonly filter?: readonly GridFilterDescriptor[];
  readonly sort?: readonly GridSortDescriptor[];
  readonly group?: readonly GridGroupDescriptor[];
  readonly aggregate?: readonly GridAggregateDescriptor[];
  readonly expandedGroupIds?: ReadonlySet<string> | "all";
  readonly viewport?: { readonly start: number; readonly count: number };
}

export interface GridDataShapingResult {
  readonly sourceRowCount: number;
  readonly filteredRowCount: number;
  readonly totalViewRowCount: number;
  readonly rows: readonly GridShapedRow[];
}

interface GroupNode {
  readonly row: GridGroupRow;
  readonly children: readonly (GroupNode | GridRow)[];
  readonly sourceRows: readonly GridRow[];
}

export type GridDataShapingPipelineStage = "filter" | "sort" | "group" | "aggregate" | "flatten";

export interface GridDataShapingPipelineOptions {
  readonly onProgress?: (
    stage: GridDataShapingPipelineStage,
    completed: number,
    total: number
  ) => void;
  readonly yieldControl?: () => Promise<void>;
}

export function shapeGridData(options: GridDataShapingOptions): GridDataShapingResult {
  validateDescriptors(options);
  const filtered = filterGridRows(options.rows, options.filter ?? []);
  const sorted = stableMultiSort(filtered, options.sort ?? []);
  const groups = options.group ?? [];
  const expanded = options.expandedGroupIds ?? "all";
  if (groups.length === 0) {
    const viewport = normalizeViewport(options.viewport, sorted.length);
    return {
      sourceRowCount: options.rows.length,
      filteredRowCount: filtered.length,
      totalViewRowCount: sorted.length,
      rows: sorted.slice(viewport.start, viewport.start + viewport.count).map(toSourceViewRow)
    };
  }
  const shaped = flattenGroups(
        applyGroupAggregates(createGroupNodes(sorted, groups, 0), options.aggregate ?? []),
        expanded
      );
  const viewport = normalizeViewport(options.viewport, shaped.length);

  return {
    sourceRowCount: options.rows.length,
    filteredRowCount: filtered.length,
    totalViewRowCount: shaped.length,
    rows: shaped.slice(viewport.start, viewport.start + viewport.count)
  };
}

export async function shapeGridDataInStages(
  options: GridDataShapingOptions,
  pipelineOptions: GridDataShapingPipelineOptions = {}
): Promise<GridDataShapingResult> {
  validateDescriptors(options);
  const total = options.rows.length;
  const filtered = await runPipelineStage(
    "filter",
    total,
    () => filterGridRows(options.rows, options.filter ?? []),
    pipelineOptions
  );
  const sorted = await runPipelineStage(
    "sort",
    total,
    () => stableMultiSort(filtered, options.sort ?? []),
    pipelineOptions
  );
  const groups = options.group ?? [];
  const groupNodes = await runPipelineStage(
    "group",
    total,
    () => groups.length === 0 ? [] : createGroupNodes(sorted, groups, 0),
    pipelineOptions
  );
  const aggregatedNodes = await runPipelineStage(
    "aggregate",
    total,
    () => applyGroupAggregates(groupNodes, options.aggregate ?? []),
    pipelineOptions
  );
  return runPipelineStage("flatten", total, () => {
    if (groups.length === 0) {
      const viewport = normalizeViewport(options.viewport, sorted.length);
      return {
        sourceRowCount: options.rows.length,
        filteredRowCount: filtered.length,
        totalViewRowCount: sorted.length,
        rows: sorted.slice(viewport.start, viewport.start + viewport.count).map(toSourceViewRow)
      };
    }
    const shaped = flattenGroups(aggregatedNodes, options.expandedGroupIds ?? "all");
    const viewport = normalizeViewport(options.viewport, shaped.length);
    return {
      sourceRowCount: options.rows.length,
      filteredRowCount: filtered.length,
      totalViewRowCount: shaped.length,
      rows: shaped.slice(viewport.start, viewport.start + viewport.count)
    };
  }, pipelineOptions);
}

export function stableMultiSort(
  rows: readonly GridRow[],
  descriptors: readonly GridSortDescriptor[]
): readonly GridRow[] {
  if (descriptors.length === 0) return [...rows];
  return rows
    .map((row, sourceIndex) => ({ row, sourceIndex }))
    .sort((left, right) => {
      for (const descriptor of descriptors) {
        const comparison = compareGridValues(
          left.row.cells[descriptor.columnId] ?? null,
          right.row.cells[descriptor.columnId] ?? null,
          descriptor.comparisonType ?? "text",
          descriptor.nulls ?? "last"
        );
        if (comparison !== 0) {
          const hasNull = (left.row.cells[descriptor.columnId] ?? null) === null
            || (right.row.cells[descriptor.columnId] ?? null) === null;
          return hasNull || descriptor.direction === "asc" ? comparison : -comparison;
        }
      }
      return left.sourceIndex - right.sourceIndex;
    })
    .map(({ row }) => row);
}

export function compareGridValues(
  left: CellValue,
  right: CellValue,
  type: GridComparisonType,
  nulls: GridNullPlacement = "last"
): number {
  if (left === null || right === null) {
    if (left === right) return 0;
    return left === null ? (nulls === "first" ? -1 : 1) : (nulls === "first" ? 1 : -1);
  }
  switch (type) {
    case "number":
      return compareFiniteNumbers(Number(left), Number(right), left, right);
    case "boolean":
      return Number(Boolean(left)) - Number(Boolean(right));
    case "date":
      return compareFiniteNumbers(Date.parse(String(left)), Date.parse(String(right)), left, right);
    case "json":
      return canonicalJson(String(left)).localeCompare(canonicalJson(String(right)), "en");
    case "text":
      return String(left).localeCompare(String(right), "en");
  }
}

export function aggregateGridRows(
  rows: readonly GridRow[],
  descriptors: readonly GridAggregateDescriptor[]
): Readonly<Record<string, CellValue>> {
  return Object.fromEntries(descriptors.map((descriptor) => {
    const values = descriptor.columnId
      ? rows.map((row) => row.cells[descriptor.columnId!] ?? null)
      : [];
    if (descriptor.operation === "custom") {
      if (!descriptor.reducer) throw new Error(`Custom aggregate '${descriptor.id}' requires a reducer.`);
      return [descriptor.id, requireAggregateValue(descriptor.reducer({
        aggregateId: descriptor.id,
        ...(descriptor.columnId ? { columnId: descriptor.columnId } : {}),
        values,
        rows
      }), descriptor.id)];
    }
    if (descriptor.reducer) {
      throw new Error(`Built-in aggregate '${descriptor.id}' cannot also define a reducer.`);
    }
    const numeric = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    switch (descriptor.operation) {
      case "count": return [descriptor.id, descriptor.columnId ? values.filter((value) => value !== null).length : rows.length];
      case "sum": return [descriptor.id, numeric.reduce((sum, value) => sum + value, 0)];
      case "min": return [descriptor.id, numeric.length ? numeric.reduce((minimum, value) => Math.min(minimum, value), Number.POSITIVE_INFINITY) : null];
      case "max": return [descriptor.id, numeric.length ? numeric.reduce((maximum, value) => Math.max(maximum, value), Number.NEGATIVE_INFINITY) : null];
      case "average": return [descriptor.id, numeric.length ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : null];
    }
  }));
}

function matchesFilter(row: GridRow, descriptor: GridFilterDescriptor): boolean {
  const actual = row.cells[descriptor.columnId] ?? null;
  if (descriptor.operator === "isNull") return actual === null;
  if (descriptor.operator === "isNotNull") return actual !== null;
  const type = descriptor.comparisonType ?? "text";
  if (descriptor.operator === "in") {
    if (!isCellValueArray(descriptor.value)) throw new Error("The 'in' filter requires an array value.");
    return descriptor.value.some((value) => compareGridValues(actual, value, type) === 0);
  }
  if (isCellValueArray(descriptor.value) || descriptor.value === undefined) {
    throw new Error(`Filter '${descriptor.operator}' requires one scalar value.`);
  }
  const expected = descriptor.value;
  if (descriptor.operator === "contains" || descriptor.operator === "startsWith") {
    const normalize = (value: CellValue) => descriptor.caseSensitive
      ? String(value ?? "")
      : String(value ?? "").toLocaleLowerCase("en");
    return descriptor.operator === "contains"
      ? normalize(actual).includes(normalize(expected))
      : normalize(actual).startsWith(normalize(expected));
  }
  const comparison = compareGridValues(actual, expected, type);
  switch (descriptor.operator) {
    case "equals": return comparison === 0;
    case "notEquals": return comparison !== 0;
    case "greaterThan": return comparison > 0;
    case "greaterThanOrEqual": return comparison >= 0;
    case "lessThan": return comparison < 0;
    case "lessThanOrEqual": return comparison <= 0;
    default: return false;
  }
}

function isCellValueArray(value: GridFilterDescriptor["value"]): value is readonly CellValue[] {
  return Array.isArray(value);
}

function createGroupNodes(
  rows: readonly GridRow[],
  descriptors: readonly GridGroupDescriptor[],
  level: number,
  parentId?: string
): readonly GroupNode[] {
  const descriptor = descriptors[level];
  if (!descriptor) return [];
  const buckets = new Map<string, { value: CellValue; rows: GridRow[] }>();
  for (const row of rows) {
    const value = row.cells[descriptor.columnId] ?? null;
    const key = stableValueKey(value, descriptor.comparisonType ?? "text");
    const bucket = buckets.get(key) ?? { value, rows: [] };
    bucket.rows.push(row);
    buckets.set(key, bucket);
  }
  return [...buckets.entries()].map(([key, bucket]) => {
    const id = `${parentId ? `${parentId}/` : ""}group:${level}:${encodeURIComponent(descriptor.columnId)}:${encodeURIComponent(key)}`;
    const children = level + 1 < descriptors.length
      ? createGroupNodes(bucket.rows, descriptors, level + 1, id)
      : bucket.rows;
    return {
      row: {
        kind: "group",
        id,
        readonly: true,
        expanded: true,
        childCount: bucket.rows.length,
        cells: {
          [descriptor.columnId]: bucket.value
        },
        provenance: {
          level,
          ...(parentId ? { parentId } : {}),
          columnId: descriptor.columnId,
          value: bucket.value,
          sourceRowIds: bucket.rows.map((row) => row.id)
        }
      },
      children,
      sourceRows: bucket.rows
    };
  });
}

function applyGroupAggregates(
  nodes: readonly GroupNode[],
  aggregates: readonly GridAggregateDescriptor[]
): readonly GroupNode[] {
  return nodes.map((node) => ({
    ...node,
    row: {
      ...node.row,
      cells: {
        ...node.row.cells,
        ...aggregateGridRows(node.sourceRows, aggregates)
      }
    },
    children: node.children.map((child) =>
      "row" in child ? applyGroupAggregates([child], aggregates)[0]! : child
    )
  }));
}

function flattenGroups(
  nodes: readonly GroupNode[],
  expanded: ReadonlySet<string> | "all"
): readonly GridShapedRow[] {
  const output: GridShapedRow[] = [];
  for (const node of nodes) {
    const isExpanded = expanded === "all" || expanded.has(node.row.id);
    output.push({ ...node.row, expanded: isExpanded });
    if (isExpanded) {
      for (const child of node.children) {
        if ("row" in child) output.push(...flattenGroups([child], expanded));
        else output.push(toSourceViewRow(child));
      }
    }
  }
  return output;
}

function toSourceViewRow(row: GridRow): GridSourceViewRow {
  return { ...row, kind: "source", sourceRowId: row.id, readonly: false };
}

function stableValueKey(value: CellValue, type: GridComparisonType): string {
  if (value === null) return "null";
  return `${type}:${type === "json" ? canonicalJson(String(value)) : String(value)}`;
}

function canonicalJson(value: string): string {
  try {
    return JSON.stringify(sortJson(JSON.parse(value)));
  } catch {
    return `!invalid:${value}`;
  }
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right, "en")).map(([key, entry]) => [key, sortJson(entry)]));
  }
  return value;
}

function requireAggregateValue(value: CellValue, aggregateId: string): CellValue {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error(`Custom aggregate '${aggregateId}' returned a non-finite number.`);
  }
  return value;
}

function compareFiniteNumbers(
  leftNumber: number,
  rightNumber: number,
  left: CellValue,
  right: CellValue
): number {
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  if (Number.isFinite(leftNumber)) return -1;
  if (Number.isFinite(rightNumber)) return 1;
  return String(left).localeCompare(String(right), "en");
}

function validateDescriptors(options: GridDataShapingOptions): void {
  const aggregateIds = new Set<string>();
  for (const descriptor of options.aggregate ?? []) {
    if (!descriptor.id || aggregateIds.has(descriptor.id)) {
      throw new Error(`Aggregate IDs must be non-empty and unique; received '${descriptor.id}'.`);
    }
    aggregateIds.add(descriptor.id);
  }
}

function normalizeViewport(
  viewport: GridDataShapingOptions["viewport"],
  total: number
): { start: number; count: number } {
  if (!viewport) return { start: 0, count: total };
  if (!Number.isSafeInteger(viewport.start) || viewport.start < 0 || !Number.isSafeInteger(viewport.count) || viewport.count < 0) {
    throw new Error("Viewport start and count must be non-negative safe integers.");
  }
  return { start: Math.min(viewport.start, total), count: Math.min(viewport.count, total) };
}

function filterGridRows(
  rows: readonly GridRow[],
  descriptors: readonly GridFilterDescriptor[]
): readonly GridRow[] {
  return rows.filter((row) => descriptors.every((descriptor) => matchesFilter(row, descriptor)));
}

async function runPipelineStage<T>(
  stage: GridDataShapingPipelineStage,
  total: number,
  operation: () => T,
  options: GridDataShapingPipelineOptions
): Promise<T> {
  options.onProgress?.(stage, 0, total);
  await options.yieldControl?.();
  const result = operation();
  options.onProgress?.(stage, total, total);
  await options.yieldControl?.();
  return result;
}
