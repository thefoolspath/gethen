# Product Roadmap

Last reviewed: 2026-08-12.

Status: A local `0.0.0-alpha.2` release candidate is implemented and verified; no package is published. Alpha 3 automated work is implemented but manual NVDA/Chrome remains open. The accepted client-first plan through local 1.0 is active.

## Roadmap Principles

- Build the frontend/core vertical slice before expanding package scope.
- Complete the client-side product through 1.0 before implementing Server DataSource, a server wire protocol, or backend integrations in 2.0.
- Treat research and benchmark work as decision gates, not optional cleanup.
- Do not accept Rust, WASM, Canvas, Worker, Angular, or backend-specific packages until the related gate has evidence.
- Keep alpha versions small enough that each one can be locally built, tested, benchmarked, and reviewed.

## Version Roadmap

| Version | Theme | Main functions | Research and benchmarks |
| --- | --- | --- | --- |
| Pre-alpha research gate | Validate risky choices before production implementation | Virtualized DOM prototype, minimal Canvas comparison prototype, TypeScript baseline operations, dependency license review, first adapter decision | Renderer benchmark, TypeScript operation benchmark, Rust native benchmark only as research, license evaluation |
| `0.0.0-alpha.1` | Smallest credible frontend grid vertical slice | Typed columns, developer-provided rows, virtualized grid, visible row/column viewport, single active cell, keyboard navigation, basic text/number/boolean editing, typed change event, client-side DataSource, one adapter or framework-neutral demo | Initial render, scroll stability, input latency, edit activation, client range/update baseline, package smoke benchmark |
| `0.0.0-alpha.2` | Interaction basics and developer customization | Optional second adapter, range selection, optional clipboard copy/paste basics with Excel/MySQL Workbench-style blank-cell handling, validation primitives with per-cell paste errors, improved column/cell metadata, class-based conditional row/column/cell styling, theme tokens, DTO-to-column mapping, hidden key fields, row edit/insert/save planning | Keyboard interaction benchmark, clipboard payload sanity checks, paste validation cost, adapter mount/unmount tests, accessibility smoke tests, conditional styling callback cost |
| `0.0.0-alpha.3` | Editing, history, and layout | Full editor state machine and built-ins, public renderer/editor lifecycle, bounded data undo/redo, resize/reorder, multiple frozen top rows and leading columns, host-persisted layout state | Layout round-trip, history byte bounds, pane interaction/accessibility, repeated edit/undo disposal, TypeScript Worker versus Rust/WASM Worker harness |
| `0.0.0-alpha.4` | Data shaping, engine bake-off, and grid-shell closure | Deterministic filter -> stable multi-sort -> group -> aggregate pipeline, typed synthetic rows, custom client reducer, equivalent TypeScript Worker and Rust/WASM Worker candidates; accepted header/accessibility corrections, row-number gutter, pinned bottom rows, client status bar, and dependency-free modern-enterprise default theme before Alpha 5 | Ingestion, transfer, shaping and representative formula/pivot kernels on shared fixtures; shell visual/accessibility/browser/performance evidence; ship the engine winner and retain the other as parity oracle |
| `0.0.0-alpha.5` | Read-only Grid Table | Existing grid in read-only mode, lightweight preset, pointer and keyboard column reordering, stable multi-sort, configurable header-menu or filter-row filtering | Read-only mutation boundaries, layout persistence, typed query parity, accessibility, handler/disposal evidence, editable/read-only performance comparison |
| `0.0.0-alpha.6` | Gethen Formula Engine | Per-cell and computed-column formulas, structured references, typed AST/dependency graph, safe functions, incremental worker recalculation, formula bar/editor | Parsing/cycle/invalidation/property tests, cancellation/progress, graph memory and full reference-workload evidence; no Excel-compatibility claim |
| `0.0.0-alpha.7` | Pivot and field builder | Typed pivot definition, stable generated rows/columns, readonly virtualized results, developer API, drag-and-drop and keyboard field builder, cardinality limits | Golden fixtures, shaping parity, dynamic-column layout/accessibility, low/medium/high-cardinality responsiveness and memory |
| `0.1.0-beta.1` | Client feature complete and API hardening | Freeze Core, Angular, Grid Table, Formula, Pivot, portable data-operation descriptors, and extension lifecycle; no server runtime scope | Full tests/benchmarks, package/license/bundle/SSR checks, memory disposal, current stable Chrome/Edge and manual NVDA/Chrome gates |
| Client `1.0.0` | Stable client-side release candidate | Every scoped client feature usable and documented, Semantic Versioning and deprecation policy, and inspected npm artifacts; publishing requires a separate decision | 1M x 50 reference workload or accepted 500K fallback, regression thresholds, long-running stability and all client release blockers satisfied |
| `2.0` workstream | Server-side parity and backend integration | Server DataSource and wire protocol; range/paging, sort, filter, group, aggregate, formula, pivot, update and row-transaction parity; separately versioned C# project/solution area in this repo | Dedicated protocol, security, cache, concurrency, provider, SQL-shape, cancellation and backend performance plan |

