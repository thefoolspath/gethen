# Architecture Decision Records

Last reviewed: 2026-09-08.

ADRs record proposed, accepted, rejected, or superseded architecture decisions. Do not mark an ADR as `Accepted` until the supporting research, prototype, or benchmark gate has completed.

## Index

| ADR | Status | Decision |
| --- | --- | --- |
| [0001-language-boundaries.md](0001-language-boundaries.md) | Superseded in part by ADR-0006 | TypeScript public/control layer; initial Rust research-only boundary |
| [0002-rendering-strategy.md](0002-rendering-strategy.md) | Accepted for alpha | Virtualized DOM renderer for alpha |
| [0003-worker-wasm-boundary.md](0003-worker-wasm-boundary.md) | Superseded by ADR-0006 | Deferred Worker/WASM until end-to-end evidence |
| [0004-monorepo-package-strategy.md](0004-monorepo-package-strategy.md) | Proposed | pnpm/Cargo monorepo |
| [0005-protocol-source-of-truth.md](0005-protocol-source-of-truth.md) | Proposed | JSON Schema protocol source |
| [0006-alpha4-production-engine.md](0006-alpha4-production-engine.md) | Accepted | TypeScript Worker at 500K; Rust/WASM retained internally as an oracle |
