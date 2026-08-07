# Renderer Evaluation

## Status

Draft

## Question

Which renderer is smallest and credible for alpha: virtualized DOM, Canvas 2D, hybrid Canvas/DOM, OffscreenCanvas, or WebGL?

## Context

The grid must render large logical datasets while supporting keyboard navigation, editing, and accessibility.

## Evaluation Criteria

Performance, accessibility, text rendering, editing complexity, sticky UI, variable row heights, browser compatibility, testing complexity, SSR import safety, and bundle size.

## Evidence

- WAI-ARIA APG describes data grids as composite widgets with managed focus and directional keyboard navigation. It also states data grid cells should be focusable or contain focusable elements, and virtualized grids need row/column counts and indexes.
- MDN documents OffscreenCanvas as available in Workers and useful for decoupling Canvas rendering from the DOM/main thread, while noting browser support details can vary.
- MDN documents `postMessage` and structured clone as the mechanism for Worker communication; Worker-based rendering introduces synchronization and transfer considerations.

## Experiments And Benchmarks

No renderer prototype exists yet. Required experiments:

- virtualized DOM prototype for fixed row height and 100 visible columns.
- Canvas 2D prototype for same viewport.
- keyboard navigation and edit overlay test.
- screen-reader smoke test for active cell semantics.

## Analysis

Virtualized DOM is likely the smallest accessible alpha renderer because native semantics and editor integration are simpler. Canvas may provide benefits at wider or denser viewports, but it makes accessibility, text measurement, selection, browser zoom, sticky rows/columns, and testing harder.

## Options

- Virtualized DOM first: lower accessibility and implementation risk.
- Hybrid Canvas/DOM first: better dense rendering hypothesis, higher accessibility risk.
- OffscreenCanvas: defer until Canvas main-thread drawing is measured as a problem.
- WebGL: defer; text and accessibility complexity are not justified for alpha.

## Recommendation

Do not accept Canvas yet. Build the smallest alpha renderer as a research-gated decision. The default recommendation is virtualized DOM first unless a Canvas prototype shows meaningful benefit for the alpha dataset budget.

## Limitations

No local benchmark exists. This recommendation has medium confidence only.

## Open Questions

- What visible cell count defines the alpha performance target?
- Does virtualized DOM satisfy the target on maintainer hardware?

## References

- "Grid Pattern", WAI-ARIA Authoring Practices Guide, W3C, accessed 2026-08-04, primary standard guidance, https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- "OffscreenCanvas", MDN Web Docs, accessed 2026-08-04, primary browser documentation, https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- "DedicatedWorkerGlobalScope: postMessage()", MDN Web Docs, accessed 2026-08-04, primary browser documentation, https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/postMessage