## Current Version Progress

The local `0.0.0-alpha.2` release candidate was completed on 2026-08-10. It includes hidden rendered columns, alignment, application-owned column/row/cell classes, text-only formatters, theme tokens, rectangular range selection, explicit DTO mapping with hidden stable keys, headless row transactions, opt-in all-or-nothing direct clipboard paste, validation primitives, host-dialog preparation, and Angular adapter passthrough. Preliminary repeat-iteration JavaScript and Chromium render-timing baselines exist. Renderer-owned row/paste-dialog controls and a second adapter are deliberately omitted; cross-hardware/full-frame-trace evidence remains required before external performance claims.

Alpha 3 and Alpha 4 details follow [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md). The accepted Alpha 5 onward sequence follows [../plans/active/0006-client-first-1.0-server-2.0-roadmap.md](../plans/active/0006-client-first-1.0-server-2.0-roadmap.md). Versions are completed sequentially. Features inside the stable scope may not be relabeled as prototypes or deferred merely to pass a release gate.

The accepted Alpha 4 grid-shell closure follows [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md). It corrects missing previously accepted header/accessibility behavior and adds CR-20260811-001/002 before Grid Table, formula, and pivot UI build on the shell. Server loading, error, retry, and known/unknown total semantics move to 2.0.

## Version Exit Discipline

- Alpha 2 is closed. Start Alpha 3 only after its implementation and roadmap documentation commits are separated.
- Each later alpha must preserve stable row/column identity, SSR-safe imports, virtualization correctness, keyboard operation, and untrusted-input boundaries.
- Grid Table, formula, and pivot capabilities are mandatory before beta; their semantics, memory behavior, accessibility, and security gates must pass before they can be called complete.
- A conditional feature may be deferred without blocking a release only when the reason, downstream impact, replacement milestone, and documentation updates are recorded.
- Beta freezes new feature scope. `1.0.0` requires compatibility, security, accessibility, performance, packaging, and release-process evidence rather than additional feature breadth.

## Research And Benchmark Timing

### Before `0.0.0-alpha.1`

Research:

- Renderer strategy: virtualized DOM versus Canvas 2D.
- Worker/WASM strategy: keep TypeScript as the required baseline and defer WASM unless evidence justifies it.
- Columnar data strategy: evaluate only where conversion cost may improve target operations.
- Framework adapter order: choose React, Angular, or framework-neutral demo for the first release.
- Dependency license review for runtime dependencies.

Benchmarks:

- Initial render for `1,000 rows x 20 columns`.
- Scroll stability for `100,000 logical rows x 50 columns`.
- TypeScript reference operations for row access, cell lookup, update, sort/filter if included.
- Renderer prototype comparison.
- Benchmark harness dry run in CI or local scripts.

### During `0.0.0-alpha.1`

Benchmarks:

- Time to first visible grid.
- Median frame time while scrolling.
- Active-cell update latency.
- Edit activation latency.
- Client-side range retrieval and update time.
- First adapter package size.

Acceptance signal:

- The grid renders only visible cells, not one DOM node per logical dataset cell.
- Keyboard and edit interactions stay within provisional alpha budgets.
- Benchmark commands are documented and repeatable.

### Before Worker/WASM Acceptance

Required research and benchmarks:

- TypeScript main-thread baseline.
- TypeScript Worker baseline.
- Rust native compute benchmark.
- Rust/WASM main-thread benchmark.
- Rust/WASM Worker benchmark.
- Transfer, serialization, startup, retained memory, and bundle-size measurements.

