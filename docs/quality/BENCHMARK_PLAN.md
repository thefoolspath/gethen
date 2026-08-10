# Benchmark Plan

Last reviewed: 2026-08-10.

Status: Initial harness implemented; several cross-runtime, memory-disposal, and cross-hardware families remain proposed.

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

## Verified Alpha 2 Commands

- `node benchmarks/typescript-reference/alpha2-customization-clipboard.mjs`
- `node benchmarks/renderer-prototype/measure-alpha2-customization.mjs`
- `node benchmarks/renderer-prototype/measure-alpha2-frame-trace.mjs`
- `pnpm run bench`

The Alpha 2 frame trace runs three independent Chromium processes per customization scenario and reports median, p75/p95, maxima, top-level long tasks, point-in-time heap movement, environment, dataset, and limitations. See [../research/findings/2026-08-10-alpha2-customization-clipboard.md](../research/findings/2026-08-10-alpha2-customization-clipboard.md).
