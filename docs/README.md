# Gethen Documentation

Last reviewed: 2026-08-25.

Gethen has locally verified `0.0.0-alpha.2` and `0.0.0-alpha.3` release candidates. Alpha 3 passed automated verification and a manual keyboard-only Chrome walkthrough; manual NVDA/Chrome validation is deferred during alpha but remains mandatory before Beta/1.0. No package is published. Architecture documents describe proposed target design unless explicitly labeled as implemented.

## Source-Of-Truth Hierarchy

1. Source code and automated tests for implemented behavior.
2. Accepted ADRs for architecture decisions.
3. Architecture documents for current system design.
4. Product scope for intended product boundaries.
5. Active plans for current implementation work.
6. Research notes for evidence and unresolved recommendations.
7. Issue/change-request intake for post-plan feedback that has not yet been accepted into roadmap or active execution.
8. Completed plans and archived planning for historical context.

## Documentation Map

- Project name: [project-name.md](project-name.md)
- Product: [product/VISION.md](product/VISION.md), [product/SCOPE.md](product/SCOPE.md), [product/ROADMAP.md](product/ROADMAP.md), [product/CUSTOMIZATION.md](product/CUSTOMIZATION.md), [product/LOGO_DESIGN_CONTEXT.md](product/LOGO_DESIGN_CONTEXT.md), [product/GETHEN_LOGO_REVEAL_VIDEO_PROMPT.md](product/GETHEN_LOGO_REVEAL_VIDEO_PROMPT.md)
- Architecture: [architecture/SYSTEM_OVERVIEW.md](architecture/SYSTEM_OVERVIEW.md), [architecture/PACKAGE_BOUNDARIES.md](architecture/PACKAGE_BOUNDARIES.md), [architecture/RUST_WASM_BOUNDARY.md](architecture/RUST_WASM_BOUNDARY.md), [architecture/DATA_MODEL.md](architecture/DATA_MODEL.md), [architecture/PROTOCOL_V1.md](architecture/PROTOCOL_V1.md), [architecture/DATA_SOURCE.md](architecture/DATA_SOURCE.md), [architecture/ACCESSIBILITY_AND_SECURITY.md](architecture/ACCESSIBILITY_AND_SECURITY.md)
- Research: [research/PRE_ALPHA_RESEARCH_GATE.md](research/PRE_ALPHA_RESEARCH_GATE.md), [research/RENDERER_EVALUATION.md](research/RENDERER_EVALUATION.md), [research/WORKER_WASM_EVALUATION.md](research/WORKER_WASM_EVALUATION.md), [research/COLUMNAR_DATA_EVALUATION.md](research/COLUMNAR_DATA_EVALUATION.md), [research/FRAMEWORK_ADAPTER_EVALUATION.md](research/FRAMEWORK_ADAPTER_EVALUATION.md), [research/DEPENDENCY_LICENSE_EVALUATION.md](research/DEPENDENCY_LICENSE_EVALUATION.md), [research/CODEX_REPOSITORY_INSTRUCTIONS.md](research/CODEX_REPOSITORY_INSTRUCTIONS.md), [research/sources/README.md](research/sources/README.md), [research/findings/README.md](research/findings/README.md), [research/project-fit/README.md](research/project-fit/README.md)
- ADRs: [adr/README.md](adr/README.md)
- Active plans: [plans/active/0001-alpha-1-vertical-slice.md](plans/active/0001-alpha-1-vertical-slice.md), [plans/active/0002-feedback-and-change-control.md](plans/active/0002-feedback-and-change-control.md), [plans/active/0004-alpha-3-onward-execution-plan.md](plans/active/0004-alpha-3-onward-execution-plan.md), [plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](plans/active/0005-grid-shell-visual-ux-research-and-implementation.md), [plans/active/0006-client-first-1.0-server-2.0-roadmap.md](plans/active/0006-client-first-1.0-server-2.0-roadmap.md), [plans/active/0007-documentation-demo-site.md](plans/active/0007-documentation-demo-site.md), [plans/active/0008-corporate-identity-and-theme-system.md](plans/active/0008-corporate-identity-and-theme-system.md)
- Completed plans: [plans/completed/0003-developer-customization-and-row-transactions.md](plans/completed/0003-developer-customization-and-row-transactions.md)
- Quality: [quality/TESTING_STRATEGY.md](quality/TESTING_STRATEGY.md), [quality/PERFORMANCE_BUDGET.md](quality/PERFORMANCE_BUDGET.md), [quality/BENCHMARK_PLAN.md](quality/BENCHMARK_PLAN.md)
- Project management: [project/PROJECT_STATE.md](project/PROJECT_STATE.md), [project/ISSUE_AND_CHANGE_REQUESTS.md](project/ISSUE_AND_CHANGE_REQUESTS.md), [project/ALPHA_1_RELEASE_NOTES.md](project/ALPHA_1_RELEASE_NOTES.md), [project/ALPHA_2_RELEASE_NOTES.md](project/ALPHA_2_RELEASE_NOTES.md), [project/ALPHA_3_RELEASE_NOTES.md](project/ALPHA_3_RELEASE_NOTES.md), [project/CURRENT_STATE_ASSESSMENT.md](project/CURRENT_STATE_ASSESSMENT.md), [project/DOCUMENTATION_INVENTORY.md](project/DOCUMENTATION_INVENTORY.md), [project/MIGRATION_REPORT.md](project/MIGRATION_REPORT.md), [project/RISK_REGISTER.md](project/RISK_REGISTER.md), [project/RELEASE_STRATEGY.md](project/RELEASE_STRATEGY.md)
- Archive: [archive/planning-2026-08-03](archive/planning-2026-08-03)

## Major Decision State

- TypeScript is the accepted public/control layer for alpha; Rust remains research-only.
- Virtualized DOM is the accepted alpha renderer; Canvas remains deferred pending stronger evidence.
- Production Rust/WASM and Worker integration are deferred for alpha.
- JSON Schema as protocol source of truth is proposed and likely, but still needs generation validation.
- Angular is the accepted first adapter for alpha.1; React remains a deferred follow-up candidate.
- Client-side features are the only runtime scope through 1.0. Server DataSource, the server wire protocol, and the separately versioned C# backend workstream begin in 2.0.

Active work is tracked in [plans/active/](plans/active/). New feedback from real use is captured in [project/ISSUE_AND_CHANGE_REQUESTS.md](project/ISSUE_AND_CHANGE_REQUESTS.md) before it is promoted into roadmap or implementation plans.
