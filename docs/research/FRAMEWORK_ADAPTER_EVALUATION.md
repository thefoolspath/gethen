# Framework Adapter Evaluation

## Status

Decision recorded for alpha planning.

## Question

Which framework adapter should ship first, and how should adapters relate to core?

## Context

The product direction includes React and Angular, but alpha must prioritize a complete vertical slice over broad adapter coverage.

## Evaluation Criteria

Adapter complexity, lifecycle cleanup, SSR import safety, peer dependencies, user demand, maintainer familiarity, packaging, and test burden.

## Evidence

- React Strict Mode performs extra development-only render/effect/ref checks to find missing cleanup.
- React `useEffect` documentation emphasizes cleanup for external systems and notes the extra setup/cleanup stress test in Strict Mode.
- Angular component lifecycle documentation defines lifecycle hooks, including cleanup via destroy hooks.

## Experiments And Benchmarks

No adapter prototype exists. Required:

- framework-neutral core mount path.
- Angular lifecycle test before promising same-alpha support.
- React mount/unmount/Strict Mode test before adding React as a follow-up adapter.

## Analysis

Business logic belongs in framework-neutral core. React is likely the smaller adapter because a thin wrapper around imperative core can be tested quickly and React package setup is common for grid demos. However, maintainer priority on 2026-08-07 selected Angular as the first adapter path.

Angular-first increases lifecycle, packaging, and test setup risk for the alpha foundation, so the core must remain framework-neutral and the Angular package must stay a thin wrapper.

## Options

- Framework-neutral demo first: lowest adapter risk.
- React first: strong ecosystem and smaller wrapper.
- Angular first: valid if maintainer priority is Angular/.NET integration.
- Both in alpha: higher release risk.
- Web Components: possible later, but not needed to prove core.

## Recommendation

Proceed with Angular as the first framework adapter because maintainer priority explicitly selected it. Keep React deferred until after the first complete Angular-backed vertical slice or until adapter bandwidth is reassessed.

## Limitations

Maintainer preference has been collected. User demand data has not been collected.

## Open Questions

- What minimum Angular version should be supported for alpha?
- Should the alpha demo use standalone Angular components only?

## References

- "`<StrictMode>`", React Docs, accessed 2026-08-04, primary framework documentation, https://react.dev/reference/react/StrictMode
- "`useEffect`", React Docs, accessed 2026-08-04, primary framework documentation, https://react.dev/reference/react/useEffect
- "Component lifecycle", Angular Docs, accessed 2026-08-04, primary framework documentation, https://angular.dev/guide/components/lifecycle
