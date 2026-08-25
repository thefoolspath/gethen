import type { CellValue } from "@thefoolspath/gethen-protocol";

import type { GridGroupRow, GridShapedRow } from "./grid-data-shaping.js";
import type {
  GridColumnarBuffer,
  GridColumnarColumn,
  GridEngineShapeRequest,
  GridPortableAggregateDescriptor
} from "./grid-engine-contract.js";
import type { RustWasmKernels } from "./rust-wasm-kernels.js";

type RustGroupKernels = Pick<
  RustWasmKernels,
  "aggregateGroups" | "assignGroups" | "flattenGroupTokens"
>;

interface GroupLevel {
  readonly rowGroupIds: Uint32Array;
  readonly groupParentIds: Uint32Array;
  readonly groupIds: readonly string[];
  readonly groupRows: readonly GridGroupRow[];
  readonly expanded: Uint8Array;
}

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

export function executeRustWasmGroupShape(
  request: GridEngineShapeRequest,
  kernels: RustGroupKernels,
  sourceRowCount: number,
  filteredRowCount: number,
  onProgress?: (stage: "group" | "aggregate" | "flatten", completed: number, total: number) => void
): {
  readonly sourceRowCount: number;
  readonly filteredRowCount: number;
  readonly totalViewRowCount: number;
  readonly rows: readonly GridShapedRow[];
} {
  validateAggregateIds(request.definition.aggregate);
  const total = request.data.rowCount;
  onProgress?.("group", 0, total);
  const levels = createGroupLevels(request, kernels);
  onProgress?.("group", total, total);

  onProgress?.("aggregate", 0, total);
  const aggregatedLevels = applyAggregates(request, levels, kernels);
  onProgress?.("aggregate", total, total);

  onProgress?.("flatten", 0, total);
  const flattened = kernels.flattenGroupTokens(
    aggregatedLevels.map((level) => level.rowGroupIds),
    aggregatedLevels.map((level) => level.groupParentIds),
    aggregatedLevels.map((level) => level.expanded),
    request.data.rowCount,
    request.definition.viewport
  );
  const rows = hydrateTokens(request.data, aggregatedLevels, flattened);
  onProgress?.("flatten", total, total);
  return {
    sourceRowCount,
    filteredRowCount,
    totalViewRowCount: flattened.totalViewRowCount,
    rows
  };
}

function createGroupLevels(
  request: GridEngineShapeRequest,
  kernels: RustGroupKernels
): readonly GroupLevel[] {
  const levels: GroupLevel[] = [];
  const expandedGroupIds = request.definition.expandedGroupIds === "all"
    ? "all"
    : new Set(request.definition.expandedGroupIds);
  let parentIds: Uint32Array<ArrayBufferLike> = new Uint32Array(request.data.rowCount);
  for (let levelIndex = 0; levelIndex < request.definition.group.length; levelIndex += 1) {
    const descriptor = request.definition.group[levelIndex]!;
    const column = resolveColumn(request.data, descriptor.columnId);
    const keys = new Map<string, number>();
    const keyValues: CellValue[] = [];
    const stableKeys: string[] = [];
    const rowKeyIds = new Uint32Array(request.data.rowCount);
    for (let rowIndex = 0; rowIndex < request.data.rowCount; rowIndex += 1) {
      const value = readColumnValue(column, rowIndex);
      const stableKey = stableValueKey(value, descriptor.comparisonType ?? "text");
      let keyId = keys.get(stableKey);
      if (keyId === undefined) {
        keyId = keys.size;
        keys.set(stableKey, keyId);
        keyValues.push(value);
        stableKeys.push(stableKey);
      }
      rowKeyIds[rowIndex] = keyId;
    }
    const assignment = kernels.assignGroups(parentIds, rowKeyIds);
    const parentLevel = levels[levelIndex - 1];
    const groupIds = Array.from(assignment.groupKeyIds, (keyId, groupIndex) => {
      const parentGroupId = levelIndex === 0
        ? undefined
        : parentLevel!.groupIds[assignment.groupParentIds[groupIndex]!]!;
      return `${parentGroupId ? `${parentGroupId}/` : ""}group:${levelIndex}:${encodeURIComponent(descriptor.columnId)}:${encodeURIComponent(stableKeys[keyId]!)}`;
    });
    const expanded = Uint8Array.from(groupIds, (groupId) =>
      expandedGroupIds === "all"
      || expandedGroupIds.has(groupId)
        ? 1
        : 0
    );
    const sourceRowIdsByGroup = Array.from(
      { length: assignment.groupCounts.length },
      () => [] as string[]
    );
    assignment.rowGroupIds.forEach((groupId, rowIndex) => {
      sourceRowIdsByGroup[groupId]!.push(request.data.rowIds[rowIndex]!);
    });
    const groupRows = groupIds.map((id, groupIndex): GridGroupRow => {
      const keyId = assignment.groupKeyIds[groupIndex]!;
      const parentId = levelIndex === 0
        ? undefined
        : parentLevel!.groupIds[assignment.groupParentIds[groupIndex]!]!;
      return {
        kind: "group",
        id,
        readonly: true,
        expanded: expanded[groupIndex] === 1,
        childCount: assignment.groupCounts[groupIndex]!,
        cells: { [descriptor.columnId]: keyValues[keyId]! },
        provenance: {
          level: levelIndex,
          ...(parentId ? { parentId } : {}),
          columnId: descriptor.columnId,
          value: keyValues[keyId]!,
          sourceRowIds: sourceRowIdsByGroup[groupIndex]!
        }
      };
    });
    levels.push({
      rowGroupIds: assignment.rowGroupIds,
      groupParentIds: assignment.groupParentIds,
      groupIds,
      groupRows,
      expanded
    });
    parentIds = assignment.rowGroupIds;
  }
  return levels;
}

