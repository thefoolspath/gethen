# Project State

Last updated: 2026-08-10.

## Purpose

This file is the short AI-readable state note for Gethen. Read it before scanning the whole repository so current implementation status, active work, and decision boundaries are clear without rereading every document.

## Snapshot

Gethen now has initial workspace/tooling scaffolding, research prototypes, separated app demo source files, and a local `0.0.0-alpha.1` release-candidate vertical-slice grid implementation. No packages are published.

The repository currently contains product, architecture, research, ADR, quality, project-management, active-plan documentation, pnpm workspace configuration, initial packages, demo apps, research prototypes, benchmark scaffolds, and CI configuration. Architecture documents describe proposed target design unless a document explicitly says a behavior is implemented.

## Implemented

- Initial protocol schemas and inferred TypeScript protocol contracts.
- Initial TypeScript client grid engine and client DataSource.
- Initial virtualized DOM renderer with viewport virtualization, selection, keyboard navigation, text/number editing, boolean toggling, typed change events, and renderer cell/value helpers split out from the mount orchestration.
- Framework-neutral core demo.
- Initial Angular standalone adapter and Angular browser demo. The adapter component keeps its template and CSS in separate source files.
- App demos and renderer prototypes keep HTML, CSS, and TypeScript source separated, with TypeScript compiled to app-local `dist/` output during workspace builds.
- Local `0.0.0-alpha.1` package metadata for protocol, core, and Angular packages.

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
- Issue and change-request intake log for post-plan feedback: [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md).
- Research scaffold: dependency-free virtualized DOM renderer prototype in `apps/renderer-prototype/`.
- Research scaffold: dependency-free Canvas 2D renderer prototype in `apps/renderer-canvas-prototype/`.
- Research scaffold: manual renderer prototype benchmark notes in `benchmarks/renderer-prototype/`.
- Research scaffold: manual Canvas renderer benchmark notes in `benchmarks/renderer-canvas-prototype/`.
- Benchmark scaffold and preliminary single-run result for TypeScript-compatible reference operations in `benchmarks/typescript-reference/` and `docs/research/findings/2026-08-07-typescript-reference-operations.md`.
- Research Rust crate scaffold in `crates/gethen-engine/`; default `cargo check` passes, GNU release benchmark runs, but default MSVC release execution is blocked by missing `msvcrt.lib`.
- Initial dependency/license candidate review for Milestone 1 and Angular-first alpha tooling in `docs/research/DEPENDENCY_LICENSE_EVALUATION.md`.
- Documentation entry point: [../README.md](../README.md).
- Active plan: [../plans/active/0001-alpha-1-vertical-slice.md](../plans/active/0001-alpha-1-vertical-slice.md).
- Active feedback/control plan: [../plans/active/0002-feedback-and-change-control.md](../plans/active/0002-feedback-and-change-control.md).
- Proposed developer customization and row transaction plan: [../plans/active/0003-developer-customization-and-row-transactions.md](../plans/active/0003-developer-customization-and-row-transactions.md).
- Pre-alpha research gate tracker: [../research/PRE_ALPHA_RESEARCH_GATE.md](../research/PRE_ALPHA_RESEARCH_GATE.md).
- Proposed ADRs: [../adr/README.md](../adr/README.md).
- Provisional quality documents: [../quality/PERFORMANCE_BUDGET.md](../quality/PERFORMANCE_BUDGET.md), [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md), and [../quality/TESTING_STRATEGY.md](../quality/TESTING_STRATEGY.md).

## Proposed But Not Accepted

- TypeScript as public API and control layer.
- Optional Rust compute behind an internal contract.
- Worker and WASM integration only if benchmarks justify them.
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
- Worker/WASM production integration is deferred for alpha.
- Milestones 6-9 are initially complete. Server-side DataSource is deferred for alpha.
- Milestone 11 first framework adapter is complete for alpha.1 with Angular as selected adapter and browser-tested demo path.
- Milestone 12 second adapter is deferred from alpha.1; React remains a follow-up candidate.
- Milestone 13 local release verification has passed for alpha.1; publishing remains blocked until explicit maintainer approval and PR review to `main`.
- Virtualized DOM and Canvas renderer prototype scaffolds exist; measured benchmark results are still open.
- Preliminary TypeScript reference operation benchmark exists; repeat runs and Rust comparison are still open.
- Preliminary Rust GNU native benchmark exists; default MSVC release execution is blocked by local MSVC linker configuration: `LINK : fatal error LNK1104: cannot open file 'msvcrt.lib'`.
- First alpha adapter path is selected as Angular first; React is deferred until after Angular-backed alpha path or later reassessment.
- Initial dependency/license candidate review is complete; installed package metadata was verified for the alpha.1 dependency set.
- Accepted ADRs for alpha: ADR-0001 TypeScript public/control layer with Rust research-only, ADR-0002 virtualized DOM renderer for alpha, and ADR-0003 Worker/WASM deferral for alpha.
- Post-plan issues and change requests should be captured in [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md) before they are promoted into roadmap versions or active implementation plans. Conversation-derived feedback must not be added to the intake log until the maintainer approves whether it is an issue or change request.
- The first hands-on issues are fixed with browser regression coverage: deep vertical scrolling, double-click editing, type-to-edit, and automatic browser-test port allocation.
- Developer-friendly customization is now planned as follow-up work: application-owned CSS classes, conditional row/column/cell styling, theme tokens, DTO-to-column mapping with hidden key fields, row-level edit/insert/save events, and optional spreadsheet-style clipboard paste with blank-cell handling and pre-commit per-cell validation. Custom renderers, custom editors, raw HTML formatters, framework-specific per-cell component mounting, XLSX import/export, and rich clipboard content remain deferred.

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
| 2026-08-08 | Added follow-up planning for developer customization, DTO column mapping, and row-level edit/insert/save transactions | [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md), [../plans/active/0003-developer-customization-and-row-transactions.md](../plans/active/0003-developer-customization-and-row-transactions.md), [../product/ROADMAP.md](../product/ROADMAP.md) |
| 2026-08-08 | Added alpha.2 planning for optional Excel/MySQL Workbench-style clipboard paste, blank-cell handling, and validation-before-commit with per-cell errors | [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md), [../plans/active/0003-developer-customization-and-row-transactions.md](../plans/active/0003-developer-customization-and-row-transactions.md), [../product/ROADMAP.md](../product/ROADMAP.md) |
| 2026-08-08 | Fixed core renderer cells disappearing after vertical scrolling and added browser regression coverage | `packages/core/src/virtual-dom-grid.ts`, `tests/browser/renderer-prototypes.spec.ts`, [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md) |
| 2026-08-08 | Fixed double-click editing, type-to-edit, and browser-test port conflicts with browser regression coverage | `packages/core/src/virtual-dom-grid.ts`, `scripts/run-browser-tests.mjs`, `tests/browser/renderer-prototypes.spec.ts`, [ISSUE_AND_CHANGE_REQUESTS.md](ISSUE_AND_CHANGE_REQUESTS.md) |
| 2026-08-10 | Refactored package renderer and adapter source for clearer separation of responsibilities and split Angular template/CSS assets from TypeScript | `packages/core/src/virtual-dom-grid.ts`, `packages/core/src/virtual-dom-grid-cell.ts`, `packages/core/src/virtual-dom-grid-values.ts`, `packages/gethen-angular/src/gethen-grid.component.ts`, `packages/gethen-angular/src/gethen-grid.component.html`, `packages/gethen-angular/src/gethen-grid.component.css`, `scripts/copy-package-assets.mjs` |
