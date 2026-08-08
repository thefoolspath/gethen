import { mountVirtualDomGrid } from "@thefoolspath/gethen-core";
import type { GridRow } from "@thefoolspath/gethen-core";
import type { CellValue, ColumnId, GridColumn } from "@thefoolspath/gethen-protocol";

const columns: readonly GridColumn[] = Array.from({ length: 50 }, (_, columnIndex) => ({
  id: `c${columnIndex}`,
  title: `Column ${columnIndex + 1}`,
  dataType: columnIndex === 2 ? "boolean" : columnIndex % 5 === 0 ? "number" : "text"
}));

const rows: readonly GridRow[] = Array.from({ length: 100000 }, (_, rowIndex) => {
  const cells: Record<ColumnId, CellValue> = {};

  for (const column of columns) {
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
  }
});

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }

  return element;
}
