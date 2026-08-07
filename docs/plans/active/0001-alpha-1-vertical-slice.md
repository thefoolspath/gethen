# Alpha 1 Vertical Slice Plan

Last reviewed: 2026-08-04.

Status: Pre-alpha research gate in progress.

## Goal

Deliver the smallest credible `0.0.0-alpha.1`: a developer can define columns, provide rows, render a virtualized grid, navigate and select a cell, edit a cell, observe a typed change event, run tests, run a benchmark, and use at least one adapter or framework-neutral demo.

## Decision Gates Before High-Cost Work

| Question | Alpha necessity | Gate |
| --- | --- | --- |
| Rust | Not required initially | Add only after TypeScript baseline and Rust benchmark justify it |
| WebAssembly | Conditional | Add only if Rust benchmark plus transfer/startup costs meet threshold |
| Web Worker | Conditional | Add if compute or render work creates UI long tasks |
| Canvas | Conditional | Compare against virtualized DOM before accepting |
| Columnar data | Conditional | Add where benchmarked conversion improves target operations |
| Angular adapter | Selected first adapter | Include only after framework-neutral core API is stable enough |
| React adapter | Deferred first follow-up candidate | Add after Angular-backed alpha path or when adapter bandwidth allows |
| Server-side DataSource | Conditional | Include if vertical slice remains complete and testable |
| Full protocol scope | Not required | Keep only alpha operations |
| Formula engine | Deferred | Beyond alpha |
| Pivot engine | Deferred | Beyond alpha |

## Milestone 0 - Research Gates And Decision Records

### Status

In progress as the pre-alpha research gate.

### Goal

Resolve or explicitly defer the major architecture choices.

### Outcome

No high-cost technology is treated as accepted without evidence.

### Dependencies

Current documentation restructure.

### Related Documents

- [../../research/RENDERER_EVALUATION.md](../../research/RENDERER_EVALUATION.md)
- [../../research/WORKER_WASM_EVALUATION.md](../../research/WORKER_WASM_EVALUATION.md)
- [../../research/COLUMNAR_DATA_EVALUATION.md](../../research/COLUMNAR_DATA_EVALUATION.md)
- [../../adr/README.md](../../adr/README.md)
- [../../research/PRE_ALPHA_RESEARCH_GATE.md](../../research/PRE_ALPHA_RESEARCH_GATE.md)

### Tasks

- [x] Open the pre-alpha research gate and record decision readiness.
- [x] Prototype virtualized DOM renderer.
- [x] Prototype Canvas renderer only enough to compare.
- [x] Benchmark TypeScript reference operations.
- [x] Benchmark representative Rust native operations.
- [x] Decide first adapter.
- [x] Validate dependency license candidates.

### Expected Files And Packages

`benchmarks/`, prototype app, research docs, ADRs.

### Acceptance Criteria

- [x] Decision readiness updated.
- [x] ADR statuses remain Proposed or become Accepted with evidence.

### Tests

Prototype smoke tests. Current syntax smoke checks: `node --check apps/renderer-prototype/prototype.js`; `node --check apps/renderer-canvas-prototype/prototype.js`; `node --check benchmarks/typescript-reference/reference-operations.mjs`. Rust benchmark checks: `cargo check --manifest-path crates/gethen-engine/Cargo.toml`; `cargo +stable-x86_64-pc-windows-gnu check --manifest-path crates/gethen-engine/Cargo.toml`.

### Performance Checks

Renderer and compute baseline measurements. Current renderer prototype measurement notes are scaffolded but no benchmark result is accepted yet. Preliminary TypeScript-compatible reference operation benchmark result is recorded but is not accepted architecture evidence by itself.

### Risks

Benchmarks may be noisy or too narrow.

### Relative Complexity

L

### Explicitly Deferred Work

Production grid implementation.

### Documentation Updates

Update research notes, ADRs, and performance budget.

### Completion Evidence

Virtualized DOM prototype scaffold: `apps/renderer-prototype/`. Canvas prototype scaffold: `apps/renderer-canvas-prototype/`. Manual benchmark notes: `benchmarks/renderer-prototype/` and `benchmarks/renderer-canvas-prototype/`. Preliminary TypeScript reference benchmark: `benchmarks/typescript-reference/` and `docs/research/findings/2026-08-07-typescript-reference-operations.md`. Preliminary Rust native GNU benchmark: `crates/gethen-engine/` and `docs/research/findings/2026-08-07-rust-native-operations-gnu.md`. Default MSVC release execution is blocked by missing `msvcrt.lib`, recorded in `docs/research/findings/2026-08-07-rust-native-benchmark-blocked.md`. First adapter decision: Angular first by maintainer priority on 2026-08-07. Dependency license candidate review: `docs/research/DEPENDENCY_LICENSE_EVALUATION.md`. Renderer benchmark report and repeat compute runs still required before related decisions can be accepted.

