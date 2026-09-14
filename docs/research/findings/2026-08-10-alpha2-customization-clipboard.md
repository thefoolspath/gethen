# Alpha 2 Customization And Clipboard Baseline

Date: 2026-08-10.

Status: Preliminary repeat-iteration local baseline. Not release or architecture decision evidence.

## Environment

- Windows `10.0.26200`, x64
- 12th Gen Intel Core i5-12500H, 16 logical cores
- 16,785,268,736 bytes total memory
- Node.js `v24.4.1`

## Method

Command:

```text
node benchmarks/typescript-reference/alpha2-customization-clipboard.mjs
```

Each scenario used 5 warm-up iterations and 20 measured iterations. Renderer simulation covered 50 rows by 10 columns (500 visible cells). Clipboard preparation covered 100 rows by 10 columns (1,000 pasted cells).

## Results

| Scenario | Median | p75 | Minimum | Maximum |
| --- | ---: | ---: | ---: | ---: |
| Visible cell value access without customization | 0.0197 ms | 0.0223 ms | 0.0141 ms | 0.1676 ms |
| Visible cells with class resolution and number formatting | 0.2081 ms | 0.2471 ms | 0.1723 ms | 0.7573 ms |
| Clipboard preparation with default parsing | 0.0942 ms | 0.1097 ms | 0.0874 ms | 0.2755 ms |
| Clipboard preparation with developer validation | 0.1212 ms | 0.2381 ms | 0.1081 ms | 0.3670 ms |

## Interpretation

The JavaScript-only costs are small for the measured visible-cell and 1,000-cell clipboard payloads on this machine. Class resolution plus locale number formatting is measurably more expensive than plain value access, as expected, but remains below one millisecond in every measured iteration.

These results do not establish browser rendering performance. DOM creation, style calculation, layout, paint, garbage collection under sustained scrolling, large-payload input latency, and framework change detection are not measured. A browser trace comparing customization off/on is still required before closing the Alpha 2 performance gate.

## Chromium Render Timing

Command:

```text
node benchmarks/renderer-prototype/measure-alpha2-customization.mjs
```

The Chromium run used a `1280 x 720` viewport, the 100,000-row by 50-visible-column core demo, and 20 measured scroll renders per scenario.

| Scenario | Median | p75 | Minimum | Maximum |
| --- | ---: | ---: | ---: | ---: |
| Customization disabled | 5.0 ms | 5.2 ms | 4.1 ms | 55.8 ms |
| Classes, callbacks, and formatters enabled | 5.3 ms | 5.5 ms | 5.0 ms | 6.7 ms |

The customization-on median was 0.3 ms above the customization-off median in this run, and both medians were below the provisional 16.7 ms scroll-frame target. The 55.8 ms maximum in the disabled scenario is an outlier and reinforces that these renderer callback timings are not a substitute for frame traces or repeated-process analysis.

This browser measurement uses the renderer's `onRender` timing. It includes DOM creation and attachment inside the render call, but not a full DevTools frame trace, paint completion, or framework change detection.

## DevTools-Style Frame Trace

Command:

```text
node benchmarks/renderer-prototype/measure-alpha2-frame-trace.mjs
```

Chromium `151.0.7922.34` was launched as a new process for each of three runs per scenario. Each run used 30 warm-up animation frames and 120 measured scrolling animation frames. CDP tracing collected `DrawFrame` intervals and top-level task durations; the Performance domain recorded point-in-time JavaScript heap use before and after each measured sequence.

| Scenario | Median of run medians | Median of run p95s | Largest interval | Long tasks over 50 ms | Heap delta range |
| --- | ---: | ---: | ---: | ---: | ---: |
| Customization disabled | 16.817 ms | 17.962 ms | 26.273 ms | 0 | +2,169,524 to +2,335,304 bytes |
| Customization enabled | 16.529 ms | 18.513 ms | 24.554 ms | 0 | +366,776 to +960,516 bytes |

The customization-enabled median was not worse than the disabled median in this trace. Neither scenario produced a task over 50 ms; maximum traced top-level task durations were 17.6 ms disabled and 19.645 ms enabled.

The provisional median target is under 16.7 ms. The disabled median-of-medians was 0.117 ms above that line while the enabled value was 0.171 ms below it. At a 60 Hz scheduling boundary this is too close to treat as a robust pass/fail distinction. The evidence supports “no measured customization regression” but not a cross-hardware scroll-stability claim.

Positive heap deltas are point-in-time values after active scrolling, not proof of retained growth. Repeated mount/dispose heap snapshots and headed/cross-hardware traces remain future hardening work.
