import type { CellValue } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "../contracts/grid-types.js";
import type { GridColumnView } from "../renderer/dom/grid-customization.js";

export type GridPasteMode = "direct" | "dialog" | "direct-and-dialog";

export interface PasteCellContext<TRow extends GridRow = GridRow> {
  readonly row: TRow;
  readonly rowId: string;
  readonly rowIndex: number;
  readonly rowOffset: number;
  readonly column: GridColumnView<TRow>;
  readonly columnIndex: number;
  readonly columnOffset: number;
  readonly rawValue: string;
}

export type PasteCellParseResult =
  | { readonly value: CellValue }
  | { readonly error: string };

export interface PasteCellValidationContext<TRow extends GridRow = GridRow>
  extends PasteCellContext<TRow> {
  readonly value: CellValue;
}

export type PasteCellValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly message: string };

export interface GridClipboardOptions<TRow extends GridRow = GridRow> {
  readonly enabled?: boolean;
  readonly pasteMode?: GridPasteMode;
  readonly validateBeforeCommit?: boolean;
  readonly emptyCellValue?: null | "";
  readonly parsePasteCell?: (context: PasteCellContext<TRow>) => PasteCellParseResult;
  readonly validatePasteCell?: (
    context: PasteCellValidationContext<TRow>
  ) => PasteCellValidationResult;
}

export interface PasteCellValidationError {
  readonly rowOffset: number;
  readonly columnOffset: number;
  readonly rowId?: string;
  readonly columnId: string;
  readonly columnTitle?: string;
  readonly rawValue: string;
  readonly message: string;
}

export interface GridPasteChange {
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly rowId: string;
  readonly columnId: string;
  readonly oldValue: CellValue;
  readonly newValue: CellValue;
}

export interface GridPasteResult {
  readonly committed: boolean;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly changes: readonly GridPasteChange[];
  readonly errors: readonly PasteCellValidationError[];
}

export interface PrepareGridPasteOptions<TRow extends GridRow> {
  readonly text: string;
  readonly startRowIndex: number;
  readonly startColumnIndex: number;
  readonly rows: readonly TRow[];
  readonly columns: readonly GridColumnView<TRow>[];
  readonly clipboard?: GridClipboardOptions<TRow>;
}

export function parseTabularClipboardText(text: string): readonly (readonly string[])[] {
  const normalized = text.replace(/\r\n?/gu, "\n");
  const withoutTerminalRecordSeparator = normalized.endsWith("\n")
    ? normalized.slice(0, -1)
    : normalized;
  return withoutTerminalRecordSeparator.split("\n").map((row) => row.split("\t"));
}

export function prepareGridPaste<TRow extends GridRow>(
  input: PrepareGridPasteOptions<TRow>
): GridPasteResult {
  const values = parseTabularClipboardText(input.text);
  const rowCount = values.length;
  const columnCount = values.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  const changes: GridPasteChange[] = [];
  const errors: PasteCellValidationError[] = [];

  values.forEach((pastedRow, rowOffset) => {
    pastedRow.forEach((rawValue, columnOffset) => {
      const rowIndex = input.startRowIndex + rowOffset;
      const columnIndex = input.startColumnIndex + columnOffset;
      const row = input.rows[rowIndex];
      const column = input.columns[columnIndex];

      if (!row || !column) {
        errors.push(createBoundsError(rowOffset, columnOffset, rawValue, column));
        return;
      }

      const context: PasteCellContext<TRow> = {
        row,
        rowId: row.id,
        rowIndex,
        rowOffset,
        column,
        columnIndex,
        columnOffset,
        rawValue
      };

      if (column.readonly) {
        errors.push(createValidationError(context, "The destination column is readonly."));
        return;
      }

      const parsed = input.clipboard?.parsePasteCell?.(context)
        ?? parseDefaultCell(context, input.clipboard?.emptyCellValue ?? null);

      if ("error" in parsed) {
        errors.push(createValidationError(context, parsed.error));
        return;
      }

      if (input.clipboard?.validateBeforeCommit !== false && input.clipboard?.validatePasteCell) {
        const validation = input.clipboard.validatePasteCell({ ...context, value: parsed.value });

        if (!validation.valid) {
          errors.push(createValidationError(context, validation.message));
          return;
        }
      }

      changes.push({
        rowIndex,
        columnIndex,
        rowId: row.id,
        columnId: column.id,
        oldValue: row.cells[column.id] ?? null,
        newValue: parsed.value
      });
    });
  });

  return {
    committed: errors.length === 0,
    rowCount,
    columnCount,
    changes: errors.length === 0 ? changes : [],
    errors
  };
}

function parseDefaultCell<TRow extends GridRow>(
  context: PasteCellContext<TRow>,
  emptyCellValue: null | ""
): PasteCellParseResult {
  if (context.rawValue === "") {
    return context.column.nullable
      ? { value: emptyCellValue }
      : { error: "A blank value is not allowed for this column." };
  }

  if (context.column.dataType === "text") {
    return { value: context.rawValue };
  }

  if (context.column.dataType === "number") {
    const value = Number(context.rawValue);
    return Number.isFinite(value)
      ? { value }
      : { error: "The pasted value is not a valid number." };
  }

  const normalized = context.rawValue.trim().toLowerCase();

  if (normalized === "true" || normalized === "1") {
    return { value: true };
  }

  if (normalized === "false" || normalized === "0") {
    return { value: false };
  }

  return { error: "The pasted value is not a valid boolean." };
}

function createValidationError<TRow extends GridRow>(
  context: PasteCellContext<TRow>,
  message: string
): PasteCellValidationError {
  return {
    rowOffset: context.rowOffset,
    columnOffset: context.columnOffset,
    rowId: context.rowId,
    columnId: context.column.id,
    columnTitle: context.column.title,
    rawValue: context.rawValue,
    message
  };
}

function createBoundsError<TRow extends GridRow>(
  rowOffset: number,
  columnOffset: number,
  rawValue: string,
  column: GridColumnView<TRow> | undefined
): PasteCellValidationError {
  return {
    rowOffset,
    columnOffset,
    ...(column ? { columnId: column.id, columnTitle: column.title } : { columnId: "" }),
    rawValue,
    message: "The pasted cell falls outside the available grid rows or columns."
  };
}
