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

## Capacity Diagnostic

`node --max-old-space-size=2048 benchmarks/engine-bakeoff/measure-columnar-capacity.mjs` passed locally with 1,000,000 rows, 50 numeric columns, filter, stable sort, and a 100-row viewport. The measured compute time was approximately 851 ms, RSS approximately 931 MB, heap used approximately 330 MB, and array buffers approximately 450 MB. This confirms that bounded viewport hydration avoids the earlier 50-column row-object amplification. It remains diagnostic because mixed storage, grouping, Worker transfer, formula, pivot, and browser retained-memory evidence are still open.
