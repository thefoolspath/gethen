import {
  createGridColumnarBuffer,
  createGridAggregatePinnedRow,
  createGridWorkerShapeDefinition,
  createRustWasmWorkerEngine,
  createRustWasmWorkerGridEngine,
  createTypeScriptWorkerGridEngine,
  mountVirtualDomGrid,
  typescriptFilterAggregate
} from "@thefoolspath/gethen-core";
import type { GridColumnView, GridRow } from "@thefoolspath/gethen-core";
import type { CellValue, ColumnId } from "@thefoolspath/gethen-protocol";

const searchParams = new URLSearchParams(window.location.search);
const customizationEnabled = searchParams.get("customization") !== "off";
const alpha3DemoEnabled = searchParams.get("alpha3") === "on";
const emptyDemoEnabled = searchParams.get("empty") === "on";
const columns: readonly GridColumnView[] = [
  ...Array.from({ length: 50 }, (_, columnIndex): GridColumnView => ({
    id: `c${columnIndex}`,
    title: `Column ${columnIndex + 1}`,
    dataType: columnIndex === 2 ? "boolean" : columnIndex % 5 === 0 ? "number" : "text",
    align: columnIndex % 5 === 0 ? "right" : "left",
    ...(customizationEnabled && columnIndex === 0 ? { headerClassName: "gethen-primary-header" } : {}),
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

const pinnedBottomRows = [createGridAggregatePinnedRow({
  rows,
  aggregates: [
    { id: "c0", operation: "sum", columnId: "c0" },
    { id: "c5", operation: "average", columnId: "c5" }
  ],
  labelColumnId: "c1",
  label: "Total / average"
})];
const renderedRows = emptyDemoEnabled ? [] : rows;

const gridApi = mountVirtualDomGrid(requireElement("gridHost"), {
  columns,
  rows: renderedRows,
  pinnedBottomRows: emptyDemoEnabled ? [] : pinnedBottomRows,
  statusBar: { totalRowCount: renderedRows.length },
  ...(customizationEnabled
    ? {
        styling: {
          getRowClass: ({ rowIndex }: { rowIndex: number }) =>
            rowIndex % 2 === 1 ? "gethen-alternate-row" : undefined,
          getHeaderClass: ({ column }: { column: GridColumnView }) =>
            column.id === "c2" ? "gethen-boolean-header" : undefined,
          getCellClass: ({ column, value }: { column: GridColumnView; value: CellValue | undefined }) =>
            column.id === "c2" && value === true ? "gethen-true-cell" : undefined
        },
        theme: {
          density: "comfortable" as const,
          activeCellBorder: "#0f766e",
          activeCellBackground: "#f0fdfa",
          headerBackground: "#f0f4f7"
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
requireElement("runWorker").addEventListener("click", async () => {
  const engine = createTypeScriptWorkerGridEngine();
  try {
    const data = createGridColumnarBuffer(rows.slice(0, 100), [
      { columnId: "c0", storage: "float64" },
      { columnId: "c1", storage: "utf8" },
      { columnId: "c2", storage: "boolean" }
    ]);
    const result = await engine.shape({
      data,
      definition: createGridWorkerShapeDefinition({
        filter: [{ columnId: "c0", operator: "greaterThan", value: 50, comparisonType: "number" }],
        sort: [{ columnId: "c0", direction: "desc", comparisonType: "number" }],
        group: [{ columnId: "c2", comparisonType: "boolean" }],
        aggregate: [{ id: "sum", operation: "sum", columnId: "c0" }]
      }),
      onProgress: (progress) => {
        requireElement("workerStatus").textContent = progress.stage;
      }
    });
    requireElement("workerStatus").textContent = `${result.filteredRowCount} filtered / ${result.rows.length} view rows`;
  } finally {
    engine.destroy();
  }
});
requireElement("runWasmWorker").addEventListener("click", async () => {
  const engine = createRustWasmWorkerEngine();
  try {
    const values = Float64Array.from({ length: 100 }, (_, index) => index + 1);
    const validity = new Uint8Array(100).fill(1);
    const expected = typescriptFilterAggregate(values, validity, 50);
    const result = await engine.filterAggregate(values, validity, 50, {
      onProgress: (stage) => {
        requireElement("wasmStatus").textContent = stage;
      }
    });
    requireElement("wasmStatus").textContent = result.count === expected.count && result.sum === expected.sum
      ? `parity: ${result.count} rows / sum ${result.sum}`
      : "parity mismatch";
  } finally {
    engine.destroy();
  }
});
requireElement("runEngineParity").addEventListener("click", async () => {
  const typescriptEngine = createTypeScriptWorkerGridEngine();
  const rustEngine = createRustWasmWorkerGridEngine();
  const columns = [
    { columnId: "c0", storage: "float64" as const },
    { columnId: "c1", storage: "utf8" as const },
    { columnId: "c2", storage: "boolean" as const }
  ];
  const definition = createGridWorkerShapeDefinition({
    filter: [
      { columnId: "c0", operator: "greaterThan", value: 50, comparisonType: "number" },
      { columnId: "c1", operator: "contains", value: "column", comparisonType: "text" }
    ],
    sort: [
      { columnId: "c2", direction: "asc", comparisonType: "boolean" },
      { columnId: "c1", direction: "desc", comparisonType: "text" },
      { columnId: "c0", direction: "desc", comparisonType: "number" }
    ],
    group: [{ columnId: "c2", comparisonType: "boolean" }],
    aggregate: [{ id: "sum", operation: "sum", columnId: "c0" }]
  });
  try {
    const [typescriptResult, rustResult] = await Promise.all([
      typescriptEngine.shape({ data: createGridColumnarBuffer(rows.slice(0, 100), columns), definition }),
      rustEngine.shape({ data: createGridColumnarBuffer(rows.slice(0, 100), columns), definition })
    ]);
    requireElement("wasmStatus").textContent = JSON.stringify(typescriptResult) === JSON.stringify(rustResult)
      ? `full parity: ${rustResult.rows.length} view rows`
      : "full parity mismatch";
  } finally {
    typescriptEngine.destroy();
    rustEngine.destroy();
  }
});

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }

  return element;
}
