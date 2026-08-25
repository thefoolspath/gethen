# Rust/WASM Boundary

Last reviewed: 2026-08-25.

Status: Alpha 4 research implementation exists; production-engine selection remains pending end-to-end benchmarks.

## Boundary Rule

Do not call WASM per cell. If adopted, communication must be coarse-grained:

- load dataset batch
- apply query
- update cells in batch
- get visible range
- cancel operation
- dispose dataset

The current A4-05 checkpoint follows this boundary: TypeScript normalizes mixed-type comparison and grouping values, then dependency-free Rust/WASM kernels compute filter masks, stable multi-sort row indices, hierarchical group assignments, built-in aggregates, and flattened viewport tokens in coarse column batches. TypeScript hydrates the public source/group row objects. Full-capacity, memory, cancellation, formula/pivot, and production-engine-selection evidence remain open; the implementation is not yet an accepted production runtime.

## Conditional Data Format

The initial research candidate is:

- TypeScript public API accepts row objects.
- TypeScript normalizes rows into typed batches.
- Numeric and boolean vectors use typed arrays.
- Typed array buffers are transferable to a Worker.
- Strings use transferable UTF-8 bytes with offset vectors.
- Nulls use explicit null bitmaps.

This is not accepted until transfer, memory, and correctness benchmarks exist.

## Failure Behavior

If WASM loading fails, the grid should use the TypeScript reference engine and emit diagnostics. Worker termination should reject pending requests, recreate the worker only when recoverable, and avoid leaving stale promises.

## Related Documents

- [../research/WORKER_WASM_EVALUATION.md](../research/WORKER_WASM_EVALUATION.md)
- [../adr/0003-worker-wasm-boundary.md](../adr/0003-worker-wasm-boundary.md)
- [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md)
