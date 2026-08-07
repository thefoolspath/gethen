(function () {
  "use strict";

  const rowCount = 100000;
  const columnCount = 50;
  const rowHeight = 32;
  const columnWidth = 132;
  const overscanRows = 6;
  const overscanColumns = 2;

  const grid = document.getElementById("grid");
  const spacer = document.getElementById("spacer");
  const canvas = document.getElementById("canvas");
  const activeCellDescription = document.getElementById("activeCell");
  const drawnCells = document.getElementById("drawnCells");
  const drawTime = document.getElementById("drawTime");
  const context = canvas.getContext("2d");

  const activeCell = { row: 0, column: 0 };
  let lastRange = "";
  let scheduled = false;

  spacer.style.width = `${columnCount * columnWidth}px`;
  spacer.style.height = `${rowCount * rowHeight}px`;

  function cellValue(rowIndex, columnIndex) {
    if (columnIndex === 0) {
      return `Row ${rowIndex + 1}`;
    }

    if (columnIndex % 5 === 0) {
      return String((rowIndex + 1) * (columnIndex + 1));
    }

    return `R${rowIndex + 1} C${columnIndex + 1}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function visibleRange() {
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

  function resizeCanvas() {
    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(1, grid.clientWidth);
    const height = Math.max(1, grid.clientHeight);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawCell(rowIndex, columnIndex, left, top) {
    const isRowHeader = columnIndex === 0;
    const isActive = rowIndex === activeCell.row && columnIndex === activeCell.column;

    context.fillStyle = isActive ? "#fff8df" : isRowHeader ? "#eef3f5" : "#ffffff";
    context.fillRect(left, top, columnWidth, rowHeight);

    context.strokeStyle = isActive ? "#176b87" : "#e0e5ea";
    context.lineWidth = isActive ? 2 : 1;
    context.strokeRect(
      left + (isActive ? 1 : 0.5),
      top + (isActive ? 1 : 0.5),
      columnWidth - (isActive ? 2 : 1),
      rowHeight - (isActive ? 2 : 1)
    );

    context.fillStyle = "#1d2630";
    context.font = isRowHeader ? "700 13px Arial, Helvetica, sans-serif" : "13px Arial, Helvetica, sans-serif";
    context.textBaseline = "middle";
    context.save();
    context.beginPath();
    context.rect(left + 8, top + 2, columnWidth - 16, rowHeight - 4);
    context.clip();
    context.fillText(cellValue(rowIndex, columnIndex), left + 10, top + rowHeight / 2);
    context.restore();
  }

  function render() {
    scheduled = false;
    const started = performance.now();
    const range = visibleRange();
    const rangeKey = `${grid.clientWidth}:${grid.clientHeight}:${range.firstRow}:${range.lastRow}:${range.firstColumn}:${range.lastColumn}:${activeCell.row}:${activeCell.column}`;

    if (rangeKey === lastRange) {
      return;
    }

    lastRange = rangeKey;
    resizeCanvas();
    context.clearRect(0, 0, grid.clientWidth, grid.clientHeight);

    let drawn = 0;

    for (let rowIndex = range.firstRow; rowIndex <= range.lastRow; rowIndex += 1) {
      for (let columnIndex = range.firstColumn; columnIndex <= range.lastColumn; columnIndex += 1) {
        const left = columnIndex * columnWidth - grid.scrollLeft;
        const top = rowIndex * rowHeight - grid.scrollTop;
        drawCell(rowIndex, columnIndex, left, top);
        drawn += 1;
      }
    }

    activeCellDescription.textContent = `Row ${activeCell.row + 1}, Column ${activeCell.column + 1}, ${cellValue(
      activeCell.row,
      activeCell.column
    )}`;
    drawnCells.textContent = String(drawn);
    drawTime.textContent = `${(performance.now() - started).toFixed(2)} ms`;
  }

  function scheduleRender() {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(render);
  }

  function scrollActiveCellIntoView() {
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
