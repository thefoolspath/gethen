import { createGridAggregatePinnedRow, shapeGridData } from "@thefoolspath/gethen-core";
import type {
  GridClipboardOptions,
  GridHistoryOptions,
  GridRow,
  GridStylingOptions,
  VirtualDomGridTheme
} from "@thefoolspath/gethen-core";
import type { GethenAngularGridColumn } from "@thefoolspath/gethen-angular";
import type { CellValue } from "@thefoolspath/gethen-protocol";

import type { DemoKind } from "./docs-data.js";

export interface DemoConfig {
  readonly columns: readonly GethenAngularGridColumn[];
  readonly rows: readonly GridRow[];
  readonly pinnedBottomRows: readonly GridRow[];
  readonly clipboard: GridClipboardOptions | undefined;
  readonly history: GridHistoryOptions | false;
  readonly styling: GridStylingOptions | undefined;
  readonly theme: VirtualDomGridTheme;
  readonly frozenRowCount: number;
  readonly frozenColumnCount: number;
  readonly statusBar: { readonly totalRowCount: number };
}

const angularBasicCode = `import { Component } from "@angular/core";
import { GethenGridComponent } from "@thefoolspath/gethen-angular";
import type { GridColumnView, GridRow } from "@thefoolspath/gethen-core";

@Component({
  standalone: true,
  imports: [GethenGridComponent],
  template: \`
    <gethen-grid
      [columns]="columns"
      [rows]="rows"
      [rowNumbers]="true"
      [statusBar]="{ totalRowCount: rows.length }"
    />
  \`
})
export class OrdersGridComponent {
  readonly columns: readonly GridColumnView[] = columns;
  readonly rows: readonly GridRow[] = rows;
}`;

const demoCode: Partial<Record<DemoKind, string>> = {
  selection: `<gethen-grid
  [columns]="columns"
  [rows]="rows"
  (selectionChange)="handleSelection($event)"
  (selectionRangeChange)="handleRange($event)"
/>`,
  editing: `<gethen-grid
  [columns]="columns"
  [rows]="rows"
  (cellChange)="save($event)"
  (editorStateChange)="observeEditor($event)"
/>`,
  clipboard: `<gethen-grid
  [columns]="columns"
  [rows]="rows"
  [clipboard]="{
    enabled: true,
    pasteMode: 'direct-and-dialog',
    validateBeforeCommit: true
  }"
  (pasteResult)="handlePaste($event)"
/>`,
  layout: `<gethen-grid #grid [columns]="columns" [rows]="rows"
  (layoutChange)="persist($event.state)" />

<button (click)="grid.resizeColumn('customer', 240)">Resize</button>
<button (click)="grid.reorderColumn('status', 0)">Reorder</button>`,
  frozen: `<gethen-grid
  [columns]="columns"
  [rows]="rows"
  [frozenRowCount]="2"
  [frozenColumnCount]="2"
/>`,
  history: `<gethen-grid #grid
  [columns]="columns"
  [rows]="rows"
  [history]="{ maxEntries: 100, maxRetainedBytes: 4194304 }"
  (historyChange)="observeHistory($event)"
/>

<button (click)="grid.undo()">Undo</button>
<button (click)="grid.redo()">Redo</button>`,
  theme: `import { gethenDarkTheme, gethenLightTheme } from "@thefoolspath/gethen-core";

readonly lightTheme = gethenLightTheme;
readonly darkTheme = gethenDarkTheme;
readonly brandedOverride = {
  ...gethenDarkTheme,
  activeCellBorder: "#ff5a5f"
};

// Object preset:
// <gethen-grid [theme]="darkTheme" [columns]="columns" [rows]="rows" />

// Direct host-scoped CSS variable override remains supported:
// .orders-grid { --gethen-active-cell-border: #ff5a5f; }`,
  formatting: `readonly columns: readonly GridColumnView[] = [{
  id: "total",
  title: "Total",
  dataType: "number",
  formatter: ({ value }) => formatCurrency(value)
}];

// Pass these public definitions through <gethen-grid [columns]="columns" />.`,
  "custom-renderer": `import type { GethenAngularRendererRegistry } from "@thefoolspath/gethen-angular";

readonly rendererRegistry: GethenAngularRendererRegistry = {
  customerBadge: { component: CustomerBadgeComponent }
};

// <gethen-grid [columns]="columns" [rendererRegistry]="rendererRegistry" />`,
  "custom-editor": `readonly columns: readonly GethenAngularGridColumn[] = [{
  id: "status",
  title: "Status",
  dataType: "text",
  editor: {
    kind: "select",
    options: [
      { value: "Ready", label: "Ready" },
      { value: "Review", label: "Review" }
    ]
  }
}];`,
  shaping: `import { shapeGridData } from "@thefoolspath/gethen-core";

readonly shaped = shapeGridData({
  rows,
  filter: [{ columnId: "total", operator: "greaterThan", value: 500 }],
  sort: [{ columnId: "total", direction: "desc" }],
  group: [{ columnId: "region" }],
  aggregate: [{ id: "total", operation: "sum", columnId: "total" }],
  expandedGroupIds: "all"
});

// <gethen-grid [columns]="columns" [rows]="shaped.rows" />`,
  readonly: `<gethen-grid
  [columns]="readonlyColumns"
  [rows]="rows"
  [clipboard]="{ enabled: false }"
  [history]="false"
/>`
};

