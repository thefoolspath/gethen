# Developer Customization And Row Transaction Plan

Last reviewed: 2026-08-10.

Status: Implemented and locally verified for the `0.0.0-alpha.2` release candidate. No package is published. Cross-hardware/full-frame-trace evidence remains deferred before external performance claims.

## Implementation Progress

- [x] Add core view metadata for hidden columns, alignment, application classes, and text formatters.
- [x] Add typed row and cell class callbacks that run within the virtualized viewport.
- [x] Add initial CSS-variable theme tokens.
- [x] Pass styling and theme options through the Angular adapter.
- [x] Add unit and browser regression coverage for the initial customization surface.
- [x] Add DTO-to-column mapping with runtime metadata checks and one stable hidden key field.
- [x] Add headless single-row edit, insert, cancel, and save transactions with changed-field payloads.
- [x] Add rectangular range selection with Shift+keyboard and Shift+click interactions.
- [x] Add opt-in direct clipboard paste and a pure preparation API for host-owned dialog previews, with all-or-nothing validation-before-commit.
- [x] Add a repeat-iteration JavaScript baseline for customization and 1,000-cell clipboard preparation/validation.
- [x] Measure initial callback and formatter render cost across repeated Chromium scroll positions.
- [x] Capture a local DevTools-style frame trace across three independent Chromium processes per scenario.
- [ ] Repeat trace evidence in headed/cross-hardware environments before external performance claims.

## Completion Evidence

- `pnpm run build` passed.
- `pnpm run check` passed.
- `pnpm run test` passed with 34 tests.
- `pnpm run test:browser` passed with 17 Chromium tests.
- `pnpm run bench` passed, including TypeScript, browser, Alpha 2, and GNU Rust stages.
- Local CDP frame tracing recorded no task over 50 ms and no customization-on median regression; results remain too close to the 16.7 ms scheduling boundary for a cross-hardware claim.
- Package dry-run inspection passed for protocol, core, and Angular at `0.0.0-alpha.2`.
- No runtime dependency was added.
- CR-20260808-002 and CR-20260808-003 are marked done in the intake log.
- [Alpha 2 release notes](../../project/ALPHA_2_RELEASE_NOTES.md) record included and deferred behavior.

## Goal

Make Gethen friendly for application developers who need to adapt the grid to their product UI, DTO shape, and API save flow without relying on renderer internals.

The first public surface should support custom CSS frameworks such as Tailwind, Bootstrap, PrimeNG, or application-owned design systems, while keeping custom renderers and custom editors private until the core API is stable enough.

## Outcome

Developers can:

1. Use their own CSS class names for rows, columns, headers, and cells.
2. Apply conditional styling by row, column, or cell.
3. Align and format values without replacing the renderer.
4. Hide primary keys or other DTO fields from the visible grid.
5. Edit or insert a row and save only that row to an API.
6. Receive row-level save payloads that include the current row, original row, and changed fields.
7. Opt into spreadsheet-style clipboard paste from Excel, MySQL Workbench, or similar tabular sources.
8. Validate pasted values before committing them and receive per-cell errors for invalid data.

## Related Documents

- [../../product/ROADMAP.md](../../product/ROADMAP.md)
- [../../project/ISSUE_AND_CHANGE_REQUESTS.md](../../project/ISSUE_AND_CHANGE_REQUESTS.md)
- [../../architecture/DATA_MODEL.md](../../architecture/DATA_MODEL.md)
- [../../architecture/DATA_SOURCE.md](../../architecture/DATA_SOURCE.md)
- [../../architecture/PACKAGE_BOUNDARIES.md](../../architecture/PACKAGE_BOUNDARIES.md)
- [../../architecture/ACCESSIBILITY_AND_SECURITY.md](../../architecture/ACCESSIBILITY_AND_SECURITY.md)

## Scope

### Public Styling Surface

Gethen should not own public class names such as `cell-success` or `cell-danger`. Those are examples only. The public API should let the host application return its own class names.

Initial styling options should be class-first:

```ts
type GridClassValue = string | readonly string[] | undefined;

interface GridColumnView {
  readonly field: string;
  readonly title?: string;
  readonly hidden?: boolean;
  readonly key?: boolean;
  readonly readonly?: boolean;
  readonly width?: number;
  readonly align?: "left" | "center" | "right";
  readonly className?: GridClassValue;
  readonly headerClassName?: GridClassValue;
}

interface GridStylingOptions<TRow> {
  readonly getRowClass?: (context: RowClassContext<TRow>) => GridClassValue;
  readonly getCellClass?: (context: CellClassContext<TRow>) => GridClassValue;
  readonly getHeaderClass?: (context: HeaderClassContext<TRow>) => GridClassValue;
}
```

Example Tailwind-friendly usage:

```ts
getCellClass: ({ column, value }) => {
  if (column.field === "status" && value === "Approved") {
    return "bg-green-50 text-green-700";
  }

  if (column.field === "status" && value === "Rejected") {
    return "bg-red-50 text-red-700";
  }

  if (column.field === "amount" && typeof value === "number" && value < 0) {
    return "text-red-600 tabular-nums";
  }

  return undefined;
}
```

