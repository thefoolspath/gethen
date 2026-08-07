# ADR-002: Rendering Strategy

## Status

Proposed.

## Context

Gethen must virtualize large logical datasets without creating one DOM element per dataset cell. It also needs editing and accessibility.

## Decision

Use Canvas 2D for visible cell rendering and DOM overlays for editing, focus, tooltips, and accessibility. Put this behind an internal renderer contract.

## Alternatives Considered

- Fully virtualized DOM: better native semantics but may stress layout at high row/column counts.
- OffscreenCanvas: promising but unnecessary for first renderer proof.
- WebGL: too complex for text and accessibility in alpha.

## Consequences

Accessibility work is mandatory. DOM overlay architecture must be designed from the start.

## Evidence Required

Scroll/render benchmarks, browser zoom/DPI tests, screen-reader trials, and comparison with a DOM prototype.

## Revisit Conditions

Revisit if Canvas cannot meet accessibility requirements or DOM virtualization meets performance budgets with lower complexity.
