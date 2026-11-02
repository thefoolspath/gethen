import type { CellChangeEvent } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "../../contracts/grid-types.js";
import { createGridColumnarBuffer, createGridWorkerShapeDefinition } from "../../contracts/engine-contract.js";
import { createGridWorkerEngine } from "../../engine/grid-worker-engine.js";
import type { GridWorkerEngine } from "../../engine/grid-worker-engine.js";
import type { GridQueryEvent, GridQueryState, GridQueryStatus } from "../../state/grid-query.js";
import { GridSortingMode, copyGridQueryState, nextHeaderSort, normalizeGridQueryState } from "../../state/grid-query.js";
import type { GridClipboardOptions, GridPasteResult } from "../../state/grid-clipboard.js";
import { prepareGridPaste } from "../../state/grid-clipboard.js";
import type { GridColumnView, GridStylingOptions, VirtualDomGridTheme } from "./grid-customization.js";
import { getVisibleColumns } from "./grid-customization.js";
import type { GridCellEditor, GridEditorSnapshot, GridValidationResult } from "../../state/grid-editing.js";
import { createGridEditorStateMachine } from "../../state/grid-editing.js";
import type { GridHistoryEvent, GridHistoryOptions } from "../../state/grid-history.js";
import type { GridRowNumberOptions, GridStatusBarOptions } from "./grid-shell.js";
import { createGridHistory, invertCellChange } from "../../state/grid-history.js";
import type { GridLayoutEvent, GridLayoutState } from "../../state/grid-layout.js";
import {
  applyGridLayoutState,
  freezeGridPanes,
  getGridColumnOffsets,
  getGridLayoutWidth,
  projectVisibleGridLayoutState,
  reorderGridColumnByVisibleIndex,
  resizeGridColumn
} from "../../state/grid-layout.js";
import { createVirtualDomGridCell } from "./virtual-dom-grid-cell.js";
import {
  appendGridRowNumber,
  appendGridShellAfterRows,
  appendGridShellBeforeRows
} from "./virtual-dom-grid-shell.js";
import { clamp, isTypeToEditKey } from "./virtual-dom-grid-values.js";
import {
  applyVirtualDomGridTheme,
  cssGridPixelValue,
  findGridColumnIndex,
  getGridDensityDefaults,
  getRenderedGridColumnIndexes,
  getRenderedGridRowIndexes,
  orderGridColumns
} from "./virtual-dom-grid-geometry.js";
import type { GridEditorOperationToken } from "./virtual-dom-grid-editor-coordinator.js";
import { VirtualDomGridEditorCoordinator } from "./virtual-dom-grid-editor-coordinator.js";

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
  readonly readOnly?: boolean;
  readonly columnReordering?: boolean;
  /** Header sorting is opt-in so existing grid interactions remain unchanged. */
  readonly sortingMode?: GridSortingMode;
  readonly queryState?: GridQueryState;
  readonly onQueryChange?: (event: GridQueryEvent) => void;
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
  setReadOnly(readOnly: boolean): void;
  setColumnReordering(enabled: boolean): void;
  setSortingMode(mode: GridSortingMode): Promise<void>;
  getQueryState(): GridQueryState;
  setQueryState(state: GridQueryState): Promise<void>;
  getLayoutState(): GridLayoutState;
  applyLayoutState(state: GridLayoutState): void;
  resizeColumn(columnId: string, width: number): void;
  reorderColumn(columnId: string, targetIndex: number): void;
  freezePanes(frozenRowCount: number, frozenColumnCount: number): void;
  undo(): readonly CellChangeEvent[];
  redo(): readonly CellChangeEvent[];
}

export const gethenReadOnlyGridPreset = Object.freeze({ readOnly: true } as const);

let gridInstanceSequence = 0;

const COLUMN_DRAG_THRESHOLD = 6;
const COLUMN_DRAG_EDGE_ZONE = 32;
const COLUMN_DRAG_MAX_SCROLL_PER_FRAME = 18;

interface ColumnPointerCandidate {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly columnId: string;
  readonly startX: number;
  readonly startY: number;
}

interface ColumnDragState {
  readonly pointerId: number;
  readonly columnId: string;
  clientX: number;
  clientY: number;
  targetIndex: number | undefined;
  validTarget: boolean;
  invalidReason: "frozen-boundary" | undefined;
}

