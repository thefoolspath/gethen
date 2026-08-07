# ADR-0002: Rendering Strategy

## Status

Accepted for alpha

## Context

Gethen needs virtualized rendering, keyboard navigation, editing, and accessibility. Canvas may help dense rendering but creates semantic accessibility risk.

## Decision

Use virtualized DOM as the alpha renderer. Keep Canvas 2D deferred unless later browser trace evidence shows virtualized DOM cannot meet the alpha budget.

## Alternatives Considered

- Virtualized DOM.
- Canvas 2D plus DOM overlays.
- OffscreenCanvas.
- WebGL.

## Supporting Evidence

- [../research/RENDERER_EVALUATION.md](../research/RENDERER_EVALUATION.md)
- [../research/findings/2026-08-07-renderer-prototype-comparison.md](../research/findings/2026-08-07-renderer-prototype-comparison.md)
- [../architecture/ACCESSIBILITY_AND_SECURITY.md](../architecture/ACCESSIBILITY_AND_SECURITY.md)

## Consequences

### Positive

Keeps the alpha renderer accessible and easier to integrate with keyboard navigation and editing.

### Negative

May need revisit if browser trace evidence later shows DOM cannot meet scroll or memory budgets.

### Neutral

Renderer contract should remain internal during alpha. Canvas remains a deferred option.

## Uncertainties

Exact cross-browser scroll-frame behavior still needs trace measurement.

## Revisit Conditions

Revisit after browser trace measurements, accessibility smoke tests, or evidence that visible-cell density exceeds the DOM budget.

## Related Documents

- [../quality/PERFORMANCE_BUDGET.md](../quality/PERFORMANCE_BUDGET.md)
- [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md)
