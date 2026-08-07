# Migration Report

Last reviewed: 2026-08-04.

## Migration Mapping

| Existing path | Proposed path | Action | Reason | Risk | Approval required |
| --- | --- | --- | --- | --- | --- |
| `docs/planning/` | `docs/archive/planning-2026-08-03/` | Archive | Preserve broad first-pass planning while removing it as authoritative docs | Low | No |
| `docs/planning/00-executive-summary.md` | `docs/README.md`, `docs/project/CURRENT_STATE_ASSESSMENT.md` | Split/rewrite | Entry point and assessment need different roles | Low | No |
| `docs/planning/01-product-scope.md` | `docs/product/VISION.md`, `docs/product/SCOPE.md` | Split/rewrite | Product docs should not hold technical plans | Low | No |
| `docs/planning/02-architecture.md` | `docs/architecture/SYSTEM_OVERVIEW.md` | Rewrite | Must label proposed versus implemented | Low | No |
| `docs/planning/03-package-boundaries.md` | `docs/architecture/PACKAGE_BOUNDARIES.md`, `docs/research/DEPENDENCY_LICENSE_EVALUATION.md` | Split/rewrite | Architecture and license evidence are different sources | Low | No |
| `docs/planning/04-rust-wasm-boundary.md` | `docs/architecture/RUST_WASM_BOUNDARY.md`, `docs/research/WORKER_WASM_EVALUATION.md` | Split/rewrite | Boundary design depends on research gate | Low | No |
| `docs/planning/05-renderer-evaluation.md` | `docs/research/RENDERER_EVALUATION.md`, `docs/adr/0002-rendering-strategy.md` | Split/rewrite | Evaluation should inform, not equal, decision | Low | No |
| `docs/planning/06-data-model.md` | `docs/architecture/DATA_MODEL.md`, `docs/research/COLUMNAR_DATA_EVALUATION.md` | Split/rewrite | Proposed model and evidence separated | Low | No |
| `docs/planning/07-protocol-v1.md` | `docs/architecture/PROTOCOL_V1.md`, `docs/adr/0005-protocol-source-of-truth.md` | Rewrite | Contract proposal and decision record separated | Low | No |
| `docs/planning/08-client-server-data-source.md` | `docs/architecture/DATA_SOURCE.md` | Rewrite | Preserve correctness rules | Low | No |
| `docs/planning/09-performance-benchmark-plan.md` | `docs/quality/PERFORMANCE_BUDGET.md`, `docs/quality/BENCHMARK_PLAN.md` | Split/rewrite | Targets and methodology separated | Low | No |
| `docs/planning/10-accessibility-security.md` | `docs/architecture/ACCESSIBILITY_AND_SECURITY.md`, `SECURITY.md` | Split/rewrite | Security policy belongs at root too | Low | No |
| `docs/planning/11-testing-strategy.md` | `docs/quality/TESTING_STRATEGY.md` | Rewrite | Quality source of truth | Low | No |
| `docs/planning/12-release-roadmap.md` | `docs/product/ROADMAP.md`, `docs/project/RELEASE_STRATEGY.md` | Split/rewrite | Product roadmap and release policy separated | Low | No |
| `docs/planning/13-risk-register.md` | `docs/project/RISK_REGISTER.md` | Rewrite | Required risk table fields added | Low | No |
| `docs/planning/14-alpha-1-implementation-plan.md` | `docs/plans/active/0001-alpha-1-vertical-slice.md` | Rewrite | Active plan should link to sources, not duplicate them | Low | No |
| `docs/planning/decisions/*.md` | `docs/adr/0001-0005*.md` | Rewrite | New ADR template and Proposed status | Low | No |

## Notes

`git mv` could not be used because this folder is not currently a Git repository. The move was performed with filesystem operations and recorded here.
