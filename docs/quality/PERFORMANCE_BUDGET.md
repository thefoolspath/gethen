# Alpha Performance Budget

Last reviewed: 2026-08-04.

Status: Provisional. No benchmarks exist yet.

| Scenario | Dataset | Metric | Target | Failure threshold | Method | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Initial render | 1,000 rows x 20 columns local | time to first visible grid | provisional 200 ms | over 500 ms | Playwright trace | Needs prototype |
| Scroll stability | 100,000 logical rows x 50 columns | median frame time while scrolling | provisional under 16.7 ms | repeated frames over 50 ms | browser performance trace | Needs prototype |
| Input latency | visible grid | active-cell update latency | provisional under 50 ms | over 100 ms | Playwright interaction timing | WAI-ARIA keyboard model, needs measurement |
| Edit activation | visible grid | time from Enter/double-click to editor focus | provisional under 100 ms | over 200 ms | browser test timing | Needs prototype |
| Client sort | 100,000 rows x representative columns | operation time excluding render | provisional measured baseline | UI long task on main thread | benchmark harness | Needs baseline |
| Worker transfer | 100,000 rows transformed to candidate payload | clone/transfer time and retained memory | measured only | unbounded memory growth | benchmark harness | MDN transfer docs |
| Bundle size | first adapter package | minified+compressed size | measured only | unexplained growth | package analysis | Needs package |

Do not use these targets as marketing claims. They are alpha gates to be replaced by measured values.
