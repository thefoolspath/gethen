# Project State

Last updated: 2026-08-25.

## Purpose

This file is the short AI-readable state note for Gethen. Read it before scanning the whole repository so current implementation status, active work, and decision boundaries are clear without rereading every document.

## Snapshot

Gethen now has locally verified `0.0.0-alpha.2` and `0.0.0-alpha.3` release candidates, an in-progress Alpha 4 data-shaping/engine checkpoint, and the implemented Alpha 4 grid-shell/default-theme foundation. Alpha 3 passed automated verification and a manual keyboard-only Chrome walkthrough. Manual NVDA/Chrome validation remains open; it is optional during alpha and mandatory before Beta/1.0. The accepted roadmap is client-first through 1.0, with Read-only Grid Table in Alpha 5, Formula in Alpha 6, Pivot in Alpha 7, and all server/C# work deferred to 2.0. No packages are published.

The repository currently contains product, architecture, research, ADR, quality, project-management, active-plan documentation, pnpm workspace configuration, initial packages, demo apps, research prototypes, benchmark scaffolds, and CI configuration. Architecture documents describe proposed target design unless a document explicitly says a behavior is implemented.

## Implemented

- Initial protocol schemas and inferred TypeScript protocol contracts.
- Initial TypeScript client grid engine and client DataSource.
- Initial virtualized DOM renderer with viewport virtualization, selection, keyboard navigation, text/number editing, boolean toggling, typed change events, and renderer cell/value helpers split out from the mount orchestration.
- Framework-neutral core demo.
- Initial Angular standalone adapter and Angular browser demo. The adapter component keeps its template and CSS in separate source files.
- App demos and renderer prototypes keep HTML, CSS, and TypeScript source separated, with TypeScript compiled to app-local `dist/` output during workspace builds.
- Local `0.0.0-alpha.3` package metadata for protocol, core, Angular, demos, and prototypes.
- Initial Alpha 2 view customization: hidden rendered columns, alignment, application-owned column/row/cell classes, text-only formatters, CSS-variable theme tokens, and Angular adapter passthrough.
- Initial Alpha 2 rectangular range selection with Shift+keyboard and Shift+click interactions, normalized range events, virtualized `aria-selected` state, and Angular event passthrough.
- Initial Alpha 2 explicit DTO mapping with stable hidden key fields, runtime metadata validation, and typed source-row retention.
- Initial Alpha 2 headless row transaction manager with edit, insert, cancel, dirty-field tracking, stable-identity protection, and row-only save payloads.
- Initial Alpha 2 opt-in direct TSV clipboard paste with typed parsing, nullable blank handling, developer validation, all-or-nothing commit, per-cell errors, pasted-range selection, host-dialog preparation, and Angular passthrough.
- Preliminary repeat-iteration Alpha 2 customization and 1,000-cell clipboard preparation/validation baseline in `benchmarks/typescript-reference/alpha2-customization-clipboard.mjs`.
- Preliminary repeated-scroll Chromium comparison for customization off/on in `benchmarks/renderer-prototype/measure-alpha2-customization.mjs`; medians were 5.0 ms and 5.3 ms respectively in the first local run.
- Local DevTools-style CDP trace across three independent Chromium processes per customization scenario: median frame intervals were 16.817 ms off and 16.529 ms on, with no top-level task over 50 ms. Cross-hardware evidence remains open.
- Alpha 3 editor state machine and built-in text, number, boolean, date, datetime, select, and JSON editors with nullable, readonly, validation, Tab, scroll, and unmount semantics.
- Alpha 3 trusted `GridCellRenderer`/`GridCellEditor` lifecycle plus Angular template/component renderer and component editor registries; Core imports no Angular code.
- Alpha 3 bounded cell/paste/row history with inverse local events and no automatic network replay.
- Alpha 3 host-persisted `GridLayoutState`, variable widths/order, and multiple virtualized frozen top rows/leading columns.
- Alpha 4 canonical filter/sort/group/aggregate/flatten/viewport pipeline with deterministic mixed-type comparisons, stable readonly synthetic group rows, and client-only custom reducers.
- Alpha 4 transferable mixed-type columnar schema and shared worker contract with progress and cancellation messages.
- Alpha 4 TypeScript Worker and dependency-free Rust/WASM Worker candidates, shared numeric formula/pivot-style kernels, browser parity smoke coverage, and a diagnostic 100,000-row numeric boundary comparison. Full end-to-end selection evidence remains open.
- Alpha 4 A4-01 deterministic mixed-type fixture generator with stable seeded 10,000-row, 500,000-row, and 1,000,000-row by 50-column profiles. Normal validation allocates the 10,000-row profile; full end-to-end Worker execution remains open.
- Alpha 4 A4-02 canonical TypeScript parity oracle with deterministic full-result digests for the 10,000-row fixture and compact checksum/count/aggregate output prepared for later 500,000-row and 1,000,000-row capacity runs.
- Alpha 4 A4-03 staged TypeScript Worker execution with ordered decode, filter, sort, group, aggregate, flatten, and completion progress. Each stage yields to the Worker event loop; canonical parity, 69 unit/contract/adapter tests, and 26 Chromium scenarios pass locally. Cooperative batching within long stages remains open.
- Alpha 4 A4-04 dependency-free Rust/WASM relational/UTF-8 filter masks and stable multi-sort indices behind TypeScript-normalized mixed-type comparison ranks. The 10,000-row mixed fixture passes full TypeScript/Rust-WASM filter/sort parity in Chromium.
- Alpha 4 A4-05 dependency-free Rust/WASM hierarchical group assignment, built-in count/sum/min/max/average aggregation, and expanded/collapsed viewport flatten tokens. TypeScript retains deterministic mixed-type key normalization and public row hydration; the full 10,000-row group/aggregate fixture passes TypeScript/Rust-WASM parity in Chromium.
- Alpha 4 grid shell with visible column headers, dedicated row-number gutter, correct body/header ARIA offsets, focus-safe empty state, readonly pinned bottom rows, client status bar, and host/aggregate-backed summary rows.
- Dependency-free modern-enterprise light default theme with comfortable default density, compact/spacious presets, expanded shell/state tokens, header class/callback customization, labelled built-in editors, and readonly cell semantics.
- Core and Angular grid-shell passthrough plus Chromium coverage and manual visual QA at 1280 x 720 and 1440 x 900. Representative-user walkthroughs and manual NVDA/Chrome remain open.
- Initial shell-enabled local performance evidence: 4.7 ms customization-on repeated-scroll median; three-process trace median-of-medians 16.599 ms, median p95 18.559 ms, and zero tasks over 50 ms. Cross-hardware evidence remains open.

