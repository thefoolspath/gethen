# Release Roadmap

## Corrected Roadmap

```text
0.0.0-alpha.1
Protocol, core controller, virtual Canvas renderer, single-cell selection/editing,
client/server DataSource, Rust/WASM worker experiment, TypeScript fallback,
React adapter, benchmark harness.

0.0.0-alpha.2
Angular adapter if deferred, range selection, clipboard read/write basics,
validation primitives.

0.0.0-alpha.3
Undo/redo, column resize, column reorder, frozen columns.

0.0.0-alpha.4
Grouping and aggregation.

0.0.0-alpha.5
Formula dependency model and formula engine prototype.

0.0.0-alpha.6
Pivot engine built on grouping/aggregation/formula metadata.

0.1.0-beta.1
API feedback, compatibility hardening, accessibility validation, docs.

1.0.0
Stable public API and documented compatibility policy.
```

## Changes From Proposal

- Formulas should come before pivot if pivot values may depend on computed fields.
- Angular can move to `alpha.2` if it threatens the first vertical slice.
- Clipboard should follow range selection, not precede it.
- Validation primitives should arrive before richer editors.
- API stabilization should wait until renderer, DataSource, and protocol behavior have real usage.

## Publishing

Use SemVer pre-release versions such as `0.0.0-alpha.1`. Do not use four-part versions like `0.0.0.1`.

For npm later:

```bash
npm publish --tag alpha --access public
```

For supply-chain security later, publish from CI with provenance once release automation is mature.
