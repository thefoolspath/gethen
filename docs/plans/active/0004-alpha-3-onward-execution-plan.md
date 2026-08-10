# Alpha 3 Through Local 1.0 Execution Plan

Last reviewed: 2026-08-10.

Status: Accepted roadmap execution plan. Alpha 2 is a locally verified release candidate; no package is published.

## Goal

Deliver a production-quality, desktop-first Gethen data-grid and spreadsheet ecosystem as local package artifacts through `1.0.0`, without publishing to npm or NuGet. Every capability included in the stable scope must be implemented, documented, tested, benchmarked, and usable; the MIT license warranty disclaimer does not weaken product quality gates.

## Fixed Decisions

- Framework-neutral TypeScript remains the public/control/DOM layer.
- Core and Angular are supported through 1.0; React is post-1.0.
- The virtualized DOM renderer remains the supported renderer.
- Client computation targets 1,000,000 rows across all included features while rendering only the viewport. If both engine candidates fail the gate, the accepted fallback is 500,000 rows; failure at 500,000 blocks release.
- TypeScript Worker and Rust/WASM Worker are the two compute candidates. Ship only the winner and retain the other as a parity oracle. If end-to-end results differ by no more than 10%, choose Rust.
- Server mode supports whole-dataset range, sort, filter, group, aggregate, pivot, and updates before 1.0.
- Server formulas before 1.0 are allowlisted backend-computed fields. Portable client/server formula execution is post-1.0.
- Protocol v2 replaces v1 before beta.
- The .NET preview targets `net10.0` and EF Core 10 with MySQL, SQL Server, and PostgreSQL verification.
- Chrome and Edge are release-blocking browsers. Firefox and Safari are best-effort smoke paths until after 1.0.
- Desktop mouse/keyboard interaction is supported; full touch editing is not a 1.0 gate.
- Manual NVDA with Chrome is an accessibility release gate.
- No npm or NuGet publishing occurs in this plan.

## Cross-Version Invariants

- Logical row and column IDs survive viewport movement, sort, filter, grouping, layout changes, formulas, pivots, and server cache replacement.
- Visible indexes are presentation coordinates, never durable identity.
- Main-thread code owns DOM and interaction only; workers never access DOM.
- Renderer state is not the authoritative full data state.
- Cell values, clipboard input, formula text, protocol requests, server responses, and query field names are untrusted.
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
- Keyboard-only and NVDA/Chrome checks pass for the included layout/editor surface.

Automated Alpha 3 gates are implemented. Manual NVDA/Chrome verification remains open because NVDA is not installed in the current environment; Alpha 3 cannot be declared a completed local release candidate until that manual gate is recorded.

## `0.0.0-alpha.4` - Data Shaping And Engine Bake-Off

### Public Surface

- `GridSortDescriptor`, `GridFilterDescriptor`, `GridGroupDescriptor`, and `GridAggregateDescriptor`.
- Distinct source-row and synthetic group-row types.
- Built-in count, sum, min, max, and average aggregations.
- Deterministic client-only custom reducer callbacks.

### Work

- [ ] Implement the canonical pipeline: filter, stable multi-sort, group, aggregate, flatten, viewport.
- [ ] Define null, text, number, boolean, date, and JSON comparison semantics.
- [ ] Give synthetic rows stable IDs, explicit provenance, readonly defaults, keyboard behavior, and ARIA expansion state.
- [ ] Define one compact columnar buffer schema and one batched worker contract.
- [ ] Implement equivalent TypeScript Worker and Rust/WASM Worker kernels for ingestion, transfer, sort, filter, group, aggregate, and representative formula/pivot workloads.
- [ ] Use identical fixtures, algorithms, optimization intent, cancellation, and progress behavior.
- [ ] Measure cold/warm startup, end-to-end latency, peak/retained memory, transfer, bundle cost, and disposal.
- [ ] Select the production engine at the Alpha 4 exit gate; retain the loser only as a test/benchmark oracle.

### Exit Gate

- Shaping results are deterministic and parity fixtures pass.
- Main-thread interaction remains responsive during full-dataset work.
- The selected engine passes the accepted 1M target or the documented 500K fallback.
- Synthetic rows cannot enter source-row save paths.

## `0.0.0-alpha.5` - Gethen Formula Engine

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

