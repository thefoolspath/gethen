# Benchmarks

Benchmark harnesses and measured result artifacts will live here.

Do not treat benchmark claims as accepted until commands and results are recorded in the relevant research and project-state documents.

Current benchmark targets:

- `renderer-canvas-prototype/`: manual measurement notes for the Canvas 2D renderer prototype.
- `renderer-prototype/`: manual measurement notes for the virtualized DOM renderer prototype.
- `typescript-reference/`: dependency-free Node benchmark for TypeScript-compatible reference operations.
## Alpha 4 Worker Bake-Off

- `engine-bakeoff/measure-worker-boundary.mjs` compares startup, transferable-buffer copy, and round-trip distributions for TypeScript Worker and Rust/WASM Worker numeric kernels.
- The current result is diagnostic. It cannot select the production engine until the complete end-to-end gate is measured.
