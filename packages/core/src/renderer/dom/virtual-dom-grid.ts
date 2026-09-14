import type { CellChangeEvent } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "../../contracts/grid-types.js";
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
  reorderGridColumn,
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
  let columns = orderGridColumns(sourceColumns, layoutState);
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
  applyVirtualDomGridTheme(grid, options.theme);

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
    invalidatePendingEditorOperationForRemount();
    const started = performance.now();
    destroyMountedLifecycles();
    requestActiveEditorCommit = undefined;
    const columnOffsets = getGridColumnOffsets(layoutState);
    const rowIndexes = getRenderedGridRowIndexes(
      rows.length,
      rowHeight,
      Math.max(0, grid.scrollTop - headerHeight),
      Math.max(rowHeight, grid.clientHeight - headerHeight - pinnedHeight - statusHeight),
      layoutState.frozenRowCount,
      overscanRows
    );
    const columnIndexes = getRenderedGridColumnIndexes(
      layoutState,
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
      layoutState,
      styling: options.styling,
      statusBar: options.statusBar,
      activeCell,
      anchorCell,
      rowHeight,
      rowNumberWidth,
      headerHeight,
      statusHeight,
      pinnedHeight,
      showColumnHeaders,
      showRowNumbers,
      showStatusBar
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
      appendGridRowNumber(fragment, row, rowIndex, rowIndex < layoutState.frozenRowCount, shellContext);
    }

    appendGridShellAfterRows(fragment, columnIndexes, columnOffsets, shellContext);
    viewport.appendChild(fragment);
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
      try {
        await editor?.cancel();
      } catch {
        // Cancellation remains final; custom editor cleanup failures must not revive the session.
      }
      if (!editorCoordinator.destroyed && editorState.snapshot.phase === "cancelling") {
        editorState.cancelled();
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
    columns = orderGridColumns(sourceColumns, layoutState);
    activeCell.columnIndex = findGridColumnIndex(columns, activeColumnId, activeCell.columnIndex);
    anchorCell.columnIndex = findGridColumnIndex(columns, anchorColumnId, anchorCell.columnIndex);
    if (editState) {
      editState = {
        ...editState,
        columnIndex: findGridColumnIndex(columns, editColumnId, editState.columnIndex)
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
      editorCoordinator.destroy();
      editState = null;
      if (animationFrame !== 0) {
        cancelAnimationFrame(animationFrame);
      }

      grid.removeEventListener("scroll", scheduleRender);
      grid.removeEventListener("keydown", handleKeyDown);
      grid.removeEventListener("click", handleClick);
      grid.removeEventListener("paste", handlePaste);
      window.removeEventListener("resize", scheduleRender);
      editorState.unmount();
      unsubscribeEditor();
      unsubscribeHistory?.();
      destroyMountedLifecycles();
      container.replaceChildren();
    },
    render,
    setTheme: (theme) => applyVirtualDomGridTheme(grid, theme),
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
