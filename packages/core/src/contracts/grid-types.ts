import type { CellValue, ColumnId, RowId } from "@thefoolspath/gethen-protocol";

export interface GridRow {
  readonly id: RowId;
  readonly cells: Readonly<Record<ColumnId, CellValue>>;
}
