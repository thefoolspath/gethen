# Data Model

Last reviewed: 2026-08-04.

Status: Proposed. No data model is implemented yet.

## Public Model

The public developer API should start with row-oriented objects and typed column definitions because that is the most natural integration shape for web apps.

## Identity

- `rowId`: stable logical identity from user data.
- source row index: internal position in the loaded client dataset.
- visible row index: current position after sort/filter/viewport.

Visible indexes must not be treated as stable row identity.

## Authoritative Ownership

Client-side mode must have one authoritative mutable dataset. The TypeScript reference engine should own it initially. If Rust/WASM is later introduced, ownership must be explicit and the TypeScript copy must not become a second independently mutable truth.

Server-side mode: the server owns the full dataset and whole-result sorting/filtering.

## Data Representation Gate

Columnar or typed-array storage is proposed for performance-sensitive operations, but alpha should start with a TypeScript reference representation and benchmark whether columnar conversion is worth the cost.
