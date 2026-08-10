import type { CellValue } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "./client-grid-engine.js";
import type { GridClassValue, GridColumnView, GridStylingOptions } from "./grid-customization.js";
import { resolveGridClassNames } from "./grid-customization.js";
import type { GridCellEditor, GridEditorContext } from "./grid-editing.js";
import { parseBuiltInEditorValue, resolveBuiltInEditor } from "./grid-editing.js";

export interface VirtualDomGridCellInput<TRow extends GridRow = GridRow> {
  readonly rowHeight: number;
  readonly columnWidth: number;
  readonly left: number;
  readonly top: number;
  readonly frozenRow: boolean;
  readonly frozenColumn: boolean;
  readonly commitEdit: (
    value: CellValue,
    editor?: GridCellEditor<TRow>,
    navigation?: "next" | "previous"
  ) => void;
  readonly cancelEdit: (editor?: GridCellEditor<TRow>) => void;
  readonly styling: GridStylingOptions<TRow> | undefined;
  readonly editorSignal: AbortSignal;
  readonly registerLifecycle: (destroy: () => void) => void;
}

export function createVirtualDomGridCell<TRow extends GridRow>(
  input: VirtualDomGridCellInput<TRow>,
  row: TRow,
  column: GridColumnView<TRow>,
  rowIndex: number,
  columnIndex: number,
  rowClass: GridClassValue,
  active: boolean,
  selected: boolean,
  editing: boolean,
  draftValue: CellValue
): HTMLElement {
  const cell = document.createElement("div");
  const context = {
    row,
    rowId: row.id,
    rowIndex,
    column,
    columnIndex,
    value: row.cells[column.id]
  };
  configureCellAccessibility(cell, columnIndex, rowIndex, active, selected);
  configureCellPosition(cell, input, column);
  configureCellClasses(cell, input.styling, rowClass, row, column, rowIndex, columnIndex);

  if (selected) {
    applySelectedCellStyles(cell);
  }
  if (active) {
    applyActiveCellStyles(cell);
  }

  if (editing) {
    cell.dataset.gethenEditorHost = "true";
    const editor = createCellEditor(cell, input, context, draftValue);
    input.registerLifecycle(() => editor?.destroy());
  } else if (column.renderer) {
    const renderer = column.renderer();
    renderer.mount(cell, context);
    renderer.update(context);
    input.registerLifecycle(() => renderer.destroy());
  } else {
    cell.textContent = column.formatter?.(context) ?? String(context.value ?? "");
  }

  return cell;
}

function configureCellClasses<TRow extends GridRow>(
  cell: HTMLElement,
  styling: GridStylingOptions<TRow> | undefined,
  rowClass: GridClassValue,
  row: TRow,
  column: GridColumnView<TRow>,
  rowIndex: number,
  columnIndex: number
): void {
  const cellClass = styling?.getCellClass?.({
    row,
    rowId: row.id,
    rowIndex,
    column,
    columnIndex,
    value: row.cells[column.id]
  });
  cell.classList.add(...resolveGridClassNames(column.className, rowClass, cellClass));
}

function configureCellAccessibility(
  cell: HTMLElement,
  columnIndex: number,
  rowIndex: number,
  active: boolean,
  selected: boolean
): void {
  cell.id = active ? "gethen-active-cell" : "";
  cell.setAttribute("role", columnIndex === 0 ? "rowheader" : "gridcell");
  cell.setAttribute("aria-rowindex", String(rowIndex + 1));
  cell.setAttribute("aria-colindex", String(columnIndex + 1));
  cell.setAttribute("aria-selected", selected ? "true" : "false");
  cell.dataset.rowIndex = String(rowIndex);
  cell.dataset.columnIndex = String(columnIndex);
}

function applySelectedCellStyles(cell: HTMLElement): void {
  cell.style.background = "var(--gethen-selection-background, #e6f4ff)";
}

