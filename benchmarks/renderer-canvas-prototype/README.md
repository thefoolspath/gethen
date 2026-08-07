# Canvas Renderer Prototype Benchmark Notes

Status: scaffolded, not yet measured.

## Prototype

- App: `../../apps/renderer-canvas-prototype/index.html`
- Renderer: Canvas 2D
- Dataset shape: `100,000` logical rows by `50` logical columns
- Cell size: fixed `132px x 32px`
- Overscan: `6` rows and `2` columns
- Dependencies: none

## Manual Measurement Procedure

1. Open the prototype in a browser from the local file system.
2. Record hardware, operating system, browser version, device pixel ratio, and viewport size.
3. Focus the grid and verify arrow-key active-cell movement.
4. Scroll vertically and horizontally through the dataset.
5. Record drawn cell count and draw time from the on-screen counters.
6. Compare against `../renderer-prototype/` using the same viewport and browser session.
7. Repeat in at least three fresh page loads before treating the result as evidence.

## Current Result

No accepted benchmark result yet. This directory only establishes the Canvas comparison target for the pre-alpha renderer gate.
