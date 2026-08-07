export interface VirtualViewportInput {
  readonly rowCount: number;
  readonly columnCount: number;
  readonly rowHeight: number;
  readonly columnWidth: number;
  readonly viewportHeight: number;
  readonly viewportWidth: number;
  readonly scrollTop: number;
  readonly scrollLeft: number;
  readonly overscanRows: number;
  readonly overscanColumns: number;
}

export interface VirtualViewport {
  readonly firstRow: number;
  readonly lastRow: number;
  readonly firstColumn: number;
  readonly lastColumn: number;
  readonly rowOffset: number;
  readonly columnOffset: number;
  readonly visibleRowCount: number;
  readonly visibleColumnCount: number;
  readonly renderedCellCount: number;
  readonly totalHeight: number;
  readonly totalWidth: number;
}

export function calculateVirtualViewport(input: VirtualViewportInput): VirtualViewport {
  const firstRow = clamp(
    Math.floor(input.scrollTop / input.rowHeight) - input.overscanRows,
    0,
    Math.max(0, input.rowCount - 1)
  );
  const lastRow = clamp(
    Math.ceil((input.scrollTop + input.viewportHeight) / input.rowHeight) + input.overscanRows,
    0,
    Math.max(0, input.rowCount - 1)
  );
  const firstColumn = clamp(
    Math.floor(input.scrollLeft / input.columnWidth) - input.overscanColumns,
    0,
    Math.max(0, input.columnCount - 1)
  );
  const lastColumn = clamp(
    Math.ceil((input.scrollLeft + input.viewportWidth) / input.columnWidth) + input.overscanColumns,
    0,
    Math.max(0, input.columnCount - 1)
  );
  const visibleRowCount = input.rowCount === 0 ? 0 : lastRow - firstRow + 1;
  const visibleColumnCount = input.columnCount === 0 ? 0 : lastColumn - firstColumn + 1;

  return {
    firstRow,
    lastRow,
    firstColumn,
    lastColumn,
    rowOffset: firstRow * input.rowHeight,
    columnOffset: firstColumn * input.columnWidth,
    visibleRowCount,
    visibleColumnCount,
    renderedCellCount: visibleRowCount * visibleColumnCount,
    totalHeight: input.rowCount * input.rowHeight,
    totalWidth: input.columnCount * input.columnWidth
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}
