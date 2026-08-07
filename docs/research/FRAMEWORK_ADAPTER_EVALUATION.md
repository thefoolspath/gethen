# Framework Adapter Evaluation

## Status

Draft

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

- core demo without framework.
- React mount/unmount/Strict Mode test.
- Angular lifecycle test before promising same-alpha support.

## Analysis

Business logic belongs in framework-neutral core. React is likely the smaller first adapter because a thin wrapper around imperative core can be tested quickly and React package setup is common for grid demos. Angular should remain on the roadmap but conditional for alpha.

## Options

- Framework-neutral demo first: lowest adapter risk.
- React first: strong ecosystem and smaller wrapper.
- Angular first: valid if maintainer priority is Angular/.NET integration.
- Both in alpha: higher release risk.
- Web Components: possible later, but not needed to prove core.

## Recommendation

Build framework-neutral core and demo first, then React adapter. Treat Angular as conditional for alpha or first follow-up.

## Limitations

No maintainer preference or user demand data has been collected.

## Open Questions

- Is Angular strategically more important because of future ASP.NET/Core enterprise users?

## References

- "`<StrictMode>`", React Docs, accessed 2026-08-04, primary framework documentation, https://react.dev/reference/react/StrictMode
- "`useEffect`", React Docs, accessed 2026-08-04, primary framework documentation, https://react.dev/reference/react/useEffect
- "Component lifecycle", Angular Docs, accessed 2026-08-04, primary framework documentation, https://angular.dev/guide/components/lifecycle
