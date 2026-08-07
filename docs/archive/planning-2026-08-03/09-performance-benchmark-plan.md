# Performance Benchmark Plan

Performance claims must be scenario-based and reproducible. Candidate budgets are hypotheses until measured.

## Candidate Budgets

| Scenario | Candidate target |
| --- | --- |
| Initial grid creation | under 150 ms for empty/server mode shell |
| First visible render | under 200 ms after data available |
| Vertical scroll frame | 16 ms where practical; no repeated frames over 50 ms |
| Horizontal scroll frame | 16 ms where practical; no repeated frames over 50 ms |
| Cell selection latency | under 50 ms |
| Editor activation | under 100 ms |
| Sort 100,000 rows | benchmark target, no UI-thread long task |
| Filter 100,000 rows | benchmark target, no UI-thread long task |
| Sort/filter 1,000,000 rows | best-effort practical benchmark with memory report |
| Client-to-worker transfer | measured separately for row objects, column arrays, typed arrays |
| WASM initialization | under 300 ms warm; measured cold separately |
| Memory usage | no unbounded growth after replace/dispose cycles |
| Server block loading | visible block request issued within 50 ms of viewport need |

## Benchmark Matrix

Run identical datasets and operations across:

- TypeScript on main thread
- TypeScript in Worker
- Rust/WASM on main thread
- Rust/WASM in Worker

Separate:

- normalization time
- transfer/clone time
- WASM initialization
- algorithm time
- visible range materialization
- render time
- memory retained after disposal

## Dataset Shapes

- Numeric-heavy: 100k and 1M rows, 20 columns.
- String-heavy: 100k rows, 10 string columns with low/high cardinality.
- Mixed realistic: id, sku, name, quantity, price, active, category.
- Wide viewport stress: 1M logical rows, 100 columns, server mode.
- Update stress: 1k batch cell updates.

## Tooling

- Browser performance APIs for interaction timing and long tasks.
- Playwright for repeatable browser runs.
- Vitest for deterministic engine correctness tests.
- Criterion for native Rust algorithm baselines.
- Browser memory instrumentation where available.

## Decision Thresholds

Replace Rust with TypeScript for alpha if Worker TypeScript is within 20 percent of Rust/WASM on target operations while using less memory, simpler transfer, and smaller bundles.

Replace Canvas with DOM if virtualized DOM meets scroll/render budgets and provides materially better accessibility with acceptable DOM count.
