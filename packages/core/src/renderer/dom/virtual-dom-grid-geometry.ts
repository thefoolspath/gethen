import type { GridRow } from "../../contracts/grid-types.js";
import type { GridLayoutState } from "../../state/grid-layout.js";
import type { GridColumnView, GridDensity, VirtualDomGridTheme } from "./grid-customization.js";
import { clamp } from "./virtual-dom-grid-values.js";

export interface GridDensityDefaults {
  readonly rowHeight: number;
  readonly columnWidth: number;
  readonly headerHeight: number;
  readonly rowNumberWidth: number;
  readonly statusHeight: number;
}

export function orderGridColumns<TRow extends GridRow>(
  columns: readonly GridColumnView<TRow>[],
  layout: GridLayoutState
): readonly GridColumnView<TRow>[] {
  const byId = new Map(columns.map((column) => [column.id, column] as const));
  return layout.columns.map((column) => byId.get(column.columnId)!).filter(Boolean);
}

export function findGridColumnIndex<TRow extends GridRow>(
  columns: readonly GridColumnView<TRow>[],
  columnId: string | undefined,
  fallback: number
): number {
  const index = columnId === undefined ? -1 : columns.findIndex((column) => column.id === columnId);
  return index >= 0 ? index : clamp(fallback, 0, Math.max(0, columns.length - 1));
}

export function getRenderedGridRowIndexes(
  rowCount: number,
  rowHeight: number,
  scrollTop: number,
  viewportHeight: number,
  frozenRowCount: number,
  overscan: number
): readonly number[] {
  const indexes = new Set<number>();
  for (let index = 0; index < Math.min(rowCount, frozenRowCount); index += 1) indexes.add(index);
  const first = Math.max(frozenRowCount, Math.floor(scrollTop / rowHeight) - overscan);
  const last = Math.min(rowCount - 1, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan);
  for (let index = first; index <= last; index += 1) indexes.add(index);
  return [...indexes].sort((left, right) => left - right);
}

export function getRenderedGridColumnIndexes(
  layout: GridLayoutState,
  offsets: readonly number[],
  scrollLeft: number,
  viewportWidth: number,
  overscan: number
): readonly number[] {
  const indexes = new Set<number>();
  for (let index = 0; index < layout.frozenColumnCount; index += 1) indexes.add(index);
  const visible: number[] = [];
  for (let index = layout.frozenColumnCount; index < layout.columns.length; index += 1) {
    const left = offsets[index]!;
    const right = left + layout.columns[index]!.width;
    if (right >= scrollLeft && left <= scrollLeft + viewportWidth) visible.push(index);
  }
  const first = visible[0] ?? layout.frozenColumnCount;
  const last = visible.at(-1) ?? first - 1;
  for (
    let index = Math.max(layout.frozenColumnCount, first - overscan);
    index <= Math.min(layout.columns.length - 1, last + overscan);
    index += 1
  ) {
    indexes.add(index);
  }
  return [...indexes].sort((left, right) => left - right);
}

export function getGridDensityDefaults(density: GridDensity): GridDensityDefaults {
  switch (density) {
    case "compact":
      return { rowHeight: 28, columnWidth: 124, headerHeight: 32, rowNumberWidth: 44, statusHeight: 28 };
    case "spacious":
      return { rowHeight: 40, columnWidth: 148, headerHeight: 44, rowNumberWidth: 56, statusHeight: 36 };
    case "comfortable":
      return { rowHeight: 34, columnWidth: 136, headerHeight: 38, rowNumberWidth: 48, statusHeight: 32 };
  }
}

export function cssGridPixelValue(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function applyVirtualDomGridTheme(
  grid: HTMLElement,
  theme: VirtualDomGridTheme | undefined
): void {
  const variables: ReadonlyArray<readonly [string, string | undefined]> = [
    ["--gethen-background", theme?.background], ["--gethen-text-color", theme?.textColor],
    ["--gethen-grid-line-color", theme?.gridLineColor], ["--gethen-header-background", theme?.headerBackground],
    ["--gethen-header-text-color", theme?.headerTextColor], ["--gethen-row-number-background", theme?.rowNumberBackground],
    ["--gethen-row-number-text-color", theme?.rowNumberTextColor], ["--gethen-pinned-row-background", theme?.pinnedRowBackground],
    ["--gethen-status-background", theme?.statusBackground], ["--gethen-status-text-color", theme?.statusTextColor],
    ["--gethen-active-cell-border", theme?.activeCellBorder], ["--gethen-active-cell-background", theme?.activeCellBackground],
    ["--gethen-selection-background", theme?.selectionBackground], ["--gethen-readonly-text-color", theme?.readonlyTextColor],
    ["--gethen-invalid-color", theme?.invalidColor], ["--gethen-editor-focus-color", theme?.editorFocusColor],
    ["--gethen-cell-padding", theme?.cellPadding], ["--gethen-font-family", theme?.fontFamily],
    ["--gethen-font-size", theme?.fontSize]
  ];
  for (const [name, value] of variables) {
    if (value !== undefined) grid.style.setProperty(name, value);
    else grid.style.removeProperty(name);
  }
}
