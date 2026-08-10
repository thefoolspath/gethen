import type { CellChangeEvent, GridColumn } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./client-grid-engine.js";
import { createVirtualDomGridCell } from "./virtual-dom-grid-cell.js";
import { clamp, coerceValue, isTypeToEditKey } from "./virtual-dom-grid-values.js";
import { calculateVirtualViewport } from "./viewport.js";

export interface VirtualDomGridRenderMetrics {
  readonly renderedCellCount: number;
  readonly renderMs: number;
}

export interface VirtualDomGridSelection {
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly rowId: string;
  readonly columnId: string;
}

export interface VirtualDomGridOptions {
  readonly columns: readonly GridColumn[];
  readonly rows: readonly GridRow[];
  readonly rowHeight?: number;
  readonly columnWidth?: number;
  readonly overscanRows?: number;
  readonly overscanColumns?: number;
  readonly onRender?: (metrics: VirtualDomGridRenderMetrics) => void;
  readonly onSelectionChange?: (selection: VirtualDomGridSelection) => void;
  readonly onCellChange?: (change: CellChangeEvent) => void;
}

export interface VirtualDomGrid {
  readonly element: HTMLElement;
  destroy(): void;
  render(): void;
}

export function mountVirtualDomGrid(container: HTMLElement, options: VirtualDomGridOptions): VirtualDomGrid {
  const grid = document.createElement("div");
  const spacer = document.createElement("div");
  const viewport = document.createElement("div");
  const rowHeight = options.rowHeight ?? 32;
  const columnWidth = options.columnWidth ?? 132;
  const overscanRows = options.overscanRows ?? 6;
  const overscanColumns = options.overscanColumns ?? 2;
  const rows = options.rows.map((row) => ({
    id: row.id,
    cells: { ...row.cells }
  }));
  const activeCell = {
    rowIndex: 0,
    columnIndex: 0
  };
  let editState: { rowIndex: number; columnIndex: number; draftValue: string } | null = null;
  let animationFrame = 0;

  grid.setAttribute("role", "grid");
  grid.setAttribute("tabindex", "0");
  grid.setAttribute("aria-rowcount", String(rows.length));
  grid.setAttribute("aria-colcount", String(options.columns.length));
  grid.setAttribute("aria-activedescendant", "gethen-active-cell");
  grid.style.position = "relative";
  grid.style.overflow = "auto";
  grid.style.width = "100%";
  grid.style.height = "100%";

  spacer.style.position = "absolute";
  spacer.style.inset = "0 auto auto 0";
  spacer.style.width = `${options.columns.length * columnWidth}px`;
  spacer.style.height = `${rows.length * rowHeight}px`;

  viewport.style.position = "absolute";
  viewport.style.inset = "0 auto auto 0";

  grid.append(spacer, viewport);
  container.replaceChildren(grid);

  function render(): void {
    animationFrame = 0;
    const started = performance.now();
    const virtualViewport = calculateVirtualViewport({
      rowCount: rows.length,
      columnCount: options.columns.length,
      rowHeight,
      columnWidth,
      viewportHeight: grid.clientHeight,
      viewportWidth: grid.clientWidth,
      scrollTop: grid.scrollTop,
      scrollLeft: grid.scrollLeft,
      overscanRows,
      overscanColumns
    });
    const fragment = document.createDocumentFragment();

    viewport.replaceChildren();
    viewport.style.transform = `translate(${virtualViewport.columnOffset}px, ${virtualViewport.rowOffset}px)`;
    const cellInput = {
      rowHeight,
      columnWidth,
      firstRenderedRow: virtualViewport.firstRow,
      firstRenderedColumn: virtualViewport.firstColumn,
      commitEdit: handleEditorCommit,
      cancelEdit: handleEditorCancel
    };

    for (let rowIndex = virtualViewport.firstRow; rowIndex <= virtualViewport.lastRow; rowIndex += 1) {
      const row = rows[rowIndex];

      if (!row) {
        continue;
      }

      for (
        let columnIndex = virtualViewport.firstColumn;
        columnIndex <= virtualViewport.lastColumn;
        columnIndex += 1
      ) {
        const column = options.columns[columnIndex];

        if (!column) {
          continue;
        }

        fragment.appendChild(
          createVirtualDomGridCell(
            cellInput,
            row,
            column,
            rowIndex,
            columnIndex,
            rowIndex === activeCell.rowIndex && columnIndex === activeCell.columnIndex,
            editState?.rowIndex === rowIndex && editState.columnIndex === columnIndex,
            editState?.draftValue ?? ""
          )
        );
      }
    }

    viewport.appendChild(fragment);
    options.onRender?.({
      renderedCellCount: virtualViewport.renderedCellCount,
      renderMs: performance.now() - started
    });
  }

  function scheduleRender(): void {
    if (animationFrame !== 0) {
      return;
    }

    animationFrame = requestAnimationFrame(render);
  }

  function setActiveCell(rowIndex: number, columnIndex: number): void {
    activeCell.rowIndex = clamp(rowIndex, 0, Math.max(0, rows.length - 1));
    activeCell.columnIndex = clamp(columnIndex, 0, Math.max(0, options.columns.length - 1));
    scrollActiveCellIntoView();
    options.onSelectionChange?.({
      rowIndex: activeCell.rowIndex,
      columnIndex: activeCell.columnIndex,
      rowId: rows[activeCell.rowIndex]?.id ?? "",
      columnId: options.columns[activeCell.columnIndex]?.id ?? ""
    });
    render();
  }

  function scrollActiveCellIntoView(): void {
    const left = activeCell.columnIndex * columnWidth;
    const top = activeCell.rowIndex * rowHeight;
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

  function handleKeyDown(event: KeyboardEvent): void {
    if (editState) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex + 1, activeCell.columnIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex - 1, activeCell.columnIndex);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex, activeCell.columnIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex, activeCell.columnIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex, 0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex, options.columns.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      startEdit();
    } else if (event.key === " " && options.columns[activeCell.columnIndex]?.dataType === "boolean") {
      event.preventDefault();
      toggleBooleanCell();
    } else if (isTypeToEditKey(event)) {
      const column = options.columns[activeCell.columnIndex];

      if (column && !column.readonly && column.dataType !== "boolean") {
        event.preventDefault();
        startEdit(event.key);
      }
    }
  }

  function handleClick(event: MouseEvent): void {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const cell = target.closest<HTMLElement>("[data-row-index][data-column-index]");
    const rowIndex = Number(cell?.dataset.rowIndex);
    const columnIndex = Number(cell?.dataset.columnIndex);

    if (Number.isInteger(rowIndex) && Number.isInteger(columnIndex)) {
      grid.focus();

      if (rowIndex !== activeCell.rowIndex || columnIndex !== activeCell.columnIndex) {
        setActiveCell(rowIndex, columnIndex);
      }

      if (event.detail === 2) {
        startEdit();
      }
    }
  }

  function startEdit(initialDraftValue?: string): void {
    const column = options.columns[activeCell.columnIndex];
    const row = rows[activeCell.rowIndex];

    if (!column || !row || column.readonly) {
      return;
    }

    if (column.dataType === "boolean") {
      toggleBooleanCell();
      return;
    }

    editState = {
      rowIndex: activeCell.rowIndex,
      columnIndex: activeCell.columnIndex,
      draftValue: initialDraftValue ?? String(row.cells[column.id] ?? "")
    };
    render();
    const editor = viewport.querySelector<HTMLInputElement>("[data-gethen-editor='true']");
    editor?.focus();

    if (initialDraftValue === undefined) {
      editor?.select();
    }
  }

  function handleEditorCommit(value: string): void {
    if (!editState) {
      return;
    }

    commitValue(editState.rowIndex, editState.columnIndex, value);
    editState = null;
    grid.focus();
    render();
  }

  function handleEditorCancel(): void {
    editState = null;
    grid.focus();
    render();
  }

  function toggleBooleanCell(): void {
    const column = options.columns[activeCell.columnIndex];
    const row = rows[activeCell.rowIndex];

    if (!column || !row || column.readonly) {
      return;
    }

    commitValue(activeCell.rowIndex, activeCell.columnIndex, !(row.cells[column.id] === true));
    render();
  }

  function commitValue(rowIndex: number, columnIndex: number, rawValue: string | boolean): void {
    const column = options.columns[columnIndex];
    const row = rows[rowIndex];

    if (!column || !row || column.readonly) {
      return;
    }

    const oldValue = row.cells[column.id] ?? null;
    const newValue = coerceValue(rawValue, column.dataType);

    row.cells[column.id] = newValue;
    options.onCellChange?.({
      rowId: row.id,
      columnId: column.id,
      oldValue,
      newValue
    });
  }

  grid.addEventListener("scroll", scheduleRender);
  grid.addEventListener("keydown", handleKeyDown);
  grid.addEventListener("click", handleClick);
  window.addEventListener("resize", scheduleRender);
  render();

  return {
    element: grid,
    destroy() {
      if (animationFrame !== 0) {
        cancelAnimationFrame(animationFrame);
      }

      grid.removeEventListener("scroll", scheduleRender);
      grid.removeEventListener("keydown", handleKeyDown);
      grid.removeEventListener("click", handleClick);
      window.removeEventListener("resize", scheduleRender);
      container.replaceChildren();
    },
    render
  };
}
