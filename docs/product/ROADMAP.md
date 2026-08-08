# Product Roadmap

Last reviewed: 2026-08-08.

Status: In progress. A local `0.0.0-alpha.1` release candidate exists; no package is published.

## Roadmap Principles

- Build the frontend/core vertical slice before expanding package scope.
- Keep server-side and backend integration in the project roadmap, but implement them after the frontend core, DataSource contract, and protocol are stable.
- Treat research and benchmark work as decision gates, not optional cleanup.
- Do not accept Rust, WASM, Canvas, Worker, Angular, or backend-specific packages until the related gate has evidence.
- Keep alpha versions small enough that each one can be locally built, tested, benchmarked, and reviewed.

## Version Roadmap

| Version | Theme | Main functions | Research and benchmarks |
| --- | --- | --- | --- |
| Pre-alpha research gate | Validate risky choices before production implementation | Virtualized DOM prototype, minimal Canvas comparison prototype, TypeScript baseline operations, dependency license review, first adapter decision | Renderer benchmark, TypeScript operation benchmark, Rust native benchmark only as research, license evaluation |
| `0.0.0-alpha.1` | Smallest credible frontend grid vertical slice | Typed columns, developer-provided rows, virtualized grid, visible row/column viewport, single active cell, keyboard navigation, basic text/number/boolean editing, typed change event, client-side DataSource, one adapter or framework-neutral demo | Initial render, scroll stability, input latency, edit activation, client range/update baseline, package smoke benchmark |
| `0.0.0-alpha.2` | Interaction basics and adapter expansion | Optional second adapter, range selection, clipboard copy/paste basics, validation primitives, improved column/cell metadata | Keyboard interaction benchmark, clipboard payload sanity checks, adapter mount/unmount tests, accessibility smoke tests |
| `0.0.0-alpha.3` | Spreadsheet-like layout controls | Undo/redo, column resize, column reorder, frozen columns/rows if still in scope, improved editor lifecycle | Layout reflow benchmark, resize/reorder interaction timing, memory leak checks after repeated edits |
| `0.0.0-alpha.4` | Data shaping | Grouping, aggregation, sort/filter hardening, large dataset client-side behavior | Sort/filter/group/aggregate benchmark, Worker feasibility benchmark if main-thread long tasks appear |
| `0.0.0-alpha.5` | Formula foundation | Formula model, dependency graph prototype, formula engine prototype, recalculation lifecycle | Formula recalculation benchmark, dependency graph memory benchmark, circular reference behavior research |
| `0.0.0-alpha.6` | Pivot prototype | Pivot model prototype, pivot data source flow, integration with grouping/aggregation/formula foundations | Pivot generation benchmark, aggregation stress tests, UI responsiveness checks |
| Post-frontend alpha | Server-side DataSource and protocol hardening | Server range request/response flow, cancellation, stale-response discard, loading/error/retry states, bounded block cache, protocol examples | Server request payload benchmark, cache behavior benchmark, stale response tests, protocol schema validation |
| Post-frontend backend libraries | Backend ecosystem integrations | `Gethen.AspNetCore`, `Gethen.Linq`, `Gethen.EntityFrameworkCore`; safe allowlisted query mapping for range/sort/filter/update | EF Core query translation research, SQL shape review, query complexity limits, cancellation tests, large table benchmarks |
| `0.1.0-beta.1` | API feedback and hardening | Public API cleanup, compatibility policy draft, documentation, accessibility validation, package contents review | Full benchmark suite, browser matrix smoke tests, bundle/package size review, license review |
| `1.0.0` | Stable release | Stable API, compatibility guarantees, documented extension points, release process, security posture | Release benchmark baseline, regression thresholds, long-running stability checks |

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

### Before Backend Libraries

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

- Backend libraries must depend on the shared protocol, but protocol and frontend core must not depend on ASP.NET Core, LINQ, EF Core, SQL, or any backend-specific runtime.

## Deferred Or Conditional Scope

| Area | Status | Condition |
| --- | --- | --- |
| Angular adapter | Selected for alpha.1 | Included after the core API became stable enough for the first adapter path. |
| React adapter | Deferred from alpha.1 | Add only after the Angular-backed alpha path is verified or when adapter bandwidth allows. |
| Server-side DataSource | Conditional for alpha, planned after frontend | Include only if it does not threaten the first complete frontend vertical slice. |
| Rust/WASM | Conditional | Add only if benchmark results justify boundary and maintenance cost. |
| Web Worker | Conditional | Add if compute or rendering creates measured UI long tasks. |
| Canvas renderer | Conditional | Add only if renderer research proves value over virtualized DOM. |
| Backend C# packages | Planned, deferred | Implement after frontend core, DataSource contract, and protocol are stable. |
| Formula engine | Deferred | Start after core interaction and data shaping are credible. |
| Pivot engine | Deferred | Start after grouping, aggregation, and formula foundations exist. |
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
