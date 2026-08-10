import type { GridRow } from "./client-grid-engine.js";
import type { GridClassValue, GridColumnView, GridStylingOptions } from "./grid-customization.js";
import { resolveGridClassNames } from "./grid-customization.js";

export interface VirtualDomGridCellInput<TRow extends GridRow = GridRow> {
  readonly rowHeight: number;
  readonly columnWidth: number;
  readonly firstRenderedRow: number;
  readonly firstRenderedColumn: number;
  readonly commitEdit: (value: string) => void;
  readonly cancelEdit: () => void;
  readonly styling: GridStylingOptions<TRow> | undefined;
}

export function createVirtualDomGridCell<TRow extends GridRow>(
  input: VirtualDomGridCellInput<TRow>,
  row: TRow,
  column: GridColumnView<TRow>,
  rowIndex: number,
  columnIndex: number,
  rowClass: GridClassValue,
  active: boolean,
  selected: boolean,
  editing: boolean,
  draftValue: string
): HTMLElement {
  const cell = document.createElement("div");
  configureCellAccessibility(cell, columnIndex, rowIndex, active, selected);
  configureCellPosition(cell, input, column, rowIndex, columnIndex);
  configureCellClasses(cell, input.styling, rowClass, row, column, rowIndex, columnIndex);

  if (selected) {
    applySelectedCellStyles(cell);
  }

  if (active) {
    applyActiveCellStyles(cell);
  }

  if (editing) {
    cell.replaceChildren(createCellEditor(draftValue, input.commitEdit, input.cancelEdit));
  } else {
    const value = row.cells[column.id];
    cell.textContent = column.formatter?.({
      row,
      rowId: row.id,
      rowIndex,
      column,
      columnIndex,
      value
    }) ?? String(value ?? "");
  }

  return cell;
}

function configureCellClasses<TRow extends GridRow>(
  cell: HTMLElement,
  styling: GridStylingOptions<TRow> | undefined,
  rowClass: GridClassValue,
  row: TRow,
  column: GridColumnView<TRow>,
  rowIndex: number,
  columnIndex: number
): void {
  const cellClass = styling?.getCellClass?.({
    row,
    rowId: row.id,
    rowIndex,
    column,
    columnIndex,
    value: row.cells[column.id]
  });
  cell.classList.add(...resolveGridClassNames(column.className, rowClass, cellClass));
}

function configureCellAccessibility(
  cell: HTMLElement,
  columnIndex: number,
  rowIndex: number,
  active: boolean,
  selected: boolean
): void {
  cell.id = active ? "gethen-active-cell" : "";
  cell.setAttribute("role", columnIndex === 0 ? "rowheader" : "gridcell");
  cell.setAttribute("aria-rowindex", String(rowIndex + 1));
  cell.setAttribute("aria-colindex", String(columnIndex + 1));
  cell.setAttribute("aria-selected", selected ? "true" : "false");
  cell.dataset.rowIndex = String(rowIndex);
  cell.dataset.columnIndex = String(columnIndex);
}

function applySelectedCellStyles(cell: HTMLElement): void {
  cell.style.background = "var(--gethen-selection-background, #e6f4ff)";
}

function configureCellPosition<TRow extends GridRow>(
  cell: HTMLElement,
  input: VirtualDomGridCellInput<TRow>,
  column: GridColumnView<TRow>,
  rowIndex: number,
  columnIndex: number
): void {
  Object.assign(cell.style, {
    position: "absolute",
    left: `${(columnIndex - input.firstRenderedColumn) * input.columnWidth}px`,
    top: `${(rowIndex - input.firstRenderedRow) * input.rowHeight}px`,
    width: `${input.columnWidth}px`,
    height: `${input.rowHeight}px`,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    borderRight: "1px solid #e0e5ea",
    borderBottom: "1px solid #e0e5ea",
    borderColor: "var(--gethen-grid-line-color, #e0e5ea)",
    padding: "var(--gethen-cell-padding, 7px 10px)",
    color: "var(--gethen-text-color, inherit)",
    background: "var(--gethen-background, transparent)",
    fontFamily: "var(--gethen-font-family, inherit)",
    fontSize: "var(--gethen-font-size, inherit)",
    textAlign: column.align ?? "inherit"
  });
}

function applyActiveCellStyles(cell: HTMLElement): void {
  Object.assign(cell.style, {
    border: "2px solid var(--gethen-active-cell-border, #176b87)",
    background: "var(--gethen-active-cell-background, #fff8df)",
    zIndex: "1"
  });
}

function createCellEditor(
  draftValue: string,
  commitEdit: (value: string) => void,
  cancelEdit: () => void
): HTMLInputElement {
  const input = document.createElement("input");
  input.dataset.gethenEditor = "true";
  input.value = draftValue;
  Object.assign(input.style, {
    width: "100%",
    height: "100%",
    border: "0",
    padding: "0"
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      commitEdit(input.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancelEdit();
    }
  });

  return input;
}
