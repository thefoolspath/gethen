import type { CellValue, GridColumn } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./client-grid-engine.js";
import type {
  GridBuiltInEditorDefinition,
  GridCellEditorFactory,
  GridCellRendererFactory
} from "./grid-editing.js";

export type GridClassValue = string | readonly string[] | undefined;
export type GridColumnAlignment = "left" | "center" | "right";

export interface GridColumnView<TRow extends GridRow = GridRow> extends GridColumn {
  readonly hidden?: boolean;
  readonly nullable?: boolean;
  readonly key?: boolean;
  readonly align?: GridColumnAlignment;
  readonly className?: GridClassValue;
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
}

export interface VirtualDomGridTheme {
  readonly background?: string;
  readonly textColor?: string;
  readonly gridLineColor?: string;
  readonly activeCellBorder?: string;
  readonly activeCellBackground?: string;
  readonly selectionBackground?: string;
  readonly cellPadding?: string;
  readonly fontFamily?: string;
  readonly fontSize?: string;
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
