import type { FromSchema } from "json-schema-to-ts";

import type {
  cellUpdateRequestSchema,
  getRowsRequestSchema,
  getRowsResultSchema,
  protocolErrorSchema,
  updateCellsResultSchema
} from "./schemas.js";

export type ProtocolVersion = "v1";
export type RowId = string;
export type ColumnId = string;
export type ColumnDataType = "text" | "number" | "boolean";
export type CellValue = string | number | boolean | null;

export interface GridColumn {
  readonly id: ColumnId;
  readonly title: string;
  readonly dataType: ColumnDataType;
  readonly readonly?: boolean;
}

export interface CellCoordinate {
  readonly rowId: RowId;
  readonly columnId: ColumnId;
}

export interface CellChangeEvent extends CellCoordinate {
  readonly oldValue: CellValue;
  readonly newValue: CellValue;
}

export type SortDirection = "asc" | "desc";
export type FilterOperator = "equals" | "contains" | "greaterThan" | "lessThan";

export interface SortRule {
  readonly columnId: ColumnId;
  readonly direction: SortDirection;
}

export interface FilterRule {
  readonly columnId: ColumnId;
  readonly operator: FilterOperator;
  readonly value: CellValue;
}

export type GetRowsRequest = FromSchema<typeof getRowsRequestSchema>;
export type GetRowsResult = FromSchema<typeof getRowsResultSchema>;
export type CellUpdateRequest = FromSchema<typeof cellUpdateRequestSchema>;
export type UpdateCellsResult = FromSchema<typeof updateCellsResultSchema>;
export type DataSourceError = FromSchema<typeof protocolErrorSchema>;
export type CellUpdate = CellUpdateRequest["changes"][number];