## Present Repository Assets

- MIT `LICENSE`.
- Root `.gitignore` covering OS/editor files, local secrets, Node/TypeScript outputs, Rust outputs, WebAssembly outputs, temporary files, and benchmark/profiling artifacts.
- Root `.gitattributes` normalizing repository text files to LF while preserving common Windows script endings and binary assets.
- Placeholder workspace directories: `apps/`, `packages/`, `benchmarks/`, `crates/`, and `tests/`.
- pnpm workspace configuration with root TypeScript, Vitest, Playwright, and CI scaffolding.
- Package skeletons for `@thefoolspath/gethen-protocol`, `@thefoolspath/gethen-core`, and `@thefoolspath/gethen-angular`.
- Initial protocol schemas, inferred TypeScript contracts, and Ajv contract tests in `packages/protocol/src/`.
- Initial TypeScript reference engine in `packages/core/src/client-grid-engine.ts`.
- Initial virtualized DOM renderer slice, selection/navigation, editing, framework-neutral core demo, and client DataSource in `packages/core/src/` and `apps/core-demo/`; renderer cell DOM creation and value coercion helpers are split into focused modules.
- Initial Angular standalone adapter component in `packages/gethen-angular/src/gethen-grid.component.ts`, with separate `gethen-grid.component.html` and `gethen-grid.component.css` assets copied to package `dist/` during build.
- Angular-backed browser demo in `apps/angular-demo/`.
- App demo/prototype source split: `apps/core-demo/src/main.ts`, `apps/angular-demo/src/main.html`, `apps/angular-demo/src/main.ts`, `apps/renderer-prototype/src/prototype.ts`, and `apps/renderer-canvas-prototype/src/prototype.ts`, with app-local TypeScript package configs where needed.
- Package asset copy helper: `scripts/copy-package-assets.mjs`.
- Alpha.1 local release notes: [ALPHA_1_RELEASE_NOTES.md](ALPHA_1_RELEASE_NOTES.md).
- Alpha.2 local release notes: [ALPHA_2_RELEASE_NOTES.md](ALPHA_2_RELEASE_NOTES.md).
- Alpha.3 local candidate notes: [ALPHA_3_RELEASE_NOTES.md](ALPHA_3_RELEASE_NOTES.md).
- Issue and change-request intake log for post-plan feedback: [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md).
- Research scaffold: dependency-free virtualized DOM renderer prototype in `apps/renderer-prototype/`.
- Research scaffold: dependency-free Canvas 2D renderer prototype in `apps/renderer-canvas-prototype/`.
- Research scaffold: manual renderer prototype benchmark notes in `benchmarks/renderer-prototype/`.
- Research scaffold: manual Canvas renderer benchmark notes in `benchmarks/renderer-canvas-prototype/`.
- Benchmark scaffold and preliminary single-run result for TypeScript-compatible reference operations in `benchmarks/typescript-reference/` and `docs/research/findings/2026-08-07-typescript-reference-operations.md`.
- Research Rust crate scaffold in `crates/gethen-engine/`; default `cargo check` passes, GNU release benchmark runs, but default MSVC release execution is blocked by missing `msvcrt.lib`.
- Initial dependency/license candidate review for Milestone 1 and Angular-first alpha tooling in `docs/research/DEPENDENCY_LICENSE_EVALUATION.md`.
- Documentation entry point: [../README.md](../README.md).
- Project-name origin, product wordplay, creator relationship, and naming principles: [../project-name.md](../project-name.md).
- Active plan: [../plans/active/0001-alpha-1-vertical-slice.md](../plans/active/0001-alpha-1-vertical-slice.md).
- Active feedback/control plan: [../plans/active/0002-feedback-and-change-control.md](../plans/active/0002-feedback-and-change-control.md).
- Completed Alpha 2 developer customization and row transaction plan: [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md).
- Active Alpha 3 through local 1.0 execution plan: [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md).
- Active Alpha 4 grid-shell visual UX plan: [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md).
- Active client-first 1.0 and Server 2.0 sequencing amendment: [../plans/active/0006-client-first-1.0-server-2.0-roadmap.md](../plans/active/0006-client-first-1.0-server-2.0-roadmap.md).
- Initial customization API guide: [../product/CUSTOMIZATION.md](../product/CUSTOMIZATION.md).
- Pre-alpha research gate tracker: [../research/PRE_ALPHA_RESEARCH_GATE.md](../research/PRE_ALPHA_RESEARCH_GATE.md).
- Proposed ADRs: [../adr/README.md](../adr/README.md).
- Provisional quality documents: [../quality/PERFORMANCE_BUDGET.md](../quality/PERFORMANCE_BUDGET.md), [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md), and [../quality/TESTING_STRATEGY.md](../quality/TESTING_STRATEGY.md).

