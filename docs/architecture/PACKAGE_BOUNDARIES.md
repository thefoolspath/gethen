# Package Boundaries

Last reviewed: 2026-08-04.

Status: Proposed. No packages currently exist.

## Proposed NPM Packages

| Package | Proposed responsibility | Alpha status |
| --- | --- | --- |
| `@thefoolspath/gethen-protocol` | Shared protocol schemas and generated TypeScript types | Proposed |
| `@thefoolspath/gethen-core` | Framework-neutral grid controller, state, DataSource, renderer and engine contracts | Proposed |
| `@thefoolspath/gethen-react` | Thin React adapter | Proposed |
| `@thefoolspath/gethen-angular` | Thin Angular adapter | Conditional |
| `@thefoolspath/gethen-wasm` | Optional Worker/WASM adapter | Conditional |

## Proposed Rust Crates

| Crate | Proposed responsibility | Alpha status |
| --- | --- | --- |
| `gethen-engine` | Native benchmark/reference for compute-heavy operations | Research gate |
| `gethen-wasm` | wasm-bindgen wrapper if Rust/WASM proceeds | Conditional |

## Planned Backend Packages

Backend packages are planned after the frontend core and protocol stabilize. They should adapt the language-neutral server-side DataSource protocol to specific backend ecosystems without making those ecosystems required dependencies of the grid core.

| Package | Proposed responsibility | Alpha status |
| --- | --- | --- |
| `Gethen.AspNetCore` | ASP.NET Core endpoint helpers for serving Gethen DataSource requests | Deferred |
| `Gethen.Linq` | Safe allowlisted query translation helpers over `IQueryable`/LINQ | Deferred |
| `Gethen.EntityFrameworkCore` | EF Core integration for range queries, sorting, filtering, updates, cancellation, and stale-response-safe server behavior | Deferred |

## Dependency Direction

Adapters may depend on core. Core may depend on protocol. Optional WASM integration should depend on core contracts, not the other way around.

```text
react/angular -> core -> protocol
wasm adapter -> core contracts
wasm crate -> rust engine crate
backend packages -> protocol
```

Backend packages may depend on the shared protocol contract, but protocol and frontend core must not depend on ASP.NET Core, LINQ, EF Core, SQL, or any backend-specific runtime.

## Internal Until Stable

Renderer contracts, compute engine contracts, worker message internals, cache internals, editor plugin points, and column storage internals should remain private during alpha.