export function codeForDemo(kind: DemoKind): string {
  return demoCode[kind] ?? angularBasicCode;
}

export function createDemoConfig(kind: DemoKind): DemoConfig {
  const sourceRows = createRows(kind === "large" ? 20_000 : 1_000);
  const rows = kind === "shaping" ? shapeDemoRows(sourceRows) : sourceRows;
  const columns = createColumns(kind);
  const pinnedBottomRows = kind === "theme"
    ? [createGridAggregatePinnedRow({
        rows: sourceRows,
        aggregates: [{ id: "total", operation: "sum", columnId: "total" }],
        labelColumnId: "customer",
        label: "Portfolio total"
      })]
    : [];

  return {
    columns,
    rows,
    pinnedBottomRows,
    clipboard: kind === "readonly"
      ? { enabled: false }
      : kind === "clipboard"
        ? { enabled: true, pasteMode: "direct-and-dialog", validateBeforeCommit: true, emptyCellValue: null }
        : undefined,
    history: kind === "readonly" ? false : { maxEntries: 100, maxRetainedBytes: 4 * 1024 * 1024 },
    styling: kind === "formatting"
      ? {
          getRowClass: ({ rowIndex }) => rowIndex % 2 === 1 ? "docs-alt-row" : undefined,
          getCellClass: ({ column, value }) => column.id === "total" && typeof value === "number" && value > 20_000
            ? "docs-high-value"
            : undefined,
          getHeaderClass: ({ column }) => column.id === "total" ? "docs-total-header" : undefined
        }
      : undefined,
    theme: {},
    frozenRowCount: kind === "frozen" ? 2 : 0,
    frozenColumnCount: kind === "frozen" ? 2 : 0,
    statusBar: { totalRowCount: rows.length }
  };
}

export function shapeDemoRows(rows = createRows(1_000)): readonly GridRow[] {
  return shapeGridData({
    rows,
    filter: [{ columnId: "total", operator: "greaterThan", value: 500, comparisonType: "number" }],
    sort: [{ columnId: "total", direction: "desc", comparisonType: "number" }],
    group: [{ columnId: "region", comparisonType: "text" }],
    aggregate: [{ id: "total", operation: "sum", columnId: "total" }],
    expandedGroupIds: "all",
    viewport: { start: 0, count: 100 }
  }).rows;
}

function createColumns(kind: DemoKind): readonly GethenAngularGridColumn[] {
  const readonly = kind === "readonly";
  return [
    { id: "order", title: "Order", dataType: "number", align: "right", readonly: true },
    {
      id: "customer",
      title: "Customer",
      dataType: "text",
      readonly,
      ...(kind === "custom-renderer"
        ? {
            renderer: () => ({
              mount(host: HTMLElement, context: { value: CellValue | undefined }) {
                const badge = document.createElement("span");
                badge.className = "customer-badge";
                badge.textContent = String(context.value ?? "");
                host.replaceChildren(badge);
              },
              update() {},
              destroy() {}
            })
          }
        : {})
    },
    { id: "region", title: "Region", dataType: "text", readonly },
    {
      id: "status",
      title: "Status",
      dataType: "text",
      readonly,
      ...(kind === "custom-editor"
        ? {
            editor: {
              kind: "select" as const,
              options: [
                { value: "Ready", label: "Ready" },
                { value: "Review", label: "Review" },
                { value: "Blocked", label: "Blocked" }
              ]
            }
          }
        : {})
    },
    {
      id: "total",
      title: "Total",
      dataType: "number",
      align: "right",
      readonly,
      ...(kind === "formatting" ? { formatter: ({ value }) => formatCurrency(value) } : {})
    },
    { id: "approved", title: "Approved", dataType: "boolean", readonly }
  ];
}

function createRows(count: number): readonly GridRow[] {
  const customers = ["Northwind", "Contoso", "Adventure Works", "Tailspin"] as const;
  const regions = ["APAC", "EMEA", "Americas"] as const;
  return Array.from({ length: count }, (_, index) => ({
    id: `order-${index + 1}`,
    cells: {
      order: index + 1,
      customer: customers[index % customers.length] ?? "Customer",
      region: regions[index % regions.length] ?? "APAC",
      status: index % 3 === 0 ? "Review" : "Ready",
      total: (index + 1) * 37.5,
      approved: index % 4 !== 0
    }
  }));
}

function formatCurrency(value: CellValue | undefined): string {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
    : "";
}
