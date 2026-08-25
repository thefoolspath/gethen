import type { GridHistory, GridHistoryOptions } from "./grid-history.js";
import { createGridHistory } from "./grid-history.js";

export type RowSaveMode = "edit" | "insert";

export interface RowSaveEvent<TRow extends object> {
  readonly mode: RowSaveMode;
  readonly rowId: string;
  readonly row: TRow;
  readonly originalRow?: TRow;
  readonly changes: Partial<TRow>;
}

export interface RowTransactionState<TRow extends object> extends RowSaveEvent<TRow> {}

export interface RowTransactionManagerOptions<TRow extends object> {
  readonly rows: readonly TRow[];
  readonly getRowId: (row: TRow) => string;
  readonly history?: GridHistoryOptions | false;
  readonly onHistoryChange?: (change: RowHistoryChange<TRow>) => void;
}

export interface RowHistoryChange<TRow extends object> {
  readonly rowId: string;
  readonly oldRow: TRow | null;
  readonly newRow: TRow | null;
}

export class RowTransactionManager<TRow extends object> {
  readonly #getRowId: (row: TRow) => string;
  readonly #history: GridHistory<RowHistoryChange<TRow>> | undefined;
  readonly #onHistoryChange: ((change: RowHistoryChange<TRow>) => void) | undefined;
  #rows: TRow[];
  #rowIndexById: Map<string, number>;
  #transaction: RowTransactionState<TRow> | null = null;

  constructor(options: RowTransactionManagerOptions<TRow>) {
    this.#getRowId = options.getRowId;
    this.#history = options.history === false
      ? undefined
      : createGridHistory<RowHistoryChange<TRow>>(options.history);
    this.#onHistoryChange = options.onHistoryChange;
    this.#rows = options.rows.map(cloneRow);
    this.#rowIndexById = indexRows(this.#rows, this.#getRowId);
  }

  getRows(): readonly TRow[] {
    return this.#rows.map(cloneRow);
  }

  getRow(rowId: string): TRow | undefined {
    const rowIndex = this.#rowIndexById.get(rowId);
    const row = rowIndex === undefined ? undefined : this.#rows[rowIndex];
    return row ? cloneRow(row) : undefined;
  }

  getTransaction(): RowTransactionState<TRow> | null {
    return this.#transaction ? cloneTransaction(this.#transaction) : null;
  }

