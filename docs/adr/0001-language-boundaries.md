# ADR-0001: Language Boundaries

## Status

Proposed

## Context

Gethen needs browser integration, framework adapters, data operations, and future backend compatibility. No implementation exists yet.

## Decision

Use TypeScript as the public API and control layer. Use Rust only as a conditional compute implementation behind an internal contract.

## Alternatives Considered

- TypeScript-only.
- Rust-heavy architecture.
- Backend-first protocol architecture.

## Supporting Evidence

- [../research/WORKER_WASM_EVALUATION.md](../research/WORKER_WASM_EVALUATION.md)
- [../research/FRAMEWORK_ADAPTER_EVALUATION.md](../research/FRAMEWORK_ADAPTER_EVALUATION.md)

## Consequences

### Positive

TypeScript remains the easiest browser and framework integration layer.

### Negative

Maintaining TypeScript and Rust implementations can duplicate correctness work.

### Neutral

Rust stays optional until benchmarks justify it.

## Uncertainties

Rust/WASM value after transfer and startup costs.

## Revisit Conditions

Accept, reject, or revise after the TypeScript reference engine and Rust benchmark milestones.

## Related Documents

- [../architecture/SYSTEM_OVERVIEW.md](../architecture/SYSTEM_OVERVIEW.md)
- [../plans/active/0001-alpha-1-vertical-slice.md](../plans/active/0001-alpha-1-vertical-slice.md)
