import type { CellChangeEvent } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "../../contracts/grid-types.js";
import type { GridClipboardOptions, GridPasteResult } from "../../state/grid-clipboard.js";
import { prepareGridPaste } from "../../state/grid-clipboard.js";
import type { GridColumnView, GridStylingOptions, VirtualDomGridTheme } from "./grid-customization.js";
import { getVisibleColumns, resolveGridClassNames } from "./grid-customization.js";
import type { GridCellEditor, GridEditorSnapshot, GridValidationResult } from "../../state/grid-editing.js";
import { createGridEditorStateMachine } from "../../state/grid-editing.js";
import type { GridHistoryEvent, GridHistoryOptions } from "../../state/grid-history.js";
import type { GridRowNumberOptions, GridStatusBarOptions } from "./grid-shell.js";
import { formatGridStatus } from "./grid-shell.js";
import { createGridHistory, invertCellChange } from "../../state/grid-history.js";
import type { GridLayoutEvent, GridLayoutState } from "../../state/grid-layout.js";
import {
  applyGridLayoutState,
  freezeGridPanes,
  getGridColumnOffsets,
  getGridLayoutWidth,
  reorderGridColumn,
  resizeGridColumn
} from "../../state/grid-layout.js";
import { createVirtualDomGridCell } from "./virtual-dom-grid-cell.js";
import { clamp, isTypeToEditKey } from "./virtual-dom-grid-values.js";

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
  readonly showColumnHeaders?: boolean;
  readonly rowNumbers?: boolean | GridRowNumberOptions;
  readonly statusBar?: false | GridStatusBarOptions;
  readonly pinnedBottomRows?: readonly TRow[];
  readonly clipboard?: GridClipboardOptions<TRow>;
  readonly layoutState?: GridLayoutState;
  readonly frozenRowCount?: number;
  readonly frozenColumnCount?: number;
  readonly history?: GridHistoryOptions | false;
  readonly onRender?: (metrics: VirtualDomGridRenderMetrics) => void;
  readonly onSelectionChange?: (selection: VirtualDomGridSelection) => void;
  readonly onSelectionRangeChange?: (selection: VirtualDomGridSelectionRange) => void;
  readonly onCellChange?: (change: CellChangeEvent) => void;
  readonly onPaste?: (result: GridPasteResult) => void;
  readonly onLayoutChange?: (event: GridLayoutEvent) => void;
  readonly onHistoryChange?: (event: GridHistoryEvent<CellChangeEvent>) => void;
  readonly onEditorStateChange?: (state: GridEditorSnapshot) => void;
}

export interface VirtualDomGrid {
  readonly element: HTMLElement;
  destroy(): void;
  render(): void;
  setTheme(theme: VirtualDomGridTheme | undefined): void;
  getLayoutState(): GridLayoutState;
  applyLayoutState(state: GridLayoutState): void;
  resizeColumn(columnId: string, width: number): void;
  reorderColumn(columnId: string, targetIndex: number): void;
  freezePanes(frozenRowCount: number, frozenColumnCount: number): void;
  undo(): readonly CellChangeEvent[];
  redo(): readonly CellChangeEvent[];
}

