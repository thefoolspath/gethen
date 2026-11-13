import type { GridColumn } from "@thefoolspath/gethen-protocol";
import type { GridComparisonType, GridFilterDescriptor, GridFilterOperator, GridSortDescriptor } from "../shaping/grid-data-shaping.js";

/** Portable query intent shared by header sorting and filter presentations. */
export interface GridQueryState {
  readonly sort: readonly GridSortDescriptor[];
  readonly filter: readonly GridFilterDescriptor[];
}

export enum GridSortingMode {
  None = "none",
  Single = "single",
  Multiple = "multiple"
}

export type GridQueryStatus = "idle" | "loading" | "ready" | "error";

export interface GridQueryEvent {
  readonly state: GridQueryState;
  readonly status: GridQueryStatus;
  readonly error?: string;
}

type QueryColumn = Pick<GridColumn, "id" | "dataType">;

const textOperators = new Set<GridFilterOperator>([
  "equals", "notEquals", "contains", "startsWith", "in", "isNull", "isNotNull"
]);
const orderedOperators = new Set<GridFilterOperator>([
  "equals", "notEquals", "greaterThan", "greaterThanOrEqual", "lessThan", "lessThanOrEqual",
  "in", "isNull", "isNotNull"
]);
const booleanOperators = new Set<GridFilterOperator>(["equals", "notEquals", "in", "isNull", "isNotNull"]);

export function getGridFilterOperators(type: GridComparisonType): readonly GridFilterOperator[] {
  const allowed = type === "text" ? textOperators : type === "boolean" ? booleanOperators : orderedOperators;
  return [...allowed];
}

function isValidFilterValue(value: unknown, type: GridComparisonType): boolean {
  if (value === null) return true;
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "boolean") return typeof value === "boolean";
  if (type === "date") {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?$/.test(value)
      || Number.isNaN(Date.parse(value))) return false;
    const date = value.slice(0, 10);
    return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  }
  return typeof value === "string";
}

export function parseGridFilterDraft(
  columnId: string,
  operator: GridFilterOperator,
  rawValue: string,
  comparisonType: GridComparisonType,
  caseSensitive: boolean
): GridFilterDescriptor {
  if (operator === "isNull" || operator === "isNotNull") {
    return { columnId, operator, comparisonType };
  }
  let value: string | number | boolean;
  if (comparisonType === "number") {
    value = Number(rawValue);
    if (rawValue.trim() === "" || !Number.isFinite(value)) throw new Error("Invalid number filter value.");
  } else if (comparisonType === "boolean") {
    if (rawValue !== "true" && rawValue !== "false") throw new Error("Invalid boolean filter value.");
    value = rawValue === "true";
  } else {
    value = rawValue;
    if (comparisonType === "date" && !isValidFilterValue(value, "date")) throw new Error("Invalid date filter value.");
  }
  return {
    columnId, operator, value, comparisonType,
    ...(comparisonType === "text" ? { caseSensitive } : {})
  };
}

export function replaceColumnFilter(
  state: GridQueryState,
  columnId: string,
  descriptor?: GridFilterDescriptor
): GridQueryState {
  return {
    sort: state.sort,
    filter: [...state.filter.filter((filter) => filter.columnId !== columnId), ...(descriptor ? [descriptor] : [])]
  };
}

export function copyGridQueryState(state: GridQueryState): GridQueryState {
  return {
    sort: state.sort.map((descriptor) => ({ ...descriptor })),
    filter: state.filter.map((descriptor) => ({
      ...descriptor,
      ...(Array.isArray(descriptor.value) ? { value: [...descriptor.value] } : {})
    }))
  };
}

export function normalizeGridQueryState(
  state: GridQueryState,
  columns: readonly QueryColumn[]
): GridQueryState {
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const seenSort = new Set<string>();
  const sort = state.sort.map((descriptor) => {
    const column = columnById.get(descriptor.columnId);
    if (!column) throw new Error(`Unknown sort column '${descriptor.columnId}'.`);
    if (seenSort.has(descriptor.columnId)) throw new Error(`Duplicate sort column '${descriptor.columnId}'.`);
    seenSort.add(descriptor.columnId);
    if (descriptor.direction !== "asc" && descriptor.direction !== "desc") {
      throw new Error(`Invalid sort direction for '${descriptor.columnId}'.`);
    }
    if (descriptor.nulls !== undefined && descriptor.nulls !== "first" && descriptor.nulls !== "last") {
      throw new Error(`Invalid null placement for '${descriptor.columnId}'.`);
    }
    const comparisonType = descriptor.comparisonType ?? column.dataType;
    if (!["text", "number", "boolean", "date", "json"].includes(comparisonType)) {
      throw new Error(`Invalid comparison type for '${descriptor.columnId}'.`);
    }
    return { ...descriptor, comparisonType, nulls: descriptor.nulls ?? "last" };
  });
  const filter = state.filter.map((descriptor) => {
    const column = columnById.get(descriptor.columnId);
    if (!column) {
      throw new Error(`Unknown filter column '${descriptor.columnId}'.`);
    }
    const comparisonType = descriptor.comparisonType ?? column.dataType;
    if (!["text", "number", "boolean", "date", "json"].includes(comparisonType)) {
      throw new Error(`Invalid comparison type for '${descriptor.columnId}'.`);
    }
    if (!getGridFilterOperators(comparisonType).includes(descriptor.operator)) {
      throw new Error(`Invalid filter operator for '${descriptor.columnId}'.`);
    }
    if (descriptor.operator === "isNull" || descriptor.operator === "isNotNull") {
      if (descriptor.value !== undefined) throw new Error(`Filter '${descriptor.operator}' does not accept a value.`);
    } else if (descriptor.operator === "in") {
      if (!Array.isArray(descriptor.value) || descriptor.value.length === 0
        || descriptor.value.some((value) => !isValidFilterValue(value, comparisonType))) {
        throw new Error(`Invalid filter value for '${descriptor.columnId}'.`);
      }
    } else if (!isValidFilterValue(descriptor.value, comparisonType)
      || (descriptor.value === null && descriptor.operator !== "equals" && descriptor.operator !== "notEquals")) {
      throw new Error(`Invalid filter value for '${descriptor.columnId}'.`);
    }
    return {
      ...descriptor,
      comparisonType,
      ...(Array.isArray(descriptor.value) ? { value: [...descriptor.value] } : {})
    };
  });
  return { sort, filter };
}

export function nextHeaderSort(
  state: GridQueryState,
  columnId: string,
  mode: GridSortingMode,
  columns: readonly QueryColumn[]
): GridQueryState {
  if (mode === GridSortingMode.None) {
    return normalizeGridQueryState({ sort: [], filter: state.filter }, columns);
  }
  const existing = state.sort.find((descriptor) => descriptor.columnId === columnId);
  const multiple = mode === GridSortingMode.Multiple;
  const togglesExisting = multiple || state.sort[0]?.columnId === columnId;
  const nextDirection = togglesExisting && existing?.direction === "asc" ? "desc" : "asc";
  const retained = multiple
    ? state.sort.filter((descriptor) => descriptor.columnId !== columnId)
    : [];
  const next: GridSortDescriptor = { ...existing, columnId, direction: nextDirection };
  if (multiple && existing) {
    const index = state.sort.findIndex((descriptor) => descriptor.columnId === columnId);
    retained.splice(index, 0, next);
  } else {
    retained.push(next);
  }
  return normalizeGridQueryState({ sort: retained, filter: state.filter }, columns);
}
