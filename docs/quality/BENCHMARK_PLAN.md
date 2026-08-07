# Benchmark Plan

Last reviewed: 2026-08-04.

Status: Proposed.

## Methodology Requirements

Every benchmark report must include:

- hardware
- operating system
- browser and version
- Node/Rust/runtime version
- dataset shape
- warm-up method
- iteration count
- median
- p75/p95 where relevant
- variability
- memory behavior
- limitations

Use more than one run. Do not rely on arithmetic mean alone.

## Required Benchmark Families

- renderer prototype comparison
- TypeScript reference engine
- TypeScript Worker
- Rust native compute
- Rust/WASM main thread
- Rust/WASM Worker
- Worker transfer formats
- memory disposal

## Decision Gates

- Rust/WASM should not proceed unless end-to-end results justify added build, package, and maintenance cost.
- Canvas should not be accepted unless it materially outperforms virtualized DOM for the alpha budget without blocking accessibility.
