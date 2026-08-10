# Engine Bake-Off Harness

The Alpha 4 checkpoint contains TypeScript Worker and dependency-free Rust/WASM Worker candidates behind the same transferable columnar boundary. The browser suite verifies full-result parity for a mixed numeric/text/boolean fixture.

Run `node benchmarks/engine-bakeoff/measure-worker-boundary.mjs`. It reports cold startup, buffer-copy cost, and warm median/p75/p95 round-trip timing for a 100,000-row numeric filter/aggregate kernel. Its output is diagnostic evidence, not an engine-selection result; the complete mixed-type 1M/500K workload, memory, bundle, cancellation, formula, and pivot gates remain open.
