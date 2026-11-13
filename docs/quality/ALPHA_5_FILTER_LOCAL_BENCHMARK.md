# Alpha 5 local filter measurement

Date: 2026-11-11.

Run `node benchmarks/engine-bakeoff/measure-alpha5-filter.mjs` after the workspace build. Set `GETHEN_BROWSER_CHANNEL=chrome` to use locally installed Chrome. The script creates the 500,000-row by 50-column mixed-type fallback fixture, filters `number-02 > -7500` through the selected TypeScript Worker, and requests the first 100 result rows. It checks the filtered count, result length, progress, and first row ID on every run.

| Item | Local result |
| --- | --- |
| Hardware | Intel Core i5-12500H, 16 logical cores |
| OS | Windows 10.0.26300 |
| Runtime and browser | Node 24.4.1, Chrome 156.0.8078.80 |
| Warm-up and measurement | One warm-up, then three measured runs |
| Filtered rows | 440,007 in every run |
| Worker shape time | 1,410 ms, 3,048 ms, 2,248 ms; median 2,248 ms |
| Fixture construction | 3,404 ms, 3,347 ms, 3,344 ms in measured runs; excluded from Worker time |
| Browser heap snapshot after each measured run | 353 MB, 357 MB, 357 MB; these are point-in-time values, not retained-memory measurements |

The 1,638 ms spread between the fastest and slowest measured Worker run is large. This run establishes that the filter completed and returned stable output on this machine. It does not establish a speedup, UI input latency, cancellation time, long-task behavior, retained memory, or cross-hardware performance. A5-06 owns those gates.
