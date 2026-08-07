# Dependency And License Evaluation

## Status

Initial candidate review complete for alpha tooling.

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
- npm package metadata lists `@angular/core` as MIT.
- npm package metadata lists TypeScript as Apache-2.0.
- npm package metadata lists Vite and Vitest as MIT.
- npm package metadata lists Playwright as Apache-2.0.
- npm package metadata lists RxJS as Apache-2.0, while RxJS project documentation currently shows MIT. Treat RxJS license as requiring lockfile/package metadata confirmation before publish.

## Experiments And Benchmarks

Dependency installation now exists for the initial workspace. A full automated license scan still does not exist.

Initial candidate review for Milestone 1 and Angular-first alpha work:

| Candidate | Intended use | Dependency class | License evidence | Initial result |
| --- | --- | --- | --- | --- |
| TypeScript | Type checking and declaration output | Development | Apache-2.0 in npm metadata | Allowed |
| Vite | Demo/build tooling | Development | MIT in npm metadata | Allowed |
| Vitest | Unit tests | Development | MIT in npm metadata | Allowed |
| Playwright | Browser smoke tests | Development | Apache-2.0 in npm metadata | Allowed |
| Ajv | JSON Schema contract validation | Development | MIT in npm metadata | Allowed |
| json-schema-to-ts | TypeScript inference from JSON Schema literals | Development | MIT in npm metadata | Allowed |
| Angular core packages | First adapter/runtime peer | Runtime peer | MIT in npm metadata | Allowed as peer dependency |
| Angular CLI/build tooling | Angular demo/test tooling | Development | MIT in package metadata/security index | Allowed |
| RxJS | Angular peer/runtime ecosystem dependency | Runtime peer/transitive | npm metadata and project docs differ | Allowed only after installed metadata is verified |

## Analysis

The repo should avoid unnecessary runtime dependencies until package boundaries exist. Runtime dependencies deserve stricter review than development tooling. For the Angular-first path, Angular should be modeled as a peer dependency of the adapter rather than bundled into core. Publishing should wait for name, scope, license, repository URL, provenance, package-content checks, and installed dependency license review.

## Options

- MIT-only dependencies: safest but unnecessarily restrictive.
- MIT/Apache/BSD permissive runtime set: practical recommendation.
- Copyleft dependencies: require explicit approval and legal review.

## Recommendation

Use MIT for Gethen. Allow permissive runtime dependencies after review. Defer all publishing. Use SemVer pre-release versions such as `0.0.0-alpha.1`.

For Milestone 1, dependency candidates are acceptable to install as development tooling if their resolved package metadata matches the reviewed license class. For Angular adapter work, keep Angular packages as peer dependencies wherever practical and verify the resolved lockfile before release verification.

## Limitations

This is not legal advice.

## Open Questions

- Final npm scope availability.
- GitHub organization/repository availability.
- Trademark/domain clearance.
- Final Angular minimum supported version.
- Installed RxJS license metadata for the selected Angular version.

## References

- "Creating and publishing scoped public packages", npm Docs, accessed 2026-08-04, primary registry documentation, https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/
- "Generating provenance statements", npm Docs, accessed 2026-08-04, primary registry documentation, https://docs.npmjs.com/generating-provenance-statements/
- "Semantic Versioning 2.0.0", semver.org, accessed 2026-08-04, primary specification, https://semver.org/
- "wasm-pack", wasm-bindgen GitHub organization, accessed 2026-08-04, maintainer source, https://github.com/wasm-bindgen/wasm-pack
- "@angular/core", npm package metadata, accessed 2026-08-07, https://www.npmjs.com/package/%40angular/core
- "typescript", npm package metadata, accessed 2026-08-07, https://www.npmjs.com/package/typescript
- "vite", npm package metadata, accessed 2026-08-07, https://www.npmjs.com/package/vite
- "vitest", npm package metadata, accessed 2026-08-07, https://www.npmjs.com/package/vitest
- "playwright", npm package metadata, accessed 2026-08-07, https://www.npmjs.com/package/playwright
- "ajv", npm package metadata, accessed 2026-08-07, https://www.npmjs.com/package/ajv
- "json-schema-to-ts", npm package metadata, accessed 2026-08-07, https://www.npmjs.com/package/json-schema-to-ts
- "rxjs", npm package metadata, accessed 2026-08-07, https://www.npmjs.com/package/rxjs
- "RxJS License", RxJS documentation, accessed 2026-08-07, https://rxjs.dev/license
