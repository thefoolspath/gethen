import type { GridColumn } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./client-grid-engine.js";

export interface VirtualDomGridCellInput {
  readonly rowHeight: number;
  readonly columnWidth: number;
  readonly firstRenderedRow: number;
  readonly firstRenderedColumn: number;
  readonly commitEdit: (value: string) => void;
  readonly cancelEdit: () => void;
}

export function createVirtualDomGridCell(
  input: VirtualDomGridCellInput,
  row: GridRow,
  column: GridColumn,
  rowIndex: number,
  columnIndex: number,
  active: boolean,
  editing: boolean,
  draftValue: string
): HTMLElement {
  const cell = document.createElement("div");
  configureCellAccessibility(cell, columnIndex, rowIndex, active);
  configureCellPosition(cell, input, rowIndex, columnIndex);

  if (active) {
    applyActiveCellStyles(cell);
  }

  if (editing) {
    cell.replaceChildren(createCellEditor(draftValue, input.commitEdit, input.cancelEdit));
  } else {
    cell.textContent = String(row.cells[column.id] ?? "");
  }

  return cell;
}

function configureCellAccessibility(
  cell: HTMLElement,
  columnIndex: number,
  rowIndex: number,
  active: boolean
): void {
  cell.id = active ? "gethen-active-cell" : "";
  cell.setAttribute("role", columnIndex === 0 ? "rowheader" : "gridcell");
  cell.setAttribute("aria-rowindex", String(rowIndex + 1));
  cell.setAttribute("aria-colindex", String(columnIndex + 1));
  cell.setAttribute("aria-selected", active ? "true" : "false");
  cell.dataset.rowIndex = String(rowIndex);
  cell.dataset.columnIndex = String(columnIndex);
}

function configureCellPosition(
  cell: HTMLElement,
  input: VirtualDomGridCellInput,
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
    padding: "7px 10px"
  });
}

function applyActiveCellStyles(cell: HTMLElement): void {
  Object.assign(cell.style, {
    border: "2px solid #176b87",
    background: "#fff8df",
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
