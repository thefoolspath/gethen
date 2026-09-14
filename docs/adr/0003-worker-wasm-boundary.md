# ADR-0003: Worker WASM Boundary

## Status

Superseded by [ADR-0006](0006-alpha4-production-engine.md)

## Context

Heavy local data operations may block the UI thread. Workers and WASM may help, but they add transfer, startup, bundle, and build complexity.

## Decision

Build TypeScript reference compute first. Defer production Rust/WASM and Worker integration for alpha until end-to-end benchmark evidence justifies the added build, package, transfer, startup, fallback, and maintenance cost.

The Alpha 4 gate has now completed. ADR-0006 selects TypeScript Worker at the accepted 500,000-row fallback capacity and keeps Rust/WASM internal as an oracle.

## Alternatives Considered

- Main-thread TypeScript only.
- TypeScript Worker.
- Rust/WASM main thread.
- Rust/WASM Worker.
- SharedArrayBuffer.

## Supporting Evidence

- [../research/WORKER_WASM_EVALUATION.md](../research/WORKER_WASM_EVALUATION.md)
- [../architecture/RUST_WASM_BOUNDARY.md](../architecture/RUST_WASM_BOUNDARY.md)
- [../research/findings/2026-08-07-typescript-reference-operations.md](../research/findings/2026-08-07-typescript-reference-operations.md)
- [../research/findings/2026-08-07-rust-native-operations-gnu.md](../research/findings/2026-08-07-rust-native-operations-gnu.md)

## Consequences

### Positive

Protects alpha from unnecessary Rust/WASM complexity.

### Negative

Delays proving the long-term compute differentiator.

### Neutral

Worker message formats remain internal.

## Uncertainties

End-to-end speed after serialization and transfer.

## Revisit Conditions

Revisit after representative TypeScript Worker, Rust/WASM main-thread, Rust/WASM Worker, startup, transfer, serialization, retained memory, and bundle-size benchmarks.

## Related Documents

- [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md)