## Proposed But Not Accepted

- TypeScript as public API and control layer.
- Optional Rust compute behind an internal contract.
- TypeScript Worker and Rust/WASM Worker candidates are accepted for the Alpha 4 bake-off; only the measured winner ships, with Rust selected for a difference of at most 10%.
- Virtualized DOM as the default renderer recommendation, pending Canvas comparison and accessibility evidence.
- Row-oriented public data with conditional internal columnar or typed-vector representation.
- JSON Schema as protocol source of truth.
- Angular as the first framework adapter by maintainer priority on 2026-08-07, while core remains framework-neutral.
- pnpm and Cargo monorepo once implementation begins.

## Active Work

- Pre-alpha research gate initial checklist is complete, but several decision gates remain open because benchmark evidence is preliminary.
- Milestone 1 repository and quality foundation is initially complete.
- Milestone 2 protocol and public TypeScript contracts are initially complete.
- Milestone 3 minimal TypeScript reference engine is initially complete.
- Renderer strategy is accepted for alpha as virtualized DOM; Canvas is deferred.
- Rust language boundary is accepted for alpha as TypeScript public/control layer with Rust research-only.
- The Alpha 4 shaping pipeline, both Worker candidates, deterministic 10K/500K/1M mixed-type fixture profiles, and the canonical TypeScript parity oracle exist. Rust/WASM now owns filter, stable sort, hierarchical grouping, built-in aggregation, and flatten token generation. Running the larger profiles end to end, aligning cancellation/progress behavior, adding representative formula/pivot workloads, collecting browser memory/bundle evidence, rendered group-row accessibility, and production-engine selection remain active work.
- Milestones 6-9 are initially complete. Server-side DataSource is deferred for alpha.
- Milestone 11 first framework adapter is complete for alpha.1 with Angular as selected adapter and browser-tested demo path.
- Milestone 12 second adapter is deferred from alpha.1; React remains a follow-up candidate.
- Local release verification has passed for `0.0.0-alpha.2` and `0.0.0-alpha.3`. Alpha 3 automated checks and the manual keyboard-only Chrome walkthrough pass. Manual NVDA/Chrome screen-reader validation is deferred during alpha and remains a Beta/1.0 blocker. Publishing remains prohibited under the accepted local-only plan.
- Virtualized DOM and Canvas renderer prototype scaffolds exist; measured benchmark results are still open.
- Preliminary TypeScript reference operation benchmark exists; repeat runs and Rust comparison are still open.
- Preliminary Rust GNU native benchmark exists; default MSVC release execution is blocked by local MSVC linker configuration: `LINK : fatal error LNK1104: cannot open file 'msvcrt.lib'`.
- First alpha adapter path is selected as Angular first; React is deferred until after Angular-backed alpha path or later reassessment.
- Initial dependency/license candidate review is complete; Alpha 2 adds no runtime dependency, so the verified permissive Alpha 1 dependency set is unchanged.
- Accepted ADRs for alpha: ADR-0001 TypeScript public/control layer with Rust research-only, ADR-0002 virtualized DOM renderer for alpha, and ADR-0003 Worker/WASM deferral for alpha.
- Post-plan issues and change requests should be captured in [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md) before they are promoted into roadmap versions or active implementation plans. Conversation-derived feedback must not be added to the intake log until the maintainer approves whether it is an issue or change request.
- The first hands-on issues are fixed with browser regression coverage: deep vertical scrolling, double-click editing, type-to-edit, and automatic browser-test port allocation.
- The local Alpha 2 release candidate is implemented and verified. Application-owned classes, conditional styling, alignment, hidden columns, text-only formatters, theme tokens, rectangular range selection, explicit DTO mapping, headless row transactions, opt-in validated direct clipboard paste, host-dialog preparation, and Angular passthrough are included. JavaScript, repeated-render, and local CDP frame-trace baselines exist. Headed/cross-hardware evidence remains required before external performance claims. Renderer-owned row/paste-dialog controls, a second adapter, custom renderers/editors, raw HTML formatters, XLSX import/export, and rich clipboard content are deliberately omitted or deferred.
- Work remains sequential after the completed `0.0.0-alpha.3` local candidate: finish the Alpha 4 engine bake-off, implement Read-only Grid Table in Alpha 5, Formula in Alpha 6, Pivot in Alpha 7, then complete deferred NVDA/Chrome validation during client-side beta hardening before client 1.0. Server DataSource, a server wire protocol, and C#/EF Core integration move to 2.0.
- The Alpha 4 grid-shell foundation is implemented. ISSUE-20260811-001 through ISSUE-20260811-003 and CR-20260811-001 are done; the client portion of CR-20260811-002 is done and its server-status extension is deferred to 2.0. User walkthroughs and manual NVDA/Chrome evidence remain open and no validated-usability claim is made.

