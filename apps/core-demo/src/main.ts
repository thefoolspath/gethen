import { mountVirtualDomGrid } from "@thefoolspath/gethen-core";
import type { GridColumnView, GridRow } from "@thefoolspath/gethen-core";
import type { CellValue, ColumnId } from "@thefoolspath/gethen-protocol";

const customizationEnabled = new URLSearchParams(window.location.search).get("customization") !== "off";
const alpha3DemoEnabled = new URLSearchParams(window.location.search).get("alpha3") === "on";
const columns: readonly GridColumnView[] = [
  ...Array.from({ length: 50 }, (_, columnIndex): GridColumnView => ({
    id: `c${columnIndex}`,
    title: `Column ${columnIndex + 1}`,
    dataType: columnIndex === 2 ? "boolean" : columnIndex % 5 === 0 ? "number" : "text",
    align: columnIndex % 5 === 0 ? "right" : "left",
    ...(customizationEnabled && columnIndex % 5 === 0
      ? {
          className: "gethen-numeric-column",
          formatter: ({ value }) => typeof value === "number" ? value.toLocaleString("en-US") : ""
        }
      : {}),
    ...(alpha3DemoEnabled && columnIndex === 1
      ? {
          renderer: () => ({
            mount(host: HTMLElement, context) {
              host.textContent = `Custom: ${String(context.value ?? "")}`;
              host.dataset.customRenderer = "mounted";
            },
            update() {},
            destroy() {}
          })
        }
      : {}),
    ...(alpha3DemoEnabled && columnIndex === 3 ? { editor: { kind: "json" as const } } : {}),
    ...(alpha3DemoEnabled && columnIndex === 4
      ? {
          editor: {
            kind: "select" as const,
            options: [
              { value: "Open", label: "Open" },
              { value: "Closed", label: "Closed" }
            ]
          }
        }
      : {}),
    ...(alpha3DemoEnabled && columnIndex === 6
      ? {
          editor: () => {
            let input: HTMLInputElement | undefined;
            return {
              mount(host: HTMLElement, context) {
                input = document.createElement("input");
                input.dataset.customEditor = "true";
                input.value = String(context.initialValue ?? "");
                input.addEventListener("keydown", (event) => {
                  if (event.key === "Enter") context.requestCommit();
                  if (event.key === "Escape") context.requestCancel();
                });
                host.replaceChildren(input);
              },
              update() {},
              focus() { input?.focus(); },
              getValue() { return input?.value ?? null; },
              validate(value) {
                return typeof value === "string" && value.startsWith("custom:")
                  ? { valid: true as const }
                  : { valid: false as const, message: "Custom values must start with custom:." };
              },
              commit() {},
              cancel() {},
              destroy() { input = undefined; }
            };
          }
        }
      : {})
  })),
  { id: "internalKey", title: "Internal key", dataType: "text", hidden: true, readonly: true }
];

const rows: readonly GridRow[] = Array.from({ length: 100000 }, (_, rowIndex) => {
  const cells: Record<ColumnId, CellValue> = {};

  for (const column of columns) {
    if (column.id === "internalKey") {
      cells[column.id] = `key-${rowIndex + 1}`;
      continue;
    }

    const columnIndex = Number(column.id.slice(1));
    cells[column.id] =
      columnIndex === 2
        ? rowIndex % 2 === 0
        : columnIndex % 5 === 0
          ? (rowIndex + 1) * (columnIndex + 1)
          : `R${rowIndex + 1} ${column.title}`;
  }

  return {
    id: `row-${rowIndex + 1}`,
    cells
  };
});

const gridApi = mountVirtualDomGrid(requireElement("gridHost"), {
  columns,
  rows,
  ...(customizationEnabled
    ? {
        styling: {
          getRowClass: ({ rowIndex }: { rowIndex: number }) =>
            rowIndex % 2 === 1 ? "gethen-alternate-row" : undefined,
          getCellClass: ({ column, value }: { column: GridColumnView; value: CellValue | undefined }) =>
            column.id === "c2" && value === true ? "gethen-true-cell" : undefined
        },
        theme: {
          activeCellBorder: "#0f766e",
          activeCellBackground: "#f0fdfa"
        }
      }
    : {}),
  clipboard: {
    enabled: true,
    pasteMode: "direct-and-dialog",
    validateBeforeCommit: true,
    emptyCellValue: null
  },
  history: { maxEntries: 100, maxRetainedBytes: 4 * 1024 * 1024 },
  onRender(metrics) {
    requireElement("renderedCells").textContent = String(metrics.renderedCellCount);
    requireElement("renderTime").textContent = `${metrics.renderMs.toFixed(2)} ms`;
  },
  onSelectionChange(selection) {
    requireElement("activeCell").textContent = `${selection.rowId} / ${selection.columnId}`;
  },
  onCellChange(change) {
    requireElement("lastChange").textContent =
      `${change.rowId} / ${change.columnId}: ${String(change.oldValue)} -> ${String(change.newValue)}`;
  },
  onPaste(result) {
    requireElement("lastPaste").textContent = result.committed
      ? `${result.changes.length} cells committed`
      : `${result.errors.length} cells rejected`;
  },
  onLayoutChange(event) {
    requireElement("layoutStatus").textContent =
      `${event.reason}: ${event.state.frozenRowCount} x ${event.state.frozenColumnCount}`;
  },
  onHistoryChange(event) {
    requireElement("historyStatus").textContent = `${event.undoCount} undo / ${event.redoCount} redo`;
  },
  onEditorStateChange(state) {
    requireElement("editorStatus").textContent = state.phase;
  }
});

requireElement("resizeColumn").addEventListener("click", () => gridApi.resizeColumn("c0", 220));
requireElement("reorderColumn").addEventListener("click", () => gridApi.reorderColumn("c1", 0));
requireElement("freezePanes").addEventListener("click", () => gridApi.freezePanes(2, 2));
requireElement("undo").addEventListener("click", () => gridApi.undo());
requireElement("redo").addEventListener("click", () => gridApi.redo());

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }

  return element;
}
