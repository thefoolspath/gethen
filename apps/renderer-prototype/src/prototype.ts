(function () {
  "use strict";

  const rowCount = 100000;
  const columnCount = 50;
  const rowHeight = 32;
  const columnWidth = 132;
  const overscanRows = 6;
  const overscanColumns = 2;

  const grid = requireElement("grid");
  const spacer = requireElement("spacer");
  const viewport = requireElement("viewport");
  const mountedCells = requireElement("mountedCells");
  const renderTime = requireElement("renderTime");

  const activeCell = { row: 0, column: 0 };
  let lastRange = "";
  let scheduled = false;

  spacer.style.width = `${columnCount * columnWidth}px`;
  spacer.style.height = `${rowCount * rowHeight}px`;

  function cellValue(rowIndex: number, columnIndex: number): string {
    if (columnIndex === 0) {
      return `Row ${rowIndex + 1}`;
    }

    if (columnIndex % 5 === 0) {
      return String((rowIndex + 1) * (columnIndex + 1));
    }

    return `R${rowIndex + 1} C${columnIndex + 1}`;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  function visibleRange(): {
    firstRow: number;
    lastRow: number;
    firstColumn: number;
    lastColumn: number;
  } {
    const firstRow = Math.max(0, Math.floor(grid.scrollTop / rowHeight) - overscanRows);
    const lastRow = Math.min(
      rowCount - 1,
      Math.ceil((grid.scrollTop + grid.clientHeight) / rowHeight) + overscanRows
    );
    const firstColumn = Math.max(0, Math.floor(grid.scrollLeft / columnWidth) - overscanColumns);
    const lastColumn = Math.min(
      columnCount - 1,
      Math.ceil((grid.scrollLeft + grid.clientWidth) / columnWidth) + overscanColumns
    );

    return { firstRow, lastRow, firstColumn, lastColumn };
  }

  function render(): void {
    scheduled = false;
    const started = performance.now();
    const range = visibleRange();
    const rangeKey = `${range.firstRow}:${range.lastRow}:${range.firstColumn}:${range.lastColumn}:${activeCell.row}:${activeCell.column}`;

    if (rangeKey === lastRange) {
      return;
    }

    lastRange = rangeKey;
    viewport.replaceChildren();
    viewport.style.transform = `translate(${range.firstColumn * columnWidth}px, ${range.firstRow * rowHeight}px)`;

    const fragment = document.createDocumentFragment();
    let mounted = 0;

    for (let rowIndex = range.firstRow; rowIndex <= range.lastRow; rowIndex += 1) {
      for (let columnIndex = range.firstColumn; columnIndex <= range.lastColumn; columnIndex += 1) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.setAttribute("role", columnIndex === 0 ? "rowheader" : "gridcell");
        cell.textContent = cellValue(rowIndex, columnIndex);
        cell.style.left = `${(columnIndex - range.firstColumn) * columnWidth}px`;
        cell.style.top = `${(rowIndex - range.firstRow) * rowHeight}px`;
        cell.setAttribute("aria-rowindex", String(rowIndex + 1));
        cell.setAttribute("aria-colindex", String(columnIndex + 1));

        if (rowIndex === activeCell.row && columnIndex === activeCell.column) {
          cell.classList.add("active");
          cell.setAttribute("aria-selected", "true");
        }

        fragment.appendChild(cell);
        mounted += 1;
      }
    }

    viewport.appendChild(fragment);
    mountedCells.textContent = String(mounted);
    renderTime.textContent = `${(performance.now() - started).toFixed(2)} ms`;
  }

  function scheduleRender(): void {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(render);
  }

  function scrollActiveCellIntoView(): void {
    const left = activeCell.column * columnWidth;
    const top = activeCell.row * rowHeight;
    const right = left + columnWidth;
    const bottom = top + rowHeight;

    if (left < grid.scrollLeft) {
      grid.scrollLeft = left;
    } else if (right > grid.scrollLeft + grid.clientWidth) {
      grid.scrollLeft = right - grid.clientWidth;
    }

    if (top < grid.scrollTop) {
      grid.scrollTop = top;
    } else if (bottom > grid.scrollTop + grid.clientHeight) {
      grid.scrollTop = bottom - grid.clientHeight;
    }
  }

  grid.addEventListener("scroll", scheduleRender);
  grid.addEventListener("keydown", function (event) {
    const previousRow = activeCell.row;
    const previousColumn = activeCell.column;

    if (event.key === "ArrowDown") {
      activeCell.row = clamp(activeCell.row + 1, 0, rowCount - 1);
    } else if (event.key === "ArrowUp") {
      activeCell.row = clamp(activeCell.row - 1, 0, rowCount - 1);
    } else if (event.key === "ArrowRight") {
      activeCell.column = clamp(activeCell.column + 1, 0, columnCount - 1);
    } else if (event.key === "ArrowLeft") {
      activeCell.column = clamp(activeCell.column - 1, 0, columnCount - 1);
    } else if (event.key === "Home") {
      activeCell.column = 0;
    } else if (event.key === "End") {
      activeCell.column = columnCount - 1;
    } else {
      return;
    }

    event.preventDefault();

    if (previousRow !== activeCell.row || previousColumn !== activeCell.column) {
      scrollActiveCellIntoView();
      lastRange = "";
      scheduleRender();
    }
  });

  window.addEventListener("resize", function () {
    lastRange = "";
    scheduleRender();
  });

  render();
})();

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }

  return element;
}
