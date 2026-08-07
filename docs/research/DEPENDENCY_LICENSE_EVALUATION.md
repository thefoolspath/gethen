# Dependency And License Evaluation

## Status

Draft

## Question

Which dependency and license constraints should apply before alpha implementation?

## Context

Gethen intends to be MIT-licensed and distributed through npm, with possible future Rust and NuGet packages.

## Evaluation Criteria

License compatibility, runtime versus development dependency risk, attribution, publish security, package metadata, and future release requirements.

## Evidence

- npm documentation states scoped packages are private/restricted by default and require `npm publish --access public` for public scoped publishing.
- npm provenance documentation describes provenance attestations and notes they improve supply-chain transparency but do not prove a package is free of malicious code.
- SemVer defines `MAJOR.MINOR.PATCH` and pre-release labels as extensions to that format.
- wasm-pack and wasm-bindgen use permissive MIT/Apache-2.0 licensing in their repositories/documentation.

## Experiments And Benchmarks

No dependency tree exists, so no automated license scan can run yet.

## Analysis

The repo should avoid dependencies until package boundaries exist. Runtime dependencies deserve stricter review than development tooling. Publishing should wait for name, scope, license, repository URL, provenance, and package-content checks.

## Options

- MIT-only dependencies: safest but unnecessarily restrictive.
- MIT/Apache/BSD permissive runtime set: practical recommendation.
- Copyleft dependencies: require explicit approval and legal review.

## Recommendation

Use MIT for Gethen. Allow permissive runtime dependencies after review. Defer all publishing. Use SemVer pre-release versions such as `0.0.0-alpha.1`.

## Limitations

This is not legal advice.

## Open Questions

- Final npm scope availability.
- GitHub organization/repository availability.
- Trademark/domain clearance.

## References

- "Creating and publishing scoped public packages", npm Docs, accessed 2026-08-04, primary registry documentation, https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/
- "Generating provenance statements", npm Docs, accessed 2026-08-04, primary registry documentation, https://docs.npmjs.com/generating-provenance-statements/
- "Semantic Versioning 2.0.0", semver.org, accessed 2026-08-04, primary specification, https://semver.org/
- "wasm-pack", wasm-bindgen GitHub organization, accessed 2026-08-04, maintainer source, https://github.com/wasm-bindgen/wasm-pack
