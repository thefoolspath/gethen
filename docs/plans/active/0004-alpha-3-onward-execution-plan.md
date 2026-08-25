# Alpha 3 Through Local 1.0 Execution Plan

Last reviewed: 2026-08-25.

Status: Alpha 3 is a locally verified release candidate. This plan remains accepted for Alpha 4. The Alpha 5 onward sequence and all server-before-1.0 scope are superseded by [0006-client-first-1.0-server-2.0-roadmap.md](0006-client-first-1.0-server-2.0-roadmap.md). No package is published.

## Goal

Deliver a production-quality, desktop-first Gethen data-grid and spreadsheet ecosystem as local package artifacts through `1.0.0`, without publishing to npm or NuGet. Every capability included in the stable scope must be implemented, documented, tested, benchmarked, and usable; the MIT license warranty disclaimer does not weaken product quality gates.

## Fixed Decisions

- Framework-neutral TypeScript remains the public/control/DOM layer.
- Core and Angular are supported through 1.0; React is post-1.0.
- The virtualized DOM renderer remains the supported renderer.
- Client computation targets 1,000,000 rows across all included features while rendering only the viewport. If both engine candidates fail the gate, the accepted fallback is 500,000 rows; failure at 500,000 blocks release.
- TypeScript Worker and Rust/WASM Worker are the two compute candidates. Ship only the winner and retain the other as a parity oracle. If end-to-end results differ by no more than 10%, choose Rust.
- Client-side execution is the only runtime scope through 1.0. Server mode and a server wire protocol move to 2.0.
- Portable client data-operation descriptors must remain serializable so Server 2.0 can add parity without coupling Core to a backend runtime.
- C# backend integration moves to the independently versioned Server 2.0 workstream in this repository; its internal package split will be planned later.
- Chrome and Edge are release-blocking browsers. Firefox and Safari are best-effort smoke paths until after 1.0.
- Desktop mouse/keyboard interaction is supported; full touch editing is not a 1.0 gate.
- Manual NVDA with Chrome is an accessibility release gate.
- No npm or NuGet publishing occurs in this plan.

## Cross-Version Invariants

- Logical row and column IDs survive viewport movement, sort, filter, grouping, layout changes, formulas, and pivots.
- Visible indexes are presentation coordinates, never durable identity.
- Main-thread code owns DOM and interaction only; workers never access DOM.
- Renderer state is not the authoritative full data state.
- Cell values, clipboard input, formula text, and query field names are untrusted.
- Portable contracts never contain JavaScript callbacks, executable text, unrestricted expressions, or raw SQL.
- Core imports remain SSR-safe.
- Runtime dependencies require license review.

## Alpha 2 Closure

- [x] Verify TypeScript checks and package builds.
- [x] Verify 34 unit/contract/adapter tests.
- [x] Verify 17 Chromium browser scenarios.
- [x] Verify benchmark suite and GNU Rust research benchmark.
- [x] Inspect protocol, core, and Angular package contents with local dry-run packs.
- [x] Keep packages unpublished.
- [x] Move the Alpha 2 implementation plan to completed after the implementation commit.
- [x] Commit accepted roadmap documentation separately from Alpha 2 implementation.

## `0.0.0-alpha.3` - Editing, History, And Layout

### Public Surface

- `GridLayoutState` and normalized layout events.
- `GridHistoryOptions` and normalized undo/redo events.
- `GridCellRenderer`, `GridCellEditor`, `GridEditorContext`, and `GridValidationResult`.
- Built-in text, number, boolean, date, datetime, select, and JSON editors.

### Work

- [x] Implement editor states: idle, activating, editing, validating, committing, cancelling, failed, and disposed.
- [x] Normalize Enter, Escape, Tab, double-click, type-to-edit, scroll, validation, commit, and unmount transitions.
- [x] Implement host-trusted custom renderer/editor lifecycle: mount, update, focus, get value, validate, commit, cancel, destroy.
- [x] Add Angular template/component registries without importing Angular from core.
- [x] Implement bounded undo/redo for cell edits, row transactions, and paste commits.
- [x] Emit an inverse change as a new transaction after an acknowledged save; never replay a previous network request automatically.
- [x] Implement column resize/reorder and multiple frozen top rows/leading columns.
- [x] Preserve focus, selection, editing, ARIA state, and virtualization across frozen panes.
- [x] Normalize, serialize, and apply layout snapshots; host applications own persistence.
- [x] Add TypeScript Worker and Rust/WASM Worker benchmark harness scaffolding.

### Exit Gate

- All editor transitions and cleanup paths have unit/browser coverage.
- History is bounded by entry count and retained bytes and does not retain disposed data.
- Layout round-trips are deterministic.
- Resize/reorder/frozen panes work with hidden columns, range selection, clipboard, and Angular.
- Keyboard-only Chrome checks pass for the included layout/editor surface.

