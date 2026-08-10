# Gethen `0.0.0-alpha.3` Local Candidate Notes

Status: Automated implementation gates pass locally. Manual NVDA/Chrome verification is open, so this is not yet a completed local release candidate. No package has been published.

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
- 12 unit/contract/adapter test files pass with 52 tests.
- Chromium browser regression coverage passes 22 scenarios, including Tab navigation and the Angular adapter after registry integration.
- The complete benchmark suite passes, including the GNU Rust research benchmark.
- Local dry-run package inspection passes for Protocol, Core, and Angular `0.0.0-alpha.3` artifacts.
- `node benchmarks/engine-bakeoff/measure-worker-boundary.mjs` reports worker startup, buffer-copy, median, p75, and p95 round-trip values over repeat iterations.

## Open Release Gate

- Manual keyboard and NVDA/Chrome verification for the Alpha 3 editor/layout surface. NVDA was not installed in the verification environment.

## Publishing

Local artifacts only. Do not publish to npm or NuGet.
