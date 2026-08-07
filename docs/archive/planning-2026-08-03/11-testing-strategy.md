# Testing Strategy

## Test Layers

| Layer | Tests |
| --- | --- |
| Protocol | JSON Schema validation, example fixtures, generated type drift checks |
| Core state | selection, keyboard navigation, editing reducer, event ordering |
| DataSource | client sorting/filtering, server cache, cancellation, stale response discard |
| Engine | Rust unit tests, TypeScript fallback parity tests, fuzz/property tests where practical |
| WASM bridge | worker message contract, transfer behavior, recovery from errors |
| Renderer | viewport math, visible cell count, resize behavior, pixel smoke tests |
| Framework adapters | React Strict Mode cleanup, Angular lifecycle cleanup, SSR import tests |
| Browser | Playwright keyboard/editing/scrolling tests |
| Accessibility | axe smoke checks plus manual screen-reader testing before compliance claims |
| Performance | repeatable benchmark suite with published hardware/browser metadata |

## Correctness Invariants

- row ID remains stable across sort/filter.
- visible index never replaces row ID.
- server mode never filters only cached blocks.
- stale server responses are discarded.
- read-only cells cannot commit edits.
- cancelled requests do not emit loaded events.
- worker termination cleans pending promises.
- importing packages in SSR does not access browser globals.

## CI

Initial CI should run:

- TypeScript typecheck.
- Vitest unit tests.
- JSON Schema validation.
- generated type drift check.
- Rust `cargo test`.
- `cargo clippy`.
- formatting checks.
- Playwright smoke tests after alpha UI exists.

Benchmarks should run manually or on scheduled CI to avoid noisy pull request gating.