## Milestone 1 - Repository And Quality Foundation

### Status

Initial foundation complete.

### Goal

Create the minimum workspace needed to build, test, benchmark, and package.

### Outcome

Repository has verified commands.

### Dependencies

Milestone 0 decisions that affect tooling.

### Related Documents

- [../../architecture/PACKAGE_BOUNDARIES.md](../../architecture/PACKAGE_BOUNDARIES.md)
- [../../quality/TESTING_STRATEGY.md](../../quality/TESTING_STRATEGY.md)

### Tasks

- [x] Initialize Git repository if appropriate.
- [x] Add package manager workspace.
- [x] Add TypeScript configuration.
- [x] Add unit test tooling.
- [x] Add browser test tooling.
- [x] Add benchmark harness.
- [x] Add CI after commands are verified locally.

### Expected Files And Packages

Root config, `packages/`, `apps/`, `tests/`, `benchmarks/`.

### Acceptance Criteria

- [x] Install/build/test commands are documented and pass.

### Tests

Initial smoke tests through Vitest and Playwright.

### Performance Checks

Benchmark harness dry run through `pnpm bench`.

### Risks

Tooling churn before code exists.

### Relative Complexity

M

### Explicitly Deferred Work

Release automation.

### Documentation Updates

Updated `AGENTS.md` verified commands.

### Completion Evidence

Verified commands: `pnpm install`, `pnpm run check`, `pnpm run build`, `pnpm run test`, `pnpm exec playwright install chromium`, `pnpm run test:browser`, and `pnpm run bench`. CI scaffold: `.github/workflows/ci.yml`.

## Milestone 2 - Protocol And Public TypeScript Contracts

### Status

Initial contracts complete.

### Goal

Define minimal stable contracts.

### Outcome

Typed columns, row identity, cell coordinates, DataSource, events, and editing contracts exist.

### Dependencies

Milestone 1.

### Related Documents

- [../../architecture/PROTOCOL_V1.md](../../architecture/PROTOCOL_V1.md)
- [../../adr/0005-protocol-source-of-truth.md](../../adr/0005-protocol-source-of-truth.md)

### Tasks

- [x] Define minimal TypeScript public types.
- [x] Define JSON Schema for server-facing request/response if server mode remains in alpha.
- [x] Add contract tests.

### Expected Files And Packages

`packages/protocol`, `packages/core`.

### Acceptance Criteria

- [x] Types compile.
- [x] Schema examples validate.

### Tests

Type and contract tests through `pnpm check` and `pnpm test`.

### Performance Checks

Request payload size sanity remains informal; schema enforces a maximum `rowCount` of `1000`.

### Risks

Premature protocol breadth.

### Relative Complexity

M

### Explicitly Deferred Work

Formula, pivot, grouping, aggregation protocol.

### Documentation Updates

Updated protocol architecture. ADR remains Proposed because future generation and cross-language validation are not complete.

### Completion Evidence

Verified commands: `pnpm run check`, `pnpm run build`, and `pnpm run test`. Contract tests validate `GetRowsRequest`, `GetRowsResult`, `CellUpdateRequest`, `UpdateCellsResult`, and `ProtocolError`.

## Milestone 3 - Minimal TypeScript Reference Engine

### Status

Initial reference engine complete.

### Goal

Create correctness baseline.

### Outcome

Core can access rows/cells, track selection/edit state, and apply updates.

### Dependencies

Milestone 2.

### Related Documents

- [../../architecture/DATA_MODEL.md](../../architecture/DATA_MODEL.md)

### Tasks

- [x] Implement row access.
- [x] Implement cell lookup.
- [x] Implement selection state.
- [x] Implement edit state.
- [x] Implement update application.
- [ ] Add sort/filter only if retained in alpha scope.

### Expected Files And Packages

`packages/core`.

### Acceptance Criteria

- [x] Engine behavior is deterministic and tested.

### Tests

Unit tests cover row/cell access, selection, edit commit/cancel, stale update rejection, and duplicate row identity rejection.

### Performance Checks

Reference baseline benchmark through `benchmarks/typescript-reference/core-engine-operations.mjs`.

### Risks

Overbuilding before renderer needs are known.

### Relative Complexity

M

### Explicitly Deferred Work

Rust/WASM integration.

### Documentation Updates

