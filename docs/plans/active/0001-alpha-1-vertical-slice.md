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
| Angular adapter | Conditional | Include only if core API is stable enough |
| React adapter | Recommended first adapter | Confirm with maintainer priority |
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
- [ ] Prototype virtualized DOM renderer.
- [ ] Prototype Canvas renderer only enough to compare.
- [ ] Benchmark TypeScript reference operations.
- [ ] Benchmark representative Rust native operations.
- [ ] Decide first adapter.
- [ ] Validate dependency license candidates.

### Expected Files And Packages

`benchmarks/`, prototype app, research docs, ADRs.

### Acceptance Criteria

- [x] Decision readiness updated.
- [ ] ADR statuses remain Proposed or become Accepted with evidence.

### Tests

Prototype smoke tests.

### Performance Checks

Renderer and compute baseline measurements.

### Risks

Benchmarks may be noisy or too narrow.

### Relative Complexity

L

### Explicitly Deferred Work

Production grid implementation.

### Documentation Updates

Update research notes, ADRs, and performance budget.

### Completion Evidence

Record benchmark report and commands after completion.

## Milestone 1 - Repository And Quality Foundation

### Status

Not started

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

- [ ] Initialize Git repository if appropriate.
- [ ] Add package manager workspace.
- [ ] Add TypeScript configuration.
- [ ] Add unit test tooling.
- [ ] Add browser test tooling.
- [ ] Add benchmark harness.
- [ ] Add CI after commands are verified locally.

### Expected Files And Packages

Root config, `packages/`, `apps/`, `tests/`, `benchmarks/`.

### Acceptance Criteria

- [ ] Install/build/test commands are documented and pass.

### Tests

Initial smoke tests.

### Performance Checks

Benchmark harness dry run.

### Risks

Tooling churn before code exists.

### Relative Complexity

M

### Explicitly Deferred Work

Release automation.

### Documentation Updates

Update `AGENTS.md` verified commands.

### Completion Evidence

Record command output.

## Milestone 2 - Protocol And Public TypeScript Contracts

### Status

Not started

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

- [ ] Define minimal TypeScript public types.
- [ ] Define JSON Schema for server-facing request/response if server mode remains in alpha.
- [ ] Add contract tests.

### Expected Files And Packages

`packages/protocol`, `packages/core`.

### Acceptance Criteria

- [ ] Types compile.
- [ ] Schema examples validate.

### Tests

Type and contract tests.

### Performance Checks

Request payload size sanity.

### Risks

Premature protocol breadth.

### Relative Complexity

M

### Explicitly Deferred Work

Formula, pivot, grouping, aggregation protocol.

### Documentation Updates

Update protocol architecture and ADR status if accepted.

### Completion Evidence

Record test output.

## Milestone 3 - Minimal TypeScript Reference Engine

### Status

Not started

### Goal

Create correctness baseline.

### Outcome

Core can access rows/cells, track selection/edit state, and apply updates.

### Dependencies

Milestone 2.

### Related Documents

- [../../architecture/DATA_MODEL.md](../../architecture/DATA_MODEL.md)

### Tasks

- [ ] Implement row access.
- [ ] Implement cell lookup.
- [ ] Implement selection state.
- [ ] Implement edit state.
- [ ] Implement update application.
- [ ] Add sort/filter only if retained in alpha scope.

### Expected Files And Packages

`packages/core`.

### Acceptance Criteria

- [ ] Engine behavior is deterministic and tested.

### Tests

Unit tests and property-style cases where useful.

### Performance Checks

Reference baseline benchmark.

### Risks

Overbuilding before renderer needs are known.

### Relative Complexity

M

### Explicitly Deferred Work

Rust/WASM integration.

### Documentation Updates

Update data model if ownership changes.

### Completion Evidence

Record test and benchmark output.

## Milestone 4 - Rust Native Compute Benchmark

### Status

Conditional

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

- [ ] Implement representative Rust operations only.
- [ ] Compare to TypeScript baseline.

### Expected Files And Packages

`crates/gethen-engine`, `benchmarks/`.

### Acceptance Criteria

- [ ] Benchmark report justifies accept/defer decision.

### Tests

Rust unit tests and parity fixtures.

### Performance Checks

Native Rust versus TypeScript baseline.

### Risks

Native performance may not predict WASM performance.

### Relative Complexity

M

### Explicitly Deferred Work

Public Rust API.

### Documentation Updates

Update ADR-0001 and ADR-0003.

### Completion Evidence

Record benchmark report.

## Milestone 5 - WASM And Worker Integration

### Status

Conditional

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
- [ ] Keep TypeScript fallback.

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

Update ADR status and performance budget.

### Completion Evidence

Record benchmark and test output.