## Verified Commands

- `node --check apps/renderer-prototype/prototype.js`
- `node --check apps/renderer-canvas-prototype/prototype.js`
- `node --check benchmarks/typescript-reference/reference-operations.mjs`
- `node benchmarks/typescript-reference/reference-operations.mjs`
- `pnpm install`
- `pnpm run check`
- `pnpm run build`
- `pnpm run test`
- `pnpm exec playwright install chromium`
- `pnpm run test:browser`
- `pnpm run test:browser` with automatic allocation of an available loopback port, including when `127.0.0.1:4173` is already in use.
- `pnpm run bench`
- `node benchmarks/typescript-reference/alpha2-customization-clipboard.mjs`
- `node benchmarks/renderer-prototype/measure-alpha2-customization.mjs`
- `node benchmarks/renderer-prototype/measure-alpha2-frame-trace.mjs`
- `node benchmarks/engine-bakeoff/measure-worker-boundary.mjs`
- `cargo +stable-x86_64-pc-windows-gnu test --manifest-path crates/gethen-engine/Cargo.toml`
- `cargo build --manifest-path crates/gethen-engine/Cargo.toml --release --target wasm32-unknown-unknown`
- `npm.cmd pack --dry-run --json` from `packages/protocol`, `packages/core`, and `packages/gethen-angular` with `npm_config_cache=..\..\tmp\npm-cache`
- `cargo check --manifest-path crates/gethen-engine/Cargo.toml`
- `cargo +stable-x86_64-pc-windows-gnu check --manifest-path crates/gethen-engine/Cargo.toml`
- `cargo +stable-x86_64-pc-windows-gnu run --manifest-path crates/gethen-engine/Cargo.toml --release`

