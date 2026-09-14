# Alpha 4 Engine Selection

## Status

Accepted local engine-selection evidence. TypeScript Worker is the production client shaping engine. Rust/WASM remains an internal test and benchmark oracle.

## Decision

The 1,000,000-row primary run completed with deterministic shaping, progress, formula-style, pivot-style, and cancellation parity, but both candidates missed at least one responsiveness or cancellation threshold across three measured runs. The accepted process therefore moved to the complete 500,000-row fallback gate.

At 500,000 rows, TypeScript Worker passed every gate. Rust/WASM completed the workload and remained result-compatible, but its measured main-thread frame-gap p95 was exactly `100.0 ms`; the budget requires a value below `100 ms`. TypeScript Worker is therefore selected even though Rust/WASM had lower median end-to-end latency.

## Environment

- Date: 2026-09-08.
- OS: Windows `10.0.26200`, x64.
- CPU: 12th Gen Intel Core i5-12500H, 16 logical cores.
- Memory: 16,785,268,736 bytes.
- Node.js: `v24.4.1`.
- Chromium: `151.0.7922.34`.
- Harness: `node benchmarks/engine-bakeoff/measure-alpha4-engine-selection.mjs --profile=<profile>`.
- Method: one cold/warm-up run followed by three measured runs per candidate.

## Fallback Gate Results

| Candidate | Median | p75/p95 | Range | Main-thread frame-gap p95 | Cancellation | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| TypeScript Worker | 5,229.8 ms | 5,305.5 / 5,305.5 ms | 4,969.3-5,305.5 ms | 16.8 ms | 54.5 ms | Pass; selected |
| Rust/WASM Worker | 4,472.5 ms | 4,913.7 / 4,913.7 ms | 3,086.2-4,913.7 ms | 100.0 ms | 88.3 ms | Fails strict responsiveness threshold |

Both candidates returned 135,032 filtered source rows, 135,068 total view rows, and the same 100-row viewport from the deterministic 500,000-row by 50-column mixed-type fixture. Full shaping output, ordered progress, cancellation outcome, numeric filter/aggregate, pivot-style grouped sum, and formula-style sum-product results matched.

## Package And Memory Evidence

The TypeScript shaping Worker entry is 2,150 bytes. The benchmark-only TypeScript numeric-kernel entry is 1,954 bytes. Rust/WASM candidate assets total 53,044 bytes across its shaping Worker, numeric-kernel Worker, and 47,814-byte WASM module. Package metadata excludes the Rust/WASM oracle and benchmark-only numeric kernel from publishable Core artifacts.

Chromium exposed a coarse 364,000,000-byte main-thread heap value before, during, and after both candidates, with zero reported retained delta after engine destruction and forced collection. This is useful disposal evidence, not a portable Worker-heap claim; Chromium does not expose candidate Worker/WASM peak heap through this API.

## Primary Gate Limitation

The primary 1,000,000-row run proved functional capacity but did not establish a stable passing performance result. Across the final three-run sample, TypeScript reported a 9,696.4 ms median and 133.3 ms main-thread frame-gap p95; Rust/WASM reported an 8,770.9 ms median and 300.1 ms frame-gap p95. TypeScript cancellation also exceeded the 100 ms budget in that run. The accepted stable capacity for Alpha 4 is therefore 500,000 rows, not 1,000,000.

## Consequences

- `createGridWorkerEngine()` is the supported public factory and resolves to the TypeScript Worker implementation.
- Candidate-specific factories are internal and are used only by parity tests and benchmarks.
- Rust/WASM code and assets remain in the repository but are excluded from package artifacts.
- The 1,000,000-row target may be revisited after memory-pressure and responsiveness improvements; it is not an Alpha 4 release claim.
