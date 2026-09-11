# UX And Visual Verification

Last verified: 2026-09-09.

Status: Passed for the current Alpha scope. Manual NVDA/Chrome remains deferred and is mandatory before Beta/1.0. This evidence does not claim a completed external-participant usability study or screen-reader conformance.

## Automated Browser Evidence

- `pnpm run test:browser`: 48/48 Chromium scenarios passed locally.
- Coverage includes Emerald system-theme selection, persisted overrides, Grid updates without remounting, route search, keyboard result navigation, narrow navigation, desktop table of contents, sidebar collapse/expand, and existing Grid interactions.
- A representative walkthrough exposed that `undo redo` did not match the `Undo / Redo` route. Route search now normalizes punctuation and symbols before matching all query terms, with browser regression coverage.

## Visual Matrix

The local documentation build was rendered and inspected at the plan's exact viewports. No blocking contrast, hierarchy, clipping, overflow, or state-distinction defect was observed.

| Viewport | Mode | States inspected | Result |
| --- | --- | --- | --- |
| 1440 x 900 | Emerald Light | documentation shell, table of contents, selection range, active cell, rejected clipboard paste, inspector | Pass |
| 1440 x 900 | Emerald Dark | documentation shell, active editor, event output, Grid, code panel, API panel | Pass |
| 390 x 844 | Emerald Light | compact top bar, navigation overlay, active route, grouped navigation | Pass |
| 390 x 844 | Emerald Dark | readonly Grid, active cell, status row, inspector, code-panel header | Pass |

The inspected state set covers selection, editing, readonly, invalid/rejected input, code panels, and desktop/mobile navigation. Generated screenshots are temporary local verification artifacts and are not repository assets.

## Representative Task Walkthroughs

Three task-based walkthroughs were completed through the local browser UI:

| Representative persona | Task | Observed outcome |
| --- | --- | --- |
| Angular adopter | Start at Introduction, follow `Start building`, focus the Basic Grid, and move the active cell | Reached Basic Grid; the selection event identified the selected row and column |
| Keyboard-heavy analyst | Open route search, find local history, edit a customer cell, then undo and redo | Edit and both history directions completed; the punctuation-search gap found during this walkthrough was fixed and regression-tested |
| Mobile read-only reviewer | At 390 x 844, open `Browse docs`, navigate to Readonly Preview, focus a cell, and press Enter | Navigation opened, the preview loaded, and no editor control was created |

These are representative scenario walkthroughs performed by one local evaluator, not sessions with three independent external participants. They close the plan's local walkthrough evidence while preserving the limitation: do not claim broadly validated usability without external participant research.

## Deferred Accessibility Gate

Manual NVDA with current stable Chrome was not run. It remains optional for Alpha and a blocking gate before Beta/1.0. Automated ARIA and keyboard evidence must not be represented as equivalent to this deferred screen-reader check.
