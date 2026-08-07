# Product Scope

Gethen is planned as an MIT-licensed full-stack data grid ecosystem for large, editable, queryable datasets. The differentiator is not that `alpha.1` matches Excel or AG Grid feature-for-feature; it is that the architecture can grow into advanced spreadsheet and analytical features without moving core capabilities behind an enterprise license.

## Product Identity

- Name: Gethen
- Creator identity: TheFoolsPath
- License: MIT
- Initial version: `0.0.0-alpha.1`
- Tagline: One dataset. Every perspective.
- Description: Gethen is an MIT-licensed full-stack data grid ecosystem for displaying, editing, querying, and analyzing large datasets.

Before launch, perform final availability checks for npm scope/package names, NuGet IDs, crates.io crates, GitHub organization/repository, domains, and trademarks. Do not publish or reserve names during planning.

## Alpha Scope

`0.0.0-alpha.1` should prove the core architecture:

- Column definitions for text, number, and boolean fields.
- Row and column virtualization with fixed row height and explicit column widths.
- Hybrid Canvas rendering with DOM overlays for active editor and accessibility.
- Single-cell selection and keyboard navigation.
- Text, number, and boolean editing.
- Client-side DataSource backed by a compute engine.
- Server-side DataSource with offset pagination, cancellation, stale-response protection, loading/error state, retry, and bounded cache.
- Rust/WASM worker engine for local sort/filter/update, with TypeScript fallback.
- React adapter as a stable first adapter.
- Angular adapter as alpha-compatible if feasible; otherwise ship immediately after React.
- Test and benchmark harnesses that define what "large" means.

## Deferred From Alpha

Range selection, multi-cell clipboard, undo/redo, validation framework, date editor, dropdown editor, custom editors, frozen columns, column resize/reorder, grouping, aggregation, pivot, formulas, merged cells, conditional formatting, XLSX import/export, charts, collaboration, comments, multiple sheets, tree data, master/detail, and C# backend implementation are deferred.

## Public Claims

Avoid vague claims like "supports millions of rows." Prefer scenario claims such as:

- Can virtualize a grid with 1,000,000 logical rows and 100 columns without creating DOM nodes per dataset cell.
- Server mode can display large server datasets without downloading all rows.
- Client mode benchmarked against specified dataset shapes and operations.

## Competitor Posture

Use public documentation and behavior only. Do not copy AG Grid Enterprise source, Handsontable source without license review, proprietary Excel behavior, or copyrighted documentation. Gethen should compete through licensing, architecture, performance transparency, and developer experience.
