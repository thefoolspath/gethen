# Renderer Prototype Comparison

Date: 2026-08-07.

Status: Preliminary single local Chromium run. This supports alpha implementation direction but is not a final performance claim.

## Source

- Command: `pnpm bench`
- Script: `../../../benchmarks/renderer-prototype/measure-renderers.mjs`
- DOM prototype: `../../../apps/renderer-prototype/`
- Canvas prototype: `../../../apps/renderer-canvas-prototype/`

## Environment

- Browser: Chromium through Playwright
- Viewport: `1280 x 720`
- Dataset: `100,000` rows by `50` columns

## Results

| Renderer | Scenario | Visible cells | Prototype render counter |
| --- | --- | ---: | ---: |
| Virtualized DOM | initial | `338` | `2.5 ms` |
| Virtualized DOM | scroll mid | `480` | `1.4 ms` |
| Virtualized DOM | keyboard move | `312` | `1.1 ms` |
| Canvas 2D | initial | `338` | `4.5 ms` |
| Canvas 2D | scroll mid | `480` | `2.0 ms` |
| Canvas 2D | keyboard move | `312` | `1.2 ms` |

## Interpretation

Canvas did not show a material advantage in this initial comparison. Virtualized DOM remains the lower-risk alpha renderer because it is competitive in the prototype counter and has simpler accessibility and editor integration.

## Decision Impact

Use virtualized DOM for the alpha renderer slice. Keep Canvas deferred and revisit only if later measured density, scrolling, or memory behavior shows DOM cannot meet the alpha budget.

## Limitations

- Single Chromium run only.
- Uses prototype counters rather than browser trace frame timing.
- Screen-reader behavior and edit overlay behavior are not measured.
- Not a cross-browser benchmark.
