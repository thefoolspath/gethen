# Client-First 1.0 And Server-Side 2.0 Roadmap

Last reviewed: 2026-08-12.

Status: Accepted sequencing and scope amendment. This plan supersedes the Alpha 5 onward sequencing and server-before-1.0 scope in [0004-alpha-3-onward-execution-plan.md](0004-alpha-3-onward-execution-plan.md). It does not change the implemented status of any version.

## Goal

Complete Gethen as a production-quality client-side grid through `1.0.0` before starting server execution. Alpha artifacts remain local only, but every existing implementation, test, browser, accessibility, performance, package-inspection, and license gate remains mandatory. Publishing is a separate decision at the beta gate.

## Accepted Sequence

1. Finish `0.0.0-alpha.3` by recording the outstanding manual NVDA/Chrome gate. Automated implementation is already complete, but Alpha 3 is not yet a completed local release candidate.
2. Finish `0.0.0-alpha.4` data shaping, engine bake-off, and grid-shell closure without weakening its current exit gates.
3. Implement `0.0.0-alpha.5` as the read-only Grid Table milestone.
4. Implement the Gethen Formula Engine as `0.0.0-alpha.6`.
5. Implement Pivot and the field builder as `0.0.0-alpha.7`.
6. Enter client-side beta hardening, then produce the client-side `1.0.0` release candidate.
7. Plan and implement Server DataSource, the server wire protocol, and C# backend integration as the `2.0` workstream.

No Protocol v2 server transport, Server DataSource, ASP.NET Core, LINQ, EF Core, SQL-provider integration, or NuGet artifact is required for client-side `1.0.0`.

## Alpha 5 Read-Only Grid Table

- Reuse the existing Core renderer and Angular component. Do not fork a second DataTable renderer or component.
- Add an `editable`/`readOnly` interaction mode with `editable` as the compatibility-preserving default.
- Provide a read-only preset/helper that avoids installing editing, paste-mutation, row-mutation, and mutation-history handlers.
- Keep selection, copy, resize, column reordering, layout persistence, sort, filter, group, aggregate, virtualization, pinned summaries, and the status bar available in read-only mode.
- Add pointer drag-and-drop column reordering and a keyboard-accessible move-left/move-right alternative. Persist the result through the existing layout-state boundary.
- Add header sorting with stable multi-sort and configurable filtering. Both a header-menu presentation and a filter-row presentation must be supported over the same query state.
- Keep typed comparison, null placement, filter operators, and sort stability consistent with Alpha 4 shaping semantics.
- Preserve ARIA header, sort, filter, focus, keyboard, frozen-pane, hidden-column, and virtualized-row behavior.

## Client Contracts Prepared For 2.0

- Represent range/paging, sort, filter, group, aggregate, formula, pivot, update, and row-transaction intent with transport-neutral descriptors or typed ASTs where those operations are part of the client product.
- Keep portable data-operation contracts serializable and free of JavaScript callbacks, executable text, raw SQL, ASP.NET Core types, LINQ expressions, and EF Core types.
- Mark application-provided renderers, editors, formatters, and custom JavaScript reducers as client-only. A future server implementation must use named, allowlisted equivalents rather than attempting to execute browser callbacks.
- Keep stable row and column identity independent of viewport indexes so the same logical operations can later cross a server boundary.
- Do not freeze a server wire protocol in 1.0. The 2.0 plan will define transport envelopes, cancellation, stale-response handling, retries, caching, revisions, concurrency, and safe backend translation around the client-side logical model.

## Server-Side 2.0 Boundary

- Server-side 2.0 must target parity for data operations: range/paging, sort, filter, group, aggregate, formula, pivot, updates, and row transactions.
- C# backend code will live in this repository but in a separate project/solution area with a version lifecycle independent from the npm packages.
- Frontend packages and shared client contracts must not depend on C#, ASP.NET Core, LINQ, EF Core, SQL, or provider-specific runtimes.
- The internal C# package split, target framework, provider matrix, and release numbering will be decided in a dedicated 2.0 plan. No C# project is scaffolded by this roadmap amendment.

## Release And Quality Gates

- Alpha completion means all gates relevant to the included surface pass locally; it does not mean build-and-demo only.
- Manual NVDA/Chrome remains an accessibility release gate. Current open manual evidence must continue to be reported truthfully.
- Chrome and Edge remain release-blocking through client-side 1.0; other browser commitments remain unchanged.
- Performance-sensitive milestones retain the accepted 1,000,000-row target and documented 500,000-row fallback.
- Alpha packages are not published. Before beta, the maintainer will approve a separate publishing decision; this plan neither authorizes nor requires npm publishing.
- Until implementation begins, this amendment changes documentation only: no source, tests, package versions, build configuration, or backend projects are changed.

## Documentation Consequences

- [0004-alpha-3-onward-execution-plan.md](0004-alpha-3-onward-execution-plan.md) remains authoritative for Alpha 3 and Alpha 4 details, but this plan replaces its Alpha 5 onward numbering and removes its Alpha 7/8 server commitments.
- The product roadmap, product scope, release strategy, architecture boundaries, grid-shell integration notes, and project state must route future work to this plan.
- Historical research and change-log entries remain evidence of the decision that existed when they were written; current source-of-truth documents must label that sequencing as superseded.
