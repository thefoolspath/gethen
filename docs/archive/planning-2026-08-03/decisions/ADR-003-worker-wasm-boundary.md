# ADR-003: Worker WASM Boundary

## Status

Proposed.

## Context

Sorting and filtering large client datasets can block interaction. Web Workers isolate long-running work, while WASM may improve algorithm performance.

## Decision

Run Rust/WASM compute in a Worker from the first vertical slice. Use coarse-grained messages: load dataset batches, apply query, update cells, get visible range, cancel, dispose.

## Alternatives Considered

- WASM on main thread: simpler but risks UI long tasks.
- TypeScript Worker only: simpler and retained as fallback.
- SharedArrayBuffer: deferred due cross-origin isolation requirements.
- Arrow: deferred until transfer and interop value is demonstrated.

## Consequences

Worker lifecycle, cancellation, and recovery become core responsibilities. Transfer cost must be measured.

## Evidence Required

Transferable vs clone benchmarks, string-heavy dataset benchmarks, WASM init timing, memory disposal checks.

## Revisit Conditions

Revisit if Worker transfer dominates total time or if TypeScript Worker performs close enough with lower complexity.
