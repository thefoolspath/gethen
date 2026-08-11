# Testing Strategy

Last reviewed: 2026-08-11.

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

Current Chromium coverage includes virtualization, column headers, row numbers, empty-state focus safety, pinned summaries, client status, editing activation/commit/cancel paths, rectangular selection, validated paste, variable layout, multiple frozen panes, bounded-history interaction, trusted custom editors/renderers, Angular passthrough, and adapter lifecycle smoke checks. Manual visual QA passed at 1280 x 720 and 1440 x 900 on 2026-08-11. Manual NVDA/Chrome and representative-user walkthroughs remain open and must not be represented as automated coverage.