Alpha 3 is a completed local release candidate. Automated gates and a manual keyboard-only Chrome walkthrough passed on 2026-08-12 for focus traversal, active-cell navigation, editor activation/cancellation, Tab commit/advance, resize, reorder, and frozen panes. Manual NVDA/Chrome validation remains open because NVDA is not installed in the current environment. By maintainer decision on 2026-08-12, it is optional during alpha and mandatory before Beta/1.0; no screen-reader or WCAG compliance claim is made.

## `0.0.0-alpha.4` - Data Shaping And Engine Bake-Off

### Public Surface

- `GridSortDescriptor`, `GridFilterDescriptor`, `GridGroupDescriptor`, and `GridAggregateDescriptor`.
- Distinct source-row and synthetic group-row types.
- Built-in count, sum, min, max, and average aggregations.
- Deterministic client-only custom reducer callbacks.

### Work

- [x] Implement the canonical pipeline: filter, stable multi-sort, group, aggregate, flatten, viewport.
- [x] Define null, text, number, boolean, date, and JSON comparison semantics.
- [x] Give synthetic rows stable IDs, explicit provenance, and readonly defaults. Keyboard behavior and ARIA expansion state remain part of the rendered group-row slice.
- [x] Define one compact columnar buffer schema and one batched worker contract.
- [x] A4-01: Add deterministic 10K, 500K, and 1M by 50-column mixed-type fixture profiles with stable seeded data, row IDs, column ordering, and nullable values. Normal validation allocates only the 10K profile.
- [x] A4-02: Add a canonical TypeScript parity oracle with full deterministic results for the 10K profile and compact checksum/count/aggregate output for later 500K/1M capacity runs. Normal validation does not allocate the larger profiles.
- [x] A4-03: Execute the TypeScript Worker pipeline as ordered asynchronous decode, filter, sort, group, aggregate, flatten, and completion stages with truthful start/end progress while preserving canonical results. Cooperative batching within long stages remains A4-07.
- [x] A4-04: Move mixed-type filter and stable multi-sort row-mask/index execution into dependency-free Rust/WASM kernels behind TypeScript-normalized comparison ranks. The 10K mixed fixture passes Chromium parity.
- [x] A4-05: Move hierarchical group assignment, built-in count/sum/min/max/average aggregation, and expanded/collapsed viewport flatten tokens into dependency-free Rust/WASM kernels. TypeScript retains stable mixed-type key normalization and result hydration; full 10K group/aggregate output passes Chromium parity.
- [ ] Implement equivalent TypeScript Worker and Rust/WASM Worker kernels for ingestion, transfer, sort, filter, group, aggregate, and representative formula/pivot workloads.
- [ ] Use identical fixtures, algorithms, optimization intent, cancellation, and progress behavior.
- [ ] Measure cold/warm startup, end-to-end latency, peak/retained memory, transfer, bundle cost, and disposal.
- [ ] Select the production engine at the Alpha 4 exit gate; retain the loser only as a test/benchmark oracle.

The first Alpha 4 checkpoint now includes the portable pipeline, transferable mixed-type buffer, TypeScript Worker, dependency-free Rust/WASM filter/sort/group/aggregate/flatten kernels, browser parity coverage, and immediate cancellation rejection. The current 100,000-row numeric boundary measurement is diagnostic only; it does not satisfy the full engine-selection gate.

### Exit Gate

- Shaping results are deterministic and parity fixtures pass.
- Main-thread interaction remains responsive during full-dataset work.
- The selected engine passes the accepted 1M target or the documented 500K fallback.
- Synthetic rows cannot enter source-row save paths.

### Grid-Shell UX Closure Before Alpha 5

The accepted [grid-shell visual UX plan](0005-grid-shell-visual-ux-research-and-implementation.md) runs after the Alpha 4 shaping boundary is stable and before Alpha 5 begins. It must correct missing header and accessibility behavior, provide row numbers, readonly pinned bottom rows, a client status bar, and a dependency-free modern-enterprise default theme without weakening the engine-selection gate. Server loading, error, retry, and unknown-total states move to Server 2.0.

## `0.0.0-alpha.5` - Read-Only Grid Table

### Public Surface

- An `editable`/`readOnly` interaction mode on the existing Core grid and Angular component.
- A read-only preset/helper that disables mutation handlers without creating a second renderer.
- Shared query state for header sorting and configurable header-menu or filter-row filtering.

### Work

- [ ] Keep selection, copy, layout, grouping, aggregation, virtualization, pinned summaries, and status behavior active while blocking editing and mutation paths.
- [ ] Add pointer drag-and-drop column reordering plus keyboard-accessible move-left/move-right commands.
- [ ] Add stable single/multi-sort header controls and typed filter controls in both supported presentations.
- [ ] Preserve layout persistence, frozen panes, hidden columns, ARIA state, focus, and Angular passthrough.
- [ ] Verify that read-only mode avoids installing editor, paste-mutation, row-mutation, and mutation-history handlers.
- [ ] Benchmark read-only and editable modes independently at the accepted dataset target.

## `0.0.0-alpha.6` - Gethen Formula Engine

### Formula Model

