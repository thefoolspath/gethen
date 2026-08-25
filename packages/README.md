# Packages

This directory contains the initial local npm package workspaces for Gethen.

- `protocol`: protocol schemas and inferred TypeScript contracts.
- `core`: framework-neutral grid engine, client DataSource, viewport logic, and virtualized DOM renderer.
- `gethen-angular`: standalone Angular adapter over the core renderer.

The `core/src` directory is organized by responsibility without creating additional runtime or
package boundaries:

- `contracts/`: shared row and engine boundary types.
- `data/`: DataSource, model mapping, and row transactions.
- `state/`: client state, editing, history, layout, and clipboard behavior.
- `shaping/`: filter, sort, group, aggregate, and TypeScript kernels.
- `engine/`: TypeScript Worker and Rust/WASM Worker implementations.
- `renderer/dom/`: virtualized DOM rendering, viewport, shell, and customization.

Only `core/src/index.ts` is a public barrel. Internal modules use direct relative imports.

Current package boundaries are documented in `../docs/architecture/PACKAGE_BOUNDARIES.md`.
