# Risk Register

Last reviewed: 2026-08-04.

| ID | Risk | Probability | Impact | Evidence | Mitigation | Trigger | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-001 | Premature Rust/WASM complexity | Medium | High | No benchmarks exist; MDN and serde-wasm-bindgen show transfer/perf variance | TypeScript reference first; benchmark gate | WASM added before benchmark | Unassigned | Open |
| R-002 | Renderer cannot meet accessibility goals | Medium | High | WAI-ARIA grid requires managed focus and semantics; Canvas has no DOM semantics | Renderer prototype and AT testing | Canvas accepted without a11y proof | Unassigned | Open |
| R-003 | Public API instability | High | High | No implementation/user feedback | Keep internals private; alpha warnings | API exposed before vertical slice | Unassigned | Open |
| R-004 | Duplicate TypeScript/Rust contracts drift | Medium | High | No generation tooling exists | Schema/codegen checks | Manual duplicate types appear | Unassigned | Open |
| R-005 | Excessive bundle size | Medium | Medium | WASM/framework adapters can add weight | Bundle budget and inspection | Package size exceeds threshold | Unassigned | Open |
| R-006 | Framework-specific leakage into core | Medium | Medium | React/Angular both planned | Adapter boundary tests | Core imports framework | Unassigned | Open |
| R-007 | Unreliable benchmarks | Medium | Medium | No harness exists | Record environment and distributions | Single-run claims | Unassigned | Open |
| R-008 | License incompatibility | Low | High | No dependency review tooling exists | License table and scan before deps | New runtime dependency | Unassigned | Open |
| R-009 | Scope expansion into formulas/pivot | High | Medium | Product vision includes advanced features | Alpha scope document | Formula/pivot tasks enter alpha | Unassigned | Open |
| R-010 | Unsupported browser behavior | Medium | Medium | OffscreenCanvas/SharedArrayBuffer have deployment constraints | Browser policy and feature detection | Feature requires unavailable API | Unassigned | Open |
| R-011 | Insufficient adapter testing | Medium | Medium | No adapters/tests exist | Adapter lifecycle tests | Adapter releases without tests | Unassigned | Open |
| R-012 | Single-maintainer complexity | High | High | Project appears early and owner unstated | Minimize alpha scope | Multiple high-cost tech tracks start | Unassigned | Open |
