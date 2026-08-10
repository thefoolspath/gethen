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

Initial Alpha 2 formatter callbacks return text only. The virtualized DOM renderer assigns formatter output through `textContent`, so it is not interpreted as HTML. Application class callbacks may return host-owned CSS class names but do not receive a raw DOM mutation hook.

Initial Alpha 2 range selection keeps one active descendant while setting `aria-selected="true"` on every rendered cell inside the rectangular selection. Shift-modified keyboard navigation and pointer selection share the same anchor/focus model. Manual assistive-technology validation remains open.

Initial Alpha 2 direct paste is disabled by default and reads `text/plain` only. The complete tabular payload is parsed and validated before mutation; any bounds, type, nullability, readonly, or developer-validation error rejects the whole paste. Formula-looking and HTML-looking text remains inert cell data.

Future custom renderers should be treated as application code supplied by the host app.
