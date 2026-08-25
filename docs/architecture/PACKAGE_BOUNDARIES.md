# Package Boundaries

Last reviewed: 2026-08-25.

Status: Initial npm packages exist. Backend boundaries are deferred to the Server 2.0 plan.

## Proposed NPM Packages

| Package | Proposed responsibility | Alpha status |
| --- | --- | --- |
| `@thefoolspath/gethen-protocol` | Shared protocol schemas and generated/inferred TypeScript types | Initial skeleton |
| `@thefoolspath/gethen-core` | Framework-neutral grid controller, state, DataSource, renderer and engine contracts | Initial skeleton |
| `@thefoolspath/gethen-react` | Thin React adapter | Deferred |
| `@thefoolspath/gethen-angular` | Thin Angular adapter | Selected first adapter; initial skeleton |
| `@thefoolspath/gethen-wasm` | Optional Worker/WASM adapter | Conditional |

## Proposed Rust Crates

| Crate | Proposed responsibility | Alpha status |
| --- | --- | --- |
| `gethen-engine` | Native benchmark/reference for compute-heavy operations | Research gate |
| `gethen-wasm` | wasm-bindgen wrapper if Rust/WASM proceeds | Conditional |

## Planned Server-Side 2.0 Project Area

Backend work begins only after client-side 1.0. It will live in this repository in a separate C# project/solution area with an independent version lifecycle. The package split, names, target framework, provider matrix, and release versions are deliberately deferred to a dedicated 2.0 plan; the package table below is historical candidate decomposition, not accepted 1.0 scope.

| Package | Proposed responsibility | Alpha status |
| --- | --- | --- |
| `Gethen.AspNetCore` | Candidate ASP.NET Core endpoint helpers | Candidate for 2.0 planning |
| `Gethen.Linq` | Candidate safe allowlisted `IQueryable`/LINQ translation helpers | Candidate for 2.0 planning |
| `Gethen.EntityFrameworkCore` | Candidate EF Core integration | Candidate for 2.0 planning |

## Dependency Direction

Adapters may depend on core. Core may depend on protocol. Optional WASM integration should depend on core contracts, not the other way around.

```text
react/angular -> core -> protocol
wasm adapter -> core contracts
wasm crate -> rust engine crate
future backend packages -> portable contracts / server protocol
```

Future backend packages may depend on portable shared contracts and the 2.0 server protocol. Frontend protocol types and Core must not depend on ASP.NET Core, LINQ, EF Core, SQL, or any backend-specific runtime.

Client 1.0 portable descriptors cover the intent of range/paging, sort, filter, group, aggregate, formula, pivot, updates, and row transactions where those operations exist. They must remain serializable. Renderers, editors, formatters, themes, layouts, and arbitrary JavaScript callbacks are browser-only and are not backend contracts.

## Current Core Internal Organization

`@thefoolspath/gethen-core` remains one npm package. Its source is grouped into `contracts`, `data`,
`state`, `shaping`, `engine`, and `renderer/dom` directories for navigation and dependency clarity.
This organization does not add a runtime boundary, package dependency, asynchronous call, data copy,
or serialization step. The existing root package exports remain the public API; internal directories
do not expose additional barrel entry points.

Worker scripts and `gethen_engine.wasm` are emitted beside their loaders under the matching engine
directories so `new URL(..., import.meta.url)` keeps the same loading behavior after compilation.

## Internal Until Stable

Renderer contracts, compute engine contracts, worker message internals, cache internals, editor plugin points, and column storage internals should remain private during alpha.