Inline style callbacks may be added later as an escape hatch, but they should not be the first recommendation because per-cell inline styles can increase rendering cost in large virtualized grids.

### Theme Tokens

Theme tokens should control default grid appearance without forcing a CSS framework:

- background
- text color
- header background
- grid line color
- active cell border
- active cell background
- readonly/disabled color
- edit input focus color
- default row height
- default column width
- header height
- cell padding
- font family
- font size
- density preset: `compact`, `comfortable`, or `spacious`

Theme tokens should be implemented through CSS variables where practical so host applications can override them globally or per grid instance.

### Conditional Styling

Conditional styling must support three levels:

| Level | Purpose | Example |
| --- | --- | --- |
| Column | Whole-column display rules | Align numeric columns to the right. |
| Row | Whole-row state | Muted class for archived rows. |
| Cell | Value-specific display | Negative numbers red; status-specific classes. |

Class callbacks must receive enough context to avoid reaching into renderer internals:

```ts
interface CellClassContext<TRow> {
  readonly row: TRow;
  readonly rowId: string;
  readonly rowIndex: number;
  readonly column: GridColumnView;
  readonly columnIndex: number;
  readonly value: unknown;
}
```

### Value Formatting

Formatting should be separate from styling:

```ts
interface GridColumnView<TRow = unknown> {
  readonly field: string;
  readonly formatter?: (context: CellFormatContext<TRow>) => string;
}
```

Formatters should return text, not raw HTML, for the first public version. Rendering trusted HTML or host components should remain deferred until a custom renderer/editor contract is designed with security and accessibility rules.

### DTO And Column Mapping

Gethen should support DTO-shaped rows without requiring callers to reshape all data into internal `cells` records forever.

Recommended public model:

```ts
interface GridModelColumn<TRow> {
  readonly field: keyof TRow & string;
  readonly title?: string;
  readonly dataType: "text" | "number" | "boolean";
  readonly nullable?: boolean;
  readonly hidden?: boolean;
  readonly key?: boolean;
  readonly readonly?: boolean;
  readonly width?: number;
  readonly align?: "left" | "center" | "right";
}
```

Example:

```ts
type OrderDto = {
  id: string;
  customerName: string;
  amount: number;
  status: string;
};

const columns: readonly GridModelColumn<OrderDto>[] = [
  { field: "id", dataType: "text", key: true, hidden: true },
  { field: "customerName", title: "Customer", dataType: "text" },
  { field: "amount", title: "Amount", dataType: "number", align: "right" },
  { field: "status", title: "Status", dataType: "text" }
];
```

The grid should not rely on TypeScript runtime class reflection as the primary mechanism because type metadata is not available at runtime without decorators, schema generation, or framework-specific tooling. Future helpers may generate column definitions from DTO metadata, but explicit column config must remain the portable baseline.

### Optional Clipboard Paste And Validation

Spreadsheet-style paste should be an explicit developer opt-in, not default behavior. Many product grids should remain read-only or API-controlled, and clipboard input must be treated as untrusted.

Target use cases:

- Copy tabular data from Excel and paste into Gethen.
- Copy query results from MySQL Workbench and paste into Gethen.
- Preserve intentionally blank cells where the target column allows empty values.
- Validate every affected cell before changing grid data.
- Tell the user exactly which pasted cells are invalid.

Recommended first public shape:

```ts
interface GridClipboardOptions<TRow> {
  readonly enabled?: boolean;
  readonly pasteMode?: "direct" | "dialog" | "direct-and-dialog";
  readonly validateBeforeCommit?: boolean;
  readonly emptyCellValue?: null | "";
  readonly parsePasteCell?: (context: PasteCellParseContext<TRow>) => PasteCellParseResult;
  readonly validatePasteCell?: (context: PasteCellValidationContext<TRow>) => PasteCellValidationResult;
}
```

Default recommendation:

```ts
clipboard: {
  enabled: true,
  pasteMode: "direct-and-dialog",
  validateBeforeCommit: true,
  emptyCellValue: null
}
```

Direct paste should allow the user to select a starting cell and press `Ctrl+V`, matching Excel expectations. Dialog paste should expose a paste button that opens a multiline input or preview surface before commit. The dialog path is useful for large payloads or business-critical validation because the user can review errors before the grid changes.

Blank cells are valid only when column metadata or a developer validator allows them. For example, a blank `MOD DATE TIME` value copied from MySQL Workbench should map to `null` when the destination column is nullable. A blank required field should fail validation.

Per-cell validation errors should include enough context for both UI display and host-app logging:

```ts
interface PasteCellValidationError {
  readonly rowOffset: number;
  readonly columnOffset: number;
  readonly rowId?: string;
  readonly columnId: string;
  readonly columnTitle?: string;
  readonly rawValue: string;
  readonly message: string;
}
```

