# Testing Strategy

Last reviewed: 2026-08-10.

Status: Implemented test harnesses exist for unit, contract, adapter, Chromium browser, benchmark, and Rust research checks. Manual assistive-technology and expanded cross-browser gates remain open.

## Required Test Layers

| Layer | Purpose |
| --- | --- |
| Unit tests | Core state, selection, editing, DataSource cache behavior |
| Contract tests | Protocol schemas and generated types |
| Browser tests | Rendering, keyboard navigation, editing, resize, scrolling |
| Accessibility tests | Automated checks plus manual assistive-technology verification |
| Cross-adapter tests | Adapter lifecycle and event mapping |
| Engine parity tests | TypeScript reference versus optional Rust/WASM |
| Benchmarks | Repeatable performance measurements |

## Invariants

- Row identity is stable across viewport movement.
- Visible index is not row identity.
- Server mode never filters only cached rows.
- Cancelled requests do not update visible state.
- Readonly cells do not commit edits.
- Importing packages does not access browser globals during SSR.

## Verified Commands

- `pnpm run check`
- `pnpm run build`
- `pnpm run test`
- `pnpm run test:browser`
- `pnpm run bench`
- `node benchmarks/engine-bakeoff/measure-worker-boundary.mjs`

Current Chromium coverage includes virtualization, editing activation/commit/cancel paths, rectangular selection, validated paste, variable layout, multiple frozen panes, bounded-history interaction, trusted custom editors/renderers, Angular passthrough, and adapter lifecycle smoke checks. Manual NVDA/Chrome remains a release gate and must not be represented as automated coverage.