export function mountVirtualDomGrid<TRow extends GridRow>(
  container: HTMLElement,
  options: VirtualDomGridOptions<TRow>
): VirtualDomGrid {
  const grid = document.createElement("div");
  const spacer = document.createElement("div");
  const viewport = document.createElement("div");
  const density = options.theme?.density ?? "comfortable";
  const densityDefaults = getDensityDefaults(density);
  const rowHeight = options.rowHeight ?? cssPixelValue(options.theme?.rowHeight, densityDefaults.rowHeight);
  const columnWidth = options.columnWidth ?? densityDefaults.columnWidth;
  const showColumnHeaders = options.showColumnHeaders !== false;
  const rowNumberOptions = typeof options.rowNumbers === "object" ? options.rowNumbers : undefined;
  const showRowNumbers = options.rowNumbers !== false && rowNumberOptions?.visible !== false;
  const showStatusBar = options.statusBar !== false && options.statusBar?.visible !== false;
  const headerHeight = showColumnHeaders
    ? cssPixelValue(options.theme?.headerHeight, densityDefaults.headerHeight)
    : 0;
  const rowNumberWidth = showRowNumbers
    ? rowNumberOptions?.width ?? cssPixelValue(options.theme?.rowNumberWidth, densityDefaults.rowNumberWidth)
    : 0;
  const statusHeight = showStatusBar
    ? cssPixelValue(options.theme?.statusHeight, densityDefaults.statusHeight)
    : 0;
  const overscanRows = options.overscanRows ?? 6;
  const overscanColumns = options.overscanColumns ?? 2;
  const sourceColumns = getVisibleColumns(options.columns);
  const rows = options.rows.map((row) => ({
    ...row,
    cells: { ...row.cells }
  })) as TRow[];
  const pinnedBottomRows = (options.pinnedBottomRows ?? []).map((row) => ({
    ...row,
    cells: { ...row.cells }
  })) as TRow[];
  const pinnedHeight = pinnedBottomRows.length * rowHeight;
  let layoutState = applyGridLayoutState({
    columnIds: sourceColumns.map((column) => column.id),
    defaultColumnWidth: columnWidth,
    ...(options.frozenRowCount === undefined ? {} : { frozenRowCount: options.frozenRowCount }),
    ...(options.frozenColumnCount === undefined ? {} : { frozenColumnCount: options.frozenColumnCount }),
    rowCount: rows.length,
    ...(options.layoutState ? { state: options.layoutState } : {})
  });
  let columns = orderColumns(sourceColumns, layoutState);
  const history = options.history === false ? undefined : createGridHistory(options.history);
  const editorState = createGridEditorStateMachine();
  let editorAbortController = new AbortController();
  let mountedLifecycles: Array<() => void> = [];
  let requestActiveEditorCommit: (() => Promise<boolean>) | undefined;
  const activeCell = {
    rowIndex: 0,
    columnIndex: 0
  };
  const anchorCell = {
    rowIndex: 0,
    columnIndex: 0
  };
  let editState: { rowIndex: number; columnIndex: number; draftValue: CellChangeEvent["newValue"] } | null = null;
  let animationFrame = 0;

  grid.setAttribute("role", "grid");
  grid.setAttribute("tabindex", "0");
  grid.setAttribute("aria-rowcount", String(rows.length + pinnedBottomRows.length + (showColumnHeaders ? 1 : 0)));
  grid.setAttribute("aria-colcount", String(columns.length + (showRowNumbers ? 1 : 0)));
  if (rows.length > 0 && columns.length > 0) {
    grid.setAttribute("aria-activedescendant", "gethen-active-cell");
  }
  grid.style.position = "relative";
  grid.style.overflow = "auto";
  grid.style.width = "100%";
  grid.style.height = "100%";
  grid.style.border = "1px solid var(--gethen-grid-line-color, #d8e0e8)";
  grid.style.borderRadius = "6px";
  grid.style.background = "var(--gethen-background, #ffffff)";
  grid.style.color = "var(--gethen-text-color, #17212b)";
  grid.style.fontFamily = "var(--gethen-font-family, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)";
  grid.style.fontSize = "var(--gethen-font-size, 13px)";
  applyGridTheme(grid, options.theme);

  spacer.style.position = "absolute";
  spacer.style.inset = "0 auto auto 0";
  spacer.style.width = `${rowNumberWidth + getGridLayoutWidth(layoutState)}px`;
  spacer.style.height = `${headerHeight + rows.length * rowHeight + pinnedHeight + statusHeight}px`;

  viewport.style.position = "absolute";
  viewport.style.inset = "0 auto auto 0";
  viewport.style.width = spacer.style.width;
  viewport.style.height = spacer.style.height;

  grid.append(spacer, viewport);
  container.replaceChildren(grid);
  const unsubscribeEditor = editorState.subscribe((state) => options.onEditorStateChange?.(state));
  const unsubscribeHistory = history?.subscribe((event) => options.onHistoryChange?.(event));

  function render(): void {
    animationFrame = 0;
    const started = performance.now();
    destroyMountedLifecycles();
    requestActiveEditorCommit = undefined;
    const columnOffsets = getGridColumnOffsets(layoutState);
    const rowIndexes = getRenderedRowIndexes(
      rows.length,
      rowHeight,
      Math.max(0, grid.scrollTop - headerHeight),
      Math.max(rowHeight, grid.clientHeight - headerHeight - pinnedHeight - statusHeight),
      layoutState.frozenRowCount,
      overscanRows
    );
    const columnIndexes = getRenderedColumnIndexes(
      layoutState,
      columnOffsets,
      Math.max(0, grid.scrollLeft - rowNumberWidth),
      Math.max(columnWidth, grid.clientWidth - rowNumberWidth),
      overscanColumns
    );
    const fragment = document.createDocumentFragment();

    viewport.replaceChildren();
    appendColumnHeaders(fragment, columnIndexes, columnOffsets);
    appendRowNumberCorner(fragment);
    appendEmptyState(fragment);
    for (const rowIndex of rowIndexes) {
      const row = rows[rowIndex];

      if (!row) {
        continue;
      }

      const rowClass = options.styling?.getRowClass?.({ row, rowId: row.id, rowIndex });

      for (const columnIndex of columnIndexes) {
        const column = columns[columnIndex];

        if (!column) {
          continue;
        }

        const frozenRow = rowIndex < layoutState.frozenRowCount;
        const frozenColumn = columnIndex < layoutState.frozenColumnCount;
        const cellInput = {
          rowHeight,
          columnWidth: layoutState.columns[columnIndex]!.width,
          left: rowNumberWidth + columnOffsets[columnIndex]! + (frozenColumn ? grid.scrollLeft : 0),
          top: headerHeight + rowIndex * rowHeight + (frozenRow ? grid.scrollTop : 0),
          frozenRow,
          frozenColumn,
          ariaRowOffset: showColumnHeaders ? 1 : 0,
          ariaColumnOffset: showRowNumbers ? 1 : 0,
          commitEdit: (
            value: CellChangeEvent["newValue"],
            editor?: GridCellEditor<TRow>,
            navigation?: "next" | "previous"
          ) => handleEditorCommit(value, editor, navigation),
          cancelEdit: (editor?: GridCellEditor<TRow>) => {
            void handleEditorCancel(editor);
          },
          styling: options.styling,
          editorSignal: editorAbortController.signal,
          registerLifecycle: (destroy: () => void) => mountedLifecycles.push(destroy),
          registerEditorCommit: (commit: () => Promise<boolean>) => {
            requestActiveEditorCommit = commit;
          }
        };
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
            editState?.draftValue ?? null
          )
        );
      }
      appendRowNumber(fragment, row, rowIndex, rowIndex < layoutState.frozenRowCount);
    }

    appendPinnedBottomRows(fragment, columnIndexes, columnOffsets);
    appendStatusBar(fragment);
    viewport.appendChild(fragment);
    options.onRender?.({
      renderedCellCount: rowIndexes.length * columnIndexes.length,
      renderMs: performance.now() - started
    });
    if (editorState.snapshot.phase === "suspended") {
      editorState.resumeAfterScroll();
    }
  }

  function appendColumnHeaders(
    fragment: DocumentFragment,
    columnIndexes: readonly number[],
    columnOffsets: readonly number[]
  ): void {
    if (!showColumnHeaders) return;
    for (const columnIndex of columnIndexes) {
      const column = columns[columnIndex];
      const layoutColumn = layoutState.columns[columnIndex];
      if (!column || !layoutColumn) continue;
      const frozenColumn = columnIndex < layoutState.frozenColumnCount;
      const header = document.createElement("div");
      header.setAttribute("role", "columnheader");
      header.setAttribute("aria-rowindex", "1");
      header.setAttribute("aria-colindex", String(columnIndex + 1 + (showRowNumbers ? 1 : 0)));
      header.dataset.columnIndex = String(columnIndex);
      header.textContent = column.title;
      header.title = column.title;
      header.classList.add(...resolveGridClassNames(
        column.headerClassName,
        options.styling?.getHeaderClass?.({ column, columnIndex })
      ));
      Object.assign(header.style, {
        position: "absolute",
        left: `${rowNumberWidth + columnOffsets[columnIndex]! + (frozenColumn ? grid.scrollLeft : 0)}px`,
        top: `${grid.scrollTop}px`,
        width: `${layoutColumn.width}px`,
        height: `${headerHeight}px`,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        padding: "var(--gethen-header-padding, 0 10px)",
        borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
        borderBottom: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
        background: "var(--gethen-header-background, #f3f6f9)",
        color: "var(--gethen-header-text-color, #344054)",
        fontWeight: "650",
        zIndex: frozenColumn ? "9" : "8"
      });
      fragment.appendChild(header);
    }
  }

  function appendRowNumberCorner(fragment: DocumentFragment): void {
    if (!showRowNumbers || !showColumnHeaders) return;
    const corner = document.createElement("div");
    corner.setAttribute("role", "columnheader");
    corner.setAttribute("aria-label", "Row numbers");
    corner.setAttribute("aria-rowindex", "1");
    corner.setAttribute("aria-colindex", "1");
    Object.assign(corner.style, {
      position: "absolute",
      left: `${grid.scrollLeft}px`,
      top: `${grid.scrollTop}px`,
      width: `${rowNumberWidth}px`,
      height: `${headerHeight}px`,
      borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
      borderBottom: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
      background: "var(--gethen-row-number-background, #eef2f6)",
      zIndex: "10"
    });
    fragment.appendChild(corner);
  }

  function appendRowNumber(
    fragment: DocumentFragment,
    row: TRow,
    rowIndex: number,
    frozenRow: boolean
  ): void {
    if (!showRowNumbers) return;
    const rowHeader = document.createElement("div");
    const isGroup = "kind" in row && row.kind === "group";
    rowHeader.setAttribute("role", "rowheader");
    rowHeader.setAttribute("aria-rowindex", String(rowIndex + 1 + (showColumnHeaders ? 1 : 0)));
    rowHeader.setAttribute("aria-colindex", "1");
    rowHeader.textContent = isGroup ? "" : String(rowIndex + 1);
    rowHeader.title = isGroup ? "Group row" : `Row ${rowIndex + 1}`;
    Object.assign(rowHeader.style, {
      position: "absolute",
      left: `${grid.scrollLeft}px`,
      top: `${headerHeight + rowIndex * rowHeight + (frozenRow ? grid.scrollTop : 0)}px`,
      width: `${rowNumberWidth}px`,
      height: `${rowHeight}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "0 10px",
      borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
      borderBottom: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
      background: "var(--gethen-row-number-background, #f7f9fb)",
      color: "var(--gethen-row-number-text-color, #667085)",
      fontVariantNumeric: "tabular-nums",
      userSelect: "none",
      zIndex: frozenRow ? "7" : "6"
    });
    fragment.appendChild(rowHeader);
  }

  function appendEmptyState(fragment: DocumentFragment): void {
    if (rows.length > 0 && columns.length > 0) return;
    const empty = document.createElement("div");
    empty.dataset.gethenEmptyState = "true";
    empty.textContent = columns.length === 0 ? "No visible columns" : "No rows to display";
    Object.assign(empty.style, {
      position: "absolute",
      left: `${grid.scrollLeft}px`,
      top: `${grid.scrollTop + headerHeight}px`,
      width: `${grid.clientWidth}px`,
      height: `${Math.max(80, grid.clientHeight - headerHeight - statusHeight)}px`,
      display: "grid",
      placeItems: "center",
      color: "var(--gethen-readonly-text-color, #667085)",
      background: "var(--gethen-background, #ffffff)",
      zIndex: "5"
    });
    fragment.appendChild(empty);
  }

  function appendPinnedBottomRows(
    fragment: DocumentFragment,
    columnIndexes: readonly number[],
    columnOffsets: readonly number[]
  ): void {
    if (pinnedBottomRows.length === 0) return;
    const baseTop = grid.scrollTop + Math.max(headerHeight, grid.clientHeight - statusHeight - pinnedHeight);
    pinnedBottomRows.forEach((row, pinnedIndex) => {
      const ariaRowIndex = rows.length + pinnedIndex + 1 + (showColumnHeaders ? 1 : 0);
      if (showRowNumbers) {
        const label = document.createElement("div");
        label.setAttribute("role", "rowheader");
        label.setAttribute("aria-rowindex", String(ariaRowIndex));
        label.setAttribute("aria-colindex", "1");
        label.textContent = "Σ";
        label.title = "Pinned summary row";
        Object.assign(label.style, {
          position: "absolute",
          left: `${grid.scrollLeft}px`,
          top: `${baseTop + pinnedIndex * rowHeight}px`,
          width: `${rowNumberWidth}px`,
          height: `${rowHeight}px`,
          display: "grid",
          placeItems: "center",
          borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
          borderTop: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
          background: "var(--gethen-pinned-row-background, #eef4ff)",
          color: "var(--gethen-row-number-text-color, #667085)",
          fontWeight: "700",
          zIndex: "10"
        });
        fragment.appendChild(label);
      }
      for (const columnIndex of columnIndexes) {
        const column = columns[columnIndex];
        const layoutColumn = layoutState.columns[columnIndex];
        if (!column || !layoutColumn) continue;
        const frozenColumn = columnIndex < layoutState.frozenColumnCount;
        const cell = document.createElement("div");
        const context = {
          row,
          rowId: row.id,
          rowIndex: rows.length + pinnedIndex,
          column,
          columnIndex,
          value: row.cells[column.id]
        };
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-readonly", "true");
        cell.setAttribute("aria-rowindex", String(ariaRowIndex));
        cell.setAttribute("aria-colindex", String(columnIndex + 1 + (showRowNumbers ? 1 : 0)));
        cell.dataset.gethenPinnedBottom = "true";
        cell.textContent = column.formatter?.(context) ?? String(context.value ?? "");
        Object.assign(cell.style, {
          position: "absolute",
          left: `${rowNumberWidth + columnOffsets[columnIndex]! + (frozenColumn ? grid.scrollLeft : 0)}px`,
          top: `${baseTop + pinnedIndex * rowHeight}px`,
          width: `${layoutColumn.width}px`,
          height: `${rowHeight}px`,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          padding: "var(--gethen-cell-padding, 7px 10px)",
          borderRight: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
          borderTop: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
          background: "var(--gethen-pinned-row-background, #eef4ff)",
          color: "var(--gethen-text-color, #17212b)",
          fontWeight: "650",
          textAlign: column.align ?? "inherit",
          zIndex: frozenColumn ? "9" : "8"
        });
        fragment.appendChild(cell);
      }
    });
  }

  function appendStatusBar(fragment: DocumentFragment): void {
    if (!showStatusBar) return;
    const rowSpan = Math.abs(activeCell.rowIndex - anchorCell.rowIndex) + 1;
    const columnSpan = Math.abs(activeCell.columnIndex - anchorCell.columnIndex) + 1;
    const selectedCellCount = rows.length > 0 && columns.length > 0 ? rowSpan * columnSpan : 0;
    const status = document.createElement("div");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.dataset.gethenStatusBar = "true";
    status.textContent = formatGridStatus(rows.length, selectedCellCount, options.statusBar || undefined);
    Object.assign(status.style, {
      position: "absolute",
      left: `${grid.scrollLeft}px`,
      top: `${grid.scrollTop + Math.max(0, grid.clientHeight - statusHeight)}px`,
      width: `${grid.clientWidth}px`,
      height: `${statusHeight}px`,
      display: "flex",
      alignItems: "center",
      padding: "0 12px",
      borderTop: "1px solid var(--gethen-grid-line-color, #d8e0e8)",
      background: "var(--gethen-status-background, #f8fafc)",
      color: "var(--gethen-status-text-color, #475467)",
      fontSize: "12px",
      fontVariantNumeric: "tabular-nums",
      zIndex: "12"
    });
    fragment.appendChild(status);
  }

  function destroyMountedLifecycles(): void {
    for (const destroy of mountedLifecycles.splice(0)) {
      destroy();
    }
  }

  function scheduleRender(): void {
    if (animationFrame !== 0) {
      return;
    }

    if (editorState.snapshot.phase === "editing" || editorState.snapshot.phase === "failed") {
      editorState.suspendForScroll();
    }
    animationFrame = requestAnimationFrame(render);
  }

  function setActiveCell(rowIndex: number, columnIndex: number, extendRange = false): void {
    if (rows.length === 0 || columns.length === 0) return;
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
    const offsets = getGridColumnOffsets(layoutState);
    const left = rowNumberWidth + (offsets[activeCell.columnIndex] ?? 0);
    const top = headerHeight + activeCell.rowIndex * rowHeight;
    const right = left + (layoutState.columns[activeCell.columnIndex]?.width ?? columnWidth);
    const bottom = top + rowHeight;
    const frozenWidth = rowNumberWidth + layoutState.columns
      .slice(0, layoutState.frozenColumnCount)
      .reduce((total, column) => total + column.width, 0);
    const frozenHeight = headerHeight + layoutState.frozenRowCount * rowHeight;
    const bottomInset = pinnedHeight + statusHeight;

    if (activeCell.columnIndex >= layoutState.frozenColumnCount && left < grid.scrollLeft + frozenWidth) {
      grid.scrollLeft = Math.max(0, left - frozenWidth);
    } else if (right > grid.scrollLeft + grid.clientWidth) {
      grid.scrollLeft = right - grid.clientWidth;
    }

    if (activeCell.rowIndex >= layoutState.frozenRowCount && top < grid.scrollTop + frozenHeight) {
      grid.scrollTop = Math.max(0, top - frozenHeight);
    } else if (bottom > grid.scrollTop + grid.clientHeight - bottomInset) {
      grid.scrollTop = bottom - grid.clientHeight + bottomInset;
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof Element && event.target.closest("[data-gethen-editor-host='true']")) {
      return;
    }
    if (editState) {
      return;
    }
    if (rows.length === 0 || columns.length === 0) {
      return;
    }

    const commandKey = event.ctrlKey || event.metaKey;
    if (commandKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
    } else if (commandKey && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    } else if (event.key === "ArrowDown") {
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

  async function handleClick(event: MouseEvent): Promise<void> {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest("[data-gethen-editor-host='true']")) {
      return;
    }

    const cell = target.closest<HTMLElement>("[data-row-index][data-column-index]");
    const rowIndex = Number(cell?.dataset.rowIndex);
    const columnIndex = Number(cell?.dataset.columnIndex);

    if (Number.isInteger(rowIndex) && Number.isInteger(columnIndex)) {
      if (editState && requestActiveEditorCommit) {
        const committed = await requestActiveEditorCommit();
        if (!committed) return;
      }
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
      const committedChanges: CellChangeEvent[] = [];
      for (const change of result.changes) {
        const row = rows[change.rowIndex];

        if (!row) {
          continue;
        }

        (row.cells as Record<string, CellChangeEvent["newValue"]>)[change.columnId] = change.newValue;
        const committedChange = {
          rowId: change.rowId,
          columnId: change.columnId,
          oldValue: change.oldValue,
          newValue: change.newValue
        };
        committedChanges.push(committedChange);
        options.onCellChange?.(committedChange);
      }
      history?.record({ kind: "paste", changes: committedChanges });

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

    const initialValue = row.cells[column.id] ?? null;
    editorAbortController.abort("replaced");
    editorAbortController = new AbortController();
    editState = {
      rowIndex: activeCell.rowIndex,
      columnIndex: activeCell.columnIndex,
      draftValue: initialDraftValue ?? initialValue
    };
    editorState.activate({
      rowId: row.id,
      columnId: column.id,
      initialValue,
      draftValue: editState.draftValue
    });
    render();
    const editor = viewport.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "[data-gethen-editor='true']"
    );
    editor?.focus();
    if (initialDraftValue === undefined && editor instanceof HTMLInputElement && editor.type !== "checkbox") {
      editor.select();
    }
  }

  async function handleEditorCommit(
    value: CellChangeEvent["newValue"],
    editor?: GridCellEditor<TRow>,
    navigation?: "next" | "previous"
  ): Promise<boolean> {
    if (!editState) {
      return false;
    }

    editState = { ...editState, draftValue: value };
    editorState.updateDraft(value);
    editorState.beginValidation();
    const column = columns[editState.columnIndex];
    const row = rows[editState.rowIndex];
    if (!column || !row) {
      editorState.validationFailed({ valid: false, message: "The edited cell is no longer available." });
      return false;
    }
    const context = {
      row,
      rowId: row.id,
      rowIndex: editState.rowIndex,
      column,
      columnIndex: editState.columnIndex,
      value
    };
    const editorValidation = editor ? await editor.validate(value) : { valid: true } as const;
    const validation: GridValidationResult = editorValidation.valid
      ? await (column.validate?.(value, context) ?? { valid: true })
      : editorValidation;
    if (!validation.valid) {
      editorState.validationFailed(validation);
      render();
      return false;
    }
    editorState.beginCommit();
    try {
      await editor?.commit(value);
      commitValue(editState.rowIndex, editState.columnIndex, value, "cell-edit");
      editorState.committed();
    } catch (error) {
      editorState.commitFailed(error instanceof Error ? error.message : "Editor commit failed.");
      render();
      return false;
    }
    editState = null;
    editorAbortController.abort("commit");
    if (navigation) {
      const delta = navigation === "next" ? 1 : -1;
      const linearIndex = activeCell.rowIndex * columns.length + activeCell.columnIndex + delta;
      const boundedIndex = clamp(linearIndex, 0, Math.max(0, rows.length * columns.length - 1));
      setActiveCell(Math.floor(boundedIndex / columns.length), boundedIndex % columns.length);
    } else {
      grid.focus();
      render();
    }
    return true;
  }

  async function handleEditorCancel(editor?: GridCellEditor<TRow>): Promise<void> {
    if (editorState.snapshot.phase !== "inactive") {
      editorState.beginCancel();
      await editor?.cancel();
      editorState.cancelled();
    }
    editState = null;
    editorAbortController.abort("cancel");
    grid.focus();
    render();
  }

  function toggleBooleanCell(): void {
    const column = columns[activeCell.columnIndex];
    const row = rows[activeCell.rowIndex];

    if (!column || !row || column.readonly) {
      return;
    }

    commitValue(activeCell.rowIndex, activeCell.columnIndex, !(row.cells[column.id] === true), "cell-edit");
    render();
  }

  function commitValue(
    rowIndex: number,
    columnIndex: number,
    newValue: CellChangeEvent["newValue"],
    kind: "cell-edit" | "paste"
  ): void {
    const column = columns[columnIndex];
    const row = rows[rowIndex];

    if (!column || !row || column.readonly) {
      return;
    }

    const oldValue = row.cells[column.id] ?? null;
    (row.cells as Record<string, CellChangeEvent["newValue"]>)[column.id] = newValue;
    const change = {
      rowId: row.id,
      columnId: column.id,
      oldValue,
      newValue
    };
    history?.record({ kind, changes: [change] });
    options.onCellChange?.(change);
  }

  function applyHistoryChanges(changes: readonly CellChangeEvent[]): readonly CellChangeEvent[] {
    const applied: CellChangeEvent[] = [];
    for (const change of changes) {
      const row = rows.find((candidate) => candidate.id === change.rowId);
      if (!row || !columns.some((column) => column.id === change.columnId)) {
        continue;
      }
      const currentValue = row.cells[change.columnId] ?? null;
      const normalized = { ...change, oldValue: currentValue };
      (row.cells as Record<string, CellChangeEvent["newValue"]>)[change.columnId] = change.newValue;
      applied.push(normalized);
      options.onCellChange?.(normalized);
    }
    if (applied.length > 0) {
      render();
    }
    return applied;
  }

  function undo(): readonly CellChangeEvent[] {
    return applyHistoryChanges(history?.undo(invertCellChange) ?? []);
  }

  function redo(): readonly CellChangeEvent[] {
    return applyHistoryChanges(history?.redo() ?? []);
  }

  function setLayoutState(state: GridLayoutState, reason: GridLayoutEvent["reason"]): void {
    const activeColumnId = columns[activeCell.columnIndex]?.id;
    const anchorColumnId = columns[anchorCell.columnIndex]?.id;
    const editColumnId = editState ? columns[editState.columnIndex]?.id : undefined;
    layoutState = applyGridLayoutState({
      columnIds: sourceColumns.map((column) => column.id),
      defaultColumnWidth: columnWidth,
      rowCount: rows.length,
      state
    });
    columns = orderColumns(sourceColumns, layoutState);
    activeCell.columnIndex = findColumnIndex(columns, activeColumnId, activeCell.columnIndex);
    anchorCell.columnIndex = findColumnIndex(columns, anchorColumnId, anchorCell.columnIndex);
    if (editState) {
      editState = {
        ...editState,
        columnIndex: findColumnIndex(columns, editColumnId, editState.columnIndex)
      };
    }
    spacer.style.width = `${rowNumberWidth + getGridLayoutWidth(layoutState)}px`;
    viewport.style.width = spacer.style.width;
    options.onLayoutChange?.({ reason, state: layoutState });
    render();
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
      editorAbortController.abort("unmount");
      editorState.unmount();
      unsubscribeEditor();
      unsubscribeHistory?.();
      destroyMountedLifecycles();
      container.replaceChildren();
    },
    render,
    setTheme: (theme) => applyGridTheme(grid, theme),
    getLayoutState: () => layoutState,
    applyLayoutState: (state) => setLayoutState(state, "apply"),
    resizeColumn: (columnId, width) => setLayoutState(
      resizeGridColumn(layoutState, columnId, width),
      "resize"
    ),
    reorderColumn: (columnId, targetIndex) => setLayoutState(
      reorderGridColumn(layoutState, columnId, targetIndex),
      "reorder"
    ),
    freezePanes: (frozenRowCount, frozenColumnCount) => setLayoutState(
      freezeGridPanes(layoutState, frozenRowCount, frozenColumnCount, rows.length),
      "freeze"
    ),
    undo,
    redo
  };
}

function orderColumns<TRow extends GridRow>(
  columns: readonly GridColumnView<TRow>[],
  layout: GridLayoutState
): readonly GridColumnView<TRow>[] {
  const byId = new Map(columns.map((column) => [column.id, column] as const));
  return layout.columns.map((column) => byId.get(column.columnId)!).filter(Boolean);
}

function findColumnIndex<TRow extends GridRow>(
  columns: readonly GridColumnView<TRow>[],
  columnId: string | undefined,
  fallback: number
): number {
  const index = columnId === undefined ? -1 : columns.findIndex((column) => column.id === columnId);
  return index >= 0 ? index : clamp(fallback, 0, Math.max(0, columns.length - 1));
}

function getRenderedRowIndexes(
  rowCount: number,
  rowHeight: number,
  scrollTop: number,
  viewportHeight: number,
  frozenRowCount: number,
  overscan: number
): readonly number[] {
  const indexes = new Set<number>();
  for (let index = 0; index < Math.min(rowCount, frozenRowCount); index += 1) {
    indexes.add(index);
  }
  const first = Math.max(frozenRowCount, Math.floor(scrollTop / rowHeight) - overscan);
  const last = Math.min(rowCount - 1, Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan);
  for (let index = first; index <= last; index += 1) {
    indexes.add(index);
  }
  return [...indexes].sort((left, right) => left - right);
}

function getRenderedColumnIndexes(
  layout: GridLayoutState,
  offsets: readonly number[],
  scrollLeft: number,
  viewportWidth: number,
  overscan: number
): readonly number[] {
  const indexes = new Set<number>();
  for (let index = 0; index < layout.frozenColumnCount; index += 1) {
    indexes.add(index);
  }
  const visible: number[] = [];
  for (let index = layout.frozenColumnCount; index < layout.columns.length; index += 1) {
    const left = offsets[index]!;
    const right = left + layout.columns[index]!.width;
    if (right >= scrollLeft && left <= scrollLeft + viewportWidth) {
      visible.push(index);
    }
  }
  const first = visible[0] ?? layout.frozenColumnCount;
  const last = visible.at(-1) ?? first - 1;
  for (let index = Math.max(layout.frozenColumnCount, first - overscan); index <= Math.min(layout.columns.length - 1, last + overscan); index += 1) {
    indexes.add(index);
  }
  return [...indexes].sort((left, right) => left - right);
}

function applyGridTheme(grid: HTMLElement, theme: VirtualDomGridTheme | undefined): void {
  const variables: ReadonlyArray<readonly [string, string | undefined]> = [
    ["--gethen-background", theme?.background],
    ["--gethen-text-color", theme?.textColor],
    ["--gethen-grid-line-color", theme?.gridLineColor],
    ["--gethen-header-background", theme?.headerBackground],
    ["--gethen-header-text-color", theme?.headerTextColor],
    ["--gethen-row-number-background", theme?.rowNumberBackground],
    ["--gethen-row-number-text-color", theme?.rowNumberTextColor],
    ["--gethen-pinned-row-background", theme?.pinnedRowBackground],
    ["--gethen-status-background", theme?.statusBackground],
    ["--gethen-status-text-color", theme?.statusTextColor],
    ["--gethen-active-cell-border", theme?.activeCellBorder],
    ["--gethen-active-cell-background", theme?.activeCellBackground],
    ["--gethen-selection-background", theme?.selectionBackground],
    ["--gethen-readonly-text-color", theme?.readonlyTextColor],
    ["--gethen-invalid-color", theme?.invalidColor],
    ["--gethen-editor-focus-color", theme?.editorFocusColor],
    ["--gethen-cell-padding", theme?.cellPadding],
    ["--gethen-font-family", theme?.fontFamily],
    ["--gethen-font-size", theme?.fontSize]
  ];

  for (const [name, value] of variables) {
    if (value !== undefined) {
      grid.style.setProperty(name, value);
    } else {
      grid.style.removeProperty(name);
    }
  }
}

function getDensityDefaults(density: NonNullable<VirtualDomGridTheme["density"]>): {
  readonly rowHeight: number;
  readonly columnWidth: number;
  readonly headerHeight: number;
  readonly rowNumberWidth: number;
  readonly statusHeight: number;
} {
  switch (density) {
    case "compact":
      return { rowHeight: 28, columnWidth: 124, headerHeight: 32, rowNumberWidth: 44, statusHeight: 28 };
    case "spacious":
      return { rowHeight: 40, columnWidth: 148, headerHeight: 44, rowNumberWidth: 56, statusHeight: 36 };
    case "comfortable":
      return { rowHeight: 34, columnWidth: 136, headerHeight: 38, rowNumberWidth: 48, statusHeight: 32 };
  }
}

function cssPixelValue(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
