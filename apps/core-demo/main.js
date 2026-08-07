import { mountVirtualDomGrid } from "../../packages/core/dist/virtual-dom-grid.js";

const columns = Array.from({ length: 50 }, (_, columnIndex) => ({
  id: `c${columnIndex}`,
  title: `Column ${columnIndex + 1}`,
  dataType: columnIndex === 2 ? "boolean" : columnIndex % 5 === 0 ? "number" : "text"
}));

const rows = Array.from({ length: 100000 }, (_, rowIndex) => {
  const cells = {};

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

mountVirtualDomGrid(document.getElementById("gridHost"), {
  columns,
  rows,
  onRender(metrics) {
    document.getElementById("renderedCells").textContent = String(metrics.renderedCellCount);
    document.getElementById("renderTime").textContent = `${metrics.renderMs.toFixed(2)} ms`;
  },
  onSelectionChange(selection) {
    document.getElementById("activeCell").textContent = `${selection.rowId} / ${selection.columnId}`;
  },
  onCellChange(change) {
    document.getElementById("lastChange").textContent =
      `${change.rowId} / ${change.columnId}: ${String(change.oldValue)} -> ${String(change.newValue)}`;
  }
});