The repository still has no Cargo workspace. `cargo run --manifest-path crates/gethen-engine/Cargo.toml --release` with the default MSVC toolchain is not verified because linking fails with missing `msvcrt.lib`.

## Research Handling Rules

- For PDFs, papers, large files, or token-heavy sources, download or locate the source file first when appropriate.
- Convert token-heavy sources to Markdown with Microsoft `markitdown` before deep reading when the tool is available.
- Store source handling notes under [../research/sources/](../research/sources/).
- Store concise source-grounded summaries under [../research/findings/](../research/findings/).
- Store project-specific gap analysis under [../research/project-fit/](../research/project-fit/).
- Respect copyright and license constraints. Do not commit restricted PDFs or full converted text if redistribution is not allowed; keep citations, metadata, and short notes instead.

## Change Log

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-08-04 | Opened pre-alpha research gate | [../research/PRE_ALPHA_RESEARCH_GATE.md](../research/PRE_ALPHA_RESEARCH_GATE.md) |
| 2026-08-07 | Added project state and research evidence workflow | this file |
| 2026-08-07 | Added repository foundation placeholders, root ignore rules, and line-ending normalization | root `.gitignore`, root `.gitattributes`, `apps/`, `packages/`, `benchmarks/`, `crates/`, `tests/` |
| 2026-08-07 | Added dependency-free virtualized DOM renderer prototype scaffold for roadmap step 1 | `apps/renderer-prototype/`, `benchmarks/renderer-prototype/`, [../research/RENDERER_EVALUATION.md](../research/RENDERER_EVALUATION.md) |
| 2026-08-07 | Added dependency-free Canvas 2D renderer prototype scaffold for renderer comparison | `apps/renderer-canvas-prototype/`, `benchmarks/renderer-canvas-prototype/`, [../research/RENDERER_EVALUATION.md](../research/RENDERER_EVALUATION.md) |
| 2026-08-07 | Added preliminary TypeScript-compatible reference operation benchmark | `benchmarks/typescript-reference/`, [../research/findings/2026-08-07-typescript-reference-operations.md](../research/findings/2026-08-07-typescript-reference-operations.md) |
| 2026-08-07 | Added Rust native benchmark scaffold and recorded local linker blocker | `crates/gethen-engine/`, `benchmarks/rust-native/`, [../research/findings/2026-08-07-rust-native-benchmark-blocked.md](../research/findings/2026-08-07-rust-native-benchmark-blocked.md) |
| 2026-08-07 | Ran preliminary Rust native benchmark with GNU Rust toolchain | [../research/findings/2026-08-07-rust-native-operations-gnu.md](../research/findings/2026-08-07-rust-native-operations-gnu.md) |
| 2026-08-07 | Selected Angular as first framework adapter by maintainer priority | [../research/FRAMEWORK_ADAPTER_EVALUATION.md](../research/FRAMEWORK_ADAPTER_EVALUATION.md), [../plans/active/0001-alpha-1-vertical-slice.md](../plans/active/0001-alpha-1-vertical-slice.md) |
| 2026-08-07 | Completed initial dependency/license candidate review for alpha tooling | [../research/DEPENDENCY_LICENSE_EVALUATION.md](../research/DEPENDENCY_LICENSE_EVALUATION.md) |
| 2026-08-07 | Added pnpm workspace, TypeScript, Vitest, Playwright, benchmark runner, package skeletons, and CI | root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, `packages/`, `tests/browser/` |
| 2026-08-07 | Added initial protocol schemas, inferred TypeScript contracts, and contract tests | `packages/protocol/src/`, [../architecture/PROTOCOL_V1.md](../architecture/PROTOCOL_V1.md) |
| 2026-08-07 | Added initial TypeScript reference engine with tests and core benchmark | `packages/core/src/client-grid-engine.ts`, `packages/core/src/client-grid-engine.test.ts`, `benchmarks/typescript-reference/core-engine-operations.mjs` |
| 2026-08-07 | Accepted virtualized DOM renderer for alpha and deferred production Worker/WASM | [../adr/0002-rendering-strategy.md](../adr/0002-rendering-strategy.md), [../adr/0001-language-boundaries.md](../adr/0001-language-boundaries.md), [../adr/0003-worker-wasm-boundary.md](../adr/0003-worker-wasm-boundary.md) |
| 2026-08-07 | Added virtualized DOM renderer slice, selection/navigation, editing, core demo, and client DataSource | `packages/core/src/`, `apps/core-demo/`, `tests/browser/renderer-prototypes.spec.ts` |
| 2026-08-07 | Added initial Angular standalone adapter wrapper | `packages/gethen-angular/src/gethen-grid.component.ts`, `packages/gethen-angular/src/gethen-grid.component.test.ts` |
| 2026-08-07 | Added Angular-backed browser demo and adapter integration tests | `apps/angular-demo/`, `tests/browser/renderer-prototypes.spec.ts` |
| 2026-08-07 | Prepared local `0.0.0-alpha.1` release candidate verification notes | [ALPHA_1_RELEASE_NOTES.md](ALPHA_1_RELEASE_NOTES.md), package manifests |
| 2026-08-08 | Split app demo/prototype source into separate HTML, CSS, and TypeScript files and added workspace build configs for TypeScript-backed app demos | `apps/core-demo/`, `apps/angular-demo/`, `apps/renderer-prototype/`, `apps/renderer-canvas-prototype/` |
| 2026-08-08 | Added issue/change-request intake process for future real-use feedback | [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md), [../plans/active/0002-feedback-and-change-control.md](../plans/active/0002-feedback-and-change-control.md), [../product/ROADMAP.md](../product/ROADMAP.md) |
| 2026-08-08 | Captured first hands-on issue intake entries from Chrome QA | [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md), [../plans/active/0002-feedback-and-change-control.md](../plans/active/0002-feedback-and-change-control.md) |
| 2026-08-08 | Added follow-up planning for developer customization, DTO column mapping, and row-level edit/insert/save transactions | [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md), [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md), [../product/ROADMAP.md](../product/ROADMAP.md) |
| 2026-08-08 | Added alpha.2 planning for optional Excel/MySQL Workbench-style clipboard paste, blank-cell handling, and validation-before-commit with per-cell errors | [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md), [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md), [../product/ROADMAP.md](../product/ROADMAP.md) |
| 2026-08-08 | Fixed core renderer cells disappearing after vertical scrolling and added browser regression coverage | `packages/core/src/virtual-dom-grid.ts`, `tests/browser/renderer-prototypes.spec.ts`, [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md) |
| 2026-08-08 | Fixed double-click editing, type-to-edit, and browser-test port conflicts with browser regression coverage | `packages/core/src/virtual-dom-grid.ts`, `scripts/run-browser-tests.mjs`, `tests/browser/renderer-prototypes.spec.ts`, [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md) |
| 2026-08-10 | Refactored package renderer and adapter source for clearer separation of responsibilities and split Angular template/CSS assets from TypeScript | `packages/core/src/virtual-dom-grid.ts`, `packages/core/src/virtual-dom-grid-cell.ts`, `packages/core/src/virtual-dom-grid-values.ts`, `packages/gethen-angular/src/gethen-grid.component.ts`, `packages/gethen-angular/src/gethen-grid.component.html`, `packages/gethen-angular/src/gethen-grid.component.css`, `scripts/copy-package-assets.mjs` |
| 2026-08-10 | Started Alpha 2 with typed view metadata, hidden rendered columns, conditional application classes, text formatters, theme tokens, Angular passthrough, and regression coverage | `packages/core/src/grid-customization.ts`, `packages/core/src/virtual-dom-grid.ts`, `packages/gethen-angular/src/gethen-grid.component.ts`, [../product/CUSTOMIZATION.md](../product/CUSTOMIZATION.md), [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md) |
| 2026-08-10 | Added Alpha 2 rectangular range selection with keyboard and pointer extension, normalized range events, ARIA state, Angular passthrough, and browser coverage | `packages/core/src/virtual-dom-grid.ts`, `packages/core/src/virtual-dom-grid-cell.ts`, `packages/gethen-angular/src/gethen-grid.component.ts`, `tests/browser/renderer-prototypes.spec.ts` |
| 2026-08-10 | Added Alpha 2 DTO mapping and headless row transactions with stable identity, runtime metadata checks, dirty-field tracking, row save payloads, and unit coverage | `packages/core/src/grid-model.ts`, `packages/core/src/row-transactions.ts`, `packages/core/src/grid-model.test.ts`, `packages/core/src/row-transactions.test.ts` |
| 2026-08-10 | Added Alpha 2 opt-in validated direct clipboard paste, per-cell errors, all-or-nothing commit, pasted-range selection, host-dialog preparation, Angular passthrough, and regression coverage | `packages/core/src/grid-clipboard.ts`, `packages/core/src/virtual-dom-grid.ts`, `packages/gethen-angular/src/gethen-grid.component.ts`, `tests/browser/renderer-prototypes.spec.ts` |
| 2026-08-10 | Added preliminary repeat-iteration Alpha 2 customization, clipboard preparation/validation, and Chromium render-timing baselines | `benchmarks/typescript-reference/alpha2-customization-clipboard.mjs`, `benchmarks/renderer-prototype/measure-alpha2-customization.mjs`, [../research/findings/2026-08-10-alpha2-customization-clipboard.md](../research/findings/2026-08-10-alpha2-customization-clipboard.md) |
| 2026-08-10 | Completed local `0.0.0-alpha.2` release-candidate verification and package inspection without publishing | [ALPHA_2_RELEASE_NOTES.md](ALPHA_2_RELEASE_NOTES.md), package manifests, full verified command suite |
| 2026-08-10 | Added three-process local Chromium CDP frame tracing with frame intervals, long-task counts, and point-in-time heap movement | `benchmarks/renderer-prototype/measure-alpha2-frame-trace.mjs`, [../research/findings/2026-08-10-alpha2-customization-clipboard.md](../research/findings/2026-08-10-alpha2-customization-clipboard.md) |
| 2026-08-10 | Closed the Alpha 2 plan and accepted the sequential Alpha 3 through local unpublished 1.0 execution plan, including mandatory formula/pivot/server scope, Protocol v2 replacement, the engine bake-off, and .NET preview | [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md), [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md), [../product/ROADMAP.md](../product/ROADMAP.md), [../product/SCOPE.md](../product/SCOPE.md), [RISK_REGISTER.md](RISK_REGISTER.md) |
| 2026-08-11 | Added source-grounded visual UX research and implemented the Alpha 4 grid-shell foundation: headers, row numbers, pinned summaries, client status, accessibility corrections, default theme/density, Angular passthrough, tests, and two-viewport visual QA | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md), [../research/findings/2026-08-11-grid-visual-ux.md](../research/findings/2026-08-11-grid-visual-ux.md), [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md) |
| 2026-08-12 | Accepted client-first sequencing through 1.0: Read-only Grid Table Alpha 5, Formula Alpha 6, Pivot Alpha 7, client beta/1.0, and Server DataSource/server protocol/C# integration deferred to an independently planned 2.0 workstream | [../plans/active/0006-client-first-1.0-server-2.0-roadmap.md](../plans/active/0006-client-first-1.0-server-2.0-roadmap.md), [../product/ROADMAP.md](../product/ROADMAP.md), [../product/SCOPE.md](../product/SCOPE.md) |
| 2026-08-10 | Implemented the automated Alpha 3 editing, trusted extension, bounded history, layout/frozen-pane, Angular registry, and worker-boundary scope; manual NVDA/Chrome remains open | `packages/core/src/grid-editing.ts`, `packages/core/src/grid-history.ts`, `packages/core/src/grid-layout.ts`, `packages/gethen-angular/src/gethen-angular-registry.ts`, `benchmarks/engine-bakeoff/`, [ALPHA_3_RELEASE_NOTES.md](ALPHA_3_RELEASE_NOTES.md) |
| 2026-08-10 | Added the first Alpha 4 checkpoint: canonical shaping, mixed-type columnar worker contract, TypeScript and Rust/WASM candidates, browser parity, cancellation, and diagnostic numeric boundary evidence; engine selection remains open | `packages/core/src/grid-data-shaping.ts`, `packages/core/src/grid-engine-contract.ts`, `crates/gethen-engine/src/lib.rs`, `benchmarks/engine-bakeoff/`, [../research/findings/2026-08-10-alpha4-worker-boundary-checkpoint.md](../research/findings/2026-08-10-alpha4-worker-boundary-checkpoint.md) |
| 2026-08-12 | Reverified Alpha 3 checks, build, 68 unit/contract/adapter tests, and 26 Chromium scenarios; recorded a passing manual keyboard-only Chrome walkthrough. NVDA/Chrome remains open because NVDA is not installed. | [ALPHA_3_RELEASE_NOTES.md](ALPHA_3_RELEASE_NOTES.md), [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md) |
| 2026-08-12 | Accepted Alpha 3 as a completed local release candidate and deferred manual NVDA/Chrome validation from individual alpha exit gates to the mandatory Beta/1.0 release gate. No screen-reader or WCAG compliance claim is made until it passes. | [ALPHA_3_RELEASE_NOTES.md](ALPHA_3_RELEASE_NOTES.md), [../plans/active/0006-client-first-1.0-server-2.0-roadmap.md](../plans/active/0006-client-first-1.0-server-2.0-roadmap.md), [../architecture/ACCESSIBILITY_AND_SECURITY.md](../architecture/ACCESSIBILITY_AND_SECURITY.md) |
| 2026-08-24 | Completed Alpha 4 A4-01 deterministic mixed-type fixture profiles for 10K, 500K, and 1M rows by 50 columns; full candidate parity and engine selection remain open. | `benchmarks/engine-bakeoff/alpha4-mixed-type-fixtures.mjs`, `benchmarks/engine-bakeoff/validate-alpha4-mixed-type-fixtures.mjs`, [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md) |
| 2026-08-24 | Completed Alpha 4 A4-02 canonical TypeScript parity oracle for full 10K mixed-type results and compact later-capacity summaries; equivalent Worker candidate execution remains open. | `benchmarks/engine-bakeoff/alpha4-parity-oracle.mjs`, `benchmarks/engine-bakeoff/validate-alpha4-parity-oracle.mjs`, [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md) |
| 2026-08-24 | Completed Alpha 4 A4-03 staged TypeScript Worker progress across the canonical shaping pipeline; canonical parity and 69 automated tests pass. Cooperative within-stage cancellation and engine selection remain open. | `packages/core/src/grid-data-shaping.ts`, `packages/core/src/grid-engine-contract.ts`, `packages/core/src/grid-engine-worker.ts`, [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md) |
| 2026-08-24 | Completed Alpha 4 A4-04 Rust/WASM mixed-type filter and stable multi-sort checkpoint; 3 GNU Rust tests and 27 Chromium scenarios pass, including full 10K fixture parity. Rust-owned grouping/aggregation remains A4-05. | `crates/gethen-engine/src/lib.rs`, `packages/core/src/rust-wasm-filter-sort.ts`, `tests/browser/renderer-prototypes.spec.ts`, [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md) |
| 2026-08-25 | Completed Alpha 4 A4-05 Rust/WASM hierarchical grouping, built-in aggregation, and viewport flatten-token checkpoint; 6 GNU Rust tests and 28 Chromium scenarios pass, including full 10K group/aggregate parity. Full-capacity and engine-selection gates remain open. | `crates/gethen-engine/src/lib.rs`, `packages/core/src/rust-wasm-group-shaping.ts`, `tests/browser/renderer-prototypes.spec.ts`, [../plans/active/0004-alpha-3-onward-execution-plan.md](../plans/active/0004-alpha-3-onward-execution-plan.md) |
