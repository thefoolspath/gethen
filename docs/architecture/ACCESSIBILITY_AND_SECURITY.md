# Accessibility And Security Architecture

Last reviewed: 2026-08-04.

Initial alpha note: the virtualized DOM renderer represents the active cell with `aria-activedescendant`, cell `aria-selected`, and row/column indexes. Full screen-reader validation remains required before release confidence.

Status: Proposed.

## Accessibility

The first renderer must support keyboard-only operation. If Canvas is selected, a DOM accessibility layer is required because Canvas pixels do not provide grid semantics.

Minimum proposed alpha accessibility:

- one tab stop into the grid
- active-cell focus model
- arrow navigation
- Enter/Escape edit mode handling
- visible focus indication
- editor labels
- row and column counts when available
- readonly indication for non-editable cells

Do not claim WCAG or screen-reader compliance until tested.

## Security

Cell text, protocol input, clipboard input, and server responses are untrusted. Gethen should not execute HTML from cell values by default and must avoid arbitrary protocol expressions.

Future custom renderers should be treated as application code supplied by the host app.