No data ownership change from the proposed data model. Reference engine owns a copied row set and preserves stable row IDs.

### Completion Evidence

Verified commands: `pnpm run check`, `pnpm run test`, and `pnpm run bench`.

## Milestone 4 - Rust Native Compute Benchmark

### Status

Initial research benchmark complete.

### Goal

Test whether Rust compute is worth pursuing.

### Outcome

Representative native Rust sort/filter/update benchmark exists.

### Dependencies

Milestone 3 baseline.

### Related Documents

- [../../research/WORKER_WASM_EVALUATION.md](../../research/WORKER_WASM_EVALUATION.md)
- [../../quality/BENCHMARK_PLAN.md](../../quality/BENCHMARK_PLAN.md)

### Tasks

- [x] Implement representative Rust operations only.
- [x] Compare to TypeScript baseline.

### Expected Files And Packages

`crates/gethen-engine`, `benchmarks/`.

### Acceptance Criteria

- [x] Benchmark report justifies accept/defer decision.

### Tests

Rust unit tests and parity fixtures.

### Performance Checks

Native Rust versus TypeScript baseline. Result: Rust remains research-only; production WASM/Worker is deferred until end-to-end boundary costs are measured.

### Risks

Native performance may not predict WASM performance.

### Relative Complexity

M

### Explicitly Deferred Work

Public Rust API.

### Documentation Updates

Updated ADR-0001 and ADR-0003 for alpha.

### Completion Evidence

Preliminary reports: `docs/research/findings/2026-08-07-typescript-reference-operations.md` and `docs/research/findings/2026-08-07-rust-native-operations-gnu.md`.

## Milestone 5 - WASM And Worker Integration

### Status

Deferred for alpha.

### Goal

Integrate WASM and Worker compute only if Milestone 4 justifies it.

### Outcome

Optional compute engine runs outside the UI thread with measured transfer cost.

### Dependencies

Milestone 4.

### Related Documents

- [../../architecture/RUST_WASM_BOUNDARY.md](../../architecture/RUST_WASM_BOUNDARY.md)
- [../../adr/0003-worker-wasm-boundary.md](../../adr/0003-worker-wasm-boundary.md)

### Tasks

- [ ] Define internal Worker message contract.
- [ ] Implement load/query/update/range calls.
- [ ] Implement cancellation and worker failure recovery.
- [x] Keep TypeScript fallback.

### Expected Files And Packages

`packages/core`, optional `packages/gethen-wasm`, optional `crates/gethen-wasm`.

### Acceptance Criteria

- [ ] End-to-end benchmark passes the agreed threshold.
- [ ] Fallback works when WASM load fails.

### Tests

Worker contract, fallback, recovery, and parity tests.

### Performance Checks

Startup, transfer, operation time, memory.

### Risks

Bundle size and transfer cost.

### Relative Complexity

XL

### Explicitly Deferred Work

SharedArrayBuffer and Arrow.

### Documentation Updates

Updated ADR status to defer production Worker/WASM for alpha.

### Completion Evidence

Deferred because no end-to-end Worker/WASM evidence justifies production integration yet.

## Milestone 6 - Virtual Viewport And Renderer Slice

### Status

Initial renderer slice complete.

### Goal

Render only visible rows and columns using the selected renderer.

### Outcome

A scrollable grid shell with headers and visible cells.

### Dependencies

Milestone 0 renderer gate and Milestone 3 reference engine.

### Related Documents

- [../../research/RENDERER_EVALUATION.md](../../research/RENDERER_EVALUATION.md)
- [../../adr/0002-rendering-strategy.md](../../adr/0002-rendering-strategy.md)

### Tasks

- [x] Implement viewport calculation.
- [x] Implement overscan.
- [x] Implement scroll synchronization.
- [x] Implement resize handling.
- [x] Add render performance instrumentation.

### Expected Files And Packages

`packages/core`, demo app.

### Acceptance Criteria

- [x] No DOM element is created per dataset cell.
- [x] Scrolling keeps row identity stable.

### Tests

Viewport unit tests and browser smoke tests.

### Performance Checks

Initial render and scroll budget.

### Risks

Renderer selection may fail accessibility or performance checks.

### Relative Complexity

XL

### Explicitly Deferred Work

Sticky/frozen rows and columns unless required by the renderer prototype.

### Documentation Updates

Update renderer research with results.

### Completion Evidence

Verified commands: `pnpm run check`, `pnpm run build`, `pnpm run test`, `pnpm run test:browser`, and `pnpm run bench`.

## Milestone 7 - Selection And Keyboard Navigation

### Status

Initial navigation complete.

