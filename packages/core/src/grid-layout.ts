export interface GridColumnLayoutState {
  readonly columnId: string;
  readonly width: number;
}

export interface GridLayoutState {
  readonly version: 1;
  readonly columns: readonly GridColumnLayoutState[];
  readonly frozenRowCount: number;
  readonly frozenColumnCount: number;
}

export interface CreateGridLayoutStateOptions {
  readonly columnIds: readonly string[];
  readonly defaultColumnWidth?: number;
  readonly frozenRowCount?: number;
  readonly frozenColumnCount?: number;
}

export interface ApplyGridLayoutStateOptions extends CreateGridLayoutStateOptions {
  readonly state?: GridLayoutState;
  readonly rowCount?: number;
}

export interface GridLayoutEvent {
  readonly reason: "apply" | "resize" | "reorder" | "freeze";
  readonly state: GridLayoutState;
}

export function createGridLayoutState(options: CreateGridLayoutStateOptions): GridLayoutState {
  return applyGridLayoutState(options);
}

export function applyGridLayoutState(options: ApplyGridLayoutStateOptions): GridLayoutState {
  assertUniqueColumnIds(options.columnIds);
  const defaultWidth = requireWidth(options.defaultColumnWidth ?? 132);
  const knownColumns = new Set(options.columnIds);
  const configured = new Map(
    (options.state?.columns ?? [])
      .filter((column) => knownColumns.has(column.columnId))
      .map((column) => [column.columnId, requireWidth(column.width)] as const)
  );
  const configuredOrder = (options.state?.columns ?? [])
    .map((column) => column.columnId)
    .filter((columnId, index, values) => knownColumns.has(columnId) && values.indexOf(columnId) === index);
  const order = [...configuredOrder, ...options.columnIds.filter((id) => !configuredOrder.includes(id))];
  const rowCount = options.rowCount ?? Number.MAX_SAFE_INTEGER;

  return {
    version: 1,
    columns: order.map((columnId) => ({
      columnId,
      width: configured.get(columnId) ?? defaultWidth
    })),
    frozenRowCount: clampInteger(
      options.state?.frozenRowCount ?? options.frozenRowCount ?? 0,
      0,
      rowCount
    ),
    frozenColumnCount: clampInteger(
      options.state?.frozenColumnCount ?? options.frozenColumnCount ?? 0,
      0,
      order.length
    )
  };
}

export function resizeGridColumn(
  state: GridLayoutState,
  columnId: string,
  width: number
): GridLayoutState {
  if (!state.columns.some((column) => column.columnId === columnId)) {
    throw new Error(`Unknown layout column '${columnId}'.`);
  }
  const normalizedWidth = requireWidth(width);
  return {
    ...state,
    columns: state.columns.map((column) =>
      column.columnId === columnId ? { ...column, width: normalizedWidth } : column
    )
  };
}

export function reorderGridColumn(
  state: GridLayoutState,
  columnId: string,
  targetIndex: number
): GridLayoutState {
  const sourceIndex = state.columns.findIndex((column) => column.columnId === columnId);
  if (sourceIndex < 0) {
    throw new Error(`Unknown layout column '${columnId}'.`);
  }
  const nextIndex = clampInteger(targetIndex, 0, state.columns.length - 1);
  const columns = [...state.columns];
  const [column] = columns.splice(sourceIndex, 1);
  columns.splice(nextIndex, 0, column!);
  return { ...state, columns };
}

export function freezeGridPanes(
  state: GridLayoutState,
  frozenRowCount: number,
  frozenColumnCount: number,
  rowCount = Number.MAX_SAFE_INTEGER
): GridLayoutState {
  return {
    ...state,
    frozenRowCount: clampInteger(frozenRowCount, 0, rowCount),
    frozenColumnCount: clampInteger(frozenColumnCount, 0, state.columns.length)
  };
}

export function getGridColumnOffsets(state: GridLayoutState): readonly number[] {
  const offsets: number[] = [];
  let offset = 0;
  for (const column of state.columns) {
    offsets.push(offset);
    offset += column.width;
  }
  return offsets;
}

export function getGridLayoutWidth(state: GridLayoutState): number {
  return state.columns.reduce((total, column) => total + column.width, 0);
}

function assertUniqueColumnIds(columnIds: readonly string[]): void {
  const ids = new Set<string>();
  for (const id of columnIds) {
    if (!id || ids.has(id)) {
      throw new Error(`Layout column IDs must be non-empty and unique; received '${id}'.`);
    }
    ids.add(id);
  }
}

function requireWidth(width: number): number {
  if (!Number.isFinite(width) || width < 24 || width > 4096) {
    throw new Error("Column width must be a finite number from 24 through 4096 pixels.");
  }
  return Math.round(width);
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Layout counts and indexes must be finite numbers.");
  }
  return Math.max(minimum, Math.min(maximum, Math.trunc(value)));
}
