# Renderer Prototype Benchmark Notes

Status: scaffolded, not yet measured.

## Prototype

- App: `../../apps/renderer-prototype/index.html`
- Renderer: virtualized DOM
- Dataset shape: `100,000` logical rows by `50` logical columns
- Cell size: fixed `132px x 32px`
- Overscan: `6` rows and `2` columns
- Dependencies: none

## Manual Measurement Procedure

1. Open the prototype in a browser from the local file system.
2. Record hardware, operating system, browser version, and viewport size.
3. Focus the grid and verify arrow-key active-cell movement.
4. Scroll vertically and horizontally through the dataset.
5. Record mounted cell count and render time from the on-screen counters.
6. Repeat in at least three fresh page loads before treating the result as evidence.

## Required Report Fields

Use `docs/quality/BENCHMARK_PLAN.md` for the complete methodology. A renderer report must include hardware, operating system, browser version, viewport size, dataset shape, warm-up method, iteration count, median, p75 or p95, variability, memory behavior, and limitations.

## Current Result

No accepted benchmark result yet. This directory only establishes the first local measurement target for the pre-alpha research gate.
