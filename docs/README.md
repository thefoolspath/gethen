# Gethen Documentation

Last reviewed: 2026-08-04.

Gethen is currently a documentation-only project. The repository has no implemented grid, packages, tests, benchmarks, CI, or published release. Architecture documents describe proposed target design unless explicitly labeled as implemented.

## Source-Of-Truth Hierarchy

1. Source code and automated tests for implemented behavior.
2. Accepted ADRs for architecture decisions.
3. Architecture documents for current system design.
4. Product scope for intended product boundaries.
5. Active plans for current implementation work.
6. Research notes for evidence and unresolved recommendations.
7. Completed plans and archived planning for historical context.

Because no production code exists yet, current implementation truth is limited to repository files and this documentation.

## Documentation Map

- Product: [product/VISION.md](product/VISION.md), [product/SCOPE.md](product/SCOPE.md), [product/ROADMAP.md](product/ROADMAP.md)
- Architecture: [architecture/SYSTEM_OVERVIEW.md](architecture/SYSTEM_OVERVIEW.md), [architecture/PACKAGE_BOUNDARIES.md](architecture/PACKAGE_BOUNDARIES.md), [architecture/RUST_WASM_BOUNDARY.md](architecture/RUST_WASM_BOUNDARY.md), [architecture/DATA_MODEL.md](architecture/DATA_MODEL.md), [architecture/PROTOCOL_V1.md](architecture/PROTOCOL_V1.md), [architecture/DATA_SOURCE.md](architecture/DATA_SOURCE.md), [architecture/ACCESSIBILITY_AND_SECURITY.md](architecture/ACCESSIBILITY_AND_SECURITY.md)
- Research: [research/PRE_ALPHA_RESEARCH_GATE.md](research/PRE_ALPHA_RESEARCH_GATE.md), [research/RENDERER_EVALUATION.md](research/RENDERER_EVALUATION.md), [research/WORKER_WASM_EVALUATION.md](research/WORKER_WASM_EVALUATION.md), [research/COLUMNAR_DATA_EVALUATION.md](research/COLUMNAR_DATA_EVALUATION.md), [research/FRAMEWORK_ADAPTER_EVALUATION.md](research/FRAMEWORK_ADAPTER_EVALUATION.md), [research/DEPENDENCY_LICENSE_EVALUATION.md](research/DEPENDENCY_LICENSE_EVALUATION.md), [research/CODEX_REPOSITORY_INSTRUCTIONS.md](research/CODEX_REPOSITORY_INSTRUCTIONS.md), [research/sources/README.md](research/sources/README.md), [research/findings/README.md](research/findings/README.md), [research/project-fit/README.md](research/project-fit/README.md)
- ADRs: [adr/README.md](adr/README.md)
- Active plan: [plans/active/0001-alpha-1-vertical-slice.md](plans/active/0001-alpha-1-vertical-slice.md)
- Quality: [quality/TESTING_STRATEGY.md](quality/TESTING_STRATEGY.md), [quality/PERFORMANCE_BUDGET.md](quality/PERFORMANCE_BUDGET.md), [quality/BENCHMARK_PLAN.md](quality/BENCHMARK_PLAN.md)
- Project management: [project/PROJECT_STATE.md](project/PROJECT_STATE.md), [project/CURRENT_STATE_ASSESSMENT.md](project/CURRENT_STATE_ASSESSMENT.md), [project/DOCUMENTATION_INVENTORY.md](project/DOCUMENTATION_INVENTORY.md), [project/MIGRATION_REPORT.md](project/MIGRATION_REPORT.md), [project/RISK_REGISTER.md](project/RISK_REGISTER.md), [project/RELEASE_STRATEGY.md](project/RELEASE_STRATEGY.md)
- Archive: [archive/planning-2026-08-03](archive/planning-2026-08-03)

## Major Proposed Decisions

- Language boundaries are proposed, not accepted.
- Rendering strategy is proposed pending prototype and accessibility evidence.
- Rust/WASM and Worker integration are proposed pending benchmarks.
- JSON Schema as protocol source of truth is proposed and likely, but still needs generation validation.
- React-first adapter order is proposed pending maintainer priority.

Active work is tracked in [plans/active/0001-alpha-1-vertical-slice.md](plans/active/0001-alpha-1-vertical-slice.md).
