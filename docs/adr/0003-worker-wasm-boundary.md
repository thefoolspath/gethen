# ADR-0003: Worker WASM Boundary

## Status

Proposed

## Context

Heavy local data operations may block the UI thread. Workers and WASM may help, but they add transfer, startup, bundle, and build complexity.

## Decision

Build TypeScript reference compute first. Treat Rust/WASM and Worker integration as conditional milestones gated by benchmark evidence.

## Alternatives Considered

- Main-thread TypeScript only.
- TypeScript Worker.
- Rust/WASM main thread.
- Rust/WASM Worker.
- SharedArrayBuffer.

## Supporting Evidence

- [../research/WORKER_WASM_EVALUATION.md](../research/WORKER_WASM_EVALUATION.md)
- [../architecture/RUST_WASM_BOUNDARY.md](../architecture/RUST_WASM_BOUNDARY.md)

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

Revisit after representative TypeScript, Rust native, WASM, and Worker benchmarks.

## Related Documents

- [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md)