### Goal

Support single active-cell navigation.

### Outcome

Users can select and move the active cell with keyboard controls.

### Dependencies

Milestone 6.

### Related Documents

- [../../architecture/ACCESSIBILITY_AND_SECURITY.md](../../architecture/ACCESSIBILITY_AND_SECURITY.md)

### Tasks

- [x] Implement focus model.
- [x] Implement click selection.
- [x] Implement arrow navigation.
- [x] Implement Home and End.
- [x] Scroll active cell into view.

### Expected Files And Packages

`packages/core`, demo app.

### Acceptance Criteria

- [x] Keyboard-only cell navigation works.
- [x] Active cell is announced or represented in the accessibility layer.

### Tests

Keyboard browser tests and state unit tests.

### Performance Checks

Input latency budget.

### Risks

Focus behavior may conflict with editor behavior.

### Relative Complexity

M

### Explicitly Deferred Work

Range selection.

### Documentation Updates

Update accessibility notes.

### Completion Evidence

Verified command: `pnpm test:browser`.

## Milestone 8 - Cell Editing

### Status

Initial editing complete.

### Goal

Support basic typed cell editing.

### Outcome

Users can enter, cancel, and commit edits with typed change events.

### Dependencies

Milestone 7.

### Related Documents

- [../../architecture/DATA_MODEL.md](../../architecture/DATA_MODEL.md)

### Tasks

- [x] Implement edit activation.
- [x] Implement text and number editors.
- [x] Implement boolean toggle.
- [x] Implement commit/cancel events.
- [x] Restore focus after editing.

### Expected Files And Packages

`packages/core`, demo app.

### Acceptance Criteria

- [x] Readonly cells do not commit.
- [x] Change events include row ID, column ID, old value, and new value.

### Tests

Editing lifecycle tests.

### Performance Checks

Edit activation budget.

### Risks

Editor overlay positioning and value coercion.

### Relative Complexity

L

### Explicitly Deferred Work

Custom editors, date editor, dropdown editor.

### Documentation Updates

Update public API docs when created.

### Completion Evidence

Verified command: `pnpm test:browser`.

## Milestone 9 - Client-Side DataSource

### Status

Initial client DataSource complete.

### Goal

Load and update developer-provided rows.

### Outcome

Client grid can retrieve ranges, apply updates, and report row count.

### Dependencies

Milestone 3 and Milestone 8.

### Related Documents

- [../../architecture/DATA_SOURCE.md](../../architecture/DATA_SOURCE.md)
- [../../architecture/DATA_MODEL.md](../../architecture/DATA_MODEL.md)

### Tasks

- [x] Implement row-key extraction.
- [x] Implement range retrieval.
- [x] Implement cell updates.
- [ ] Add optional sort/filter only if retained in alpha.

### Expected Files And Packages

`packages/core`.

### Acceptance Criteria

- [x] Row IDs remain stable.
- [x] Updates are reflected in later ranges.

### Tests

DataSource unit tests.

### Performance Checks

Range retrieval and update benchmarks.

### Risks

Duplicate authoritative data.

### Relative Complexity

M

### Explicitly Deferred Work

Insert/delete APIs.

### Documentation Updates

Update DataSource architecture.

### Completion Evidence

Verified commands: `pnpm run check` and `pnpm run test`.

## Milestone 10 - Server-Side DataSource

### Status

Deferred for alpha.

### Goal

Support correct lazy server ranges if alpha scope allows it.

### Outcome

Grid requests server ranges and handles loading, error, retry, cancellation, and stale responses.

### Dependencies

Milestone 2 and Milestone 6.

### Related Documents

- [../../architecture/DATA_SOURCE.md](../../architecture/DATA_SOURCE.md)
- [../../architecture/PROTOCOL_V1.md](../../architecture/PROTOCOL_V1.md)

### Tasks

- [ ] Implement block cache.
- [ ] Implement request cancellation.
- [ ] Implement stale-response discard.
- [ ] Implement loading/error/retry states.

### Expected Files And Packages

`packages/core`, optional demo server.

### Acceptance Criteria

- [ ] Browser never filters only cached blocks as whole-result truth.
- [ ] Stale responses do not update state.

### Tests

Fake server and cache tests.

### Performance Checks

Visible block request timing.

### Risks

Incorrect cache invalidation.

### Relative Complexity

L

### Explicitly Deferred Work

Cursor pagination.

### Documentation Updates

Update protocol and DataSource docs.

### Completion Evidence

Record test output.

## Milestone 11 - First Framework Adapter

### Status

Complete for alpha.1.

### Goal

