import type { CellValue, GridColumn } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./client-grid-engine.js";
import type {
  GridBuiltInEditorDefinition,
  GridCellEditorFactory,
  GridCellRendererFactory
} from "./grid-editing.js";

export type GridClassValue = string | readonly string[] | undefined;
export type GridColumnAlignment = "left" | "center" | "right";
export type GridDensity = "compact" | "comfortable" | "spacious";

export interface GridColumnView<TRow extends GridRow = GridRow> extends GridColumn {
  readonly hidden?: boolean;
  readonly nullable?: boolean;
  readonly key?: boolean;
  readonly align?: GridColumnAlignment;
  readonly className?: GridClassValue;
  readonly headerClassName?: GridClassValue;
  readonly formatter?: (context: CellFormatContext<TRow>) => string;
  readonly renderer?: GridCellRendererFactory<TRow>;
  readonly editor?: GridBuiltInEditorDefinition | GridCellEditorFactory<TRow>;
  readonly validate?: (
    value: CellValue,
    context: GridCellContext<TRow>
  ) => import("./grid-editing.js").GridValidationResult | Promise<import("./grid-editing.js").GridValidationResult>;
}

export interface GridCellContext<TRow extends GridRow = GridRow> {
  readonly row: TRow;
  readonly rowId: string;
  readonly rowIndex: number;
  readonly column: GridColumnView<TRow>;
  readonly columnIndex: number;
  readonly value: CellValue | undefined;
}

export type CellClassContext<TRow extends GridRow = GridRow> = GridCellContext<TRow>;
export type CellFormatContext<TRow extends GridRow = GridRow> = GridCellContext<TRow>;

export interface RowClassContext<TRow extends GridRow = GridRow> {
  readonly row: TRow;
  readonly rowId: string;
  readonly rowIndex: number;
}

export interface GridStylingOptions<TRow extends GridRow = GridRow> {
  readonly getRowClass?: (context: RowClassContext<TRow>) => GridClassValue;
  readonly getCellClass?: (context: CellClassContext<TRow>) => GridClassValue;
  readonly getHeaderClass?: (context: HeaderClassContext<TRow>) => GridClassValue;
}

export interface HeaderClassContext<TRow extends GridRow = GridRow> {
  readonly column: GridColumnView<TRow>;
  readonly columnIndex: number;
}

export interface VirtualDomGridTheme {
  readonly density?: GridDensity;
  readonly background?: string;
  readonly textColor?: string;
  readonly gridLineColor?: string;
  readonly headerBackground?: string;
  readonly headerTextColor?: string;
  readonly rowNumberBackground?: string;
  readonly rowNumberTextColor?: string;
  readonly pinnedRowBackground?: string;
  readonly statusBackground?: string;
  readonly statusTextColor?: string;
  readonly activeCellBorder?: string;
  readonly activeCellBackground?: string;
  readonly selectionBackground?: string;
  readonly readonlyTextColor?: string;
  readonly invalidColor?: string;
  readonly editorFocusColor?: string;
  readonly cellPadding?: string;
  readonly fontFamily?: string;
  readonly fontSize?: string;
  readonly headerHeight?: string;
  readonly rowHeight?: string;
  readonly rowNumberWidth?: string;
  readonly statusHeight?: string;
}

export function resolveGridClassNames(...values: readonly GridClassValue[]): readonly string[] {
  const classNames = new Set<string>();

  for (const value of values) {
    const entries = typeof value === "string" ? [value] : value ?? [];

    for (const entry of entries) {
      for (const className of entry.split(/\s+/u)) {
        if (className) {
          classNames.add(className);
        }
      }
    }
  }

  return [...classNames];
}

export function getVisibleColumns<TRow extends GridRow>(
  columns: readonly GridColumnView<TRow>[]
): readonly GridColumnView<TRow>[] {
  return columns.filter((column) => !column.hidden);
}
