# Release Strategy

Last reviewed: 2026-08-04.

## Alpha Objective

`0.0.0-alpha.1` should prove a complete vertical slice, not the full long-term product.

## Stability Expectations

Alpha APIs may change. Public APIs should still be documented, typed, and intentionally scoped. Internal contracts must remain private.

## Versioning

Use Semantic Versioning. The first pre-release should be `0.0.0-alpha.1`, not a four-part version.

## Package Naming

Proposed npm scope: `@thefoolspath`. Perform final npm, GitHub, crates.io, NuGet, domain, and trademark checks before publishing.

## Publishing

Do not publish during planning. Future scoped public npm packages require explicit public access, for example `npm publish --access public`. Alpha publishing should use an alpha dist-tag and package-content checks. Consider npm provenance through CI after release automation exists.

## Future NuGet Relationship

Future .NET packages should implement the protocol; they must not define frontend semantics.

## Release Verification

Before alpha release:

- build packages
- run tests
- run browser smoke tests
- run benchmarks
- inspect package contents
- review dependency licenses
- update changelog
- write alpha release notes

## Browser Compatibility

Define supported browsers before release. Do not require SharedArrayBuffer unless the deployment header requirements are documented.

## Security Reporting

Define a private reporting channel before public release.

## Deprecation

During alpha, breaking changes are allowed but must be documented in release notes.
