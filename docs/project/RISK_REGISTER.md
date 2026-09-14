# Risk Register

Last reviewed: 2026-08-10.

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
| R-009 | Uncontrolled scope expansion inside formulas/pivot | High | Medium | Formula and pivot are required before beta, but Excel compatibility and write-back are not | Enforce the bounded Alpha 5/6 contracts and explicit post-1.0 exclusions | Work expands toward Excel compatibility or pivot write-back | Unassigned | Open |
| R-010 | Unsupported browser behavior | Medium | Medium | OffscreenCanvas/SharedArrayBuffer have deployment constraints | Browser policy and feature detection | Feature requires unavailable API | Unassigned | Open |
| R-011 | Insufficient adapter testing | Medium | Medium | No adapters/tests exist | Adapter lifecycle tests | Adapter releases without tests | Unassigned | Open |
| R-012 | Single-maintainer complexity | High | High | Project appears early and owner unstated | Minimize alpha scope | Multiple high-cost tech tracks start | Unassigned | Open |
| R-013 | Undo history retains large row or clipboard snapshots | Medium | High | Alpha 3 includes reversible multi-cell and row mutations | Bound entry count and retained bytes; stress-test eviction and replacement | Memory grows across edit/undo cycles | Unassigned | Open |
| R-014 | Synthetic group/pivot rows break stable identity or editing assumptions | High | High | Current APIs are source-row oriented | Use distinct typed synthetic view rows and stable generated IDs | Synthetic row reaches source-row save path | Unassigned | Open |
| R-015 | Formula input enables execution or resource exhaustion | Medium | High | Formula grammar/evaluator does not exist yet | No `eval`; allowlisted grammar/functions; cycle/depth/size limits; fuzz tests | Formula can call host code or create unbounded work | Unassigned | Open |
| R-016 | Server cache presents partial local shaping as complete results | Medium | High | Server-side DataSource is not implemented | Server-authoritative shaping semantics and invariant tests | Cached rows are filtered/grouped as full dataset | Unassigned | Open |
| R-017 | Backend query translation permits expensive or unsafe requests | Medium | High | Backend packages and limits are not designed yet | Field/operator allowlists, bounded ranges/complexity, cancellation, SQL-shape tests | Arbitrary field/expression reaches query provider | Unassigned | Open |
