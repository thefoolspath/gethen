# Architecture

Gethen should be built as a layered system with replaceable internals and narrow public APIs.

```text
React / Angular adapters
        |
        v
@thefoolspath/gethen-core
  controller, state, viewport, input, events, DataSource
        |
        +--> Renderer contract
        |      Canvas 2D renderer
        |      DOM editor/accessibility overlays
        |
        +--> ComputeEngine contract
               TypeScript fallback
               Worker bridge
                    |
                    v
               Rust/WASM engine
```

## Responsibility Split

TypeScript should own browser-facing concerns: DOM, Canvas lifecycle, accessibility DOM, events, keyboard/mouse/touch, ResizeObserver, public API validation, SSR-safe imports, framework adapters, worker lifecycle, and fallback behavior.

Rust should own deterministic dataset computation in client mode: columnar storage, stable sort, multi-column sort, filter predicates, source-to-visible index maps, visible range extraction, batch updates, and future grouping/aggregation/formulas after alpha.

The protocol should own language-neutral contracts for server requests and responses. It must be independent from package versions and backend implementation details.

C# belongs later as a protocol adapter layer, not as a source of frontend semantics.

## Internal Contracts

Keep these contracts internal until stabilized:

- `Renderer`
- `ComputeEngine`
- `WorkerTransport`
- `ColumnStore`
- cache internals
- selection reducer details
- editor plugin hooks
- custom renderers

Expose only stable user concepts in alpha: columns, DataSource, grid options, events, theme variables, and selected cell/edit events.

## SSR

Imports must not crash in SSR. Browser-only work must happen lazily after mount. Avoid top-level references to `window`, `document`, `Worker`, `ResizeObserver`, `HTMLCanvasElement`, or WASM initialization.

## Failure Modes

- WASM load failure: fall back to TypeScript engine and emit `dataError`/diagnostic event.
- Worker crash: terminate, recreate, reload dataset if client mode owns rows, mark pending requests failed.
- Unsupported Canvas: use DOM renderer fallback once implemented; for alpha, fail with clear diagnostic.
- Server stale response: discard by request sequence number.
