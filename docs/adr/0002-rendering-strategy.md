# ADR-0002: Rendering Strategy

## Status

Proposed

## Context

Gethen needs virtualized rendering, keyboard navigation, editing, and accessibility. Canvas may help dense rendering but creates semantic accessibility risk.

## Decision

Select the alpha renderer through a prototype gate. The current recommendation is virtualized DOM first unless Canvas demonstrates material benefit for the alpha performance budget.

## Alternatives Considered

- Virtualized DOM.
- Canvas 2D plus DOM overlays.
- OffscreenCanvas.
- WebGL.

## Supporting Evidence

- [../research/RENDERER_EVALUATION.md](../research/RENDERER_EVALUATION.md)
- [../architecture/ACCESSIBILITY_AND_SECURITY.md](../architecture/ACCESSIBILITY_AND_SECURITY.md)

## Consequences

### Positive

Avoids premature Canvas commitment.

### Negative

Requires prototype work before locking renderer APIs.

### Neutral

Renderer contract should remain internal during alpha.

## Uncertainties

Whether virtualized DOM meets the alpha visible-cell budget.

## Revisit Conditions

Revisit after DOM and Canvas prototype measurements and accessibility smoke tests.

## Related Documents

- [../quality/PERFORMANCE_BUDGET.md](../quality/PERFORMANCE_BUDGET.md)
- [../quality/BENCHMARK_PLAN.md](../quality/BENCHMARK_PLAN.md)
