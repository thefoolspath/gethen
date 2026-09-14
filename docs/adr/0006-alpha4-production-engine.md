# ADR-0006: Alpha 4 Production Engine

## Status

Accepted

## Context

Alpha 4 implemented equivalent TypeScript Worker and Rust/WASM Worker candidates behind the same transferable mixed-type columnar boundary. ADR-0001 kept Rust research-only and ADR-0003 deferred production Worker/WASM integration until an end-to-end gate supplied correctness, responsiveness, capacity, memory, startup, transfer, bundle, cancellation, and representative formula/pivot evidence.

## Decision

Use TypeScript Worker as the production client shaping engine at the accepted 500,000-row fallback capacity. Expose the engine through the implementation-neutral `createGridWorkerEngine()` API. Keep Rust/WASM and candidate-specific factories internal as test and benchmark oracles, and exclude their assets from publishable Core package contents.

The 1,000,000-row primary workload completed but did not pass the responsiveness and cancellation thresholds consistently. At 500,000 rows TypeScript passed all gates. Rust/WASM was faster by median latency but recorded a `100.0 ms` main-thread frame-gap p95, while the accepted budget requires below `100 ms`.

## Supporting Evidence

- [../research/findings/2026-09-08-alpha4-engine-selection.md](../research/findings/2026-09-08-alpha4-engine-selection.md)
- [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md)
- [../quality/PERFORMANCE_BUDGET.md](../quality/PERFORMANCE_BUDGET.md)

## Consequences

### Positive

- The shipped engine passes deterministic correctness, parity, cancellation, responsiveness, disposal, and 500,000-row capacity gates.
- The public API does not expose an implementation choice that future evidence may change.
- Rust/WASM remains available for regression detection and later reevaluation without adding package weight.

### Negative

- The accepted Alpha 4 capacity is 500,000 rows rather than the preferred 1,000,000 rows.
- TypeScript was slower than Rust/WASM by median end-to-end latency in the fallback run.

### Neutral

- TypeScript remains the public and control layer.
- Formula and pivot product semantics remain owned by Alpha 6 and Alpha 7; the bake-off covered representative numeric kernels only.

## Revisit Conditions

Revisit if batching, allocation, Worker memory observability, or Rust/WASM responsiveness changes enough to rerun the complete 1,000,000-row gate.
