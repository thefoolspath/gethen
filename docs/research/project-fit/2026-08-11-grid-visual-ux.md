# Grid Visual And UX Project Fit

Last reviewed: 2026-08-11.

## Existing Assets

- Stable column titles and layout widths/order already exist.
- Viewport rendering, frozen panes, selection, editing, history, shaping counts, and aggregate helpers can supply the shell state.
- Application classes, CSS-variable tokens, and Angular passthrough provide a compatible customization base.

## Gaps

- No rendered column-header or corner surface.
- No explicit row-number gutter; the first data column incorrectly carries row-header semantics.
- No empty-state-safe focus model, complete built-in editor labels, or readonly cell state.
- No pinned bottom rows or client status surface.
- Theme tokens do not cover headers, gutter, pinned rows, status, hover, readonly, invalid, editor focus, dimensions, or density.
- No visual-regression or default-theme performance gate exists.

## Fit

The work belongs before Alpha 5 because formula and pivot UI would otherwise create new surfaces on an incomplete visual foundation. Headless aggregation remains Alpha 4 engine behavior; renderer summaries consume it without moving aggregation into DOM code. Server loading/error/unknown-total behavior remains Alpha 7 because it depends on Protocol v2 and server DataSource semantics.