The first implementation should use an all-or-nothing commit by default: if any pasted cell is invalid, no pasted values are applied. A future option may allow partial commit, but that behavior should not be the default because it is easy to miss failed cells in large paste operations.

Date and datetime values need an explicit plan before implementation. The current alpha data type surface is text, number, and boolean; real clipboard workflows require either built-in `date`/`datetime` support or developer-provided parse/validate callbacks. For alpha.2, developer callbacks are the safest baseline unless a broader data type expansion is accepted.

### Row Edit, Insert, And Save

The grid should support row-level transactions in addition to cell-level change events.

Planned user flows:

- Start editing one row.
- Track dirty fields for that row.
- Cancel row edits and restore the original row.
- Insert a new draft row.
- Save only the edited or inserted row.
- Return enough payload for the host app to call its API.

Proposed event shape:

```ts
type RowSaveMode = "edit" | "insert";

interface RowSaveEvent<TRow> {
  readonly mode: RowSaveMode;
  readonly rowId: string;
  readonly row: TRow;
  readonly originalRow?: TRow;
  readonly changes: Partial<TRow>;
}
```

The save event should return only the affected row and changed fields. The host application can then call APIs such as `PUT /orders/{id}` for edits or `POST /orders` for inserts.

### DataSource Relationship

Client-side mode can apply row transactions locally before or after host confirmation, depending on the chosen editing mode.

Server-side mode must treat the server as authoritative. Row save callbacks should support async success/failure and stale update protection. This should align with the existing DataSource direction instead of introducing a separate save mechanism that conflicts with server ownership.

## Public API Boundaries

The API should be split into three stable concepts:

1. Data schema: field, key, type, nullable or readonly semantics.
2. Column view config: title, hidden, width, align, class names, formatting.
3. Edit transaction: dirty state, inserted rows, row save, row cancel, validation result.
4. Clipboard transaction: opt-in paste behavior, raw text parsing, pre-commit validation, and per-cell validation errors.

This keeps future changes smaller. For example, a later React adapter, backend protocol, or C# DTO helper can target schema and transaction contracts without rewriting renderer styling callbacks.

## Explicitly Deferred

- Custom cell renderer components.
- Custom editor components.
- Rendering raw HTML returned by formatter callbacks.
- Framework-specific per-cell component mounting.
- Public renderer plugin contract.
- Runtime class reflection as the required DTO mapping mechanism.
- Backend-specific DTO attribute mapping until backend packages are planned.
- Partial paste commit as the default behavior.
- XLSX file import/export.
- Clipboard formulas, formatting, images, comments, merged cells, and rich text.

## Acceptance Criteria

- Public customization examples work with application-owned class names, including Tailwind-style utility classes.
- Conditional row, column, and cell styling are covered by typed callbacks.
- Negative numeric values can be styled red without custom renderer code.
- Status cells can be styled differently per value without custom renderer code.
- DTO rows can map visible columns explicitly while hiding a primary key column.
- Row edit and insert flows can save only the affected row.
- Row save payload includes `row`, `originalRow` when applicable, and `changes`.
- Clipboard paste is disabled unless the developer explicitly enables it.
- Direct `Ctrl+V` paste and paste-dialog flows are both accounted for in the public API design.
- Blank pasted cells can commit only when the destination column is nullable or the developer validator accepts the blank value.
- Invalid pasted values are rejected before commit and surfaced with row/column/cell context.
- Clipboard parsing treats pasted text as untrusted text and does not execute HTML or formulas.
- Formatter callbacks return text only.
- Public docs explain that custom renderers and custom editors remain deferred.

## Tests

Future implementation should include:

- Unit tests for column metadata normalization.
- Unit tests for class callback resolution and class merging.
- Unit tests for hidden primary-key columns preserving row identity.
- Unit tests for row dirty-state tracking.
- Unit tests for row insert, cancel, and save payload generation.
- Unit tests for tab/newline clipboard parsing, including trailing blank cells.
- Unit tests for nullable versus required blank pasted cells.
- Unit tests for all-or-nothing paste validation failures.
- Browser tests for conditional styling in virtualized rows.
- Browser tests for direct paste from tab-separated text into a selected cell.
- Browser tests for paste-dialog validation errors.
- Adapter tests confirming Angular passes styling and row-save options to core without duplicating business logic.

## Performance Checks

Conditional class callbacks should be measured against the virtualized renderer budget. Benchmarks should compare:

- no callbacks
- column class only
- row class callback
- cell class callback
- formatter callback
- clipboard validation for small and large paste payloads

The implementation should avoid invoking callbacks for non-rendered logical cells.

Clipboard benchmarks should include representative tab-separated payloads copied from Excel and MySQL Workbench. Validation cost should be measured separately from render cost, and large paste operations should avoid blocking the UI for longer than the accepted input-latency budget.

## Documentation Updates

When implemented, update:

- public core API docs
- Angular adapter docs
- roadmap status
- package release notes
- accessibility and security notes if formatter, clipboard, or renderer behavior changes
