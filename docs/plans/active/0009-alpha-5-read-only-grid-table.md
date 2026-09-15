# Alpha 5 Read-Only Grid Table Execution Plan

Last reviewed: 2026-09-15.

Status: Ready for implementation. Alpha 3, the Alpha 4 engine selection, and the local grid-shell/visual closure are complete. No package is published.

## Goal

Deliver `0.0.0-alpha.5` by adding a read-only Grid Table mode to the existing Core renderer and Angular component. Reuse the current grid, layout state, shaping semantics, virtualization, selection, copy, summaries, and status surface; do not create a second renderer or component.

## Source Of Truth

- Sequencing and scope: [0006-client-first-1.0-server-2.0-roadmap.md](0006-client-first-1.0-server-2.0-roadmap.md).
- Current implementation state: [../../project/PROJECT_STATE.md](../../project/PROJECT_STATE.md).
- Alpha 4 shaping semantics: `packages/core/src/shaping/grid-data-shaping.ts`.
- Existing renderer and layout boundaries: `packages/core/src/renderer/dom/virtual-dom-grid.ts` and `packages/core/src/state/grid-layout.ts`.
- Angular boundary: `packages/gethen-angular/src/gethen-grid.component.ts`.
- Quality gates: [../../quality/TESTING_STRATEGY.md](../../quality/TESTING_STRATEGY.md), [../../quality/PERFORMANCE_BUDGET.md](../../quality/PERFORMANCE_BUDGET.md), and [../../quality/BENCHMARK_PLAN.md](../../quality/BENCHMARK_PLAN.md).

## Fixed Decisions

- `editable` remains the compatibility-preserving default; `readOnly` is an explicit interaction mode.
- A read-only preset/helper configures the existing grid and does not fork rendering or state logic.
- Selection, clipboard copy, resize, column order, layout persistence, sort, filter, group, aggregate, virtualization, pinned summaries, and status remain available.
- Read-only mode must not install or invoke editing, paste-mutation, row-mutation, or mutation-history handlers.
- Sort and filter descriptors reuse Alpha 4 comparison types, null placement, operators, and stable ordering.
- Header-menu and filter-row presentations write to the same serializable query state.
- Pointer reordering must have keyboard-accessible move-left and move-right equivalents.
- Application renderers, editors, formatters, and reducers remain client-only; portable query state contains no callbacks or executable text.

## Work

### A5-01 Interaction Mode And Mutation Boundary

- [x] Define the Core `readOnly` contract, runtime setter, and frozen read-only preset.
- [x] Add the compatible Angular input and preserve theme/read-only-only updates without remounting the grid.
- [x] Block double-click edit, type-to-edit, boolean toggle, paste commits, renderer mutation APIs, and mutation-history application in read-only mode. The independently created headless row-transaction manager remains outside the renderer boundary.
- [x] Keep focus, selection, range selection, clipboard copy, resize, frozen panes, hidden columns, summaries, and status behavior active.
- [x] Prove through serialized Chromium coverage that read-only setup excludes mutation-only handlers and repeated mode changes preserve the mounted element without duplicate behavior.

### A5-02 Column Reordering

- [x] Add declarative per-column initial widths while preserving persisted `GridLayoutState` widths as the higher-precedence host choice and keeping row height grid-wide.
- [ ] Add pointer drag-and-drop reordering to column headers.
- [ ] Add keyboard move-left and move-right commands with discoverable labels and focus retention.
- [ ] Persist reordered columns through the existing `GridLayoutState` boundary and emit the existing reorder reason.
- [ ] Preserve frozen leading-column constraints, hidden-column identity, header classes, widths, and virtualized column geometry.

### A5-03 Shared Query State And Header Sorting

- [ ] Define serializable Grid Table query state over the existing `GridSortDescriptor` and `GridFilterDescriptor` semantics.
- [ ] Add single-sort and modifier-assisted stable multi-sort header controls.
- [ ] Render truthful `aria-sort` state and provide keyboard operation without pointer-only behavior.
- [ ] Execute shaping through the selected TypeScript Worker at the existing engine boundary and discard stale results.

### A5-04 Configurable Filtering

- [ ] Implement header-menu and filter-row presentations over the same query state.
- [ ] Provide typed controls for the supported string, number, boolean, date/datetime, and null-aware operators.
- [ ] Preserve Alpha 4 comparison, case-sensitivity, null, cancellation, progress, and error semantics.
- [ ] Keep query descriptors transport-neutral and reject unknown column IDs or incompatible filter values before execution.

### A5-05 Integration And Documentation

- [ ] Add Angular passthrough, events, and lifecycle coverage for mode, order, sort, and filter state.
- [ ] Add a deterministic Alpha 5 example to `apps/docs-site/` covering read-only mode, reordering, sorting, and both filter presentations.
- [ ] Document public APIs, keyboard commands, limitations, accessibility behavior, and compatibility defaults.
- [ ] Update the roadmap, project state, release notes, and package version only when the implementation and gates are complete.

### A5-06 Verification And Performance

- [ ] Add focused Core and Angular unit tests for contracts, cleanup, persistence, and invalid input.
- [ ] Add Chromium scenarios for pointer and keyboard reordering, stable multi-sort, both filter presentations, frozen panes, hidden columns, read-only mutation blocking, and editable-mode compatibility.
- [ ] Run workspace check, build, unit tests, serialized browser tests, Core public-boundary verification, and package dry-run inspection.
- [ ] Benchmark read-only and editable modes independently at the accepted 500,000-row capacity, including interaction p95, frame intervals, long tasks, cancellation, and retained memory.
- [ ] Record hardware, runtime/browser versions, dataset shape, warm-up, iteration count, median, p75/p95, variability, memory, and limitations.

## Exit Gate

- Every A5 task is complete with source and automated evidence.
- Read-only mode exposes no mutation path while retaining all promised non-mutating interactions.
- Pointer and keyboard column reordering persist and preserve focus, frozen panes, and hidden-column identity.
- Sorting is stable and filtering is semantically identical across header-menu and filter-row presentations.
- Core and Angular public APIs are documented and package boundaries remain clean.
- Relevant check, build, unit, browser, package, accessibility, and performance gates pass at the accepted capacity.
- Manual NVDA/Chrome may remain deferred during Alpha 5, but must be reported as open and remains mandatory before Beta/1.0.
- No package is published without a separate maintainer decision.
