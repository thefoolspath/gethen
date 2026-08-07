# Protocol V1

Last reviewed: 2026-08-04.

Status: Proposed.

## Purpose

Define a safe, language-neutral request/response contract for DataSource operations without assuming EF Core, SQL, C#, or a specific backend.

## Proposed Source Of Truth

JSON Schema 2020-12 is the proposed source of truth. TypeScript types should be generated and validated in CI once tooling exists.

## Minimal Alpha Concepts

- protocol version
- row range
- total row count
- sorting
- filtering
- cell update request
- structured errors

## Safety Rules

- No arbitrary code.
- No unrestricted expressions.
- Server implementations must allowlist fields.
- Server implementations must bound page size and query complexity.

## Related Documents

- [../adr/0005-protocol-source-of-truth.md](../adr/0005-protocol-source-of-truth.md)
- [DATA_SOURCE.md](DATA_SOURCE.md)
