import type { CellChangeEvent } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./client-grid-engine.js";
import type { GridClipboardOptions, GridPasteResult } from "./grid-clipboard.js";
import { prepareGridPaste } from "./grid-clipboard.js";
import type { GridColumnView, GridStylingOptions, VirtualDomGridTheme } from "./grid-customization.js";
import { getVisibleColumns } from "./grid-customization.js";
import type { GridCellEditor, GridEditorSnapshot, GridValidationResult } from "./grid-editing.js";
import { createGridEditorStateMachine } from "./grid-editing.js";
import type { GridHistoryEvent, GridHistoryOptions } from "./grid-history.js";
import { createGridHistory, invertCellChange } from "./grid-history.js";
import type { GridLayoutEvent, GridLayoutState } from "./grid-layout.js";
import {
  applyGridLayoutState,
  freezeGridPanes,
  getGridColumnOffsets,
  getGridLayoutWidth,
  reorderGridColumn,
  resizeGridColumn
} from "./grid-layout.js";
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
  const rowHeight = options.rowHeight ?? 32;
  const columnWidth = options.columnWidth ?? 132;
  const overscanRows = options.overscanRows ?? 6;
  const overscanColumns = options.overscanColumns ?? 2;
  const sourceColumns = getVisibleColumns(options.columns);
  const rows = options.rows.map((row) => ({
    ...row,
    cells: { ...row.cells }
  })) as TRow[];
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
  spacer.style.width = `${getGridLayoutWidth(layoutState)}px`;
  spacer.style.height = `${rows.length * rowHeight}px`;

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
    const columnOffsets = getGridColumnOffsets(layoutState);
    const rowIndexes = getRenderedRowIndexes(
      rows.length,
      rowHeight,
      grid.scrollTop,
      grid.clientHeight,
      layoutState.frozenRowCount,
      overscanRows
    );
    const columnIndexes = getRenderedColumnIndexes(
      layoutState,
      columnOffsets,
      grid.scrollLeft,
      grid.clientWidth,
      overscanColumns
    );
    const fragment = document.createDocumentFragment();

    viewport.replaceChildren();
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
          left: columnOffsets[columnIndex]! + (frozenColumn ? grid.scrollLeft : 0),
          top: rowIndex * rowHeight + (frozenRow ? grid.scrollTop : 0),
          frozenRow,
          frozenColumn,
          commitEdit: (
            value: CellChangeEvent["newValue"],
            editor?: GridCellEditor<TRow>,
            navigation?: "next" | "previous"
          ) => {
            void handleEditorCommit(value, editor, navigation);
          },
          cancelEdit: (editor?: GridCellEditor<TRow>) => {
            void handleEditorCancel(editor);
          },
          styling: options.styling,
          editorSignal: editorAbortController.signal,
          registerLifecycle: (destroy: () => void) => mountedLifecycles.push(destroy)
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
    }

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

    if (editorState.snapshot.phase === "editing" || editorState.snapshot.phase === "failed") {
      editorState.suspendForScroll();
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
    const offsets = getGridColumnOffsets(layoutState);
    const left = offsets[activeCell.columnIndex] ?? 0;
    const top = activeCell.rowIndex * rowHeight;
    const right = left + (layoutState.columns[activeCell.columnIndex]?.width ?? columnWidth);
    const bottom = top + rowHeight;
    const frozenWidth = layoutState.columns
      .slice(0, layoutState.frozenColumnCount)
      .reduce((total, column) => total + column.width, 0);
    const frozenHeight = layoutState.frozenRowCount * rowHeight;

    if (activeCell.columnIndex >= layoutState.frozenColumnCount && left < grid.scrollLeft + frozenWidth) {
      grid.scrollLeft = Math.max(0, left - frozenWidth);
    } else if (right > grid.scrollLeft + grid.clientWidth) {
      grid.scrollLeft = right - grid.clientWidth;
    }

    if (activeCell.rowIndex >= layoutState.frozenRowCount && top < grid.scrollTop + frozenHeight) {
      grid.scrollTop = Math.max(0, top - frozenHeight);
    } else if (bottom > grid.scrollTop + grid.clientHeight) {
      grid.scrollTop = bottom - grid.clientHeight;
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof Element && event.target.closest("[data-gethen-editor-host='true']")) {
      return;
    }
    if (editState) {
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
  ): Promise<void> {
    if (!editState) {
      return;
    }

    editState = { ...editState, draftValue: value };
    editorState.updateDraft(value);
    editorState.beginValidation();
    const column = columns[editState.columnIndex];
    const row = rows[editState.rowIndex];
    if (!column || !row) {
      editorState.validationFailed({ valid: false, message: "The edited cell is no longer available." });
      return;
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
      return;
    }
    editorState.beginCommit();
    try {
      await editor?.commit(value);
      commitValue(editState.rowIndex, editState.columnIndex, value, "cell-edit");
      editorState.committed();
    } catch (error) {
      editorState.commitFailed(error instanceof Error ? error.message : "Editor commit failed.");
      render();
      return;
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
    spacer.style.width = `${getGridLayoutWidth(layoutState)}px`;
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
