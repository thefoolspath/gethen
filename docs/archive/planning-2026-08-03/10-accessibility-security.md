# Accessibility And Security

## Accessibility Plan

Canvas creates accessibility risk because pixels do not expose cell semantics. Alpha should provide keyboard operation and a limited accessibility DOM, but must not claim full compliance until tested.

Required alpha behavior:

- single tab stop into the grid.
- managed active cell focus.
- arrow key, Tab, Shift+Tab, Enter, Escape, Home, and End handling.
- DOM editor inputs with labels.
- visible focus indication.
- `aria-live` announcements for active cell and edit state.
- row/column counts and indexes in the accessibility layer.
- readonly state for non-editable cells.
- high contrast compatible CSS variables.
- browser zoom and device pixel ratio testing.
- reduced-motion respect for animated transitions.

WAI-ARIA APG grid guidance says data grids are composite widgets with managed focus and directional navigation. Gethen should follow that interaction model and test with assistive technologies before claiming support.

## Alpha Limitation

The accessibility DOM may represent only the active row, headers, and nearby visible cells in alpha. Full screen-reader browsing of every virtual row is deferred but must remain architecturally possible.

## Security Plan

- Treat all cell values as untrusted text.
- Draw text to Canvas or assign text with `textContent`; never execute HTML from cell values by default.
- Sanitize clipboard input before later multi-cell paste support.
- Avoid merging row objects into plain option objects in ways that permit prototype pollution.
- Validate column IDs and field names.
- Bound server request size, block size, filter count, sort count, and string lengths.
- Do not accept arbitrary expressions in protocol.
- Isolate WASM failure in Worker and surface structured errors.
- Add dependency review and license checks before publish.
- Use npm provenance when publishing later.
- Treat custom renderers as application code, not trusted user content.

## Backend Future Security

Future backend adapters must allowlist fields before translating filters/sorts. Query complexity limits are mandatory. Protocol errors should be safe for clients and logs should carry deeper diagnostics server-side only.
