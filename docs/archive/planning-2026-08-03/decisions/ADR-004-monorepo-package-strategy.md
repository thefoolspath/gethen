# ADR-004: Monorepo Package Strategy

## Status

Proposed.

## Context

Gethen spans npm packages, Rust crates, demos, tests, and benchmarks.

## Decision

Use a monorepo with pnpm workspace and Cargo workspace. Use fixed package versions during alpha. Do not add Turborepo or Nx by default.

## Alternatives Considered

- Polyrepo: increases coordination overhead.
- Nx/Turborepo immediately: may add dependency and configuration cost before scale requires it.
- Independent versions: useful later but confusing during alpha.

## Consequences

Release management is simpler early. Build orchestration may need improvement later.

## Evidence Required

Build time, CI duration, and package dependency churn after early milestones.

## Revisit Conditions

Revisit if workspace commands become slow or release cadence diverges between packages.
