import type { CellChangeEvent } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./client-grid-engine.js";
import type { GridClipboardOptions, GridPasteResult } from "./grid-clipboard.js";
import { prepareGridPaste } from "./grid-clipboard.js";
import type { GridColumnView, GridStylingOptions, VirtualDomGridTheme } from "./grid-customization.js";
import { getVisibleColumns } from "./grid-customization.js";
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

export interface VirtualDomGridSelectionRange {
  readonly anchor: VirtualDomGridSelection;
  readonly focus: VirtualDomGridSelection;
  readonly startRowIndex: number;
  readonly endRowIndex: number;
  readonly startColumnIndex: number;
  readonly endColumnIndex: number;
}

export interface VirtualDomGridOptions<TRow extends GridRow = GridRow> {
  readonly columns: readonly GridColumnView<TRow>[];
  readonly rows: readonly TRow[];
  readonly rowHeight?: number;
  readonly columnWidth?: number;
  readonly overscanRows?: number;
  readonly overscanColumns?: number;
  readonly styling?: GridStylingOptions<TRow>;
  readonly theme?: VirtualDomGridTheme;
  readonly clipboard?: GridClipboardOptions<TRow>;
  readonly onRender?: (metrics: VirtualDomGridRenderMetrics) => void;
  readonly onSelectionChange?: (selection: VirtualDomGridSelection) => void;
  readonly onSelectionRangeChange?: (selection: VirtualDomGridSelectionRange) => void;
  readonly onCellChange?: (change: CellChangeEvent) => void;
  readonly onPaste?: (result: GridPasteResult) => void;
}

export interface VirtualDomGrid {
  readonly element: HTMLElement;
  destroy(): void;
  render(): void;
}

