# Release Strategy

Last reviewed: 2026-08-12.

## Alpha Objective

`0.0.0-alpha.1` should prove a complete vertical slice, not the full long-term product.

## Stability Expectations

Alpha APIs may change. Public APIs should still be documented, typed, and intentionally scoped. Internal contracts must remain private.

## Versioning

Use Semantic Versioning. The first pre-release should be `0.0.0-alpha.1`, not a four-part version.

## Package Naming

Proposed npm scope: `@thefoolspath`. Perform final npm, GitHub, crates.io, NuGet, domain, and trademark checks before publishing.

## Local-Only Release Policy

All alpha releases are local package artifacts only. Do not publish, reserve names, create registry releases, or push release tags during alpha. Before beta, the maintainer will make a separate publishing decision; this plan neither authorizes nor requires beta or 1.0 publishing.

The MIT License keeps the legal “as is” and no-warranty language. That disclaimer does not reduce implementation, documentation, test, accessibility, security, compatibility, or performance gates.

## Server-Side 2.0 And Future NuGet Relationship

Client-side `1.0.0` contains no C# or NuGet release requirement. Server-side integration begins in the 2.0 workstream. C# code will live in a separate project/solution area in this repository and use versions independent from the npm packages. Its package split, target framework, provider matrix, and first preview version require a dedicated 2.0 plan. C# packages must implement shared data-operation semantics rather than define frontend behavior.

## Release Verification

Before each local release candidate:

- build packages
- run tests
- run browser smoke tests
- run benchmarks
- inspect package contents
- review dependency licenses
- update the project state and migration documentation
- write versioned release notes
- create and inspect the local artifacts included in that release; alpha currently includes npm artifacts only

## Browser Compatibility

Current stable Chrome and Edge are release blockers through 1.0. Firefox and Safari receive best-effort smoke coverage before 1.0. An expanded current/previous Chromium, Firefox, and WebKit matrix is post-1.0. Do not require SharedArrayBuffer unless deployment headers and fallback behavior are documented.

## Security Reporting

Define a private reporting channel before public release.

## Deprecation

During alpha, breaking changes are allowed but must be documented in release notes and migration guidance. Beta freezes the public Core, Angular, Grid Table, Formula, Pivot, and portable client data-operation surfaces intended for 1.0. A server wire protocol is not frozen in client 1.0. After 1.0, breaking client changes require a major version or a documented deprecation path.
