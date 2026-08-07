# Protocol V1

Last reviewed: 2026-08-04.

Status: Initial alpha contracts implemented.

## Purpose

Define a safe, language-neutral request/response contract for DataSource operations without assuming EF Core, SQL, C#, or a specific backend.

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
