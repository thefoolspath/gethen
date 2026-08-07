# Project State

Last updated: 2026-08-07.

## Purpose

This file is the short AI-readable state note for Gethen. Read it before scanning the whole repository so current implementation status, active work, and decision boundaries are clear without rereading every document.

## Snapshot

Gethen is currently documentation-only. There are no production packages, source files, package manager configuration, tests, benchmarks, CI workflows, published packages, or verified build commands.

The repository currently contains product, architecture, research, ADR, quality, project-management, active-plan documentation, and placeholder workspace directories. Architecture documents describe proposed target design unless a document explicitly says a behavior is implemented.

## Implemented

None.

## Present Repository Assets

- MIT `LICENSE`.
- Root `.gitignore` covering OS/editor files, local secrets, Node/TypeScript outputs, Rust outputs, WebAssembly outputs, temporary files, and benchmark/profiling artifacts.
- Root `.gitattributes` normalizing repository text files to LF while preserving common Windows script endings and binary assets.
- Placeholder workspace directories: `apps/`, `packages/`, `benchmarks/`, `crates/`, and `tests/`.
- Documentation entry point: [../README.md](../README.md).
- Active plan: [../plans/active/0001-alpha-1-vertical-slice.md](../plans/active/0001-alpha-1-vertical-slice.md).
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
- Framework-neutral demo first, then React adapter as the current default recommendation.
- pnpm and Cargo monorepo once implementation begins.

## Active Work

- Pre-alpha research gate is in progress.
- All gate results are still open.
- No ADR is accepted yet.

## Verified Commands

None. The repository has no package manager, Cargo workspace, build configuration, test harness, benchmark harness, or CI configuration.

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
