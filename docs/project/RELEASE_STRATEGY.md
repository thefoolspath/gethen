# Release Strategy

Last reviewed: 2026-08-10.

## Alpha Objective

`0.0.0-alpha.1` should prove a complete vertical slice, not the full long-term product.

## Stability Expectations

Alpha APIs may change. Public APIs should still be documented, typed, and intentionally scoped. Internal contracts must remain private.

## Versioning

Use Semantic Versioning. The first pre-release should be `0.0.0-alpha.1`, not a four-part version.

## Package Naming

Proposed npm scope: `@thefoolspath`. Perform final npm, GitHub, crates.io, NuGet, domain, and trademark checks before publishing.

## Local-Only Release Policy

Alpha, beta, and the first `1.0.0` release candidate are local package artifacts only. Do not publish, reserve names, create registry releases, or push release tags as part of the current execution plan. The maintainer will use the packages personally and approve a separate publishing plan later; there is no formal self-use duration gate.

The MIT License keeps the legal “as is” and no-warranty language. That disclaimer does not reduce implementation, documentation, test, accessibility, security, compatibility, or performance gates.

## Future NuGet Relationship

The frontend and NuGet package lifecycles are independent. At frontend `0.0.0-alpha.8`, the first NuGet preview is `0.0.0-alpha.1`. .NET packages implement Protocol v2 and must not define frontend semantics.

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
- create and inspect local npm/NuGet artifacts without publishing

## Browser Compatibility

Current stable Chrome and Edge are release blockers through 1.0. Firefox and Safari receive best-effort smoke coverage before 1.0. An expanded current/previous Chromium, Firefox, and WebKit matrix is post-1.0. Do not require SharedArrayBuffer unless deployment headers and fallback behavior are documented.

## Security Reporting

Define a private reporting channel before public release.

## Deprecation

During alpha, breaking changes are allowed but must be documented in release notes and migration guidance. Beta freezes the public Core, Protocol v2, and Angular surfaces. After 1.0, breaking changes require a major version or a documented deprecation path.
