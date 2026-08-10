# Grid Customization

Last reviewed: 2026-08-10.

Status: Initial Alpha 2 view-customization and rectangular range-selection surfaces implemented. Row transactions and clipboard behavior remain planned.

## Core API

`GridColumnView` extends the protocol column definition with renderer-facing metadata:

- `hidden` omits a column from the rendered viewport without removing its value from row data.
- `align` controls cell text alignment.
- `className` accepts an application class string or array of class strings.
- `formatter` converts a cell value to text. It does not render HTML.

`GridStylingOptions` provides `getRowClass` and `getCellClass` callbacks. Callbacks run only for cells in the virtualized render window and receive stable row identity, visible indexes, column metadata, and the current value.

```ts
import { mountVirtualDomGrid } from "@thefoolspath/gethen-core";
import type { GridColumnView } from "@thefoolspath/gethen-core";

const columns: readonly GridColumnView[] = [
  { id: "id", title: "ID", dataType: "text", hidden: true },
  {
    id: "amount",
    title: "Amount",
    dataType: "number",
    align: "right",
    className: "tabular-nums",
    formatter: ({ value }) => typeof value === "number" ? value.toLocaleString() : ""
  }
];

mountVirtualDomGrid(host, {
  columns,
  rows,
  styling: {
    getCellClass: ({ column, value }) =>
      column.id === "amount" && typeof value === "number" && value < 0
        ? "text-red-600"
        : undefined
  }
});
```

Class names belong to the host application, so utility classes and design-system classes can be used without a renderer plugin. Multiple whitespace-separated classes are normalized and duplicate class names are removed.

## Theme Overrides

`VirtualDomGridTheme` exposes initial color, typography, padding, grid-line, and active-cell tokens. The renderer maps supplied tokens to CSS custom properties on the grid root. Applications may also override these properties directly per grid container.

## Range Selection

Users can extend a rectangular range from the active-cell anchor with `Shift` plus an arrow, `Home`, or `End`, or with `Shift` plus a pointer click. Navigation without `Shift` collapses the range to the new active cell.

The existing `onSelectionChange` callback continues to report the focused cell. `onSelectionRangeChange` reports the anchor, focus, and normalized start/end row and column indexes. Selected cells use `aria-selected="true"`, including virtualized cells that are recreated after scrolling.

The Angular adapter exposes the same state through `selectionRangeChange`.

## DTO Mapping

`createGridModel` converts application DTOs into renderer rows from explicit `GridModelColumn` metadata. Exactly one column must be marked `key`; its non-empty string or numeric value becomes stable row identity. A key column may be hidden from the rendered viewport while remaining available in row cells and source DTO lookup.

The mapper validates duplicate fields, duplicate row identities, nullability, declared text/number/boolean types, and finite numeric values. Each mapped `GridModelRow` retains its source DTO as `source`, so typed styling callbacks can use application fields without reverse lookup.

```ts
const model = createGridModel({
  columns: [
    { field: "id", dataType: "text", key: true, hidden: true },
    { field: "customerName", title: "Customer", dataType: "text" },
    { field: "amount", dataType: "number", align: "right" }
  ],
  rows: orders
});

mountVirtualDomGrid(host, {
  columns: model.columns,
  rows: model.rows,
  styling: {
    getRowClass: ({ row }) => row.source.amount < 0 ? "text-red-600" : undefined
  }
});
```

## Row Transactions

`createRowTransactionManager` provides one active edit or insert transaction at a time. Edits preserve an original row snapshot, remove fields from `changes` when reverted, reject stable-identity changes, and do not mutate the authoritative row until `save`. Cancel discards the draft.

Save returns the affected row only:

```ts
const transactions = createRowTransactionManager({
  rows: orders,
  getRowId: model.getRowId
});

transactions.beginEdit("order-1");
transactions.updateField("amount", 125);

const payload = transactions.save();
// { mode: "edit", rowId: "order-1", row, originalRow, changes: { amount: 125 } }
```

The manager is framework-neutral and synchronous. The host application owns API calls and can decide when to replace server-authoritative data after success or failure.

## Clipboard Paste

Clipboard handling is disabled unless `clipboard.enabled` is `true`. Direct paste reads only `text/plain`, starts at the active cell, parses tab/newline-delimited values, validates the complete payload, and commits all cells or none. Successful paste selects the affected rectangle and emits typed cell-change events plus one paste result.

Default parsing supports text, finite numbers, and `true`/`false` or `1`/`0` booleans. Blank values commit only when the destination column is nullable; `emptyCellValue` selects `null` or an empty string. `parsePasteCell` supports application formats such as dates, while `validatePasteCell` provides business validation and per-cell messages.

`pasteMode` accepts `direct`, `dialog`, or `direct-and-dialog`. In dialog modes, a host-owned preview can call `prepareGridPaste` with pasted text and render the returned changes or per-cell errors before applying data. A renderer-owned dialog UI is not yet included.

Pasted formulas, HTML, and other rich content are not executed. Formula-looking values in text columns remain inert strings.

## Angular Adapter

`GethenGridComponent` accepts `styling` and `theme` inputs and passes them to core. The adapter does not duplicate class resolution, formatting, or range-selection logic.

## Security And Deferred APIs

Formatters return text and are assigned through `textContent`; cell values and formatter output are not interpreted as HTML. Custom renderers, custom editors, raw HTML formatters, renderer-owned row action controls, async server reconciliation helpers, and a renderer-owned paste dialog remain outside the implemented slices.
