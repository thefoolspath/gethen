# System Overview

Last reviewed: 2026-08-12.

## Implemented Architecture

Initial protocol, Core, Angular, demo, renderer, client DataSource, shaping, and worker-candidate slices are implemented. See [../project/PROJECT_STATE.md](../project/PROJECT_STATE.md) for evidence and open gates.

## Proposed Target Architecture

```text
Framework adapter or core demo
        |
        v
Gethen Core - TypeScript
  public API, state, input, viewport, rendering orchestration, DataSource
        |
        +--> Renderer contract
        |
        +--> Compute engine contract
        |
        +--> Protocol types
```

Potential future compute path:

```text
Gethen Core -> Worker bridge -> Rust/WASM engine
```

Deferred Server 2.0 integration path:

```text
Gethen Core DataSource
        |
        v
Language-neutral protocol
        |
        v
Separately versioned C# project/solution area in this repository
        |
        +--> ASP.NET Core endpoint helpers
        +--> LINQ query translation helpers
        +--> EF Core query/update helpers
```

## Architectural Principles

- Keep framework-specific behavior outside core.
- Keep expensive technology choices behind interfaces until benchmarks justify them.
- Keep backend integrations outside frontend core and behind the language-neutral protocol.
- Complete client-side 1.0 before implementing Server DataSource or backend packages.
- Keep client data-operation descriptors serializable so Server 2.0 can add parity for range/paging, sort, filter, group, aggregate, formula, pivot, updates, and row transactions.
- Keep browser UI callbacks outside portable contracts; future server execution uses named and allowlisted equivalents.
- Use source code and tests as truth for implemented behavior once code exists.
- Treat research notes as evidence, not decisions.
- Treat ADRs as the record of proposed or accepted decisions.

## Related Documents

- [PACKAGE_BOUNDARIES.md](PACKAGE_BOUNDARIES.md)
- [DATA_MODEL.md](DATA_MODEL.md)
- [DATA_SOURCE.md](DATA_SOURCE.md)
- [../plans/active/0001-alpha-1-vertical-slice.md](../plans/active/0001-alpha-1-vertical-slice.md)