- Per-cell formulas and computed-column formulas.
- `[@columnId]` for current-row structured references.
- `CELL("rowId", "columnId")` for stable absolute cells.
- `COLUMN("columnId")` and stable range descriptors for collections.
- Arithmetic, comparison, concatenation, `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `IF`, `AND`, `OR`, `NOT`, and `ROUND`.
- Structured parse, reference, value, divide-by-zero, and cycle errors.

### Work

- [ ] Parse formula text into a typed AST without `eval`, `Function`, DOM execution, or unrestricted callbacks.
- [ ] Separate raw text, AST, dependency graph, computed value, and formatted display.
- [ ] Track graph edges by stable logical identity and remove them on replacement/disposal.
- [ ] Support deterministic cycle detection, incremental invalidation, batch recalculation, cancellation, progress, and undo/redo.
- [ ] Add a cell formula editor and formula bar with basic autocomplete, dependency display, and errors.
- [ ] Run recalculation in the selected worker engine.
- [ ] Validate up to 1,000,000 formula cells at the primary target or the accepted 500K fallback.
- [ ] Document that Gethen formulas are not an Excel-compatibility claim.

## `0.0.0-alpha.7` - Pivot And Field Builder

### Public Surface

- `GridPivotDefinition` with row dimensions, column dimensions, measures, filters, totals, and subtotals.
- Stable generated row/column metadata and provenance.

### Work

- [ ] Reuse Alpha 4 grouping and aggregation semantics.
- [ ] Generate readonly pivot cells by default; exclude write-back from 1.0.
- [ ] Render dynamic pivot columns through the virtualized grid.
- [ ] Preserve layout, frozen panes, selection, keyboard navigation, and accessibility.
- [ ] Provide typed configuration and a field-builder UI for selecting/dragging dimensions, measures, and filters.
- [ ] Provide keyboard alternatives to drag-and-drop.
- [ ] Enforce configurable cardinality limits before allocating oversized output.
- [ ] Benchmark generation, refresh, navigation, memory, and cancellation at the accepted dataset target.

## `0.1.0-beta.1` - Feature Complete And API Hardening

- [ ] Freeze new feature scope.
- [ ] Inventory exports and mark stable, internal, or deprecated.
- [ ] Freeze Core, Angular, Grid Table, formula, pivot, and portable client data-operation surfaces intended for 1.0.
- [ ] Inventory server-oriented Protocol v1 exports and keep them outside the stable client-side 1.0 surface.
- [ ] Stabilize formula, pivot, Grid Table, and custom renderer/editor contracts.
- [ ] Verify SSR-safe imports, memory disposal, package contents, licenses, bundle sizes, and browser behavior.
- [ ] Run automated accessibility checks and manual NVDA/Chrome validation.
- [ ] Produce and inspect local npm beta artifacts. Publishing requires a separately approved beta decision.

## Local `1.0.0` Release Candidate

- [ ] Every included feature is implemented, documented, tested, and benchmarked.
- [ ] Public APIs follow Semantic Versioning and documented deprecation rules.
- [ ] Chrome/Edge release gates and NVDA/Chrome validation pass.
- [ ] Long-running mount/unmount, edit/history, Grid Table, compute, formula, and pivot stress tests pass.
- [ ] Local npm pack inspection, license review, changelog, migration guide, and release notes pass.
- [ ] No registry publish occurs. The maintainer decides separately when personal use is sufficient to open a publishing plan.

## Performance Gate

Reference workload: 1,000,000 rows by 50 mixed-type columns and up to 1,000,000 formula cells.

- Render only visible cells.
- Main-thread interaction p95 below 100 ms.
- No repeated main-thread task over 50 ms.
- Median scroll frame interval target at or below 16.7 ms.
- Worker cancellation acknowledgement below 100 ms.
- Report cold/warm median, p75/p95, variability, startup, bundle, peak/retained memory, hardware, browser, and limitations.
- If both candidate engines fail 1M, repeat the complete gate at 500K and document the stable capacity as 500K.
- Failure at 500K blocks release.

## Verification Matrix

- Unit and property tests for identity, editor transitions, history bounds, layout round-trips, shaping determinism, read-only boundaries, formula parsing/cycles/invalidation, pivot limits, and query validation.
- TypeScript/Rust parity fixtures for nulls, text, numbers, booleans, dates, JSON, formula errors, group output, and pivot output.
- Browser tests for frozen panes, layout, custom extensions, read-only Grid Table controls, formula bar, pivot builder, and cancellation.
- Manual keyboard and NVDA/Chrome checks.

## Server-Side 2.0 Direction

- Server DataSource and a versioned server wire protocol with parity for range/paging, sort, filter, group, aggregate, formula, pivot, updates, and row transactions.
- A separately versioned C# project/solution area in this repository; the package split, target framework, provider matrix, and release numbering require a dedicated 2.0 plan.
- React adapter.
- Current/previous Chromium, Firefox, and WebKit support matrix.
- Pivot write-back and advanced Excel compatibility.
- npm/NuGet publishing, provenance, signing, and registry rollout under a separately approved plan.
