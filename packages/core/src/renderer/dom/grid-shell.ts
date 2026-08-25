import type { CellValue } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./client-grid-engine.js";
import type { GridAggregateDescriptor } from "./grid-data-shaping.js";
import { aggregateGridRows } from "./grid-data-shaping.js";

export interface GridRowNumberOptions {
  readonly visible?: boolean;
  readonly width?: number;
}

export interface GridStatusBarOptions {
  readonly visible?: boolean;
  readonly totalRowCount?: number | null;
  readonly filteredRowCount?: number | null;
}

export interface GridAggregatePinnedRowOptions {
  readonly rows: readonly GridRow[];
  readonly aggregates: readonly GridAggregateDescriptor[];
  readonly id?: string;
  readonly labelColumnId?: string;
  readonly label?: string;
}

export function createGridAggregatePinnedRow(
  options: GridAggregatePinnedRowOptions
): GridRow {
  const cells: Record<string, CellValue> = {
    ...aggregateGridRows(options.rows, options.aggregates)
  };
  if (options.labelColumnId) {
    cells[options.labelColumnId] = options.label ?? "Total";
  }
  return {
    id: options.id ?? "gethen-summary",
    cells
  };
}

export function formatGridStatus(
  loadedRowCount: number,
  selectedCellCount: number,
  options: GridStatusBarOptions | undefined
): string {
  const total = options?.totalRowCount;
  const filtered = options?.filteredRowCount;
  let rowsText: string;
  if (filtered !== undefined && filtered !== null && total !== undefined && total !== null && filtered !== total) {
    rowsText = `${filtered.toLocaleString()} of ${total.toLocaleString()} rows`;
  } else if (total === null) {
    rowsText = `${loadedRowCount.toLocaleString()} rows loaded · total unknown`;
  } else {
    rowsText = `${(total ?? filtered ?? loadedRowCount).toLocaleString()} rows`;
  }
  return selectedCellCount > 1
    ? `${rowsText} · ${selectedCellCount.toLocaleString()} cells selected`
    : rowsText;
}
