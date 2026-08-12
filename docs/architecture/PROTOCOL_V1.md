# Protocol V1

Last reviewed: 2026-08-12.

Status: Initial alpha contracts implemented. These server-oriented v1 envelopes are not a stable client-side 1.0 wire-protocol commitment; server transport is deferred to the 2.0 workstream.

## Purpose

Define a safe, language-neutral request/response contract for DataSource operations without assuming EF Core, SQL, C#, or a specific backend.

Client-side 1.0 may continue to use shared primitive types and transport-neutral data-operation descriptors, but it does not ship or freeze a Server DataSource protocol. The dedicated 2.0 plan will decide whether these initial envelopes are migrated, replaced, or retained as compatibility fixtures.

## Proposed Source Of Truth

JSON Schema 2020-12 is the source of truth for the initial alpha protocol contracts. TypeScript types are inferred from schema literals with `json-schema-to-ts`, and examples are validated with Ajv in contract tests.

## Minimal Alpha Concepts

- protocol version
- row range
- total row count
- sorting
- filtering
- cell update request
- structured errors

Implemented initial schemas:

- `GetRowsRequest`
- `GetRowsResult`
- `CellUpdateRequest`
- `UpdateCellsResult`
- `ProtocolError`

## Safety Rules

- No arbitrary code.
- No unrestricted expressions.
- Server implementations must allowlist fields.
- Server implementations must bound page size and query complexity.

## Related Documents

- [../adr/0005-protocol-source-of-truth.md](../adr/0005-protocol-source-of-truth.md)
- [DATA_SOURCE.md](DATA_SOURCE.md)
