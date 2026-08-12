# Gethen `0.0.0-alpha.3` Local Candidate Notes

Status: Completed local release candidate. Automated implementation gates and the manual keyboard-only Chrome walkthrough pass locally. Manual NVDA/Chrome validation is deferred during alpha and remains mandatory before Beta/1.0. No package has been published.

## Included

- Editor state machine covering activation, edit, validation, commit, failure, cancellation, scroll suspension, and unmount.
- Built-in text, number, boolean, date, datetime, select, and JSON editors with nullable, readonly, and validation semantics.
- Trusted custom renderer/editor lifecycle and Angular template/component registries with no Angular import in Core.
- Entry-count and retained-byte bounded undo/redo for cell edits, row transactions, and paste commits; undo emits inverse local events without replaying network effects.
- Serializable/applicable `GridLayoutState`, variable column widths/order, and multiple frozen top rows/leading columns across virtualization and selection.
- TypeScript Worker transferable-column boundary harness for the Alpha 4 TypeScript versus Rust/WASM bake-off.
- Core and Angular API passthrough plus an interactive Core demo.

## Automated Evidence

- TypeScript workspace checks and builds pass.
- 17 unit/contract/adapter test files pass with 68 tests.
- Chromium browser regression coverage passes 26 scenarios, including Tab navigation and the Angular adapter after registry integration.
- The complete benchmark suite passes, including the GNU Rust research benchmark.
- Local dry-run package inspection passes for Protocol, Core, and Angular `0.0.0-alpha.3` artifacts.
- `node benchmarks/engine-bakeoff/measure-worker-boundary.mjs` reports worker startup, buffer-copy, median, p75, and p95 round-trip values over repeat iterations.

## Manual Chrome Evidence

On 2026-08-12, a keyboard-only walkthrough of the built Core demo in Chrome passed for:

- sequential Tab focus through the Alpha 3 controls and into the grid;
- arrow-key active-cell navigation;
- Enter editor activation and Escape cancellation;
- native Tab commit followed by logical-cell advancement;
- keyboard activation of column resize, column reorder, and the 2 x 2 frozen-pane layout.

## Deferred Accessibility Evidence

- Manual NVDA/Chrome validation for the Alpha 3 editor/layout surface remains open because NVDA is not installed in the current verification environment.
- By maintainer decision on 2026-08-12, this is not an Alpha 3 exit blocker. It remains mandatory before Beta/1.0.
- Until it passes, Alpha 3 makes no screen-reader or WCAG compliance claim.

## Publishing

Local artifacts only. Do not publish to npm or NuGet.
