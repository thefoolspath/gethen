import type { CellValue, ColumnDataType } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./client-grid-engine.js";
import type {
  GridClassValue,
  GridColumnAlignment,
  GridColumnView
} from "./grid-customization.js";

export type GridModelField<TRow extends object> = Extract<keyof TRow, string>;

export interface GridModelColumn<TRow extends object> {
  readonly field: GridModelField<TRow>;
  readonly title?: string;
  readonly dataType: ColumnDataType;
  readonly nullable?: boolean;
  readonly hidden?: boolean;
  readonly key?: boolean;
  readonly readonly?: boolean;
  readonly align?: GridColumnAlignment;
  readonly className?: GridClassValue;
}

export interface GridModelRow<TRow extends object> extends GridRow {
  readonly source: TRow;
}

export interface GridModel<TRow extends object> {
  readonly columns: readonly GridColumnView<GridModelRow<TRow>>[];
  readonly rows: readonly GridModelRow<TRow>[];
  readonly sourceRowsById: ReadonlyMap<string, TRow>;
  getRowId(row: TRow): string;
}

export interface CreateGridModelOptions<TRow extends object> {
  readonly columns: readonly GridModelColumn<TRow>[];
  readonly rows: readonly TRow[];
}

export function createGridModel<TRow extends object>(
  options: CreateGridModelOptions<TRow>
): GridModel<TRow> {
  const keyColumn = requireKeyColumn(options.columns);
  assertUniqueFields(options.columns);
  const columns = options.columns.map(toGridColumnView);
  const sourceRowsById = new Map<string, TRow>();
  const rows = options.rows.map((sourceRow, rowIndex) => {
    const rowId = getStableRowId(sourceRow, keyColumn, rowIndex);

    if (sourceRowsById.has(rowId)) {
      throw new Error(`Duplicate row identity '${rowId}' from key field '${keyColumn.field}'.`);
    }

    sourceRowsById.set(rowId, sourceRow);
    const cells: Record<string, CellValue> = {};

    for (const column of options.columns) {
      const value = sourceRow[column.field];
      cells[column.field] = requireCellValue(value, column, rowIndex);
    }

    return { id: rowId, cells, source: sourceRow };
  });

  return {
    columns,
    rows,
    sourceRowsById,
    getRowId(row) {
      return getStableRowId(row, keyColumn);
    }
  };
}

function requireKeyColumn<TRow extends object>(
  columns: readonly GridModelColumn<TRow>[]
): GridModelColumn<TRow> {
  const keyColumns = columns.filter((column) => column.key);

  if (keyColumns.length !== 1) {
    throw new Error(`Grid model requires exactly one key column; received ${keyColumns.length}.`);
  }

  return keyColumns[0]!;
}

function assertUniqueFields<TRow extends object>(columns: readonly GridModelColumn<TRow>[]): void {
  const fields = new Set<string>();

  for (const column of columns) {
    if (fields.has(column.field)) {
      throw new Error(`Duplicate grid model field '${column.field}'.`);
    }

    fields.add(column.field);
  }
}

function toGridColumnView<TRow extends object>(
  column: GridModelColumn<TRow>
): GridColumnView<GridModelRow<TRow>> {
  return {
    id: column.field,
    title: column.title ?? column.field,
    dataType: column.dataType,
    ...(column.nullable === undefined ? {} : { nullable: column.nullable }),
    ...(column.hidden === undefined ? {} : { hidden: column.hidden }),
    ...(column.key === undefined ? {} : { key: column.key }),
    ...(column.key || column.readonly ? { readonly: true } : {}),
    ...(column.align === undefined ? {} : { align: column.align }),
    ...(column.className === undefined ? {} : { className: column.className })
  };
}

function getStableRowId<TRow extends object>(
  row: TRow,
  keyColumn: GridModelColumn<TRow>,
  rowIndex?: number
): string {
  const keyValue = row[keyColumn.field];

  if ((typeof keyValue !== "string" && typeof keyValue !== "number") || keyValue === "") {
    const location = rowIndex === undefined ? "row" : `row ${rowIndex}`;
    throw new Error(
      `Key field '${keyColumn.field}' on ${location} must be a non-empty string or number.`
    );
  }

  return String(keyValue);
}

function requireCellValue<TRow extends object>(
  value: TRow[GridModelField<TRow>],
  column: GridModelColumn<TRow>,
  rowIndex: number
): CellValue {
  if (value === null) {
    if (column.nullable) {
      return null;
    }

    throw new Error(`Field '${column.field}' on row ${rowIndex} is null but is not nullable.`);
  }

  const expectedType = column.dataType === "text" ? "string" : column.dataType;

  if (typeof value !== expectedType) {
    throw new Error(
      `Field '${column.field}' on row ${rowIndex} must be ${expectedType}; received ${typeof value}.`
    );
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error(`Field '${column.field}' on row ${rowIndex} must be a finite number.`);
  }

  return value as CellValue;
}
