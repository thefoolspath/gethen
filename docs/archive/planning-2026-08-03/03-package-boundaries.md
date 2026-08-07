# Package Boundaries

Use a monorepo with pnpm and Cargo workspaces. Do not add Turborepo or Nx for alpha unless build times or task orchestration become a measured problem.

## Proposed Packages

| Package | Purpose | Public surface |
| --- | --- | --- |
| `@thefoolspath/gethen-protocol` | JSON Schema files, generated TS protocol types, validators | Request/response/update/error types |
| `@thefoolspath/gethen-core` | Framework-neutral grid controller, state, renderer contracts, DataSource logic | Grid options, columns, events, controller, DataSource helpers |
| `@thefoolspath/gethen-wasm` | Worker bridge, WASM loading, engine adapter | `createWasmComputeEngine`, diagnostics |
| `@thefoolspath/gethen-react` | React component wrapper | `GethenGrid`, hooks only if needed |
| `@thefoolspath/gethen-angular` | Angular component wrapper | `<gethen-grid>`, typed inputs/outputs |
| `gethen-engine` crate | Native Rust compute engine | Internal during alpha |
| `gethen-wasm` crate | wasm-bindgen boundary | Internal during alpha |

## Dependency Direction

```text
react/angular -> core -> protocol
core -> wasm package through ComputeEngine contract
wasm package -> generated wasm artifact
rust wasm crate -> rust engine crate
```

`protocol` must not depend on `core`. Framework adapters must not duplicate grid business logic.

## Framework Dependencies

React and Angular are peer dependencies of their adapter packages. `core`, `protocol`, and `wasm` must not depend on either framework.

React adapter must tolerate Strict Mode development behavior, where React intentionally re-runs render/effects/ref callbacks to expose missing cleanup. Angular adapter must use lifecycle hooks such as `ngAfterViewInit` for mount and `ngOnDestroy` for cleanup.

## Versioning

Use fixed/locked versions across npm packages during alpha, starting at `0.0.0-alpha.1`. This reduces compatibility confusion while contracts are moving. Revisit independent versions after beta when protocol/core adapters mature at different rates.

## Runtime Dependency License Table

| Dependency | Area | License posture | Alpha recommendation |
| --- | --- | --- | --- |
| React | Adapter peer | MIT | Peer dependency only |
| Angular | Adapter peer | MIT | Peer dependency only |
| wasm-bindgen | Rust/WASM binding | MIT OR Apache-2.0 | Accept |
| serde | Rust serialization | MIT OR Apache-2.0 | Accept |
| serde-wasm-bindgen | JS/Rust value conversion | MIT | Accept for control messages; benchmark large payloads |
| js-sys/web-sys | WASM web bindings | MIT OR Apache-2.0 | Accept where needed |
| No Arrow in alpha | Column format | Apache-2.0 if later used | Defer pending evidence |

Development tools such as pnpm, TypeScript, Vite/tsup, Vitest, Playwright, ESLint, Prettier, Criterion, rustfmt, Clippy, and Changesets should be separately reviewed before adoption, but none are intended as runtime dependencies.
