import type { GridColumn } from "@thefoolspath/gethen-protocol";
import type { GridFilterDescriptor, GridSortDescriptor } from "../shaping/grid-data-shaping.js";

/** Portable query intent shared by header sorting and the future filter presentations. */
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
