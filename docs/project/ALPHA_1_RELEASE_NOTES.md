# Gethen 0.0.0-alpha.1 Release Notes

Status: local release candidate only. No package has been published.

## Summary

`0.0.0-alpha.1` is the first local vertical-slice release candidate for Gethen. It proves typed columns, developer-provided rows, viewport virtualization, active-cell navigation, basic editing, typed change events, client-side DataSource behavior, and an Angular-backed adapter demo.

## Included Packages

- `@thefoolspath/gethen-protocol@0.0.0-alpha.1`
- `@thefoolspath/gethen-core@0.0.0-alpha.1`
- `@thefoolspath/gethen-angular@0.0.0-alpha.1`

## Included Demos

- `apps/core-demo/`: framework-neutral virtualized DOM renderer demo.
- `apps/angular-demo/`: Angular-backed demo that mounts the standalone adapter component.

## Verification

- `pnpm run check`
- `pnpm run build`
- `pnpm run test`
- `pnpm run test:browser`
- `pnpm run bench`
- `npm.cmd pack --dry-run --json` in each package directory with workspace-local npm cache

## Package Inspection

Dry-run package contents include built `dist` files and `package.json` only. Test artifacts are excluded from publishable package file lists.

## Dependency Licenses

Installed metadata checked during local release verification:

- Angular packages: MIT.
- RxJS: Apache-2.0.
- tslib: 0BSD.
- Playwright and TypeScript: Apache-2.0.
- Ajv, json-schema-to-ts, and Vitest: MIT.

## Deferred

- React adapter.
- Server-side DataSource.
- Production Worker/WASM integration.
- Canvas renderer acceptance.
- Formula, pivot, range selection, clipboard, undo/redo, and advanced layout controls.

## Notes

APIs remain alpha and may change. Publishing still requires explicit maintainer approval, final package identity checks, and PR review before merging to `main`.