function applyAggregates(
  request: GridEngineShapeRequest,
  levels: readonly GroupLevel[],
  kernels: RustGroupKernels
): readonly GroupLevel[] {
  return levels.map((level) => {
    const aggregateValues = request.definition.aggregate.map((descriptor) => [
      descriptor.id,
      aggregateLevel(request.data, descriptor, level, kernels)
    ] as const);
    return {
      ...level,
      groupRows: level.groupRows.map((row, groupIndex) => ({
        ...row,
        cells: {
          ...row.cells,
          ...Object.fromEntries(aggregateValues.map(([id, values]) => [id, values[groupIndex]!]))
        }
      }))
    };
  });
}

function aggregateLevel(
  buffer: GridColumnarBuffer,
  descriptor: GridPortableAggregateDescriptor,
  level: GroupLevel,
  kernels: RustGroupKernels
): readonly CellValue[] {
  const column = descriptor.columnId ? resolveColumn(buffer, descriptor.columnId) : undefined;
  const numeric = column?.storage === "float64" ? column.values : new Float64Array(buffer.rowCount);
  const validity = descriptor.operation === "count"
    ? column?.validity ?? new Uint8Array(buffer.rowCount)
    : column?.storage === "float64"
      ? column.validity
      : new Uint8Array(buffer.rowCount);
  const result = kernels.aggregateGroups(
    numeric,
    validity,
    level.rowGroupIds,
    level.groupRows.length,
    aggregateOperationCode(descriptor.operation),
    descriptor.operation === "count" && descriptor.columnId === undefined
  );
  return Array.from(result.values, (value, index) => result.validity[index] === 0 ? null : value);
}

function hydrateTokens(
  buffer: GridColumnarBuffer,
  levels: readonly GroupLevel[],
  flattened: ReturnType<RustGroupKernels["flattenGroupTokens"]>
): readonly GridShapedRow[] {
  return Array.from(flattened.kinds, (kind, tokenIndex) => {
    const index = flattened.indices[tokenIndex]!;
    if (kind === 0) {
      const level = flattened.levels[tokenIndex]!;
      const row = levels[level]?.groupRows[index];
      if (!row) throw new Error("Rust/WASM flatten returned an unknown group token.");
      return row;
    }
    const id = buffer.rowIds[index];
    if (id === undefined) throw new Error("Rust/WASM flatten returned an unknown source row token.");
    return {
      id,
      cells: Object.fromEntries(buffer.columns.map((column) => [
        column.columnId,
        readColumnValue(column, index)
      ])),
      kind: "source" as const,
      sourceRowId: id,
      readonly: false as const
    };
  });
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

function stableValueKey(value: CellValue, type: "text" | "number" | "boolean" | "date" | "json"): string {
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
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right, "en"))
        .map(([key, entry]) => [key, sortJson(entry)])
    );
  }
  return value;
}

function aggregateOperationCode(operation: GridPortableAggregateDescriptor["operation"]): number {
  switch (operation) {
    case "count": return 0;
    case "sum": return 1;
    case "min": return 2;
    case "max": return 3;
    case "average": return 4;
  }
}

function validateAggregateIds(aggregates: readonly GridPortableAggregateDescriptor[]): void {
  const ids = new Set<string>();
  for (const aggregate of aggregates) {
    if (!aggregate.id || ids.has(aggregate.id)) {
      throw new Error(`Aggregate IDs must be non-empty and unique; received '${aggregate.id}'.`);
    }
    ids.add(aggregate.id);
  }
}
