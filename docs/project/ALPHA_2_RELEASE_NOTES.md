# Gethen 0.0.0-alpha.2 Release Notes

Status: Local release candidate only. No package has been published.

## Summary

`0.0.0-alpha.2` adds the first developer-customization, interaction, DTO, row-transaction, and validated clipboard surfaces while preserving the framework-neutral core and Angular-first adapter boundary.

## Included Packages

- `@thefoolspath/gethen-protocol@0.0.0-alpha.2`
- `@thefoolspath/gethen-core@0.0.0-alpha.2`
- `@thefoolspath/gethen-angular@0.0.0-alpha.2`

## Included Behavior

- Application-owned column, row, and cell classes.
- Conditional styling callbacks, alignment, text-only formatters, hidden/key/nullable metadata, and CSS-variable theme tokens.
- Rectangular range selection with Shift+keyboard and Shift+click interactions.
- Explicit typed DTO mapping with one stable string or numeric key field and runtime metadata validation.
- Headless single-row edit/insert/cancel/save transactions with original-row and changed-field payloads.
- Explicitly enabled direct TSV clipboard paste with typed parsing, nullable blank handling, developer parse/validation callbacks, per-cell errors, and all-or-nothing commit.
- Host-dialog paste preparation through the same pure validation API.
- Angular adapter inputs/outputs for styling, themes, range selection, clipboard configuration, and paste results.

## Verification

- `pnpm run build`
- `pnpm run check`
- `pnpm run test`: 34 tests passed.
- `pnpm run test:browser`: 17 Chromium tests passed.
- `pnpm run bench`: TypeScript, Alpha 2 customization/clipboard, DOM/Canvas browser, Alpha 2 Chromium, and GNU Rust benchmark stages passed.
- `npm.cmd pack --dry-run --json` for protocol, core, and Angular packages.
- `git diff --check`.

No runtime dependency was added, so the Alpha 1 dependency-license set remains unchanged.

## Performance Evidence

- JavaScript-only 500-visible-cell customization and 1,000-cell clipboard preparation/validation distributions are recorded in [../research/findings/2026-08-10-alpha2-customization-clipboard.md](../research/findings/2026-08-10-alpha2-customization-clipboard.md).
- Repeated-scroll Chromium runs measured customization-off medians from 4.2–5.0 ms and customization-on medians from 5.1–5.4 ms on the recorded machine.
- Three independent CDP-traced Chromium processes per scenario measured frame-interval medians of 16.817 ms off and 16.529 ms on, with no top-level task over 50 ms.
- These are local alpha baselines, not marketing or cross-hardware claims.

## Deliberately Headless Or Host-Owned

- Row transaction UI controls and asynchronous API reconciliation remain host-owned.
- Dialog paste preview uses the public preparation API; a renderer-owned dialog is not included.
- A second framework adapter remains optional and is not included.

## Deferred

- Custom renderer/editor components and raw HTML formatters.
- Partial paste commit, rich clipboard content, formulas, XLSX import/export, merged cells, and images.
- Headed and cross-hardware/browser trace matrices and external performance claims.
- Alpha 3 editor history and layout-control work.

Publishing still requires explicit maintainer approval, package-name checks, and the repository review/merge process.
