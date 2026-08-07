# Product Scope

Last reviewed: 2026-08-04.

## Current Implementation Status

No production implementation exists yet.

## Smallest Credible Alpha

A credible `0.0.0-alpha.1` should let a developer:

1. Run a demo or package locally.
2. Define typed columns.
3. Provide rows.
4. Render a virtualized grid.
5. Navigate with keyboard controls.
6. Select a single cell.
7. Edit a cell.
8. Observe a typed change event.
9. Run tests.
10. Run a reproducible benchmark.
11. Use at least one framework adapter or framework-neutral demo.

## Alpha In Scope

- Minimal protocol and TypeScript contracts.
- Framework-neutral core.
- Minimal TypeScript reference engine.
- One renderer selected by research gate.
- Single-cell selection.
- Basic editing.
- Client-side DataSource.
- At least one adapter or core demo.
- Benchmark and test harness.

## Conditional Alpha Scope

- Rust/WASM: only if benchmark thresholds are met.
- Web Worker: only if main-thread latency requires it or compute benchmark validates it.
- Canvas: only if renderer research/prototype supports it over virtualized DOM.
- Angular adapter: only if it does not compromise the first complete vertical slice.
- Server-side DataSource: include only if the first alpha remains complete and testable.

## Out Of Scope For Alpha

Formula engine, pivot tables, grouping, aggregation, range selection, full Excel clipboard, undo/redo, custom editors, column resize/reorder/freeze, XLSX import/export, charts, collaboration, comments, multiple sheets, tree data, master/detail, and C# backend packages.

## Planned Beyond Frontend Alpha

Backend integration libraries are part of the intended project direction, but they should be implemented after the frontend core, DataSource contract, and server-side protocol are stable enough to avoid locking the project to one backend stack too early.

Candidate backend packages include C#/.NET helpers for ASP.NET Core, LINQ, and EF Core. These packages should wrap the language-neutral Gethen protocol with safe server-side query translation, field allowlists, bounded page sizes, cancellation, stale-response protection, and update handling. They must not require the browser to send arbitrary LINQ, SQL, or unrestricted expressions.