## Milestone 6 - Virtual Viewport And Renderer Slice

### Status

Not started

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

- [ ] Implement viewport calculation.
- [ ] Implement overscan.
- [ ] Implement scroll synchronization.
- [ ] Implement resize handling.
- [ ] Add render performance instrumentation.

### Expected Files And Packages

`packages/core`, demo app.

### Acceptance Criteria

- [ ] No DOM element is created per dataset cell.
- [ ] Scrolling keeps row identity stable.

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

Record browser test and benchmark output.

## Milestone 7 - Selection And Keyboard Navigation

### Status

Not started

### Goal

Support single active-cell navigation.

### Outcome

Users can select and move the active cell with keyboard controls.

### Dependencies

Milestone 6.

### Related Documents

- [../../architecture/ACCESSIBILITY_AND_SECURITY.md](../../architecture/ACCESSIBILITY_AND_SECURITY.md)

### Tasks

- [ ] Implement focus model.
- [ ] Implement click selection.
- [ ] Implement arrow navigation.
- [ ] Implement Home and End.
- [ ] Scroll active cell into view.

### Expected Files And Packages

`packages/core`, demo app.

### Acceptance Criteria

- [ ] Keyboard-only cell navigation works.
- [ ] Active cell is announced or represented in the accessibility layer.

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

Record browser test output.

## Milestone 8 - Cell Editing

### Status

Not started

### Goal

Support basic typed cell editing.

### Outcome

Users can enter, cancel, and commit edits with typed change events.

### Dependencies

Milestone 7.

### Related Documents

- [../../architecture/DATA_MODEL.md](../../architecture/DATA_MODEL.md)

### Tasks

- [ ] Implement edit activation.
- [ ] Implement text and number editors.
- [ ] Implement boolean toggle.
- [ ] Implement commit/cancel events.
- [ ] Restore focus after editing.

### Expected Files And Packages

`packages/core`, demo app.

### Acceptance Criteria

- [ ] Readonly cells do not commit.
- [ ] Change events include row ID, column ID, old value, and new value.

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

Record test output.

## Milestone 9 - Client-Side DataSource

### Status

Not started

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

- [ ] Implement row-key extraction.
- [ ] Implement range retrieval.
- [ ] Implement cell updates.
- [ ] Add optional sort/filter only if retained in alpha.

### Expected Files And Packages

`packages/core`.

### Acceptance Criteria

- [ ] Row IDs remain stable.
- [ ] Updates are reflected in visible cells.

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

Record test and benchmark output.

## Milestone 10 - Server-Side DataSource

### Status

Conditional

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

Not started

### Goal

Ship one supported adapter or framework-neutral demo.

### Outcome

Developers can mount and use the grid through the chosen first integration path.

### Dependencies

Milestones 6-9.

### Related Documents

- [../../research/FRAMEWORK_ADAPTER_EVALUATION.md](../../research/FRAMEWORK_ADAPTER_EVALUATION.md)

### Tasks

- [ ] Confirm first adapter choice.
- [ ] Implement typed wrapper.
- [ ] Map options and events.
- [ ] Clean up lifecycle resources.
- [ ] Add example app.

### Expected Files And Packages

`packages/gethen-react` or framework-neutral demo package.

### Acceptance Criteria

- [ ] Example runs.
- [ ] Adapter does not duplicate core business logic.

### Tests

Mount/unmount and SSR import tests.

### Performance Checks

No duplicate controller or leaked listeners.

### Risks

Framework API leaks into core.

### Relative Complexity

M

### Explicitly Deferred Work

Second adapter.

### Documentation Updates

Update package boundaries.

### Completion Evidence

Record build and test output.

## Milestone 12 - Second Framework Adapter

### Status

Conditional

### Goal

Add the second adapter only if it does not compromise alpha completeness.

### Outcome

React and Angular both wrap the same core.

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

### Tests

Lifecycle, event, and SSR import tests.

### Performance Checks

No leaked controller after destroy.

### Risks

Adapter scope delays alpha.

### Relative Complexity

L

### Explicitly Deferred Work

Framework-specific advanced APIs.

### Documentation Updates

Update roadmap if deferred.

### Completion Evidence

Record test output.

## Milestone 13 - Release Verification

### Status

Not started

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

- [ ] Run build.
- [ ] Run tests.
- [ ] Run browser tests.
- [ ] Run benchmarks.
- [ ] Inspect bundle/package contents.
- [ ] Review licenses.
- [ ] Draft changelog and alpha notes.

### Expected Files And Packages

All alpha packages, docs, release notes.

### Acceptance Criteria

- [ ] Release candidate is locally verifiable.
- [ ] No package is published.

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

Record all verification commands and outputs.
