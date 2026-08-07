# Testing Strategy

Last reviewed: 2026-08-04.

Status: Proposed. No tests exist yet.

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

No test commands are verified yet because no test tooling exists.
