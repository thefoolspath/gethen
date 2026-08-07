# Alpha 1 Implementation Plan

Do not estimate calendar days until team size, availability, and release discipline are known. Complexity uses S/M/L/XL.

## Milestone 0 - Repository Foundation

- Goal: Create monorepo foundation.
- Tasks: add pnpm workspace, Cargo workspace, package skeletons, license, README, contributing/security placeholders, CI shell.
- Files/packages: root, `packages/*`, `crates/*`, `.github`.
- Dependencies: none.
- Acceptance: install/build/test commands exist.
- Tests: smoke command.
- Performance checks: none.
- Risks: tooling churn.
- Complexity: M.
- Deferred: release automation.

## Milestone 1 - Protocol And Public Types

- Goal: Define protocol schemas and generated TypeScript types.
- Tasks: create JSON Schema, examples, generation script, validation tests.
- Files/packages: `packages/protocol`, `tests/protocol`.
- Dependencies: Milestone 0.
- Acceptance: examples validate; generated types are deterministic.
- Tests: schema validation and type drift.
- Performance checks: request size sanity.
- Risks: premature fields.
- Complexity: M.
- Deferred: grouping, aggregation, pivot, formulas.

## Milestone 2 - Rust Dataset Prototype

- Goal: Prove column storage, filter, sort, and updates natively.
- Tasks: implement internal Rust dataset, stable indexes, filters/sorts, batch update.
- Files/packages: `crates/gethen-engine`.
- Dependencies: Milestone 1 concepts.
- Acceptance: deterministic row ID/index behavior.
- Tests: Rust unit tests.
- Performance checks: Criterion native baselines.
- Risks: mixed values and strings.
- Complexity: L.
- Deferred: public Rust API.

## Milestone 3 - WASM And Worker Bridge

- Goal: Run compute engine through Worker.
- Tasks: wasm-bindgen wrapper, worker protocol, cancellation, recovery, TS fallback.
- Files/packages: `crates/gethen-wasm`, `packages/wasm`, `packages/core`.
- Dependencies: Milestone 2.
- Acceptance: sort/filter/update/range through Worker.
- Tests: bridge parity tests.
- Performance checks: transfer, init, algorithm times.
- Risks: transfer cost erases gains.
- Complexity: XL.
- Deferred: SharedArrayBuffer, Arrow.

## Milestone 4 - Virtual Viewport And Renderer

- Goal: Render visible cells only.
- Tasks: viewport math, Canvas renderer, overscan, resize, horizontal/vertical scroll.
- Files/packages: `packages/core`.
- Dependencies: Milestone 0.
- Acceptance: 1M logical rows and 100 columns demo without dataset-cell DOM.
- Tests: viewport unit tests, Playwright smoke.
- Performance checks: scroll frame budget.
- Risks: text measurement, DPI, zoom.
- Complexity: XL.
- Deferred: OffscreenCanvas, WebGL.

## Milestone 5 - Selection And Keyboard Navigation

- Goal: Single active cell with keyboard movement.
- Tasks: click select, arrows, Tab, Shift+Tab, Enter, Home, End, scroll into view.
- Files/packages: `packages/core`.
- Dependencies: Milestone 4.
- Acceptance: active cell remains valid across scroll.
- Tests: reducer and browser keyboard tests.
- Performance checks: under 50 ms selection response.
- Risks: focus/accessibility model.
- Complexity: M.
- Deferred: range selection.

## Milestone 6 - Cell Editing

- Goal: Basic text, number, boolean editing.
- Tasks: DOM editor overlay, commit/cancel, readonly checks, event ordering.
- Files/packages: `packages/core`.
- Dependencies: Milestone 5.
- Acceptance: double-click and keyboard editing work.
- Tests: edit lifecycle tests.
- Performance checks: under 100 ms editor activation.
- Risks: overlay positioning.
- Complexity: L.
- Deferred: custom editors, date/dropdown.

## Milestone 7 - Client-Side DataSource

- Goal: Local full-dataset mode.
- Tasks: array input, row key, engine load batches, local query, update, refresh.
- Files/packages: `packages/core`, `packages/wasm`.
- Dependencies: Milestone 3.
- Acceptance: visible ranges reflect full local sort/filter.
- Tests: parity and update tests.
- Performance checks: 100k sort/filter, 1M where practical.
- Risks: memory growth.
- Complexity: L.
- Deferred: insert/delete.

## Milestone 8 - Server-Side DataSource

- Goal: Correct lazy block loading.
- Tasks: offset/limit requests, cache, cancellation, stale protection, retry, error state.
- Files/packages: `packages/core`, `packages/protocol`.
- Dependencies: Milestone 1 and 4.
- Acceptance: server owns whole-dataset sort/filter.
- Tests: fake server/cache tests.
- Performance checks: block request timing.
- Risks: stale responses and cache invalidation.
- Complexity: L.
- Deferred: cursor pagination.

## Milestone 9 - React Adapter

- Goal: Thin React wrapper.
- Tasks: component, prop mapping, events, cleanup, Strict Mode tests, examples.
- Files/packages: `packages/react`, `apps/react-demo`.
- Dependencies: core milestones.
- Acceptance: client and server examples run.
- Tests: mount/unmount and SSR import tests.
- Performance checks: no duplicate controllers in Strict Mode after cleanup.
- Risks: controlled/uncontrolled API.
- Complexity: M.
- Deferred: advanced hooks.

## Milestone 10 - Angular Adapter

- Goal: Thin Angular wrapper.
- Tasks: component, inputs/outputs, lifecycle cleanup, examples.
- Files/packages: `packages/angular`, `apps/angular-demo`.
- Dependencies: core milestones.
- Acceptance: client and server examples run.
- Tests: lifecycle and SSR import tests.
- Performance checks: no leaked controller after destroy.
- Risks: Angular packaging overhead.
- Complexity: L.
- Deferred: Angular-specific advanced APIs.

## Milestone 11 - Testing And Benchmarks

- Goal: Make evidence repeatable.
- Tasks: Playwright tests, engine benchmark matrix, memory tests, accessibility smoke.
- Files/packages: `tests`, `benchmarks`, apps.
- Dependencies: all implementation milestones.
- Acceptance: benchmark report generated.
- Tests: CI smoke plus manual benchmark command.
- Performance checks: all candidate budgets measured.
- Risks: noisy measurements.
- Complexity: L.
- Deferred: hard PR benchmark gates.

## Milestone 12 - Documentation And Alpha Packaging

- Goal: Prepare but do not publish alpha.
- Tasks: API docs, architecture docs, examples, release checklist, package metadata.
- Files/packages: all packages, docs.
- Dependencies: Milestone 11.
- Acceptance: local package build artifacts ready; no publish run.
- Tests: package import smoke.
- Performance checks: bundle size report.
- Risks: package names unavailable.
- Complexity: M.
- Deferred: public release until final name/trademark checks.
