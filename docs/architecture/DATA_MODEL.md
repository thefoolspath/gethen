# Data Model

Last reviewed: 2026-08-04.

Status: Initial TypeScript reference model implemented.

## Public Model

The public developer API should start with row-oriented objects and typed column definitions because that is the most natural integration shape for web apps.

Initial implementation: `packages/core/src/client-grid-engine.ts` uses rows shaped as stable `id` plus a `cells` record keyed by column ID.

Alpha 2 view metadata is implemented separately in `packages/core/src/grid-customization.ts`. Hidden columns remain present in caller metadata and row values but are omitted from the renderer's visible-column list.

`packages/core/src/grid-model.ts` implements explicit portable DTO mapping. It requires exactly one stable string or numeric key field, validates declared cell types and nullability at runtime, and produces renderer rows that retain their typed source DTO. `packages/core/src/row-transactions.ts` implements a framework-neutral single-row edit/insert transaction boundary with original-row and changed-field save payloads.

## Identity

- `rowId`: stable logical identity from user data.
- source row index: internal position in the loaded client dataset.
- visible row index: current position after sort/filter/viewport.

Visible indexes must not be treated as stable row identity.

## Authoritative Ownership

Client-side mode must have one authoritative mutable dataset. The TypeScript reference engine should own it initially. If Rust/WASM is later introduced, ownership must be explicit and the TypeScript copy must not become a second independently mutable truth.

Initial implementation: `ClientGridEngine` copies the supplied rows and owns update application for the in-memory reference path.

Server-side mode: the server owns the full dataset and whole-result sorting/filtering.

## Data Representation Gate

Columnar or typed-array storage is proposed for performance-sensitive operations, but alpha should start with a TypeScript reference representation and benchmark whether columnar conversion is worth the cost.
