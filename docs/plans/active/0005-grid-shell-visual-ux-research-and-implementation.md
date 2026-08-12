# Grid Shell Visual UX Research And Implementation

Last reviewed: 2026-08-12.

Status: Alpha 4 foundation implemented and locally verified. Manual NVDA/Chrome and representative-user walkthroughs remain open. NVDA/Chrome is optional during alpha and mandatory before Beta/1.0. The former Alpha 7 server-status extension is superseded by the Server 2.0 roadmap.

## Goal

Make an uncustomized Gethen grid visually coherent, understandable, and keyboard-accessible while preserving virtualization, host customization, and the no-runtime-dependency boundary.

## Accepted Defaults

- Modern-enterprise light theme using system fonts.
- Comfortable density by default, with compact and spacious presets.
- Visible column headers and row-number gutter by default; both may be disabled.
- Client status bar enabled by default.
- Readonly pinned bottom rows supplied by the host or built from Alpha 4 aggregate results.
- Dark mode is not part of this closure; tokens must remain sufficient for host overrides.

## Work

- [x] Capture the issue/CR decisions and source-grounded baseline research.
- [x] Render synchronized column headers, a corner cell, and row-number gutter with correct ARIA indexes and roles.
- [x] Restore the accepted header class/callback surface and complete theme/density tokens.
- [x] Make empty grids focus-safe and label built-in editors/readonly cells.
- [x] Add readonly pinned bottom rows that share layout and horizontal scrolling but stay outside body shaping, counts, history, editing, and paste.
- [x] Add a client status bar for loaded/filtered/total row counts and selection summary without inventing unknown values.
- [x] Pass the new inputs through Angular without importing Angular into Core.
- [x] Update demos and public customization documentation.
- [x] Add unit, browser, accessibility, manual visual, and existing benchmark-suite evidence.
- [ ] Record at least three representative user walkthroughs before claiming validated usability; otherwise record the evidence limitation.

## Version Integration

- Alpha 4 closure: complete the shell foundation and retain the existing engine bake-off gates.
- Alpha 5: reuse the shell for the read-only Grid Table, column reordering, sorting, and configurable filtering controls.
- Alpha 6: use the same tokens and status conventions for formula bar/editor/errors.
- Alpha 7: verify dynamic pivot headers and totals against the shell.
- Server 2.0: add loading, error, retry, loaded/filtered/total and unknown-total server states.
- Beta 1: freeze the public shell/theme surface after visual, accessibility, package, and performance checks.

## Exit Gate

- Default mount is coherent without host CSS and all surfaces remain customizable.
- Header, gutter, body, pinned rows, and status remain aligned through scroll, resize, reorder, hide, and frozen-pane operations.
- The default theme meets WCAG 2.2 AA contrast for included text and component states.
- Rendering remains viewport-bounded and repeated shell-enabled measurements do not hide a material regression.
- Core and Angular checks, unit tests, Chromium scenarios, benchmark suite, and the deferred manual NVDA/Chrome evidence are recorded truthfully. NVDA/Chrome must pass before Beta/1.0.
