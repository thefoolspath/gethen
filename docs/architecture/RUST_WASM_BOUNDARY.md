# Rust/WASM Boundary

Last reviewed: 2026-08-04.

Status: Proposed pending benchmarks. No Rust or WASM code exists yet.

## Boundary Rule

Do not call WASM per cell. If adopted, communication must be coarse-grained:

- load dataset batch
- apply query
- update cells in batch
- get visible range
- cancel operation
- dispose dataset

## Conditional Data Format

The initial research candidate is:

- TypeScript public API accepts row objects.
- TypeScript normalizes rows into typed batches.
- Numeric and boolean vectors use typed arrays.
- Typed array buffers are transferable to a Worker.
- Strings remain structured-cloned initially.
- Nulls use explicit null bitmaps.

This is not accepted until transfer, memory, and correctness benchmarks exist.

## Failure Behavior

If WASM loading fails, the grid should use the TypeScript reference engine and emit diagnostics. Worker termination should reject pending requests, recreate the worker only when recoverable, and avoid leaving stale promises.

## Related Documents

- [../research/WORKER_WASM_EVALUATION.md](../research/WORKER_WASM_EVALUATION.md)
- [../adr/0003-worker-wasm-boundary.md](../adr/0003-worker-wasm-boundary.md)
- [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md)