## `0.0.0-alpha.6` - Pivot And Field Builder

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

## `0.0.0-alpha.7` - Protocol v2 And Server DataSource

### Protocol v2

- JSON Schema 2020-12 remains the source of truth.
- Generate TypeScript and C# contracts; do not maintain duplicate handwritten wire types.
- Add bounded range, sort, filter, group, aggregate, pivot, update, revision/concurrency, and structured error contracts.
- Use portable allowlisted descriptors only.

### Work

- [ ] Add Protocol v2 schemas, examples, inferred TypeScript contracts, validators, and migration fixtures.
- [ ] Implement server request identity, cancellation, stale-response discard, retry, loading/error/empty states, and bounded block caching.
- [ ] Define cache eviction, invalidation, unknown/changed totals, revisions, and optimistic concurrency.
- [ ] Keep server formulas limited to allowlisted computed fields.
- [ ] Prevent cached-subset shaping from being represented as whole-dataset results.
- [ ] Provide v1-to-v2 migration documentation during Alpha 7/8 and remove v1 from the supported beta surface.

## `0.0.0-alpha.8` - .NET Backend Preview

### Packages And Versions

- Frontend/npm packages: `0.0.0-alpha.8`.
- `Gethen.Protocol`, `Gethen.Linq`, `Gethen.EntityFrameworkCore`, and `Gethen.AspNetCore`: `0.0.0-alpha.1`.
- Target: `net10.0`, EF Core 10.

### Work

- [ ] Generate C# Protocol v2 contracts from JSON Schema.
- [ ] Implement transport-neutral request handlers.
- [ ] Add Minimal API mapping extensions and services usable from controllers.
- [ ] Translate only allowlisted fields/operators with bounded ranges and expression depth.
- [ ] Propagate cancellation and return safe structured client errors.
- [ ] Prevent accidental EF client evaluation.
- [ ] Verify optimistic concurrency and generated query behavior.
- [ ] Run integration matrices against MySQL, SQL Server, and PostgreSQL using stable EF Core 10-compatible providers.
- [ ] Block Alpha 8 if a required stable provider is unavailable; do not lower the target framework.

## `0.1.0-beta.1` - Feature Complete And API Hardening

- [ ] Freeze new feature scope.
- [ ] Inventory exports and mark stable, internal, or deprecated.
- [ ] Freeze Core, Protocol v2, and Angular public surfaces intended for 1.0.
- [ ] Remove Protocol v1 from the supported surface and publish migration docs locally.
- [ ] Stabilize formula, pivot, server DataSource, and custom renderer/editor contracts.
- [ ] Verify SSR-safe imports, memory disposal, package contents, licenses, bundle sizes, and browser behavior.
- [ ] Run automated accessibility checks and manual NVDA/Chrome validation.
- [ ] Produce local npm/NuGet beta artifacts without publishing.

## Local `1.0.0` Release Candidate

- [ ] Every included feature is implemented, documented, tested, and benchmarked.
- [ ] Public APIs follow Semantic Versioning and documented deprecation rules.
- [ ] Chrome/Edge release gates and NVDA/Chrome validation pass.
- [ ] Long-running mount/unmount, edit/history, compute, cache, formula, and pivot stress tests pass.
- [ ] Local npm/NuGet pack inspection, license review, changelog, migration guide, and release notes pass.
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

- Unit and property tests for identity, editor transitions, history bounds, layout round-trips, shaping determinism, formula parsing/cycles/invalidation, pivot limits, and query validation.
- TypeScript/Rust parity fixtures for nulls, text, numbers, booleans, dates, JSON, formula errors, group output, and pivot output.
- Browser tests for frozen panes, layout, custom extensions, formula bar, pivot builder, cancellation, and server states.
- Manual keyboard and NVDA/Chrome checks.
- .NET integration tests for MySQL, SQL Server, and PostgreSQL, including SQL shape, cancellation, pagination, concurrency, and adversarial requests.

## Post-1.0 Direction

- Portable formula definitions in Protocol and client/server formula parity.
- React adapter.
- Current/previous Chromium, Firefox, and WebKit support matrix.
- Pivot write-back, server formula execution, and advanced Excel compatibility.
- npm/NuGet publishing, provenance, signing, and registry rollout under a separately approved plan.
