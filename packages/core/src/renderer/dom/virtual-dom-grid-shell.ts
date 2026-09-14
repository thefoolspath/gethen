import type { GridRow } from "../../contracts/grid-types.js";
import type { GridLayoutState } from "../../state/grid-layout.js";
import type { GridColumnView, GridStylingOptions } from "./grid-customization.js";
import { resolveGridClassNames } from "./grid-customization.js";
import type { GridStatusBarOptions } from "./grid-shell.js";
import { formatGridStatus } from "./grid-shell.js";

interface GridShellCell {
  readonly rowIndex: number;
  readonly columnIndex: number;
}

export interface VirtualDomGridShellContext<TRow extends GridRow> {
  readonly grid: HTMLElement;
  readonly rows: readonly TRow[];
  readonly columns: readonly GridColumnView<TRow>[];
  readonly pinnedBottomRows: readonly TRow[];
  readonly layoutState: GridLayoutState;
  readonly styling: GridStylingOptions<TRow> | undefined;
  readonly statusBar: false | GridStatusBarOptions | undefined;
  readonly activeCell: GridShellCell;
  readonly anchorCell: GridShellCell;
  readonly rowHeight: number;
  readonly rowNumberWidth: number;
  readonly headerHeight: number;
  readonly statusHeight: number;
  readonly pinnedHeight: number;
  readonly showColumnHeaders: boolean;
  readonly showRowNumbers: boolean;
  readonly showStatusBar: boolean;
}

export function appendGridShellBeforeRows<TRow extends GridRow>(
  fragment: DocumentFragment,
  columnIndexes: readonly number[],
  columnOffsets: readonly number[],
  context: VirtualDomGridShellContext<TRow>
): void {
  appendColumnHeaders(fragment, columnIndexes, columnOffsets, context);
  appendRowNumberCorner(fragment, context);
  appendEmptyState(fragment, context);
}

export function appendGridShellAfterRows<TRow extends GridRow>(
  fragment: DocumentFragment,
  columnIndexes: readonly number[],
  columnOffsets: readonly number[],
  context: VirtualDomGridShellContext<TRow>
): void {
  appendPinnedBottomRows(fragment, columnIndexes, columnOffsets, context);
  appendStatusBar(fragment, context);
}

