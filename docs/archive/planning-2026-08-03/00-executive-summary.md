# Gethen Executive Summary

Gethen should proceed as a framework-neutral data grid ecosystem with TypeScript as the browser/control layer, Rust/WASM as a headless compute engine, and JSON Schema as the first protocol source of truth. The architecture is promising, but two assumptions must remain provisional until alpha benchmarks exist: Rust/WASM is not automatically faster than optimized TypeScript, and Canvas is not automatically the best renderer for accessibility-heavy grids.

## Architecture Verdict

Adopt the proposed split with tighter boundaries:

- TypeScript owns public APIs, grid state orchestration, viewport math, rendering orchestration, input handling, DataSource behavior, framework adapters, SSR-safe imports, theming, and accessibility DOM.
- Rust owns optional compute-heavy client-side dataset operations: column normalization, filter/sort indexes, stable multi-column sort, batch updates, and visible index materialization.
- Web Worker owns compute isolation and cancellation boundaries.
- Protocol owns language-neutral client/server query and mutation contracts.
- Future C# packages implement protocol translation only; the frontend protocol must not assume EF Core, SQL, ASP.NET Core, or a specific database.

## Most Important Decisions

- Use hybrid Canvas 2D plus DOM overlays for `0.0.0-alpha.1`, behind a renderer interface.
- Run Rust/WASM inside a Web Worker from the first vertical slice for sort/filter operations.
- Keep a TypeScript fallback engine for correctness, tests, SSR/dev simplicity, and evidence-based comparison.
- Use coarse-grained worker/WASM messages. Do not cross the WASM boundary per cell.
- Use row-oriented public input and column-oriented internal compute storage.
- Use stable `rowId` values externally and source row indexes internally.
- Use JSON Schema 2020-12 as the protocol source of truth, with generated TypeScript types checked in CI.
- Use a monorepo with fixed package versions during alpha.
- Ship React first if both React and Angular delay alpha, then make Angular the next adapter milestone.

## Largest Risks

- Canvas accessibility may require a substantial DOM accessibility layer.
- Worker transfer and string encoding may erase Rust performance gains for small or string-heavy datasets.
- Server-side mode can easily become incorrect if the browser filters only cached blocks.
- Multi-framework release scope may dilute the first alpha.
- Protocol fields can become hard to change if published before semantics are proven.
- Large string columns may dominate memory.

## Changed Assumptions

- Rust/WASM should be treated as an optional acceleration path until benchmarked.
- OffscreenCanvas is useful later, but it should not be required for alpha.
- Apache Arrow and SharedArrayBuffer should be deferred unless transfer benchmarks prove value.
- Full accessibility compliance should not be claimed in alpha. The architecture should enable it.

## Smallest Credible Alpha

The smallest credible `0.0.0-alpha.1` is a vertical slice: protocol schemas, core controller, Canvas renderer, DOM editor overlay, single-cell selection, client DataSource with worker-backed sort/filter, server DataSource with block cache and cancellation, React adapter, Angular adapter as experimental or next milestone if needed, tests, benchmark harness, and docs. No production package publication should occur during planning.

## Authoritative Sources

- MDN structured clone and transferables: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm and https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
- MDN OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- MDN SharedArrayBuffer security requirements: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
- WAI-ARIA APG grid pattern: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- wasm-bindgen docs: https://docs.rs/wasm-bindgen
- serde-wasm-bindgen docs: https://docs.rs/serde-wasm-bindgen
- React StrictMode docs: https://react.dev/reference/react/StrictMode
- Angular lifecycle docs: https://angular.dev/guide/components/lifecycle
- JSON Schema spec: https://json-schema.org/specification
- npm scoped publish and provenance docs: https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/ and https://docs.npmjs.com/generating-provenance-statements/
- SemVer: https://semver.org/
