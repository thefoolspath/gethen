import type {
  CellChangeEvent,
  CellCoordinate,
  CellValue,
  ColumnId,
  GridColumn,
  RowId
} from "@thefoolspath/gethen-protocol";

import type { GridRow } from "../contracts/grid-types.js";

export interface SelectionState extends CellCoordinate {}

export interface EditState extends CellCoordinate {
  readonly initialValue: CellValue;
  readonly draftValue: CellValue;
}

export interface ClientGridEngineOptions {
  readonly columns: readonly GridColumn[];
  readonly rows: readonly GridRow[];
}

export class ClientGridEngine {
  readonly #columns: readonly GridColumn[];
  #rows: GridRow[];
  #rowIndexById: Map<RowId, number>;
  #selection: SelectionState | null = null;
  #edit: EditState | null = null;

  constructor(options: ClientGridEngineOptions) {
    this.#columns = [...options.columns];
    this.#rows = options.rows.map((row) => ({
      id: row.id,
      cells: { ...row.cells }
    }));
    this.#rowIndexById = indexRows(this.#rows);
  }

  get columns(): readonly GridColumn[] {
    return this.#columns;
  }

  getRowCount(): number {
    return this.#rows.length;
  }

  getRow(index: number): GridRow | undefined {
    return this.#rows[index];
  }

  getCell(rowId: RowId, columnId: ColumnId): CellValue | undefined {
    const row = this.getRowById(rowId);
    return row?.cells[columnId];
  }

  getSelection(): SelectionState | null {
    return this.#selection;
  }

  selectCell(rowId: RowId, columnId: ColumnId): SelectionState {
    this.assertCellExists(rowId, columnId);
    this.#selection = { rowId, columnId };
    return this.#selection;
  }

  getEditState(): EditState | null {
    return this.#edit;
  }

  startEdit(rowId: RowId, columnId: ColumnId): EditState {
    const value = this.requireCell(rowId, columnId);
    this.#selection = { rowId, columnId };
    this.#edit = {
      rowId,
      columnId,
      initialValue: value,
      draftValue: value
    };
    return this.#edit;
  }

  updateDraftValue(value: CellValue): EditState {
    if (!this.#edit) {
      throw new Error("Cannot update draft value when no cell is being edited.");
    }

    this.#edit = {
      ...this.#edit,
      draftValue: value
    };

    return this.#edit;
  }

  cancelEdit(): void {
    this.#edit = null;
  }

  commitEdit(): CellChangeEvent | null {
    if (!this.#edit) {
      return null;
    }

    const change = this.applyCellUpdate({
      rowId: this.#edit.rowId,
      columnId: this.#edit.columnId,
      oldValue: this.#edit.initialValue,
      newValue: this.#edit.draftValue
    });

    this.#edit = null;
    return change;
  }

  applyCellUpdate(change: CellChangeEvent): CellChangeEvent {
    const rowIndex = this.requireRowIndex(change.rowId);
    this.assertColumnExists(change.columnId);
    const currentRow = this.#rows[rowIndex];

    if (!currentRow) {
      throw new Error(`Unknown rowId: ${change.rowId}`);
    }

    const currentValue = currentRow.cells[change.columnId];

    if (currentValue !== change.oldValue) {
      throw new Error(`Stale cell update for rowId ${change.rowId}, columnId ${change.columnId}.`);
    }

    const nextRow: GridRow = {
      id: currentRow.id,
      cells: {
        ...currentRow.cells,
        [change.columnId]: change.newValue
      }
    };

    this.#rows = [
      ...this.#rows.slice(0, rowIndex),
      nextRow,
      ...this.#rows.slice(rowIndex + 1)
    ];

    return change;
  }

  private getRowById(rowId: RowId): GridRow | undefined {
    const rowIndex = this.#rowIndexById.get(rowId);
    return rowIndex === undefined ? undefined : this.#rows[rowIndex];
  }

  private requireRowIndex(rowId: RowId): number {
    const rowIndex = this.#rowIndexById.get(rowId);

    if (rowIndex === undefined) {
      throw new Error(`Unknown rowId: ${rowId}`);
    }

    return rowIndex;
  }

  private requireCell(rowId: RowId, columnId: ColumnId): CellValue {
    const row = this.getRowById(rowId);

    if (!row) {
      throw new Error(`Unknown rowId: ${rowId}`);
    }

    this.assertColumnExists(columnId);

    if (!Object.hasOwn(row.cells, columnId)) {
      throw new Error(`Unknown cell for rowId ${rowId}, columnId ${columnId}.`);
    }

    return row.cells[columnId]!;
  }

  private assertCellExists(rowId: RowId, columnId: ColumnId): void {
    if (!this.#rowIndexById.has(rowId)) {
      throw new Error(`Unknown rowId: ${rowId}`);
    }

    this.assertColumnExists(columnId);
  }

  private assertColumnExists(columnId: ColumnId): void {
    if (!this.#columns.some((column) => column.id === columnId)) {
      throw new Error(`Unknown columnId: ${columnId}`);
    }
  }
}

export function createClientGridEngine(options: ClientGridEngineOptions): ClientGridEngine {
  return new ClientGridEngine(options);
}

function indexRows(rows: readonly GridRow[]): Map<RowId, number> {
  const index = new Map<RowId, number>();

  rows.forEach((row, rowIndex) => {
    if (index.has(row.id)) {
      throw new Error(`Duplicate rowId: ${row.id}`);
    }

    index.set(row.id, rowIndex);
  });

  return index;
}