export function appendGridRowNumber<TRow extends GridRow>(
  fragment: DocumentFragment,
  row: TRow,
  rowIndex: number,
  frozenRow: boolean,
  context: VirtualDomGridShellContext<TRow>
): void {
  if (!context.showRowNumbers) return;
  const rowHeader = document.createElement("div");
  const isGroup = "kind" in row && row.kind === "group";
  rowHeader.setAttribute("role", "rowheader");
  rowHeader.setAttribute("aria-rowindex", String(rowIndex + 1 + (context.showColumnHeaders ? 1 : 0)));
  rowHeader.setAttribute("aria-colindex", "1");
  rowHeader.textContent = isGroup ? "" : String(rowIndex + 1);
  rowHeader.title = isGroup ? "Group row" : `Row ${rowIndex + 1}`;
  Object.assign(rowHeader.style, {
    position: "absolute",
    left: `${context.grid.scrollLeft}px`,
    top: `${context.headerHeight + rowIndex * context.rowHeight + (frozenRow ? context.grid.scrollTop : 0)}px`,
    width: `${context.rowNumberWidth}px`,
    height: `${context.rowHeight}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 10px",
    borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
    borderBottom: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
    background: "var(--gethen-row-number-background, #f7f9fb)",
    color: "var(--gethen-row-number-text-color, #667085)",
    fontVariantNumeric: "tabular-nums",
    userSelect: "none",
    zIndex: frozenRow ? "7" : "6"
  });
  fragment.appendChild(rowHeader);
}

function appendColumnHeaders<TRow extends GridRow>(
  fragment: DocumentFragment,
  columnIndexes: readonly number[],
  columnOffsets: readonly number[],
  context: VirtualDomGridShellContext<TRow>
): void {
  if (!context.showColumnHeaders) return;
  for (const columnIndex of columnIndexes) {
    const column = context.columns[columnIndex];
    const layoutColumn = context.layoutState.columns[columnIndex];
    if (!column || !layoutColumn) continue;
    const frozenColumn = columnIndex < context.layoutState.frozenColumnCount;
    const header = document.createElement("div");
    header.setAttribute("role", "columnheader");
    header.setAttribute("aria-rowindex", "1");
    header.setAttribute("aria-colindex", String(columnIndex + 1 + (context.showRowNumbers ? 1 : 0)));
    header.dataset.columnIndex = String(columnIndex);
    header.textContent = column.title;
    header.title = column.title;
    header.classList.add(...resolveGridClassNames(
      column.headerClassName,
      context.styling?.getHeaderClass?.({ column, columnIndex })
    ));
    Object.assign(header.style, {
      position: "absolute",
      left: `${context.rowNumberWidth + columnOffsets[columnIndex]! + (frozenColumn ? context.grid.scrollLeft : 0)}px`,
      top: `${context.grid.scrollTop}px`,
      width: `${layoutColumn.width}px`,
      height: `${context.headerHeight}px`,
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      padding: "var(--gethen-header-padding, 0 10px)",
      borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
      borderBottom: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
      background: "var(--gethen-header-background, #f3f6f9)",
      color: "var(--gethen-header-text-color, #344054)",
      fontWeight: "650",
      zIndex: frozenColumn ? "9" : "8"
    });
    fragment.appendChild(header);
  }
}

function appendRowNumberCorner<TRow extends GridRow>(
  fragment: DocumentFragment,
  context: VirtualDomGridShellContext<TRow>
): void {
  if (!context.showRowNumbers || !context.showColumnHeaders) return;
  const corner = document.createElement("div");
  corner.setAttribute("role", "columnheader");
  corner.setAttribute("aria-label", "Row numbers");
  corner.setAttribute("aria-rowindex", "1");
  corner.setAttribute("aria-colindex", "1");
  Object.assign(corner.style, {
    position: "absolute",
    left: `${context.grid.scrollLeft}px`,
    top: `${context.grid.scrollTop}px`,
    width: `${context.rowNumberWidth}px`,
    height: `${context.headerHeight}px`,
    borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
    borderBottom: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
    background: "var(--gethen-row-number-background, #eef2f6)",
    zIndex: "10"
  });
  fragment.appendChild(corner);
}

function appendEmptyState<TRow extends GridRow>(
  fragment: DocumentFragment,
  context: VirtualDomGridShellContext<TRow>
): void {
  if (context.rows.length > 0 && context.columns.length > 0) return;
  const empty = document.createElement("div");
  empty.dataset.gethenEmptyState = "true";
  empty.textContent = context.columns.length === 0 ? "No visible columns" : "No rows to display";
  Object.assign(empty.style, {
    position: "absolute",
    left: `${context.grid.scrollLeft}px`,
    top: `${context.grid.scrollTop + context.headerHeight}px`,
    width: `${context.grid.clientWidth}px`,
    height: `${Math.max(80, context.grid.clientHeight - context.headerHeight - context.statusHeight)}px`,
    display: "grid",
    placeItems: "center",
    color: "var(--gethen-readonly-text-color, #667085)",
    background: "var(--gethen-background, #ffffff)",
    zIndex: "5"
  });
  fragment.appendChild(empty);
}

function appendPinnedBottomRows<TRow extends GridRow>(
  fragment: DocumentFragment,
  columnIndexes: readonly number[],
  columnOffsets: readonly number[],
  context: VirtualDomGridShellContext<TRow>
): void {
  if (context.pinnedBottomRows.length === 0) return;
  const baseTop = context.grid.scrollTop
    + Math.max(context.headerHeight, context.grid.clientHeight - context.statusHeight - context.pinnedHeight);
  context.pinnedBottomRows.forEach((row, pinnedIndex) => {
    const ariaRowIndex = context.rows.length + pinnedIndex + 1 + (context.showColumnHeaders ? 1 : 0);
    if (context.showRowNumbers) {
      const label = document.createElement("div");
      label.setAttribute("role", "rowheader");
      label.setAttribute("aria-rowindex", String(ariaRowIndex));
      label.setAttribute("aria-colindex", "1");
      label.textContent = "Σ";
      label.title = "Pinned summary row";
      Object.assign(label.style, {
        position: "absolute", left: `${context.grid.scrollLeft}px`,
        top: `${baseTop + pinnedIndex * context.rowHeight}px`, width: `${context.rowNumberWidth}px`,
        height: `${context.rowHeight}px`, display: "grid", placeItems: "center",
        borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
        borderTop: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
        background: "var(--gethen-pinned-row-background, #eef4ff)",
        color: "var(--gethen-row-number-text-color, #667085)", fontWeight: "700", zIndex: "10"
      });
      fragment.appendChild(label);
    }
    for (const columnIndex of columnIndexes) {
      const column = context.columns[columnIndex];
      const layoutColumn = context.layoutState.columns[columnIndex];
      if (!column || !layoutColumn) continue;
      const frozenColumn = columnIndex < context.layoutState.frozenColumnCount;
      const cell = document.createElement("div");
      const cellContext = {
        row, rowId: row.id, rowIndex: context.rows.length + pinnedIndex,
        column, columnIndex, value: row.cells[column.id]
      };
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-readonly", "true");
      cell.setAttribute("aria-rowindex", String(ariaRowIndex));
      cell.setAttribute("aria-colindex", String(columnIndex + 1 + (context.showRowNumbers ? 1 : 0)));
      cell.dataset.gethenPinnedBottom = "true";
      cell.textContent = column.formatter?.(cellContext) ?? String(cellContext.value ?? "");
      Object.assign(cell.style, {
        position: "absolute",
        left: `${context.rowNumberWidth + columnOffsets[columnIndex]! + (frozenColumn ? context.grid.scrollLeft : 0)}px`,
        top: `${baseTop + pinnedIndex * context.rowHeight}px`, width: `${layoutColumn.width}px`,
        height: `${context.rowHeight}px`, overflow: "hidden", whiteSpace: "nowrap",
        textOverflow: "ellipsis", padding: "var(--gethen-cell-padding, 7px 10px)",
        borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
        borderTop: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
        background: "var(--gethen-pinned-row-background, #eef4ff)", color: "var(--gethen-text-color, #17212b)",
        fontWeight: "650", textAlign: column.align ?? "inherit", zIndex: frozenColumn ? "9" : "8"
      });
      fragment.appendChild(cell);
    }
  });
}

function appendStatusBar<TRow extends GridRow>(
  fragment: DocumentFragment,
  context: VirtualDomGridShellContext<TRow>
): void {
  if (!context.showStatusBar) return;
  const rowSpan = Math.abs(context.activeCell.rowIndex - context.anchorCell.rowIndex) + 1;
  const columnSpan = Math.abs(context.activeCell.columnIndex - context.anchorCell.columnIndex) + 1;
  const selectedCellCount = context.rows.length > 0 && context.columns.length > 0 ? rowSpan * columnSpan : 0;
  const status = document.createElement("div");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.dataset.gethenStatusBar = "true";
  status.textContent = formatGridStatus(context.rows.length, selectedCellCount, context.statusBar || undefined);
  Object.assign(status.style, {
    position: "absolute", left: `${context.grid.scrollLeft}px`,
    top: `${context.grid.scrollTop + Math.max(0, context.grid.clientHeight - context.statusHeight)}px`,
    width: `${context.grid.clientWidth}px`, height: `${context.statusHeight}px`, display: "flex",
    alignItems: "center", padding: "0 12px", borderTop: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
    background: "var(--gethen-status-background, #f8fafc)", color: "var(--gethen-status-text-color, #475467)",
    fontSize: "12px", fontVariantNumeric: "tabular-nums", zIndex: "12"
  });
  fragment.appendChild(status);
}
