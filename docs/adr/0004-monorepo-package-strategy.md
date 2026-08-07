# ADR-0004: Monorepo Package Strategy

## Status

Proposed

## Context

Gethen is expected to contain TypeScript packages, optional Rust crates, demos, tests, and benchmarks.

## Decision

Use a monorepo with pnpm workspace and Cargo workspace once implementation begins. Do not add Nx or Turborepo by default.

## Alternatives Considered

- Polyrepo.
- pnpm/Cargo monorepo without task runner.
- Nx/Turborepo-managed monorepo.

## Supporting Evidence

- Current repo has no tooling yet; added orchestration would be premature.
- [../architecture/PACKAGE_BOUNDARIES.md](../architecture/PACKAGE_BOUNDARIES.md)

## Consequences

### Positive

Lower setup complexity for alpha.

### Negative

May need task orchestration later.

### Neutral

Use fixed versions during early alpha to reduce package compatibility confusion.

## Uncertainties

CI and build performance after packages exist.

## Revisit Conditions

Revisit if builds become slow or package release cadence diverges.

## Related Documents

- [../project/RELEASE_STRATEGY.md](../project/RELEASE_STRATEGY.md)
