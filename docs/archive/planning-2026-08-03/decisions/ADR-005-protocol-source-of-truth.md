# ADR-005: Protocol Source Of Truth

## Status

Proposed.

## Context

The frontend and future backend adapters need a language-neutral query/update contract.

## Decision

Use JSON Schema 2020-12 as the source of truth. Generate TypeScript types and validate examples in CI. Keep protocol version independent from package versions.

## Alternatives Considered

- TypeScript-first protocol: convenient but not language-neutral.
- C#-first protocol: premature and backend-coupled.
- Handwritten types in every language: drift risk.

## Consequences

Schema discipline is required. Type generation must be deterministic and checked.

## Evidence Required

Reliable type generation, schema validation tests, and future C# generation feasibility.

## Revisit Conditions

Revisit if generation drift becomes persistent or JSON Schema cannot express required protocol semantics cleanly.