export function mountVirtualDomGrid<TRow extends GridRow>(
  container: HTMLElement,
  options: VirtualDomGridOptions<TRow>
): VirtualDomGrid {
  const grid = document.createElement("div");
  const spacer = document.createElement("div");
  const viewport = document.createElement("div");
  const rowHeight = options.rowHeight ?? 32;
  const columnWidth = options.columnWidth ?? 132;
  const overscanRows = options.overscanRows ?? 6;
  const overscanColumns = options.overscanColumns ?? 2;
  const columns = getVisibleColumns(options.columns);
  const rows = options.rows.map((row) => ({
    ...row,
    cells: { ...row.cells }
  })) as TRow[];
  const activeCell = {
    rowIndex: 0,
    columnIndex: 0
  };
  const anchorCell = {
    rowIndex: 0,
    columnIndex: 0
  };
  let editState: { rowIndex: number; columnIndex: number; draftValue: string } | null = null;
  let animationFrame = 0;

  grid.setAttribute("role", "grid");
  grid.setAttribute("tabindex", "0");
  grid.setAttribute("aria-rowcount", String(rows.length));
  grid.setAttribute("aria-colcount", String(columns.length));
  grid.setAttribute("aria-activedescendant", "gethen-active-cell");
  grid.style.position = "relative";
  grid.style.overflow = "auto";
  grid.style.width = "100%";
  grid.style.height = "100%";
  applyTheme(grid, options.theme);

  spacer.style.position = "absolute";
  spacer.style.inset = "0 auto auto 0";
  spacer.style.width = `${columns.length * columnWidth}px`;
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
      columnCount: columns.length,
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
      cancelEdit: handleEditorCancel,
      styling: options.styling
    };

    for (let rowIndex = virtualViewport.firstRow; rowIndex <= virtualViewport.lastRow; rowIndex += 1) {
      const row = rows[rowIndex];

      if (!row) {
        continue;
      }

      const rowClass = options.styling?.getRowClass?.({ row, rowId: row.id, rowIndex });

      for (
        let columnIndex = virtualViewport.firstColumn;
        columnIndex <= virtualViewport.lastColumn;
        columnIndex += 1
      ) {
        const column = columns[columnIndex];

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
            rowClass,
            rowIndex === activeCell.rowIndex && columnIndex === activeCell.columnIndex,
            isCellSelected(rowIndex, columnIndex),
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

  function setActiveCell(rowIndex: number, columnIndex: number, extendRange = false): void {
    const nextRowIndex = clamp(rowIndex, 0, Math.max(0, rows.length - 1));
    const nextColumnIndex = clamp(columnIndex, 0, Math.max(0, columns.length - 1));

    if (!extendRange) {
      anchorCell.rowIndex = nextRowIndex;
      anchorCell.columnIndex = nextColumnIndex;
    }

    activeCell.rowIndex = nextRowIndex;
    activeCell.columnIndex = nextColumnIndex;
    scrollActiveCellIntoView();
    const focus = getSelectionAt(activeCell.rowIndex, activeCell.columnIndex);
    options.onSelectionChange?.(focus);
    options.onSelectionRangeChange?.(createSelectionRange(focus));
    render();
  }

  function getSelectionAt(rowIndex: number, columnIndex: number): VirtualDomGridSelection {
    return {
      rowIndex,
      columnIndex,
      rowId: rows[rowIndex]?.id ?? "",
      columnId: columns[columnIndex]?.id ?? ""
    };
  }

  function createSelectionRange(focus: VirtualDomGridSelection): VirtualDomGridSelectionRange {
    return {
      anchor: getSelectionAt(anchorCell.rowIndex, anchorCell.columnIndex),
      focus,
      startRowIndex: Math.min(anchorCell.rowIndex, activeCell.rowIndex),
      endRowIndex: Math.max(anchorCell.rowIndex, activeCell.rowIndex),
      startColumnIndex: Math.min(anchorCell.columnIndex, activeCell.columnIndex),
      endColumnIndex: Math.max(anchorCell.columnIndex, activeCell.columnIndex)
    };
  }

  function isCellSelected(rowIndex: number, columnIndex: number): boolean {
    return rowIndex >= Math.min(anchorCell.rowIndex, activeCell.rowIndex)
      && rowIndex <= Math.max(anchorCell.rowIndex, activeCell.rowIndex)
      && columnIndex >= Math.min(anchorCell.columnIndex, activeCell.columnIndex)
      && columnIndex <= Math.max(anchorCell.columnIndex, activeCell.columnIndex);
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
      setActiveCell(activeCell.rowIndex + 1, activeCell.columnIndex, event.shiftKey);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex - 1, activeCell.columnIndex, event.shiftKey);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex, activeCell.columnIndex + 1, event.shiftKey);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex, activeCell.columnIndex - 1, event.shiftKey);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex, 0, event.shiftKey);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex, columns.length - 1, event.shiftKey);
    } else if (event.key === "Enter") {
      event.preventDefault();
      startEdit();
    } else if (event.key === " " && columns[activeCell.columnIndex]?.dataType === "boolean") {
      event.preventDefault();
      toggleBooleanCell();
    } else if (isTypeToEditKey(event)) {
      const column = columns[activeCell.columnIndex];

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
      setActiveCell(rowIndex, columnIndex, event.shiftKey);

      if (event.detail === 2) {
        startEdit();
      }
    }
  }

  function handlePaste(event: ClipboardEvent): void {
    const pasteMode = options.clipboard?.pasteMode ?? "direct-and-dialog";

    if (!options.clipboard?.enabled || pasteMode === "dialog") {
      return;
    }

    event.preventDefault();
    const startRowIndex = activeCell.rowIndex;
    const startColumnIndex = activeCell.columnIndex;
    const result = prepareGridPaste({
      text: event.clipboardData?.getData("text/plain") ?? "",
      startRowIndex,
      startColumnIndex,
      rows,
      columns,
      clipboard: options.clipboard
    });

    if (result.committed) {
      for (const change of result.changes) {
        const row = rows[change.rowIndex];

        if (!row) {
          continue;
        }

        (row.cells as Record<string, CellChangeEvent["newValue"]>)[change.columnId] = change.newValue;
        options.onCellChange?.({
          rowId: change.rowId,
          columnId: change.columnId,
          oldValue: change.oldValue,
          newValue: change.newValue
        });
      }

      anchorCell.rowIndex = startRowIndex;
      anchorCell.columnIndex = startColumnIndex;
      setActiveCell(
        startRowIndex + result.rowCount - 1,
        startColumnIndex + result.columnCount - 1,
        true
      );
    }

    options.onPaste?.(result);
  }

  function startEdit(initialDraftValue?: string): void {
    const column = columns[activeCell.columnIndex];
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
    const column = columns[activeCell.columnIndex];
    const row = rows[activeCell.rowIndex];

    if (!column || !row || column.readonly) {
      return;
    }

    commitValue(activeCell.rowIndex, activeCell.columnIndex, !(row.cells[column.id] === true));
    render();
  }

  function commitValue(rowIndex: number, columnIndex: number, rawValue: string | boolean): void {
    const column = columns[columnIndex];
    const row = rows[rowIndex];

    if (!column || !row || column.readonly) {
      return;
    }

    const oldValue = row.cells[column.id] ?? null;
    const newValue = coerceValue(rawValue, column.dataType);

    (row.cells as Record<string, CellChangeEvent["newValue"]>)[column.id] = newValue;
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
  grid.addEventListener("paste", handlePaste);
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
      grid.removeEventListener("paste", handlePaste);
      window.removeEventListener("resize", scheduleRender);
      container.replaceChildren();
    },
    render
  };
}

function applyTheme(grid: HTMLElement, theme: VirtualDomGridTheme | undefined): void {
  const variables: ReadonlyArray<readonly [string, string | undefined]> = [
    ["--gethen-background", theme?.background],
    ["--gethen-text-color", theme?.textColor],
    ["--gethen-grid-line-color", theme?.gridLineColor],
    ["--gethen-active-cell-border", theme?.activeCellBorder],
    ["--gethen-active-cell-background", theme?.activeCellBackground],
    ["--gethen-selection-background", theme?.selectionBackground],
    ["--gethen-cell-padding", theme?.cellPadding],
    ["--gethen-font-family", theme?.fontFamily],
    ["--gethen-font-size", theme?.fontSize]
  ];

  for (const [name, value] of variables) {
    if (value !== undefined) {
      grid.style.setProperty(name, value);
    }
  }
}