function configureCellPosition<TRow extends GridRow>(
  cell: HTMLElement,
  input: VirtualDomGridCellInput<TRow>,
  column: GridColumnView<TRow>
): void {
  Object.assign(cell.style, {
    position: "absolute",
    left: `${input.left}px`,
    top: `${input.top}px`,
    width: `${input.columnWidth}px`,
    height: `${input.rowHeight}px`,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    borderRight: "1px solid #e0e5ea",
    borderBottom: "1px solid #e0e5ea",
    borderColor: "var(--gethen-grid-line-color, #e0e5ea)",
    padding: "var(--gethen-cell-padding, 7px 10px)",
    color: "var(--gethen-text-color, inherit)",
    background: "var(--gethen-background, transparent)",
    fontFamily: "var(--gethen-font-family, inherit)",
    fontSize: "var(--gethen-font-size, inherit)",
    textAlign: column.align ?? "inherit",
    zIndex: input.frozenRow && input.frozenColumn ? "4" : input.frozenRow ? "3" : input.frozenColumn ? "2" : "0"
  });
}

function applyActiveCellStyles(cell: HTMLElement): void {
  Object.assign(cell.style, {
    border: "2px solid var(--gethen-active-cell-border, #176b87)",
    background: "var(--gethen-active-cell-background, #fff8df)",
    zIndex: "5"
  });
}

function createCellEditor<TRow extends GridRow>(
  host: HTMLElement,
  input: VirtualDomGridCellInput<TRow>,
  context: Parameters<NonNullable<GridColumnView<TRow>["formatter"]>>[0],
  draftValue: CellValue
): GridCellEditor<TRow> | undefined {
  const definition = resolveBuiltInEditor(context.column);
  if (typeof context.column.editor === "function") {
    const editor = context.column.editor();
    const editorContext: GridEditorContext<TRow> = {
      ...context,
      initialValue: draftValue,
      nullable: context.column.nullable === true,
      readonly: context.column.readonly === true,
      signal: input.editorSignal,
      requestCommit: () => input.commitEdit(editor.getValue(), editor),
      requestCancel: () => input.cancelEdit(editor)
    };
    editor.mount(host, editorContext);
    editor.update(editorContext);
    queueMicrotask(() => editor.focus());
    return editor;
  }

  const control = definition.kind === "select"
    ? document.createElement("select")
    : definition.kind === "json"
      ? document.createElement("textarea")
      : document.createElement("input");
  control.dataset.gethenEditor = "true";
  if (control instanceof HTMLInputElement) {
    control.type = definition.kind === "datetime"
      ? "datetime-local"
      : definition.kind === "boolean"
        ? "checkbox"
        : definition.kind;
    if (definition.kind === "boolean") {
      control.checked = draftValue === true;
    } else {
      control.value = String(draftValue ?? "");
    }
  } else if (control instanceof HTMLSelectElement) {
    for (const option of definition.options ?? []) {
      const element = document.createElement("option");
      element.value = String(option.value);
      element.textContent = option.label;
      element.disabled = option.disabled === true;
      control.appendChild(element);
    }
    control.value = String(draftValue ?? "");
  } else {
    control.value = String(draftValue ?? "");
  }
  Object.assign(control.style, { width: "100%", height: "100%", border: "0", padding: "0" });

  const commit = (navigation?: "next" | "previous"): void => {
    const rawValue = control instanceof HTMLInputElement && definition.kind === "boolean"
      ? control.checked
      : control.value;
    const parsed = parseBuiltInEditorValue(rawValue, definition, context.column.nullable === true);
    if ("error" in parsed) {
      control.setAttribute("aria-invalid", "true");
      control.title = parsed.error;
      return;
    }
    input.commitEdit(parsed.value, undefined, navigation);
  };
  control.addEventListener("keydown", (event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === "Enter" && !(control instanceof HTMLTextAreaElement && keyboardEvent.shiftKey)) {
      event.preventDefault();
      event.stopPropagation();
      commit();
    } else if (keyboardEvent.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      commit(keyboardEvent.shiftKey ? "previous" : "next");
    } else if (keyboardEvent.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      input.cancelEdit();
    }
  });
  if (definition.kind === "boolean" || definition.kind === "select") {
    control.addEventListener("change", () => commit());
  }
  host.replaceChildren(control);
  return undefined;
}
