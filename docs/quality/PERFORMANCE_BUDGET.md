# Alpha Performance Budget

Last reviewed: 2026-08-10.

Status: Provisional. Initial local renderer, engine, customization, clipboard, and CDP frame-trace baselines exist; cross-hardware thresholds are not accepted.

| Scenario | Dataset | Metric | Target | Failure threshold | Method | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Initial render | 1,000 rows x 20 columns local | time to first visible grid | provisional 200 ms | over 500 ms | Playwright trace | Needs prototype |
| Scroll stability | 100,000 logical rows x 50 columns | median frame interval while scrolling | provisional under 16.7 ms | repeated frames over 50 ms | CDP browser trace | Local three-process customization off/on medians: 16.817/16.529 ms; no task over 50 ms; cross-hardware evidence open. |
| Input latency | visible grid | active-cell update latency | provisional under 50 ms | over 100 ms | Playwright interaction timing | Keyboard/browser regression coverage exists; distribution measurement remains open. |
| Edit activation | visible grid | time from Enter/double-click to editor focus | provisional under 100 ms | over 200 ms | browser test timing | Needs prototype |
| Client sort | 100,000 rows x representative columns | operation time excluding render | provisional measured baseline | UI long task on main thread | benchmark harness | Repeat-iteration TypeScript and Rust research baselines exist. |
| Worker transfer | 100,000 rows transformed to candidate payload | clone/transfer time and retained memory | measured only | unbounded memory growth | benchmark harness | MDN transfer docs |
| Bundle size | first adapter package | minified+compressed size | measured only | unexplained growth | package analysis | Needs package |

Do not use these targets as marketing claims. They are alpha gates to be replaced by measured values.
