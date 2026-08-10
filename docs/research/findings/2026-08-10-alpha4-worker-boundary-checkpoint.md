# Alpha 4 Worker Boundary Checkpoint

## Status

Diagnostic checkpoint; not production-engine selection evidence.

## Local Evidence

Command: `node benchmarks/engine-bakeoff/measure-worker-boundary.mjs`

The local 2026-08-10 run used 100,000 finite numeric values plus validity bytes, five warmups, and fifteen measured iterations. Both candidates returned the same count and sum. TypeScript Worker median round trip was approximately 0.94 ms and Rust/WASM Worker median was approximately 0.22 ms. Cold startup was approximately 26 ms and 28 ms respectively.

The exact values vary by run and machine. The harness reports median, p75, and p95 rather than treating these sample values as universal performance claims.

## Interpretation

The result justifies continuing the Rust/WASM candidate, but cannot select it. It covers one transferable numeric filter/aggregate kernel, not ingestion, mixed-type sort/filter, full grouping, formula and pivot workloads, cancellation during long work, browser memory, bundle/startup cost, or disposal.

## Next Gate

Run both candidates against identical end-to-end 1,000,000-row by 50-column fixtures. If both fail, repeat the complete gate at 500,000 rows. Apply the accepted rule only after that evidence: when end-to-end performance differs by no more than 10%, select Rust; otherwise select the faster passing candidate.