Ship one supported adapter or framework-neutral demo.

### Outcome

Developers can mount and use the grid through the chosen first integration path.

### Dependencies

Milestones 6-9.

### Related Documents

- [../../research/FRAMEWORK_ADAPTER_EVALUATION.md](../../research/FRAMEWORK_ADAPTER_EVALUATION.md)

### Tasks

- [x] Confirm first adapter choice.
- [x] Implement typed wrapper.
- [x] Map options and events.
- [x] Clean up lifecycle resources.
- [x] Add example app.

### Expected Files And Packages

`packages/gethen-angular` and framework-neutral core demo package.

### Acceptance Criteria

- [x] Example runs.
- [x] Adapter does not duplicate core business logic.

### Tests

SSR/import test for Angular wrapper; browser demo tests for both the framework-neutral core renderer path and Angular-backed adapter path.

### Performance Checks

Angular wrapper destroys and remounts the core renderer during lifecycle changes.

### Risks

Framework API leaks into core.

### Relative Complexity

M

### Explicitly Deferred Work

Second adapter.

### Documentation Updates

Updated package boundaries.

### Completion Evidence

Verified commands: `pnpm run check`, `pnpm run build`, and `pnpm run test`. Angular-backed demo: `apps/angular-demo/`. Browser integration coverage: `tests/browser/renderer-prototypes.spec.ts`.

## Milestone 12 - Second Framework Adapter

### Status

Deferred for alpha.1

### Goal

Add the second adapter only if it does not compromise alpha completeness.

### Outcome

React and Angular both wrap the same core when a second adapter is accepted after the Angular-backed alpha path.

### Dependencies

Milestone 11 and stable core adapter API.

### Related Documents

- [../../research/FRAMEWORK_ADAPTER_EVALUATION.md](../../research/FRAMEWORK_ADAPTER_EVALUATION.md)

### Tasks

- [ ] Implement second wrapper.
- [ ] Add lifecycle cleanup.
- [ ] Add client example.
- [ ] Add integration tests.

### Expected Files And Packages

`packages/gethen-angular` or `packages/gethen-react`.

### Acceptance Criteria

- [ ] No duplicated business logic.
- [ ] Adapter tests pass.
- [x] Second adapter is explicitly deferred if it would delay the Angular-first alpha.1 vertical slice.

### Tests

Lifecycle, event, and SSR import tests.

### Performance Checks

No leaked controller after destroy.

### Risks

Adapter scope delays alpha.

### Relative Complexity

L

### Explicitly Deferred Work

React adapter and framework-specific advanced APIs.

### Documentation Updates

Update roadmap if deferred.

### Completion Evidence

Deferred by maintainer priority for Angular first and by alpha.1 scope control. Revisit after release verification or in a follow-up alpha.

## Milestone 13 - Release Verification

### Status

Complete locally; not published.

### Goal

Prepare a local alpha release candidate without publishing.

### Outcome

The repository can produce package artifacts and release notes for review.

### Dependencies

All included alpha milestones.

### Related Documents

- [../../project/RELEASE_STRATEGY.md](../../project/RELEASE_STRATEGY.md)
- [../../project/RISK_REGISTER.md](../../project/RISK_REGISTER.md)
- [../../quality/PERFORMANCE_BUDGET.md](../../quality/PERFORMANCE_BUDGET.md)

### Tasks

- [x] Run build.
- [x] Run tests.
- [x] Run browser tests.
- [x] Run benchmarks.
- [x] Inspect bundle/package contents.
- [x] Review licenses.
- [x] Draft changelog and alpha notes.

### Expected Files And Packages

All alpha packages, docs, release notes.

### Acceptance Criteria

- [x] Release candidate is locally verifiable.
- [x] No package is published.

### Tests

Full alpha test suite.

### Performance Checks

All alpha budgets measured.

### Risks

Name availability or license issues discovered late.

### Relative Complexity

M

### Explicitly Deferred Work

Public publishing until explicit release approval.

### Documentation Updates

Update README, release strategy, and risk register.

### Completion Evidence

Verified commands: `pnpm run check`, `pnpm run build`, `pnpm run test`, `pnpm run test:browser`, and `pnpm run bench`. Package contents inspected with `npm.cmd pack --dry-run --json` for protocol, core, and Angular packages using a workspace-local npm cache. Installed license metadata checked for Angular packages, RxJS, tslib, TypeScript, Playwright, Ajv, json-schema-to-ts, and Vitest. Alpha release notes: [../../project/ALPHA_1_RELEASE_NOTES.md](../../project/ALPHA_1_RELEASE_NOTES.md).
