# Grid Visual And UX Findings

Last reviewed: 2026-08-11.

## Question

What grid-shell and default-theme foundation must exist before Gethen adds formula, pivot, and server UI without accumulating inconsistent visual and accessibility behavior?

## Findings

- The current core demo renders a body-only cell canvas. Column titles are absent, the first ordinary data column is announced as row headers, and there is no row-number gutter, empty state, status bar, or pinned summary surface.
- The demo toolbar is diagnostic rather than a product default. Browser-native controls, a large statistics block, and body cells beginning without column context make the first-run experience unsuitable as the intended default grid presentation.
- The Alpha 2 plan describes header classes, header callbacks, header/readonly/edit-focus tokens, dimensions, and density presets, while the implementation exposes only the initial body-cell token subset.
- A coherent shell must treat column headers, the row-number corner/gutter, body viewport, pinned bottom rows, and status bar as synchronized surfaces sharing column layout, horizontal scrolling, density, typography, focus, and state tokens.
- WAI-ARIA grid guidance supports column and row headers but requires deliberate focus and labeling behavior. A first data column must not automatically become a row header unless the application declares that semantic meaning.
- Established grids ship a usable built-in theme while retaining token or class customization. Gethen can follow that product principle without importing a design system.

## Decision

Adopt a dependency-free modern-enterprise light default theme with comfortable density. Provide compact and spacious presets through the same token system. Implement the missing accepted header/accessibility behavior and the new row-number, status, and pinned-row surfaces as an Alpha 4 UX closure before Alpha 5 formula UI begins. Extend, rather than replace, the status surface for server states in Alpha 7.

## Evidence Still Required

- Automated contrast and visual-regression evidence.
- Repeated scroll/render measurements with the complete shell enabled.
- Manual keyboard and NVDA/Chrome verification.
- At least three representative user walkthroughs before making validated-usability claims; if unavailable, document that limitation.

## Initial Implementation Evidence

- Chromium browser coverage passes for column headers, row numbers, empty-state focus safety, pinned summaries, status text, scrolling, editing, layout, and Angular passthrough.
- Manual local visual QA at 1280 x 720 and 1440 x 900 confirms the header, body, pinned summary, status bar, and scrollbars remain visible and aligned. The first pass exposed an obsolete demo-height calculation; the demo now sizes the grid from its actual CSS grid track.
- The default theme uses only CSS variables, inline structural styles, and system fonts; no runtime dependency was added.
- The existing repeated-scroll Chromium run, now including the default shell, recorded a 4.7 ms customization-on render median. The three-process trace recorded a 16.599 ms median-of-medians, 18.559 ms median p95, and no task over 50 ms. These are local diagnostic results, not cross-hardware release evidence.
