# AGENTS.md

## Project Overview

Gethen is an MIT-licensed, Excel-like data-grid ecosystem under active alpha development. The repository contains TypeScript packages, a Rust/WASM research oracle, Angular and framework-neutral demos, automated tests, browser tests, benchmarks, and documentation. Alpha 4 selected TypeScript Worker as the production shaping engine at the accepted 500,000-row fallback capacity; no package is published.

## Repository Map

- `docs/README.md`: documentation entry point and source-of-truth routing.
- `docs/product/`: product vision, scope, and roadmap.
- `docs/architecture/`: proposed and future architecture. Label implemented versus proposed behavior.
- `docs/research/`: evidence and analysis used before architecture decisions.
- `docs/research/sources/`: downloaded or converted research source material, with redistribution constraints respected.
- `docs/research/findings/`: concise source-grounded research summaries.
- `docs/research/project-fit/`: comparison between research findings and current Gethen project gaps.
- `docs/adr/`: architecture decision records.
- `docs/plans/active/`: executable plans for current work.
- `docs/plans/completed/`: completed plans retained for history.
- `docs/quality/`: testing strategy, performance budget, and benchmark methodology.
- `docs/project/`: risk register, release strategy, repository assessment, and migration records.
- `docs/archive/`: preserved previous planning documents.

## Documentation Routing

- Product-scope work: read `docs/product/`.
- Architecture changes: read `docs/architecture/` and related ADRs in `docs/adr/`.
- New technical decision: read or create the relevant research note in `docs/research/` before proposing an ADR.
- Research work: record raw/converted source handling in `docs/research/sources/`, concise findings in `docs/research/findings/`, and project-specific gaps in `docs/research/project-fit/`.
- Feature implementation: read the relevant active plan in `docs/plans/active/`.
- Performance-sensitive changes: read `docs/quality/PERFORMANCE_BUDGET.md` and `docs/quality/BENCHMARK_PLAN.md`.
- Release work: read `docs/project/RELEASE_STRATEGY.md`.
- Security-sensitive work: read `SECURITY.md` and relevant architecture documents.

## Required Workflow

1. Read applicable `AGENTS.md` files.
2. Read `docs/project/PROJECT_STATE.md` when it exists, then read the relevant active plan.
3. Inspect existing code and tests before changing behavior.
4. Confirm architecture assumptions using repository evidence.
5. For PDFs, papers, large files, or token-heavy sources, prefer downloading or locating the source file first and converting it with Microsoft `markitdown` to Markdown before reading deeply, subject to copyright and redistribution constraints.
6. Make the smallest scoped change.
7. Build affected packages when build commands exist.
8. Run relevant tests when test commands exist.
9. Run performance checks for performance-sensitive changes.
10. Review the diff.
11. Update documentation if behavior, architecture, protocol, public API, repository state, or research evidence changed.
12. Update `docs/project/PROJECT_STATE.md` whenever implementation status, verified commands, accepted/proposed decision boundaries, active work, or important repository structure changes.

## Verified Commands

- `node --check apps/renderer-prototype/prototype.js`
- `node --check apps/renderer-canvas-prototype/prototype.js`
- `node --check benchmarks/typescript-reference/reference-operations.mjs`
- `node benchmarks/typescript-reference/reference-operations.mjs`
- `node benchmarks/engine-bakeoff/measure-alpha4-engine-selection.mjs --profile=primary`
- `node benchmarks/engine-bakeoff/measure-alpha4-engine-selection.mjs --profile=fallback`
- `pnpm install`
- `pnpm run check`
- `pnpm run build`
- `pnpm run test`
- `pnpm exec playwright install chromium`
- `pnpm run test:browser`
- `pnpm run bench`
- `cargo check --manifest-path crates/gethen-engine/Cargo.toml`
- `cargo +stable-x86_64-pc-windows-gnu check --manifest-path crates/gethen-engine/Cargo.toml`
- `cargo +stable-x86_64-pc-windows-gnu run --manifest-path crates/gethen-engine/Cargo.toml --release`

No lint, package publish, or Cargo workspace commands are currently verified. `cargo run --manifest-path crates/gethen-engine/Cargo.toml --release` with the default MSVC toolchain currently fails during linking because `msvcrt.lib` is missing from the local MSVC linker environment.

## Dependency And Security Constraints

- Do not add runtime dependencies without license review.
- Prefer MIT, Apache-2.0, BSD, or similarly permissive licenses for runtime dependencies.
- Do not introduce copyleft dependencies into distributed packages without explicit maintainer approval and legal review.
- Do not publish packages, reserve names, or create external releases unless explicitly requested.
- Treat cell values, clipboard data, and server protocol input as untrusted.

## Definition Of Done

- Acceptance criteria are satisfied.
- Affected projects build, when build commands exist.
- Relevant tests pass, when tests exist.
- No unrelated changes are included.
- Public API changes are documented.
- Architecture decisions are updated when necessary.
- Performance-sensitive changes are benchmarked.
- No unreviewed incompatible dependency or license is introduced.
