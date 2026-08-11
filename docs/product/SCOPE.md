# Product Scope

Last reviewed: 2026-08-11.

## Current Implementation Status

A local `0.0.0-alpha.2` release candidate is implemented and verified. No package is published. See [../project/PROJECT_STATE.md](../project/PROJECT_STATE.md) for current evidence.

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

## Frontend Foundation Alpha In Scope

- Minimal protocol and TypeScript contracts.
- Framework-neutral core.
- Minimal TypeScript reference engine.
- One renderer selected by research gate.
- Single-cell selection.
- Basic editing.
- Client-side DataSource.
- At least one adapter or core demo.
- Benchmark and test harness.

## Conditional Frontend Foundation Scope

- Rust/WASM: only if benchmark thresholds are met.
- Web Worker: only if main-thread latency requires it or compute benchmark validates it.
- Canvas: only if renderer research/prototype supports it over virtualized DOM.
- Angular adapter: only if it does not compromise the first complete vertical slice.
- Server-side DataSource: deferred from the frontend foundation and planned as the evidence-gated `alpha.7` slice.

## Extended Frontend Alpha

The accepted roadmap uses `0.0.0-alpha.3` through `0.0.0-alpha.6` for required frontend expansion before beta:

- `alpha.3`: full editor lifecycle and built-ins, public custom renderer/editor lifecycle, bounded data undo/redo, column resize/reorder, and multiple frozen rows/columns.
- `alpha.4`: deterministic client-side sort/filter/group/aggregate behavior plus the pre-Alpha-5 grid-shell closure for headers, row numbers, pinned summaries, client status, accessibility corrections, and the dependency-free default visual system.
- `alpha.5`: a safe Gethen formula engine with per-cell/computed-column formulas, structured references, dependency graph, incremental worker recalculation, and formula UI.
- `alpha.6`: a readonly-first pivot engine, virtualized pivot grid, developer configuration API, and accessible field-builder UI.

These entries are accepted product scope but remain unimplemented until their source, tests, documentation, and benchmark evidence exist. Their detailed gates are in [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md).

## Out Of Scope Through Extended Frontend Alpha

Full Excel clipboard compatibility, merged cells, XLSX import/export, charts, collaboration, comments, multiple sheets, tree data, master/detail, full Excel formula compatibility, and pivot write-back.

## Planned Beyond Frontend Alpha

Protocol v2 and a server DataSource are required in Alpha 7, including complete-dataset range, sort, filter, group, aggregate and pivot semantics. Server formulas before 1.0 are limited to allowlisted backend-computed fields.

Alpha 8 requires local .NET 10/EF Core 10 previews for `Gethen.Protocol`, `Gethen.Linq`, `Gethen.EntityFrameworkCore`, and `Gethen.AspNetCore`, with MySQL, SQL Server, and PostgreSQL integration evidence. npm and NuGet publishing, React, portable server formulas, pivot write-back, and an expanded browser-support matrix remain post-1.0 work requiring separate approval.
