import type {
  CellUpdate,
  CellValue,
  ColumnId,
  GetRowsRequest,
  GetRowsResult,
  RowId,
  UpdateCellsResult
} from "@thefoolspath/gethen-protocol";

export type ClientDataSourceRow = Readonly<Record<ColumnId, CellValue>>;

export interface ClientDataSourceOptions<TRow extends ClientDataSourceRow> {
  readonly rows: readonly TRow[];
  readonly getRowId: (row: TRow, index: number) => RowId;
}

interface StoredRow {
  readonly id: RowId;
  readonly cells: Record<ColumnId, CellValue>;
}

export class ClientDataSource<TRow extends ClientDataSourceRow> {
  #rows: StoredRow[];
  #rowIndexById: Map<RowId, number>;

  constructor(options: ClientDataSourceOptions<TRow>) {
    this.#rows = options.rows.map((row, index) => ({
      id: options.getRowId(row, index),
      cells: { ...row }
    }));
    this.#rowIndexById = indexRows(this.#rows);
  }

  get rowCount(): number {
    return this.#rows.length;
  }

  async getRows(request: GetRowsRequest, signal?: AbortSignal): Promise<GetRowsResult> {
    throwIfAborted(signal);

    const startRow = request.startRow;
    const endRow = Math.min(startRow + request.rowCount, this.#rows.length);

    return {
      protocolVersion: "v1",
      totalRowCount: this.#rows.length,
      rows: this.#rows.slice(startRow, endRow).map((row) => ({
        id: row.id,
        cells: { ...row.cells }
      }))
    };
  }

  async updateCells(changes: readonly CellUpdate[], signal?: AbortSignal): Promise<UpdateCellsResult> {
    throwIfAborted(signal);

    const rejectedChanges: CellUpdate[] = [];

    for (const change of changes) {
      const rowIndex = this.#rowIndexById.get(change.rowId);
      const row = rowIndex === undefined ? undefined : this.#rows[rowIndex];

      if (!row || row.cells[change.columnId] !== change.oldValue) {
        rejectedChanges.push(change);
        continue;
      }

      row.cells[change.columnId] = change.newValue;
    }

    return {
      protocolVersion: "v1",
      accepted: rejectedChanges.length === 0,
      rejectedChanges
    };
  }
}

export function createClientDataSource<TRow extends ClientDataSourceRow>(
  options: ClientDataSourceOptions<TRow>
): ClientDataSource<TRow> {
  return new ClientDataSource(options);
}

function indexRows(rows: readonly StoredRow[]): Map<RowId, number> {
  const index = new Map<RowId, number>();

  rows.forEach((row, rowIndex) => {
    if (index.has(row.id)) {
      throw new Error(`Duplicate rowId: ${row.id}`);
    }

    index.set(row.id, rowIndex);
  });

  return index;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new DOMException("The DataSource operation was aborted.", "AbortError");
  }
}