Decision rule:

- Do not add production WASM/Worker packages unless end-to-end results justify the build, packaging, fallback, and maintenance cost.

### Before Canvas Acceptance

Required research and benchmarks:

- Virtualized DOM prototype.
- Canvas 2D prototype with the same viewport and dataset.
- Keyboard navigation and edit overlay tests.
- Accessibility smoke test for active-cell semantics.
- Browser performance trace for scroll stability.

Decision rule:

- Do not accept Canvas unless it materially beats virtualized DOM for the alpha budget without blocking accessibility.

### Before Server-Side 2.0

Research:

- Protocol shape for server-side range, sort, filter, and update.
- Safe field allowlist model.
- LINQ and EF Core expression translation constraints.
- Query complexity and page-size limits.
- Update/concurrency behavior.

Benchmarks:

- EF Core generated SQL shape and query timing.
- Large table paging/sorting/filtering.
- Cancellation behavior.
- Stale-response handling.
- Server memory behavior under repeated requests.

Decision rule:

- The dedicated 2.0 plan must select the server protocol and backend package split. Backend libraries may depend on portable shared contracts, but frontend Core must not depend on ASP.NET Core, LINQ, EF Core, SQL, or any backend-specific runtime.

## Deferred Or Conditional Scope

| Area | Status | Condition |
| --- | --- | --- |
| Angular adapter | Selected for alpha.1 | Included after the core API became stable enough for the first adapter path. |
| React adapter | Deferred from alpha.1 | Add only after the Angular-backed alpha path is verified or when adapter bandwidth allows. |
| Server-side DataSource and server wire protocol | Deferred to 2.0 | Start only after client-side 1.0; target parity for every supported data operation without moving browser UI callbacks to the server. |
| Developer customization, row transactions, and optional clipboard paste | Implemented in Alpha 2 | Completion evidence is recorded in [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md). |
| Rust/WASM and TypeScript Worker engines | Accepted Alpha 4 bake-off | Implement against the same boundary and fixtures; ship the end-to-end winner and retain the other as a test/benchmark oracle. If results differ by no more than 10%, select Rust. |
| Canvas renderer | Conditional | Add only if renderer research proves value over virtualized DOM. |
| Backend C# project/solution area | Deferred to 2.0 | Keep it in this repository with independent versions; decide its internal package split and target framework in the dedicated 2.0 plan. |
| Read-only Grid Table | Required for `alpha.5` | Reuse the existing grid; add a preset, column drag/keyboard movement, stable sort, and configurable menu/row filtering. |
| Formula engine | Required for `alpha.6` | Implement the bounded Gethen grammar and worker lifecycle; do not claim Excel compatibility. |
| Pivot engine and field builder | Required for `alpha.7` | Reuse Alpha 4 grouping/aggregation, keep output readonly by default, and provide pointer plus keyboard configuration paths. |
| Grid shell and default visual UX | Required Alpha 4 closure before Alpha 5 | Complete headers, row numbers, pinned summaries, client status, accessibility corrections, modern-enterprise defaults, and host customization without a runtime design-system dependency. |
| Collaboration/comments/charts/XLSX import-export | Out of early alpha | Revisit after core grid stability. |

## Benchmark Report Requirements

Each benchmark report must include:

- hardware
- operating system
- browser and version
- Node, Rust, or runtime version
- dataset shape
- warm-up method
- iteration count
- median
- p75 or p95 where relevant
- variability
- memory behavior
- limitations

Use more than one run. Do not use arithmetic mean alone as the main decision signal.

## Roadmap Rules

- Roadmap entries are not accepted architecture.
- Features are not considered implemented until source code and tests exist.
- New issues and change requests discovered after hands-on use are captured first in [../project/ISSUE_AND_CHANGE_REQUESTS.md](../project/ISSUE_AND_CHANGE_REQUESTS.md).
- Accepted issue/change-request items update this roadmap only when they affect product sequencing, version scope, or release commitments.
- Active plans should link to issue/change-request IDs when new feedback becomes current execution work.
- Public API changes must update documentation.
- Performance-sensitive changes must include benchmark evidence.
- Package publishing is out of scope until explicitly requested.
