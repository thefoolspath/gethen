# ADR-0005: Protocol Source Of Truth

## Status

Proposed

## Context

Gethen needs shared contracts between TypeScript frontend code and future backend packages.

## Decision

Use JSON Schema 2020-12 as the proposed protocol source of truth, with generated TypeScript types checked by CI once tooling exists.

## Alternatives Considered

- TypeScript-first contracts.
- C#-first contracts.
- Manually maintained duplicate contracts.

## Supporting Evidence

- JSON Schema publishes a current 2020-12 specification.
- [../architecture/PROTOCOL_V1.md](../architecture/PROTOCOL_V1.md)

## Consequences

### Positive

Language-neutral contracts reduce backend coupling.

### Negative

Requires schema validation and generation tooling.

### Neutral

Protocol version remains independent from package version.

## Uncertainties

Type generation reliability for TypeScript and future C#.

## Revisit Conditions

Revisit if generation drift becomes hard to control or JSON Schema cannot express needed contracts.

## Related Documents

- [../architecture/DATA_SOURCE.md](../architecture/DATA_SOURCE.md)
- [../quality/TESTING_STRATEGY.md](../quality/TESTING_STRATEGY.md)
