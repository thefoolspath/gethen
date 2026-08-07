# Risk Register

| Risk | Impact | Likelihood | Mitigation | Trigger |
| --- | --- | --- | --- | --- |
| Canvas accessibility is insufficient | High | Medium | DOM accessibility layer, renderer abstraction, manual AT testing | Screen-reader tests fail core navigation |
| Rust/WASM loses to TS after transfer costs | High | Medium | TS fallback, benchmark matrix, coarse payloads | TS Worker within 20 percent with lower complexity |
| String-heavy datasets duplicate memory | High | High | dictionary encoding prototype, memory budgets, disposal tests | retained memory exceeds budget |
| Server mode shows incorrect filtered data | High | Medium | enforce server owns sort/filter, cache key includes query | loaded-block-only filtering appears |
| Worker failures hang UI promises | Medium | Medium | structured errors, timeout/cancel, recovery tests | pending requests remain after termination |
| Protocol overfits frontend alpha | High | Medium | JSON Schema review, minimal fields, extension namespacing | backend translation needs incompatible change |
| Multi-framework scope delays alpha | Medium | High | React first, Angular next if needed | adapter work blocks core validation |
| OffscreenCanvas complexity distracts | Medium | Medium | defer until Canvas main-thread measurements | rendering exceeds budget |
| Dependency/license conflict | High | Low | license table, automated checks before publish | non-MIT-compatible runtime dependency proposed |
| Public API stabilizes too early | High | Medium | mark internals private, alpha docs warnings | users rely on internal contracts |
| Package name/trademark conflict | High | Unknown | pre-launch checks | name unavailable or risky |
| Benchmarks become non-reproducible | Medium | Medium | fixture datasets, hardware/browser metadata | performance claims cannot be repeated |
