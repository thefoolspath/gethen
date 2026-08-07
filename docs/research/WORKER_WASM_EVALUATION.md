# Worker And WASM Evaluation

## Status

Draft

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

- TypeScript main-thread baseline.
- TypeScript Worker baseline.
- Rust native benchmark.
- Rust/WASM main-thread benchmark.
- Rust/WASM Worker benchmark.
- Separate measurement of startup, transfer, serialization, algorithm time, and retained memory.

## Analysis

Workers are valuable for avoiding UI long tasks even if algorithm time is similar. Rust/WASM is only valuable if it beats TypeScript after boundary costs and does not create unacceptable maintenance or package burden.

## Options

- TypeScript reference engine only: lowest complexity and required baseline.
- TypeScript Worker: likely best first non-blocking compute option.
- Rust/WASM Worker: conditional acceleration path.
- SharedArrayBuffer: defer due header and deployment requirements.

## Recommendation

Implement TypeScript reference engine first. Add Rust native benchmark next. Integrate WASM/Worker only if representative operations show material improvement after transfer and startup costs.

## Limitations

No local benchmark exists yet.

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
