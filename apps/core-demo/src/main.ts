import { mountVirtualDomGrid } from "@thefoolspath/gethen-core";
import type { GridColumnView, GridRow } from "@thefoolspath/gethen-core";
import type { CellValue, ColumnId } from "@thefoolspath/gethen-protocol";

const customizationEnabled = new URLSearchParams(window.location.search).get("customization") !== "off";
const columns: readonly GridColumnView[] = [
  ...Array.from({ length: 50 }, (_, columnIndex): GridColumnView => ({
    id: `c${columnIndex}`,
    title: `Column ${columnIndex + 1}`,
    dataType: columnIndex === 2 ? "boolean" : columnIndex % 5 === 0 ? "number" : "text",
    align: columnIndex % 5 === 0 ? "right" : "left",
    ...(customizationEnabled && columnIndex % 5 === 0
      ? {
          className: "gethen-numeric-column",
          formatter: ({ value }) => typeof value === "number" ? value.toLocaleString("en-US") : ""
        }
      : {})
  })),
  { id: "internalKey", title: "Internal key", dataType: "text", hidden: true, readonly: true }
];

const rows: readonly GridRow[] = Array.from({ length: 100000 }, (_, rowIndex) => {
  const cells: Record<ColumnId, CellValue> = {};

  for (const column of columns) {
    if (column.id === "internalKey") {
      cells[column.id] = `key-${rowIndex + 1}`;
      continue;
    }

    const columnIndex = Number(column.id.slice(1));
    cells[column.id] =
      columnIndex === 2
        ? rowIndex % 2 === 0
        : columnIndex % 5 === 0
          ? (rowIndex + 1) * (columnIndex + 1)
          : `R${rowIndex + 1} ${column.title}`;
  }

  return {
    id: `row-${rowIndex + 1}`,
    cells
  };
});

mountVirtualDomGrid(requireElement("gridHost"), {
  columns,
  rows,
  ...(customizationEnabled
    ? {
        styling: {
          getRowClass: ({ rowIndex }: { rowIndex: number }) =>
            rowIndex % 2 === 1 ? "gethen-alternate-row" : undefined,
          getCellClass: ({ column, value }: { column: GridColumnView; value: CellValue | undefined }) =>
            column.id === "c2" && value === true ? "gethen-true-cell" : undefined
        },
        theme: {
          activeCellBorder: "#0f766e",
          activeCellBackground: "#f0fdfa"
        }
      }
    : {}),
  clipboard: {
    enabled: true,
    pasteMode: "direct-and-dialog",
    validateBeforeCommit: true,
    emptyCellValue: null
  },
  onRender(metrics) {
    requireElement("renderedCells").textContent = String(metrics.renderedCellCount);
    requireElement("renderTime").textContent = `${metrics.renderMs.toFixed(2)} ms`;
  },
  onSelectionChange(selection) {
    requireElement("activeCell").textContent = `${selection.rowId} / ${selection.columnId}`;
  },
  onCellChange(change) {
    requireElement("lastChange").textContent =
      `${change.rowId} / ${change.columnId}: ${String(change.oldValue)} -> ${String(change.newValue)}`;
  },
  onPaste(result) {
    requireElement("lastPaste").textContent = result.committed
      ? `${result.changes.length} cells committed`
      : `${result.errors.length} cells rejected`;
  }
});

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }

  return element;
}