  beginEdit(rowId: string): RowTransactionState<TRow> {
    this.assertNoTransaction();
    const row = this.getRow(rowId);

    if (!row) {
      throw new Error(`Unknown rowId: ${rowId}`);
    }

    this.#transaction = {
      mode: "edit",
      rowId,
      row: cloneRow(row),
      originalRow: cloneRow(row),
      changes: {}
    };
    return this.getTransaction()!;
  }

  beginInsert(row: TRow): RowTransactionState<TRow> {
    this.assertNoTransaction();
    const rowId = this.#getRowId(row);

    if (this.#rowIndexById.has(rowId)) {
      throw new Error(`Duplicate rowId: ${rowId}`);
    }

    this.#transaction = {
      mode: "insert",
      rowId,
      row: cloneRow(row),
      changes: { ...row }
    };
    return this.getTransaction()!;
  }

  updateField<TKey extends keyof TRow>(field: TKey, value: TRow[TKey]): RowTransactionState<TRow> {
    const transaction = this.requireTransaction();
    const nextRow = { ...transaction.row, [field]: value };

    if (this.#getRowId(nextRow) !== transaction.rowId) {
      throw new Error("A row transaction cannot change stable row identity.");
    }

    const changes = { ...transaction.changes };
    const originalValue = transaction.originalRow?.[field];

    if (transaction.mode === "edit" && Object.is(value, originalValue)) {
      delete changes[field];
    } else {
      changes[field] = value;
    }

    this.#transaction = {
      ...transaction,
      row: nextRow,
      changes
    };
    return this.getTransaction()!;
  }

  cancel(): void {
    this.#transaction = null;
  }

  save(): RowSaveEvent<TRow> {
    const transaction = this.requireTransaction();
    const savedRow = cloneRow(transaction.row);

    if (transaction.mode === "edit") {
      const rowIndex = this.#rowIndexById.get(transaction.rowId);

      if (rowIndex === undefined) {
        throw new Error(`Unknown rowId: ${transaction.rowId}`);
      }

      this.#rows = [
        ...this.#rows.slice(0, rowIndex),
        savedRow,
        ...this.#rows.slice(rowIndex + 1)
      ];
    } else {
      this.#rowIndexById.set(transaction.rowId, this.#rows.length);
      this.#rows = [...this.#rows, savedRow];
    }

    const event = cloneTransaction(transaction);
    this.#history?.record({
      kind: "row-transaction",
      changes: [{
        rowId: transaction.rowId,
        oldRow: transaction.originalRow ? cloneRow(transaction.originalRow) : null,
        newRow: cloneRow(savedRow)
      }]
    });
    this.#transaction = null;
    return event;
  }

  undo(): readonly RowHistoryChange<TRow>[] {
    return this.applyHistory(this.#history?.undo(invertRowHistoryChange) ?? []);
  }

  redo(): readonly RowHistoryChange<TRow>[] {
    return this.applyHistory(this.#history?.redo() ?? []);
  }

  private applyHistory(changes: readonly RowHistoryChange<TRow>[]): readonly RowHistoryChange<TRow>[] {
    if (this.#transaction) {
      throw new Error("Finish or cancel the active row transaction before using history.");
    }
    for (const change of changes) {
      const rowIndex = this.#rowIndexById.get(change.rowId);
      if (change.newRow === null) {
        if (rowIndex !== undefined) {
          this.#rows = [...this.#rows.slice(0, rowIndex), ...this.#rows.slice(rowIndex + 1)];
        }
      } else if (rowIndex === undefined) {
        this.#rows = [...this.#rows, cloneRow(change.newRow)];
      } else {
        this.#rows = [
          ...this.#rows.slice(0, rowIndex),
          cloneRow(change.newRow),
          ...this.#rows.slice(rowIndex + 1)
        ];
      }
      this.#rowIndexById = indexRows(this.#rows, this.#getRowId);
      this.#onHistoryChange?.(cloneRowHistoryChange(change));
    }
    return changes.map(cloneRowHistoryChange);
  }

  private assertNoTransaction(): void {
    if (this.#transaction) {
      throw new Error("Finish or cancel the active row transaction before starting another.");
    }
  }

  private requireTransaction(): RowTransactionState<TRow> {
    if (!this.#transaction) {
      throw new Error("No row transaction is active.");
    }

    return this.#transaction;
  }
}

export function invertRowHistoryChange<TRow extends object>(
  change: RowHistoryChange<TRow>
): RowHistoryChange<TRow> {
  return {
    rowId: change.rowId,
    oldRow: change.newRow ? cloneRow(change.newRow) : null,
    newRow: change.oldRow ? cloneRow(change.oldRow) : null
  };
}

export function createRowTransactionManager<TRow extends object>(
  options: RowTransactionManagerOptions<TRow>
): RowTransactionManager<TRow> {
  return new RowTransactionManager(options);
}

function cloneRow<TRow extends object>(row: TRow): TRow {
  return { ...row };
}

function cloneTransaction<TRow extends object>(
  transaction: RowTransactionState<TRow>
): RowTransactionState<TRow> {
  return {
    mode: transaction.mode,
    rowId: transaction.rowId,
    row: cloneRow(transaction.row),
    ...(transaction.originalRow ? { originalRow: cloneRow(transaction.originalRow) } : {}),
    changes: { ...transaction.changes }
  };
}

function cloneRowHistoryChange<TRow extends object>(
  change: RowHistoryChange<TRow>
): RowHistoryChange<TRow> {
  return {
    rowId: change.rowId,
    oldRow: change.oldRow ? cloneRow(change.oldRow) : null,
    newRow: change.newRow ? cloneRow(change.newRow) : null
  };
}

function indexRows<TRow extends object>(
  rows: readonly TRow[],
  getRowId: (row: TRow) => string
): Map<string, number> {
  const index = new Map<string, number>();

  rows.forEach((row, rowIndex) => {
    const rowId = getRowId(row);

    if (index.has(rowId)) {
      throw new Error(`Duplicate rowId: ${rowId}`);
    }

    index.set(rowId, rowIndex);
  });

  return index;
}
