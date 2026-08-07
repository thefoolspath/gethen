# System Overview

Last reviewed: 2026-08-04.

## Implemented Architecture

No production architecture is implemented yet. This repository currently contains documentation only.

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

Potential future server-side integration path:

```text
Gethen Core DataSource
        |
        v
Language-neutral protocol
        |
        v
Backend integration package
        |
        +--> ASP.NET Core endpoint helpers
        +--> LINQ query translation helpers
        +--> EF Core query/update helpers
```

## Architectural Principles

- Keep framework-specific behavior outside core.
- Keep expensive technology choices behind interfaces until benchmarks justify them.
- Keep backend integrations outside frontend core and behind the language-neutral protocol.
- Use source code and tests as truth for implemented behavior once code exists.
- Treat research notes as evidence, not decisions.
- Treat ADRs as the record of proposed or accepted decisions.

## Related Documents

- [PACKAGE_BOUNDARIES.md](PACKAGE_BOUNDARIES.md)
- [DATA_MODEL.md](DATA_MODEL.md)
- [DATA_SOURCE.md](DATA_SOURCE.md)
- [../plans/active/0001-alpha-1-vertical-slice.md](../plans/active/0001-alpha-1-vertical-slice.md)
