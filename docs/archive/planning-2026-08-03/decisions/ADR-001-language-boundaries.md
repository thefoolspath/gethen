# ADR-001: Language Boundaries

## Status

Proposed.

## Context

Gethen needs browser UI, framework adapters, high-volume local data operations, and future backend protocol support.

## Decision

Use TypeScript for browser APIs, UI orchestration, render/input/accessibility logic, DataSource behavior, Worker management, and framework adapters. Use Rust for optional headless compute. Use protocol schemas for cross-language requests. Keep C# for future backend adapters.

## Alternatives Considered

- TypeScript only: simpler, but may limit heavy compute headroom.
- Rust owns more UI: poor browser/framework fit.
- Backend-first design: premature and risks coupling protocol to EF Core.

## Consequences

The boundary must be coarse and benchmarked. Rust APIs remain internal during alpha. TypeScript fallback remains required.

## Evidence Required

Benchmarks comparing TypeScript and Rust/WASM across main thread and Worker modes.

## Revisit Conditions

Revisit if Rust/WASM does not beat TypeScript enough to justify transfer, memory, and packaging complexity.
