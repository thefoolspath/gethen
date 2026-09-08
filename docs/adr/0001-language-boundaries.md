# ADR-0001: Language Boundaries

## Status

Superseded in part by [ADR-0006](0006-alpha4-production-engine.md)

## Context

Gethen needs browser integration, framework adapters, data operations, and future backend compatibility. Initial TypeScript protocol and core package skeletons now exist.

## Decision

Use TypeScript as the public API and control layer for alpha. Rust began as research-only and conditional; ADR-0006 retains it internally as a parity/benchmark oracle after selecting TypeScript Worker for production shaping.

## Alternatives Considered

- TypeScript-only.
- Rust-heavy architecture.
- Backend-first protocol architecture.

## Supporting Evidence

- [../research/WORKER_WASM_EVALUATION.md](../research/WORKER_WASM_EVALUATION.md)
- [../research/FRAMEWORK_ADAPTER_EVALUATION.md](../research/FRAMEWORK_ADAPTER_EVALUATION.md)
- [../research/findings/2026-08-07-typescript-reference-operations.md](../research/findings/2026-08-07-typescript-reference-operations.md)
- [../research/findings/2026-08-07-rust-native-operations-gnu.md](../research/findings/2026-08-07-rust-native-operations-gnu.md)

## Consequences

### Positive

TypeScript remains the easiest browser and framework integration layer.

### Negative

Maintaining TypeScript and Rust implementations can duplicate correctness work.

### Neutral

Rust stays optional until benchmarks justify it.

## Uncertainties

Rust/WASM value after transfer and startup costs remains unproven.

## Revisit Conditions

Revisit if Worker/WASM end-to-end benchmarks show material benefit after startup, transfer, serialization, memory, package, and fallback costs.

## Related Documents

- [../architecture/SYSTEM_OVERVIEW.md](../architecture/SYSTEM_OVERVIEW.md)
- [../plans/active/0001-alpha-1-vertical-slice.md](../plans/active/0001-alpha-1-vertical-slice.md)
