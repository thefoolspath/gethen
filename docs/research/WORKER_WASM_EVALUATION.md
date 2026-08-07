# Worker And WASM Evaluation

## Status

Initial alpha decision recorded.

## Question

When should Gethen introduce Rust, WebAssembly, and Web Workers?

## Context

Rust/WASM may improve compute-heavy sort/filter operations, but it adds build, packaging, transfer, fallback, and debugging complexity.

## Evaluation Criteria

Algorithm speed, UI-thread responsiveness, startup cost, transfer/serialization cost, memory, bundle size, browser compatibility, debugging, packaging, and maintainability.

## Evidence

- MDN documents that structured clone copies complex objects and is used for Worker `postMessage`.
- MDN documents transferable `ArrayBuffer` ownership transfer, where the original buffer becomes detached.
- MDN documents that `SharedArrayBuffer` requires cross-origin isolation; COOP and COEP headers are part of enabling related restricted APIs.
- The wasm-bindgen guide includes examples for running Wasm in Web Workers and notes target/output compatibility concerns.
- serde-wasm-bindgen documentation says performance varies by engine and data type and can range from regressions to improvements, so it must be measured for the actual workload.

## Experiments And Benchmarks

Required before acceptance:

- TypeScript main-thread baseline. Preliminary single-run Node result exists at `findings/2026-08-07-typescript-reference-operations.md`.
- TypeScript Worker baseline.
- Rust native benchmark. Preliminary GNU-target result exists at `findings/2026-08-07-rust-native-operations-gnu.md`; default MSVC release execution is currently blocked by local linker error `LNK1104: cannot open file 'msvcrt.lib'`.
- Rust/WASM main-thread benchmark.
- Rust/WASM Worker benchmark.
- Separate measurement of startup, transfer, serialization, algorithm time, and retained memory.

## Analysis

Workers are valuable for avoiding UI long tasks even if algorithm time is similar. Rust/WASM is only valuable if it beats TypeScript after boundary costs and does not create unacceptable maintenance or package burden.

The preliminary native Rust benchmark is much faster for the representative numeric operations, but it does not include WASM startup, transfer, serialization, browser execution, fallback behavior, or package cost. Therefore it is not sufficient to add production Rust/WASM or Worker integration to the alpha path.

## Options

- TypeScript reference engine only: lowest complexity and required baseline.
- TypeScript Worker: likely best first non-blocking compute option.
- Rust/WASM Worker: conditional acceleration path.
- SharedArrayBuffer: defer due header and deployment requirements.

## Recommendation

Use TypeScript reference compute for alpha. Keep Rust native benchmark code as research evidence. Defer production WASM and Worker integration until end-to-end measurements show material improvement after transfer and startup costs.

## Limitations

No accepted local benchmark exists yet. Preliminary TypeScript-compatible and Rust GNU native benchmark results exist, while default MSVC Rust release execution is currently blocked by local linker setup.

## Open Questions

- What threshold is enough: 2x algorithm speed, 30 percent end-to-end improvement, or no UI long task?
- How large is the accepted WASM bundle budget?

## References

- "The structured clone algorithm", MDN Web Docs, accessed 2026-08-04, primary browser documentation, https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
- "Transferable objects", MDN Web Docs, accessed 2026-08-04, primary browser documentation, https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
- "Window: crossOriginIsolated", MDN Web Docs, accessed 2026-08-04, primary browser documentation, https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated
- "Cross-Origin-Opener-Policy header", MDN Web Docs, accessed 2026-08-04, primary browser documentation, https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy
- "Wasm in Web Worker", wasm-bindgen Guide, accessed 2026-08-04, maintainer documentation, https://wasm-bindgen.github.io/wasm-bindgen/examples/wasm-in-web-worker.html
- "serde-wasm-bindgen", docs.rs, accessed 2026-08-04, maintainer documentation, https://docs.rs/crate/serde-wasm-bindgen
