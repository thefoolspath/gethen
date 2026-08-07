# Pre-Alpha Research Gate

Last reviewed: 2026-08-04.

## Status

In progress.

## Purpose

Validate the highest-risk technology choices before production implementation starts. This gate exists to prevent proposed architecture from being treated as accepted without local prototype, benchmark, accessibility, and license evidence.

## Scope

This gate covers:

- renderer strategy
- TypeScript, Worker, Rust, and WASM compute strategy
- row-oriented versus columnar internal data representation
- first framework adapter or framework-neutral demo path
- dependency and license constraints for alpha implementation

This gate does not cover production grid implementation, package publishing, server-side backend packages, formulas, pivots, collaboration, charts, or spreadsheet file import/export.

## Entry Criteria

- Documentation restructure is complete.
- Research notes exist for renderer, Worker/WASM, columnar data, framework adapters, and dependency licensing.
- ADRs are Proposed and clearly linked to supporting research.
- Performance budget and benchmark methodology are documented as provisional.

## Exit Criteria

- Renderer prototype comparison is recorded.
- TypeScript reference operation benchmark is recorded.
- Rust native benchmark is recorded or explicitly deferred with rationale.
- Worker and WASM integration remain deferred or receive measured justification.
- Columnar conversion remains deferred or receives measured justification.
- First adapter path is selected for alpha.
- Dependency license candidates are reviewed before any runtime dependency is added.
- ADR statuses remain Proposed or become Accepted only with supporting evidence.

## Current Decision Readiness

| Decision | Current state | Required evidence before acceptance | Gate result |
| --- | --- | --- | --- |
| Renderer strategy | Proposed; virtualized DOM is the default recommendation | DOM and Canvas prototype comparison, keyboard/edit smoke test, accessibility smoke test | Open |
| Rust language boundary | Proposed; TypeScript remains public/control baseline | TypeScript baseline and representative Rust native benchmark | Open |
| Worker boundary | Proposed; conditional | UI long-task evidence or Worker end-to-end improvement after clone/transfer cost | Open |
| WASM boundary | Proposed; conditional | WASM startup, transfer, serialization, algorithm time, memory, and bundle measurement | Open |
| Columnar data | Proposed; conditional | Row-object baseline, typed vector benchmark, string clone/dictionary-cost measurement, update/disposal behavior | Open |
| First adapter | Proposed; framework-neutral demo then React is current recommendation | Maintainer priority or prototype evidence for first wrapper path | Open |
| Dependency licensing | Draft guidance exists | Candidate dependency list and license review before runtime dependency introduction | Open |

## Execution Order

1. Confirm alpha dataset shapes and benchmark environment.
2. Create the smallest benchmark harness needed to record repeatable local measurements.
3. Prototype virtualized DOM rendering for the alpha viewport budget.
4. Prototype Canvas 2D only enough to compare the same viewport.
5. Benchmark TypeScript reference row access, cell lookup, updates, and any retained sort/filter operation.
6. Run representative Rust native benchmark only as research evidence.
7. Record adapter choice and dependency/license review results.
8. Update research notes, ADR statuses, performance budget, and active plan completion evidence.

## Required Benchmark Report Fields

Use the shared benchmark methodology in [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md). Every report must include hardware, operating system, browser/runtime versions, dataset shape, warm-up method, iteration count, median, p75 or p95 where relevant, variability, memory behavior, and limitations.

## Related Documents

- [RENDERER_EVALUATION.md](RENDERER_EVALUATION.md)
- [WORKER_WASM_EVALUATION.md](WORKER_WASM_EVALUATION.md)
- [COLUMNAR_DATA_EVALUATION.md](COLUMNAR_DATA_EVALUATION.md)
- [FRAMEWORK_ADAPTER_EVALUATION.md](FRAMEWORK_ADAPTER_EVALUATION.md)
- [DEPENDENCY_LICENSE_EVALUATION.md](DEPENDENCY_LICENSE_EVALUATION.md)
- [../quality/PERFORMANCE_BUDGET.md](../quality/PERFORMANCE_BUDGET.md)
- [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md)
- [../adr/README.md](../adr/README.md)