export function mountVirtualDomGrid<TRow extends GridRow>(
  container: HTMLElement,
  options: VirtualDomGridOptions<TRow>
): VirtualDomGrid {
  const grid = document.createElement("div");
  const spacer = document.createElement("div");
  const viewport = document.createElement("div");
  const reorderInstructions = document.createElement("span");
  const reorderLiveRegion = document.createElement("span");
  const queryLiveRegion = document.createElement("span");
  const instanceId = ++gridInstanceSequence;
  const activeHeaderId = `gethen-active-column-header-${instanceId}`;
  const reorderInstructionsId = `gethen-column-reorder-instructions-${instanceId}`;
  const density = options.theme?.density ?? "comfortable";
  const densityDefaults = getGridDensityDefaults(density);
  const rowHeight = options.rowHeight ?? cssGridPixelValue(options.theme?.rowHeight, densityDefaults.rowHeight);
  const columnWidth = options.columnWidth ?? densityDefaults.columnWidth;
  const showColumnHeaders = options.showColumnHeaders !== false;
  const rowNumberOptions = typeof options.rowNumbers === "object" ? options.rowNumbers : undefined;
  const showRowNumbers = options.rowNumbers !== false && rowNumberOptions?.visible !== false;
  const showStatusBar = options.statusBar !== false && options.statusBar?.visible !== false;
  const headerHeight = showColumnHeaders
    ? cssGridPixelValue(options.theme?.headerHeight, densityDefaults.headerHeight)
    : 0;
  const rowNumberWidth = showRowNumbers
    ? rowNumberOptions?.width ?? cssGridPixelValue(options.theme?.rowNumberWidth, densityDefaults.rowNumberWidth)
    : 0;
  const statusHeight = showStatusBar
    ? cssGridPixelValue(options.theme?.statusHeight, densityDefaults.statusHeight)
    : 0;
  const overscanRows = options.overscanRows ?? 6;
  const overscanColumns = options.overscanColumns ?? 2;
  const allColumns = options.columns;
  const sourceColumns = getVisibleColumns(allColumns);
  const sourceRows = options.rows.map((row) => ({
    ...row,
    cells: { ...row.cells }
  })) as TRow[];
  let rows = sourceRows;
  const pinnedBottomRows = (options.pinnedBottomRows ?? []).map((row) => ({
    ...row,
    cells: { ...row.cells }
  })) as TRow[];
  const pinnedHeight = pinnedBottomRows.length * rowHeight;
  let layoutState = applyGridLayoutState({
    columnIds: allColumns.map((column) => column.id),
    defaultColumnWidth: columnWidth,
    columnWidths: getDeclaredColumnWidths(allColumns),
    ...(options.frozenRowCount === undefined ? {} : { frozenRowCount: options.frozenRowCount }),
    ...(options.frozenColumnCount === undefined ? {} : { frozenColumnCount: options.frozenColumnCount }),
    rowCount: rows.length,
    ...(options.layoutState ? { state: options.layoutState } : {})
  });
  let columns = orderGridColumns(sourceColumns, layoutState);
  layoutState = normalizeFrozenColumnCount(layoutState, columns.length);
  let renderedLayoutState = projectVisibleGridLayoutState(
    layoutState,
    columns.map((column) => column.id)
  );
  const history = options.history === false ? undefined : createGridHistory(options.history);
  const editorState = createGridEditorStateMachine();
  const editorCoordinator = new VirtualDomGridEditorCoordinator();
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
  let readOnly = options.readOnly === true;
  let columnReordering = options.columnReordering !== false;
  let sortingMode = options.sortingMode ?? GridSortingMode.None;
  let queryState = normalizeGridQueryState(options.queryState ?? { sort: [], filter: [] }, allColumns);
  if (sortingMode === GridSortingMode.None) queryState = { ...queryState, sort: [] };
  if (sortingMode === GridSortingMode.Single && queryState.sort.length > 1) queryState = { ...queryState, sort: queryState.sort.slice(0, 1) };
  let appliedQueryState: GridQueryState = { sort: [], filter: [] };
  let queryStatus: GridQueryStatus = "idle";
  let queryRevision = 0;
  let queryAbort: AbortController | undefined;
  let queryEngine: GridWorkerEngine | undefined;
  let destroyed = false;
  let mutationHandlersBound = false;
  let animationFrame = 0;
  let dragAnimationFrame = 0;
  let announcementTimer = 0;
  let focusedHeaderColumnId: string | undefined;
  let pointerCandidate: ColumnPointerCandidate | undefined;
  let dragState: ColumnDragState | undefined;
  let dragGhost: HTMLElement | undefined;
  let dropIndicator: HTMLElement | undefined;

  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-readonly", readOnly ? "true" : "false");
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
  applyVirtualDomGridTheme(grid, options.theme);

  reorderInstructions.id = reorderInstructionsId;
  reorderInstructions.textContent = "Move the focused column with Alt+Shift+Left Arrow or Alt+Shift+Right Arrow.";
  applyVisuallyHiddenStyles(reorderInstructions);
  reorderLiveRegion.setAttribute("role", "status");
  reorderLiveRegion.setAttribute("aria-live", "polite");
  reorderLiveRegion.setAttribute("aria-atomic", "true");
  reorderLiveRegion.dataset.gethenColumnReorderStatus = "true";
  applyVisuallyHiddenStyles(reorderLiveRegion);
  queryLiveRegion.setAttribute("role", "status");
  queryLiveRegion.setAttribute("aria-live", "polite");
  queryLiveRegion.dataset.gethenQueryStatus = "true";
  applyVisuallyHiddenStyles(queryLiveRegion);

  spacer.style.position = "absolute";
  spacer.style.inset = "0 auto auto 0";
  spacer.style.width = `${rowNumberWidth + getGridLayoutWidth(renderedLayoutState)}px`;
  spacer.style.height = `${headerHeight + rows.length * rowHeight + pinnedHeight + statusHeight}px`;

  viewport.style.position = "absolute";
  viewport.style.inset = "0 auto auto 0";
  viewport.style.width = spacer.style.width;
  viewport.style.height = spacer.style.height;

  grid.append(spacer, viewport, reorderInstructions, reorderLiveRegion, queryLiveRegion);
  container.replaceChildren(grid);
  const unsubscribeEditor = editorState.subscribe((state) => options.onEditorStateChange?.(state));
  const unsubscribeHistory = history?.subscribe((event) => options.onHistoryChange?.(event));

  function render(): void {
    animationFrame = 0;
    invalidatePendingEditorOperationForRemount();
    const started = performance.now();
    destroyMountedLifecycles();
    requestActiveEditorCommit = undefined;
    const columnOffsets = getGridColumnOffsets(renderedLayoutState);
    const rowIndexes = getRenderedGridRowIndexes(
      rows.length,
      rowHeight,
      Math.max(0, grid.scrollTop - headerHeight),
      Math.max(rowHeight, grid.clientHeight - headerHeight - pinnedHeight - statusHeight),
      renderedLayoutState.frozenRowCount,
      overscanRows
    );
    const columnIndexes = getRenderedGridColumnIndexes(
      renderedLayoutState,
      columnOffsets,
      Math.max(0, grid.scrollLeft - rowNumberWidth),
      Math.max(columnWidth, grid.clientWidth - rowNumberWidth),
      overscanColumns
    );
    const fragment = document.createDocumentFragment();
    const shellContext = {
      grid,
      rows,
      columns,
      pinnedBottomRows,
      layoutState: renderedLayoutState,
      styling: options.styling,
      statusBar: queryState.filter.length > 0 && options.statusBar !== false
        ? {
            ...options.statusBar,
            totalRowCount: options.statusBar?.totalRowCount === undefined
              ? sourceRows.length : options.statusBar.totalRowCount,
            filteredRowCount: rows.length
          }
        : options.statusBar,
      activeCell,
      anchorCell,
      rowHeight,
      rowNumberWidth,
      headerHeight,
      statusHeight,
      pinnedHeight,
      showColumnHeaders,
      showRowNumbers,
      showStatusBar,
      columnReordering,
      sortingMode,
      queryState,
      focusedHeaderColumnId,
      draggingColumnId: dragState?.columnId,
      activeHeaderId,
      reorderInstructionsId
    };

    viewport.replaceChildren();
    appendGridShellBeforeRows(fragment, columnIndexes, columnOffsets, shellContext);
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

        const frozenRow = rowIndex < renderedLayoutState.frozenRowCount;
        const frozenColumn = columnIndex < renderedLayoutState.frozenColumnCount;
        const cellInput = {
          rowHeight,
          columnWidth: renderedLayoutState.columns[columnIndex]!.width,
          left: rowNumberWidth + columnOffsets[columnIndex]! + (frozenColumn ? grid.scrollLeft : 0),
          top: headerHeight + rowIndex * rowHeight + (frozenRow ? grid.scrollTop : 0),
          frozenRow,
          frozenColumn,
          ariaRowOffset: showColumnHeaders ? 1 : 0,
          ariaColumnOffset: showRowNumbers ? 1 : 0,
          readOnly,
          commitEdit: (
            value: CellChangeEvent["newValue"],
            editor?: GridCellEditor<TRow>,
            navigation?: "next" | "previous"
          ) => handleEditorCommit(value, editor, navigation),
          cancelEdit: (editor?: GridCellEditor<TRow>) => {
            void handleEditorCancel(editor);
          },
          styling: options.styling,
          editorSignal: editorCoordinator.signal,
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
      appendGridRowNumber(fragment, row, rowIndex, rowIndex < renderedLayoutState.frozenRowCount, shellContext);
    }

    appendGridShellAfterRows(fragment, columnIndexes, columnOffsets, shellContext);
    viewport.appendChild(fragment);
    updateActiveDescendant();
    options.onRender?.({
      renderedCellCount: rowIndexes.length * columnIndexes.length,
      renderMs: performance.now() - started
    });
    if (editorState.snapshot.phase === "suspended") {
      editorState.resumeAfterScroll();
    }
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

    if (
      editorState.snapshot.phase === "editing"
      || editorState.snapshot.phase === "validating"
      || editorState.snapshot.phase === "committing"
      || editorState.snapshot.phase === "failed"
    ) {
      editorCoordinator.invalidateOperation();
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
    const offsets = getGridColumnOffsets(renderedLayoutState);
    const left = rowNumberWidth + (offsets[activeCell.columnIndex] ?? 0);
    const top = headerHeight + activeCell.rowIndex * rowHeight;
    const right = left + (renderedLayoutState.columns[activeCell.columnIndex]?.width ?? columnWidth);
    const bottom = top + rowHeight;
    const frozenWidth = rowNumberWidth + renderedLayoutState.columns
      .slice(0, renderedLayoutState.frozenColumnCount)
      .reduce((total, column) => total + column.width, 0);
    const frozenHeight = headerHeight + renderedLayoutState.frozenRowCount * rowHeight;
    const bottomInset = pinnedHeight + statusHeight;

    if (activeCell.columnIndex >= renderedLayoutState.frozenColumnCount && left < grid.scrollLeft + frozenWidth) {
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

  function scrollHeaderIntoView(columnIndex: number): void {
    const offsets = getGridColumnOffsets(renderedLayoutState);
    const left = rowNumberWidth + (offsets[columnIndex] ?? 0);
    const right = left + (renderedLayoutState.columns[columnIndex]?.width ?? columnWidth);
    const frozenWidth = rowNumberWidth + renderedLayoutState.columns
      .slice(0, renderedLayoutState.frozenColumnCount)
      .reduce((total, column) => total + column.width, 0);

    if (columnIndex >= renderedLayoutState.frozenColumnCount && left < grid.scrollLeft + frozenWidth) {
      grid.scrollLeft = Math.max(0, left - frozenWidth);
    } else if (right > grid.scrollLeft + grid.clientWidth) {
      grid.scrollLeft = right - grid.clientWidth;
    }
  }

  function focusHeader(columnId: string): void {
    const columnIndex = columns.findIndex((column) => column.id === columnId);
    if ((!columnReordering && sortingMode === GridSortingMode.None) || !showColumnHeaders || columnIndex < 0) return;
    focusedHeaderColumnId = columnId;
    scrollHeaderIntoView(columnIndex);
    render();
  }

  function updateActiveDescendant(): void {
    if (focusedHeaderColumnId && (columnReordering || sortingMode !== GridSortingMode.None) && showColumnHeaders) {
      grid.setAttribute("aria-activedescendant", activeHeaderId);
    } else if (rows.length > 0 && columns.length > 0) {
      grid.setAttribute("aria-activedescendant", "gethen-active-cell");
    } else {
      grid.removeAttribute("aria-activedescendant");
    }
  }

  function moveFocusedHeader(delta: -1 | 1): void {
    if (!focusedHeaderColumnId || editState) return;
    const sourceIndex = columns.findIndex((column) => column.id === focusedHeaderColumnId);
    const targetIndex = sourceIndex + delta;
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= columns.length
      || !isSameFrozenZone(sourceIndex, targetIndex, renderedLayoutState.frozenColumnCount)) {
      announceColumnReorder(`Cannot move ${getColumnTitle(focusedHeaderColumnId)} beyond its column zone.`);
      return;
    }

    if (reorderVisibleColumn(focusedHeaderColumnId, targetIndex)) {
      const nextIndex = columns.findIndex((column) => column.id === focusedHeaderColumnId);
      announceColumnReorder(
        `Moved ${getColumnTitle(focusedHeaderColumnId)} to position ${nextIndex + 1} of ${columns.length}.`
      );
    }
  }

  function reorderVisibleColumn(columnId: string, targetIndex: number): boolean {
    return setLayoutState(
      reorderGridColumnByVisibleIndex(
        layoutState,
        columnId,
        targetIndex,
        columns.map((column) => column.id)
      ),
      "reorder"
    );
  }

  function getColumnTitle(columnId: string): string {
    return allColumns.find((column) => column.id === columnId)?.title ?? columnId;
  }

  function announceColumnReorder(message: string): void {
    if (announcementTimer !== 0) window.clearTimeout(announcementTimer);
    reorderLiveRegion.textContent = "";
    announcementTimer = window.setTimeout(() => {
      reorderLiveRegion.textContent = message;
      announcementTimer = 0;
    }, 0);
  }

  function handleNavigationKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape" && dragState) {
      event.preventDefault();
      releasePointerCandidate();
      cancelColumnDrag(true);
      return;
    }
    if (event.target instanceof Element && event.target.closest("[data-gethen-editor-host='true']")) {
      return;
    }
    if (editState) {
      return;
    }
    if (columns.length === 0) {
      return;
    }

    if (focusedHeaderColumnId) {
      const focusedIndex = columns.findIndex((column) => column.id === focusedHeaderColumnId);
      if (focusedIndex < 0) {
        focusedHeaderColumnId = undefined;
        updateActiveDescendant();
        return;
      }

      if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey
        && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        moveFocusedHeader(event.key === "ArrowLeft" ? -1 : 1);
      } else if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
        && event.key === "ArrowLeft") {
        event.preventDefault();
        focusHeader(columns[Math.max(0, focusedIndex - 1)]!.id);
      } else if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
        && event.key === "ArrowRight") {
        event.preventDefault();
        focusHeader(columns[Math.min(columns.length - 1, focusedIndex + 1)]!.id);
      } else if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
        && event.key === "Home") {
        event.preventDefault();
        focusHeader(columns[0]!.id);
      } else if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
        && event.key === "End") {
        event.preventDefault();
        focusHeader(columns.at(-1)!.id);
      } else if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
        && event.key === "ArrowDown") {
        event.preventDefault();
        if (rows.length > 0) {
          focusedHeaderColumnId = undefined;
          setActiveCell(activeCell.rowIndex, focusedIndex);
        }
      } else if (sortingMode !== GridSortingMode.None && !event.altKey && !event.ctrlKey && !event.metaKey
        && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        void applyHeaderSort(focusedHeaderColumnId);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
      }
      return;
    }

    if (rows.length === 0) {
      if ((columnReordering || sortingMode !== GridSortingMode.None) && showColumnHeaders && event.key === "ArrowUp"
        && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        focusHeader(columns[0]!.id);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCell(activeCell.rowIndex + 1, activeCell.columnIndex, event.shiftKey);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if ((columnReordering || sortingMode !== GridSortingMode.None) && showColumnHeaders && activeCell.rowIndex === 0
        && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
        focusHeader(columns[activeCell.columnIndex]!.id);
      } else {
        setActiveCell(activeCell.rowIndex - 1, activeCell.columnIndex, event.shiftKey);
      }
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
    }
  }

  function handleColumnPointerDown(event: PointerEvent): void {
    if (!columnReordering || editState || !event.isPrimary || event.button !== 0
      || !(event.target instanceof HTMLElement)) return;
    const header = event.target.closest<HTMLElement>("[data-gethen-column-reorder='true']");
    const columnId = header?.dataset.columnId;
    if (!header || !columnId || !grid.contains(header)) return;

    pointerCandidate = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      columnId,
      startX: event.clientX,
      startY: event.clientY
    };
    focusedHeaderColumnId = columnId;
    grid.focus({ preventScroll: true });
    if (event.pointerType !== "touch" && event.cancelable) event.preventDefault();
    try {
      grid.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic pointer tests and older engines may not register an active pointer for capture.
    }
    render();
  }

  function handleColumnDragKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Escape" || !dragState) return;
    event.preventDefault();
    releasePointerCandidate();
    cancelColumnDrag(true);
  }

  function handleColumnPointerMove(event: PointerEvent): void {
    if (!pointerCandidate || pointerCandidate.pointerId !== event.pointerId) return;
    if (!dragState) {
      const deltaX = event.clientX - pointerCandidate.startX;
      const deltaY = event.clientY - pointerCandidate.startY;
      if (pointerCandidate.pointerType === "touch"
        && Math.abs(deltaY) >= COLUMN_DRAG_THRESHOLD
        && Math.abs(deltaY) > Math.abs(deltaX)) {
        releasePointerCandidate();
        return;
      }
      if (Math.hypot(deltaX, deltaY) < COLUMN_DRAG_THRESHOLD) return;
      if (pointerCandidate.pointerType === "touch" && Math.abs(deltaX) <= Math.abs(deltaY)) return;
      beginColumnDrag(pointerCandidate, event.clientX, event.clientY);
    }
    if (!dragState) return;

    if (event.cancelable) event.preventDefault();
    dragState.clientX = event.clientX;
    dragState.clientY = event.clientY;
    positionDragGhost();
    updateColumnDropTarget();
    scheduleColumnDragAutoScroll();
  }

  function handleColumnPointerUp(event: PointerEvent): void {
    if (!pointerCandidate || pointerCandidate.pointerId !== event.pointerId) return;
    const completedDrag = dragState;
    const pointerCandidateColumnId = pointerCandidate.columnId;
    releasePointerCandidate();
    if (!completedDrag) {
      if (sortingMode !== GridSortingMode.None) void applyHeaderSort(pointerCandidateColumnId);
      return;
    }

    const targetIndex = completedDrag.validTarget ? completedDrag.targetIndex : undefined;
    const columnId = completedDrag.columnId;
    const invalidReason = completedDrag.invalidReason;
    cancelColumnDrag(false);
    if (targetIndex === undefined) {
      render();
      if (invalidReason === "frozen-boundary") {
        announceColumnReorder(`Cannot move ${getColumnTitle(columnId)} beyond its column zone.`);
      }
      return;
    }
    if (reorderVisibleColumn(columnId, targetIndex)) {
      const nextIndex = columns.findIndex((column) => column.id === columnId);
      announceColumnReorder(`Moved ${getColumnTitle(columnId)} to position ${nextIndex + 1} of ${columns.length}.`);
    } else {
      render();
    }
  }

  function handleColumnPointerCancel(event: PointerEvent): void {
    if (pointerCandidate?.pointerId !== event.pointerId) return;
    releasePointerCandidate();
    cancelColumnDrag(true);
  }

  function handleLostPointerCapture(event: PointerEvent): void {
    if (pointerCandidate?.pointerId !== event.pointerId) return;
    pointerCandidate = undefined;
    cancelColumnDrag(true);
  }

  function beginColumnDrag(candidate: ColumnPointerCandidate, clientX: number, clientY: number): void {
    dragState = {
      pointerId: candidate.pointerId,
      columnId: candidate.columnId,
      clientX,
      clientY,
      targetIndex: undefined,
      validTarget: false,
      invalidReason: undefined
    };
    const sourceHeader = findRenderedHeader(candidate.columnId);
    const sourceBounds = sourceHeader?.getBoundingClientRect();
    const computed = sourceHeader ? getComputedStyle(sourceHeader) : undefined;
    dragGhost = document.createElement("div");
    dragGhost.dataset.gethenColumnDragGhost = "true";
    dragGhost.textContent = getColumnTitle(candidate.columnId);
    Object.assign(dragGhost.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: `${sourceBounds?.width ?? 132}px`,
      height: `${sourceBounds?.height ?? headerHeight}px`,
      display: "flex",
      alignItems: "center",
      padding: computed?.padding ?? "0 10px",
      border: `1px solid ${computed?.borderRightColor ?? "#d8e0e8"}`,
      borderRadius: "4px",
      background: readThemeColor("--gethen-column-drag-ghost-background", "#f3f6f9"),
      color: computed?.color ?? "#344054",
      font: computed?.font ?? "inherit",
      fontWeight: "650",
      boxShadow: "0 8px 24px rgb(16 24 40 / 0.18)",
      opacity: "0.95",
      pointerEvents: "none",
      zIndex: "2147483646"
    });
    dropIndicator = document.createElement("div");
    dropIndicator.dataset.gethenColumnDropIndicator = "true";
    Object.assign(dropIndicator.style, {
      position: "fixed",
      display: "none",
      width: "3px",
      background: readThemeColor("--gethen-column-drop-indicator-color", "#6848d8"),
      borderRadius: "999px",
      pointerEvents: "none",
      zIndex: "2147483647"
    });
    document.body.append(dragGhost, dropIndicator);
    positionDragGhost();
    render();
  }

  function positionDragGhost(): void {
    if (!dragState || !dragGhost) return;
    dragGhost.style.transform = `translate(${dragState.clientX + 12}px, ${dragState.clientY + 12}px)`;
  }

  function updateColumnDropTarget(): void {
    if (!dragState || !dropIndicator) return;
    const hit = document.elementFromPoint(dragState.clientX, dragState.clientY);
    const targetHeader = hit instanceof Element
      ? hit.closest<HTMLElement>("[data-gethen-column-reorder='true']")
      : null;
    const sourceIndex = columns.findIndex((column) => column.id === dragState!.columnId);
    const targetIndex = Number(targetHeader?.dataset.columnIndex);
    if (!targetHeader || !grid.contains(targetHeader) || sourceIndex < 0 || !Number.isInteger(targetIndex)) {
      setInvalidColumnDropTarget();
      return;
    }

    const bounds = targetHeader.getBoundingClientRect();
    const insertAfter = dragState.clientX >= bounds.left + bounds.width / 2;
    const boundaryIndex = targetIndex + (insertAfter ? 1 : 0);
    const finalIndex = clamp(boundaryIndex - (sourceIndex < boundaryIndex ? 1 : 0), 0, columns.length - 1);
    if (!isSameFrozenZone(sourceIndex, finalIndex, renderedLayoutState.frozenColumnCount)) {
      setInvalidColumnDropTarget("frozen-boundary");
      return;
    }

    dragState.targetIndex = finalIndex;
    dragState.validTarget = true;
    dragState.invalidReason = undefined;
    dragGhost?.removeAttribute("data-gethen-drop-invalid");
    if (dragGhost) dragGhost.style.outline = "none";
    Object.assign(dropIndicator.style, {
      display: "block",
      left: `${insertAfter ? bounds.right - 1.5 : bounds.left - 1.5}px`,
      top: `${bounds.top}px`,
      height: `${bounds.height}px`
    });
  }

  function setInvalidColumnDropTarget(reason?: ColumnDragState["invalidReason"]): void {
    if (!dragState) return;
    dragState.targetIndex = undefined;
    dragState.validTarget = false;
    dragState.invalidReason = reason;
    dropIndicator?.style.setProperty("display", "none");
    if (dragGhost) {
      dragGhost.dataset.gethenDropInvalid = "true";
      dragGhost.style.outline = `2px solid ${readThemeColor("--gethen-invalid-color", "#b42318")}`;
    }
  }

  function scheduleColumnDragAutoScroll(): void {
    if (!dragState || dragAnimationFrame !== 0) return;
    const sourceIndex = columns.findIndex((column) => column.id === dragState!.columnId);
    if (sourceIndex < renderedLayoutState.frozenColumnCount) return;
    const speed = getColumnDragScrollSpeed(dragState.clientX);
    if (speed === 0) return;
    dragAnimationFrame = requestAnimationFrame(() => {
      dragAnimationFrame = 0;
      if (!dragState) return;
      const previousScrollLeft = grid.scrollLeft;
      grid.scrollLeft += speed;
      if (grid.scrollLeft !== previousScrollLeft) {
        scheduleRender();
        updateColumnDropTarget();
        scheduleColumnDragAutoScroll();
      }
    });
  }

  function getColumnDragScrollSpeed(clientX: number): number {
    const bounds = grid.getBoundingClientRect();
    const frozenWidth = renderedLayoutState.columns
      .slice(0, renderedLayoutState.frozenColumnCount)
      .reduce((total, column) => total + column.width, rowNumberWidth);
    const leftEdge = Math.min(bounds.right, bounds.left + frozenWidth);
    if (clientX < leftEdge + COLUMN_DRAG_EDGE_ZONE) {
      const ratio = clamp((leftEdge + COLUMN_DRAG_EDGE_ZONE - clientX) / COLUMN_DRAG_EDGE_ZONE, 0, 1);
      return -Math.max(2, Math.ceil(COLUMN_DRAG_MAX_SCROLL_PER_FRAME * ratio));
    }
    if (clientX > bounds.right - COLUMN_DRAG_EDGE_ZONE) {
      const ratio = clamp((clientX - (bounds.right - COLUMN_DRAG_EDGE_ZONE)) / COLUMN_DRAG_EDGE_ZONE, 0, 1);
      return Math.max(2, Math.ceil(COLUMN_DRAG_MAX_SCROLL_PER_FRAME * ratio));
    }
    return 0;
  }

  function releasePointerCandidate(): void {
    const pointerId = pointerCandidate?.pointerId;
    pointerCandidate = undefined;
    if (pointerId !== undefined && grid.hasPointerCapture?.(pointerId)) {
      grid.releasePointerCapture(pointerId);
    }
  }

  function cancelColumnDrag(renderAfterCancel: boolean): void {
    if (dragAnimationFrame !== 0) {
      cancelAnimationFrame(dragAnimationFrame);
      dragAnimationFrame = 0;
    }
    dragState = undefined;
    dragGhost?.remove();
    dropIndicator?.remove();
    dragGhost = undefined;
    dropIndicator = undefined;
    if (renderAfterCancel) render();
  }

  function findRenderedHeader(columnId: string): HTMLElement | undefined {
    return [...viewport.querySelectorAll<HTMLElement>("[data-column-id]")]
      .find((header) => header.dataset.columnId === columnId);
  }

  function readThemeColor(variable: string, fallback: string): string {
    return getComputedStyle(grid).getPropertyValue(variable).trim() || fallback;
  }

  function handleMutationKeyDown(event: KeyboardEvent): void {
    if (readOnly || (event.target instanceof Element && event.target.closest("[data-gethen-editor-host='true']"))) {
      return;
    }
    if (focusedHeaderColumnId || editState || rows.length === 0 || columns.length === 0) {
      return;
    }

    const commandKey = event.ctrlKey || event.metaKey;
    if (commandKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
    } else if (commandKey && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
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

    const header = target.closest<HTMLElement>("[role='columnheader'][data-column-id]");
    if (sortingMode !== GridSortingMode.None && !columnReordering && header?.dataset.columnId) {
      grid.focus({ preventScroll: true });
      focusHeader(header.dataset.columnId);
      void applyHeaderSort(header.dataset.columnId);
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
      focusedHeaderColumnId = undefined;
      grid.focus();
      if (!event.shiftKey && activeCell.rowIndex === rowIndex && activeCell.columnIndex === columnIndex
        && anchorCell.rowIndex === rowIndex && anchorCell.columnIndex === columnIndex) {
        updateActiveDescendant();
        return;
      }
      setActiveCell(rowIndex, columnIndex, event.shiftKey);

    }
  }

  function handleMutationClick(event: MouseEvent): void {
    if (readOnly || event.detail !== 2 || !(event.target instanceof HTMLElement)) return;
    if (!event.target.closest<HTMLElement>("[data-row-index][data-column-index]")) return;
    startEdit();
  }

  function handlePaste(event: ClipboardEvent): void {
    if (readOnly || focusedHeaderColumnId) return;
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
    if (readOnly) return;
    if (editorState.snapshot.phase !== "inactive") {
      return;
    }
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
    editorCoordinator.beginSession();
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
    if (readOnly) return false;
    if (editorCoordinator.pendingCommit) {
      return editorCoordinator.pendingCommit;
    }
    if (!editState) {
      return false;
    }

    const rowIndex = editState.rowIndex;
    const columnIndex = editState.columnIndex;
    editState = { ...editState, draftValue: value };
    editorState.updateDraft(value);
    editorState.beginValidation();
    return editorCoordinator.runExclusiveCommit((token) => completeEditorCommit(
      { ...token, rowIndex, columnIndex },
      value,
      editor,
      navigation
    ));
  }

  async function completeEditorCommit(
    operation: {
      readonly sessionGeneration: number;
      readonly operationGeneration: number;
      readonly rowIndex: number;
      readonly columnIndex: number;
      readonly signal: AbortSignal;
    },
    value: CellChangeEvent["newValue"],
    editor?: GridCellEditor<TRow>,
    navigation?: "next" | "previous"
  ): Promise<boolean> {
    const column = columns[operation.columnIndex];
    const row = rows[operation.rowIndex];
    if (!column || !row) {
      if (isCurrentEditorOperation(operation)) {
        editorState.validationFailed({ valid: false, message: "The edited cell is no longer available." });
      }
      return false;
    }
    const context = {
      row,
      rowId: row.id,
      rowIndex: operation.rowIndex,
      column,
      columnIndex: operation.columnIndex,
      value
    };
    let editorValidation: GridValidationResult;
    try {
      editorValidation = editor ? await editor.validate(value) : { valid: true };
    } catch (error) {
      return failEditorValidation(operation, error, "Editor validation failed.");
    }
    if (!isCurrentEditorOperation(operation)) return false;
    let validation: GridValidationResult = editorValidation;
    if (editorValidation.valid) {
      try {
        validation = await (column.validate?.(value, context) ?? { valid: true });
      } catch (error) {
        return failEditorValidation(operation, error, "Column validation failed.");
      }
    }
    if (!isCurrentEditorOperation(operation)) return false;
    if (!validation.valid) {
      editorState.validationFailed(validation);
      render();
      return false;
    }
    editorState.beginCommit();
    try {
      await editor?.commit(value);
      if (!isCurrentEditorOperation(operation)) return false;
      commitValue(operation.rowIndex, operation.columnIndex, value, "cell-edit");
      editorState.committed();
    } catch (error) {
      if (isCurrentEditorOperation(operation)) {
        editorState.commitFailed(error instanceof Error ? error.message : "Editor commit failed.");
        render();
      }
      return false;
    }
    if (!isCurrentEditorOperation(operation)) return false;
    editState = null;
    editorCoordinator.completeSession();
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
    if (!editState || editorCoordinator.destroyed) return;
    editorCoordinator.cancelSession();
    editState = null;
    if (editorState.snapshot.phase !== "inactive" && editorState.snapshot.phase !== "disposed") {
      editorState.beginCancel();
      if (!editor) {
        editorState.cancelled();
      } else {
        try {
          await editor.cancel();
        } catch {
          // Cancellation remains final; custom editor cleanup failures must not revive the session.
        }
        if (!editorCoordinator.destroyed && editorState.snapshot.phase === "cancelling") {
          editorState.cancelled();
        }
      }
    }
    if (editorCoordinator.destroyed) return;
    grid.focus();
    render();
  }

  function failEditorValidation(
    operation: GridEditorOperationToken,
    error: unknown,
    fallbackMessage: string
  ): false {
    if (isCurrentEditorOperation(operation)) {
      editorState.validationFailed({
        valid: false,
        message: error instanceof Error ? error.message : fallbackMessage,
        code: "validation"
      });
      render();
    }
    return false;
  }

  function isCurrentEditorOperation(operation: GridEditorOperationToken): boolean {
    return editorCoordinator.isCurrent(operation) && editState !== null;
  }

  function invalidatePendingEditorOperationForRemount(): void {
    if (editorState.snapshot.phase !== "validating" && editorState.snapshot.phase !== "committing") {
      return;
    }
    editorCoordinator.invalidateOperation();
    editorState.suspendForScroll();
  }

  function toggleBooleanCell(): void {
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return [];
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
    if (readOnly) return [];
    return applyHistoryChanges(history?.undo(invertCellChange) ?? []);
  }

  function redo(): readonly CellChangeEvent[] {
    if (readOnly) return [];
    return applyHistoryChanges(history?.redo() ?? []);
  }

  function setLayoutState(state: GridLayoutState, reason: GridLayoutEvent["reason"]): boolean {
    const activeColumnId = columns[activeCell.columnIndex]?.id;
    const anchorColumnId = columns[anchorCell.columnIndex]?.id;
    const editColumnId = editState ? columns[editState.columnIndex]?.id : undefined;
    const nextLayoutState = applyGridLayoutState({
      columnIds: allColumns.map((column) => column.id),
      defaultColumnWidth: columnWidth,
      columnWidths: getDeclaredColumnWidths(allColumns),
      rowCount: rows.length,
      state
    });
    const normalizedLayoutState = normalizeFrozenColumnCount(nextLayoutState, sourceColumns.length);
    if (reason === "reorder" && haveSameColumnOrder(layoutState, normalizedLayoutState)) {
      return false;
    }
    layoutState = normalizedLayoutState;
    columns = orderGridColumns(sourceColumns, layoutState);
    renderedLayoutState = projectVisibleGridLayoutState(
      layoutState,
      columns.map((column) => column.id)
    );
    activeCell.columnIndex = findGridColumnIndex(columns, activeColumnId, activeCell.columnIndex);
    anchorCell.columnIndex = findGridColumnIndex(columns, anchorColumnId, anchorCell.columnIndex);
    if (editState) {
      editState = {
        ...editState,
        columnIndex: findGridColumnIndex(columns, editColumnId, editState.columnIndex)
      };
    }
    spacer.style.width = `${rowNumberWidth + getGridLayoutWidth(renderedLayoutState)}px`;
    viewport.style.width = spacer.style.width;
    options.onLayoutChange?.({ reason, state: layoutState });
    render();
    return true;
  }

  function bindMutationHandlers(): void {
    if (mutationHandlersBound) return;
    grid.addEventListener("keydown", handleMutationKeyDown);
    grid.addEventListener("click", handleMutationClick);
    grid.addEventListener("paste", handlePaste);
    mutationHandlersBound = true;
  }

  function unbindMutationHandlers(): void {
    if (!mutationHandlersBound) return;
    grid.removeEventListener("keydown", handleMutationKeyDown);
    grid.removeEventListener("click", handleMutationClick);
    grid.removeEventListener("paste", handlePaste);
    mutationHandlersBound = false;
  }

  function setReadOnly(nextReadOnly: boolean): void {
    if (readOnly === nextReadOnly) return;
    readOnly = nextReadOnly;
    grid.setAttribute("aria-readonly", readOnly ? "true" : "false");
    if (readOnly) {
      unbindMutationHandlers();
      if (editState) void handleEditorCancel();
      else render();
    } else {
      bindMutationHandlers();
      render();
    }
  }

  function setColumnReordering(enabled: boolean): void {
    if (columnReordering === enabled) return;
    columnReordering = enabled;
    if (!enabled) {
      releasePointerCandidate();
      cancelColumnDrag(false);
      if (sortingMode === GridSortingMode.None) focusedHeaderColumnId = undefined;
    }
    render();
  }

  async function applyHeaderSort(columnId: string): Promise<void> {
    if (sortingMode === GridSortingMode.None || editState) return;
    try {
      await setQueryState(nextHeaderSort(queryState, columnId, sortingMode, allColumns));
    } catch {
      // The error has already been reported through onQueryChange.
    }
  }

  async function setQueryState(nextState: GridQueryState): Promise<void> {
    if (destroyed) throw new Error("The grid is destroyed.");
    const normalized = normalizeGridQueryState(nextState, allColumns);
    if (sortingMode === GridSortingMode.None && normalized.sort.length > 0) {
      throw new Error("Sorting is disabled for this grid.");
    }
    if (sortingMode === GridSortingMode.Single && normalized.sort.length > 1) {
      throw new Error("Single sorting mode accepts one sort column.");
    }
    if (JSON.stringify(normalized) === JSON.stringify(queryState)
      && (queryStatus === "loading" || queryStatus === "ready")) return;
    const revision = ++queryRevision;
    queryAbort?.abort();
    queryAbort = undefined;
    queryState = normalized;
    queryStatus = "loading";
    grid.setAttribute("aria-busy", "true");
    options.onQueryChange?.({ state: copyGridQueryState(queryState), status: queryStatus });
    render();
    if (queryState.sort.length === 0 && queryState.filter.length === 0) {
      applyQueryRows(sourceRows);
      appliedQueryState = queryState;
      finishQuery();
      return;
    }
    const controller = new AbortController();
    queryAbort = controller;
    try {
      queryEngine ??= createGridWorkerEngine();
      const data = createGridColumnarBuffer(sourceRows, allColumns.map((column) => ({
        columnId: column.id,
        storage: column.dataType === "number" ? "float64"
          : column.dataType === "boolean" ? "boolean" : "utf8"
      })));
      const result = await queryEngine.shape({
        data,
        definition: createGridWorkerShapeDefinition({ sort: normalized.sort, filter: normalized.filter }),
        signal: controller.signal
      });
      if (destroyed || revision !== queryRevision) return;
      const sourceById = new Map(sourceRows.map((row) => [row.id, row]));
      applyQueryRows(result.rows.map((row) => {
        const source = sourceById.get(row.id);
        if (!source) throw new Error(`Worker returned unknown row '${row.id}'.`);
        return source;
      }));
      appliedQueryState = normalized;
      finishQuery();
    } catch (error) {
      if (destroyed || revision !== queryRevision) return;
      queryState = appliedQueryState;
      queryStatus = "error";
      grid.removeAttribute("aria-busy");
      const message = error instanceof Error ? error.message : String(error);
      queryLiveRegion.textContent = `Sort failed: ${message}`;
      options.onQueryChange?.({ state: copyGridQueryState(queryState), status: queryStatus, error: message });
      render();
      throw error;
    } finally {
      if (queryAbort === controller) queryAbort = undefined;
    }
  }

  function applyQueryRows(nextRows: readonly TRow[]): void {
    const previousScrollTop = grid.scrollTop;
    const previousScrollLeft = grid.scrollLeft;
    rows = [...nextRows];
    activeCell.rowIndex = clamp(activeCell.rowIndex, 0, Math.max(0, rows.length - 1));
    anchorCell.rowIndex = clamp(anchorCell.rowIndex, 0, Math.max(0, rows.length - 1));
    grid.setAttribute("aria-rowcount", String(rows.length + pinnedBottomRows.length + (showColumnHeaders ? 1 : 0)));
    spacer.style.height = `${headerHeight + rows.length * rowHeight + pinnedHeight + statusHeight}px`;
    viewport.style.height = spacer.style.height;
    grid.scrollTop = rows.length === 0 ? 0 : previousScrollTop;
    grid.scrollLeft = previousScrollLeft;
    if (rows.length > 0 && columns.length > 0) {
      const selection = getSelectionAt(activeCell.rowIndex, activeCell.columnIndex);
      options.onSelectionChange?.(selection);
      options.onSelectionRangeChange?.(createSelectionRange(selection));
    }
    render();
  }

  function finishQuery(): void {
    queryStatus = "ready";
    grid.removeAttribute("aria-busy");
    const primary = queryState.sort[0];
    queryLiveRegion.textContent = primary
      ? `Sorted by ${getColumnTitle(primary.columnId)} ${primary.direction === "asc" ? "ascending" : "descending"}.`
      : "Sorting cleared.";
    options.onQueryChange?.({ state: copyGridQueryState(queryState), status: queryStatus });
    render();
  }

  async function setSortingMode(mode: GridSortingMode): Promise<void> {
    if (mode !== GridSortingMode.None && mode !== GridSortingMode.Single && mode !== GridSortingMode.Multiple) {
      throw new Error(`Unknown sorting mode '${String(mode)}'.`);
    }
    if (sortingMode === mode) return;
    sortingMode = mode;
    if ((mode === GridSortingMode.None && queryState.sort.length > 0)
      || (mode === GridSortingMode.Single && queryState.sort.length > 1)) {
      await setQueryState({
        sort: mode === GridSortingMode.None ? [] : queryState.sort.slice(0, 1),
        filter: queryState.filter
      });
    }
    render();
  }

  grid.addEventListener("scroll", scheduleRender);
  grid.addEventListener("keydown", handleNavigationKeyDown);
  grid.addEventListener("click", handleClick);
  grid.addEventListener("pointerdown", handleColumnPointerDown);
  grid.addEventListener("pointermove", handleColumnPointerMove);
  grid.addEventListener("pointerup", handleColumnPointerUp);
  grid.addEventListener("pointercancel", handleColumnPointerCancel);
  grid.addEventListener("lostpointercapture", handleLostPointerCapture);
  if (!readOnly) bindMutationHandlers();
  window.addEventListener("resize", scheduleRender);
  window.addEventListener("keydown", handleColumnDragKeyDown, true);
  render();
  if (queryState.sort.length > 0 || queryState.filter.length > 0) void setQueryState(queryState).catch(() => {});

  return {
    element: grid,
    destroy() {
      destroyed = true;
      queryAbort?.abort();
      queryEngine?.destroy();
      editorCoordinator.destroy();
      editState = null;
      if (animationFrame !== 0) {
        cancelAnimationFrame(animationFrame);
      }
      if (announcementTimer !== 0) {
        window.clearTimeout(announcementTimer);
      }
      releasePointerCandidate();
      cancelColumnDrag(false);

      grid.removeEventListener("scroll", scheduleRender);
      grid.removeEventListener("keydown", handleNavigationKeyDown);
      grid.removeEventListener("click", handleClick);
      grid.removeEventListener("pointerdown", handleColumnPointerDown);
      grid.removeEventListener("pointermove", handleColumnPointerMove);
      grid.removeEventListener("pointerup", handleColumnPointerUp);
      grid.removeEventListener("pointercancel", handleColumnPointerCancel);
      grid.removeEventListener("lostpointercapture", handleLostPointerCapture);
      unbindMutationHandlers();
      window.removeEventListener("resize", scheduleRender);
      window.removeEventListener("keydown", handleColumnDragKeyDown, true);
      editorState.unmount();
      unsubscribeEditor();
      unsubscribeHistory?.();
      destroyMountedLifecycles();
      container.replaceChildren();
    },
    render,
    setTheme: (theme) => applyVirtualDomGridTheme(grid, theme),
    setReadOnly,
    setColumnReordering,
    setSortingMode,
    getQueryState: () => copyGridQueryState(queryState),
    setQueryState,
    getLayoutState: () => layoutState,
    applyLayoutState: (state) => setLayoutState(state, "apply"),
    resizeColumn: (columnId, width) => setLayoutState(
      resizeGridColumn(layoutState, columnId, width),
      "resize"
    ),
    reorderColumn: (columnId, targetIndex) => {
      reorderVisibleColumn(columnId, targetIndex);
    },
    freezePanes: (frozenRowCount, frozenColumnCount) => setLayoutState(
      freezeGridPanes(layoutState, frozenRowCount, frozenColumnCount, rows.length),
      "freeze"
    ),
    undo,
    redo
  };
}

function getDeclaredColumnWidths<TRow extends GridRow>(
  columns: readonly GridColumnView<TRow>[]
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    columns
      .filter((column) => column.width !== undefined)
      .map((column) => [column.id, column.width!])
  );
}

function normalizeFrozenColumnCount(state: GridLayoutState, visibleColumnCount: number): GridLayoutState {
  const frozenColumnCount = Math.max(0, Math.min(visibleColumnCount, Math.trunc(state.frozenColumnCount)));
  return frozenColumnCount === state.frozenColumnCount ? state : { ...state, frozenColumnCount };
}

function haveSameColumnOrder(left: GridLayoutState, right: GridLayoutState): boolean {
  return left.columns.length === right.columns.length
    && left.columns.every((column, index) => column.columnId === right.columns[index]?.columnId);
}

function isSameFrozenZone(sourceIndex: number, targetIndex: number, frozenColumnCount: number): boolean {
  return (sourceIndex < frozenColumnCount) === (targetIndex < frozenColumnCount);
}

function applyVisuallyHiddenStyles(element: HTMLElement): void {
  Object.assign(element.style, {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: "0"
  });
}
