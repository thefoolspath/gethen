# Rust/WASM Boundary

Last reviewed: 2026-09-08.

Status: Alpha 4 bake-off complete. TypeScript Worker is selected for production shaping at 500,000 rows; Rust/WASM is an internal parity/benchmark oracle.

## Boundary Rule

Do not call WASM per cell. If adopted, communication must be coarse-grained:

- load dataset batch
- apply query
- update cells in batch
- get visible range
- cancel operation
- dispose dataset

The Alpha 4 candidate follows this boundary: TypeScript normalizes mixed-type comparison and grouping values, then dependency-free Rust/WASM kernels compute filter masks, stable multi-sort row indices, hierarchical group assignments, built-in aggregates, and flattened viewport tokens in coarse column batches. TypeScript hydrates the public source/group row objects. The candidate remains repository-internal after the 500,000-row fallback gate selected TypeScript Worker for production shaping.

The TypeScript boundary validates equal column lengths, UTF-8 offset length/start/order/bounds/end,
sort indices, group IDs/counts, hierarchy metadata, viewport values, and operation codes before an FFI
call. Public unsafe Rust exports document their pointer and length safety contracts, and typed
allocators must be paired with the matching typed deallocator for both empty and non-empty buffers.

## Conditional Data Format

The initial research candidate is:

- TypeScript public API accepts row objects.
- TypeScript normalizes rows into typed batches.
- Numeric and boolean vectors use typed arrays.
- Typed array buffers are transferable to a Worker.
- Strings use transferable UTF-8 bytes with offset vectors.
- Nulls use explicit null bitmaps.

This format is accepted for the production TypeScript Worker boundary. The Rust/WASM implementation uses the same format only for parity and benchmark coverage.

## Failure Behavior

The public engine does not load WASM. Worker termination rejects pending requests and avoids stale promises. A future attempt to promote Rust/WASM must define a recoverable fallback and rerun the complete gate.

## Related Documents

- [../research/WORKER_WASM_EVALUATION.md](../research/WORKER_WASM_EVALUATION.md)
- [../adr/0003-worker-wasm-boundary.md](../adr/0003-worker-wasm-boundary.md)
- [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md)
- [../adr/0006-alpha4-production-engine.md](../adr/0006-alpha4-production-engine.md)
- [../research/findings/2026-09-08-alpha4-engine-selection.md](../research/findings/2026-09-08-alpha4-engine-selection.md)
