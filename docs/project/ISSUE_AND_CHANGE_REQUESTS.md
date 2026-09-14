# Issue And Change Request Log

Last reviewed: 2026-09-03.

Status: Active intake log.

## Purpose

This file tracks defects, usability findings, and change requests discovered after planning or after hands-on use.

Use it as the first stop for feedback that is not already part of an accepted plan. Do not rewrite older plans to make new feedback look like original scope.

## Definitions

- Issue: behavior that is broken, confusing, unstable, or inconsistent with implemented behavior, accepted ADRs, architecture, or current docs.
- Change request: new or changed behavior requested after the original plan was written.
- Planned work: an issue or change request that has been accepted into a roadmap version or active plan.
- Deferred work: valid feedback that is intentionally postponed.

## ID Format

- Issues: `ISSUE-YYYYMMDD-NNN`
- Change requests: `CR-YYYYMMDD-NNN`

Example: `CR-20260808-001`.

## Status Flow

| Status | Meaning |
| --- | --- |
| New | Captured but not triaged. |
| Needs evidence | Needs reproduction steps, user scenario, benchmark, design decision, or architecture review. |
| Accepted | Agreed as valid work, but not necessarily scheduled. |
| Planned | Linked to a roadmap version or active plan task. |
| In progress | Implementation or documentation update is underway. |
| Done | Merged into source/docs with verification recorded. |
| Deferred | Valid, but intentionally postponed. |
| Rejected | Not aligned with current scope or product direction. |

## Triage Rules

- Keep the original roadmap and plan intent intact.
- Before turning a conversation point into an issue or change request, ask the maintainer which category to use and wait for approval.
- Do not create an intake row from discussion alone unless the maintainer explicitly approves the category.
- Add new feedback here first unless it is an obvious tiny documentation correction.
- Link accepted feedback into the roadmap only when it affects product sequencing.
- Link accepted feedback into an active plan only when it becomes part of current execution.
- Create or update an ADR when the feedback changes an accepted architecture decision.
- Update `docs/project/PROJECT_STATE.md` when feedback changes implementation status, active work, verified commands, accepted decisions, or important repository structure.
- Keep defects and change requests traceable by ID in commits, plan updates, and release notes when practical.

## Intake Queue

| ID | Type | Summary | Source | Impact | Status | Target | Links |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CR-20260808-001 | Change request | Add a lightweight process for future issues and CRs discovered during real use. | Maintainer feedback | Medium | Done | Documentation/process | [../plans/active/0002-feedback-and-change-control.md](../plans/active/0002-feedback-and-change-control.md) |
| CR-20260808-002 | Change request | Plan developer-friendly customization for application-owned CSS classes, conditional row/column/cell styling, DTO column mapping, hidden key fields, and row-level edit/insert/save events. | Maintainer planning feedback | High | Done | Developer API/customization | [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md); [../product/ROADMAP.md](../product/ROADMAP.md) |
| CR-20260808-003 | Change request | Plan optional Excel/MySQL Workbench-style clipboard paste with blank-cell support, pre-commit data type validation, and per-cell error reporting. | Maintainer planning feedback | High | Done | Clipboard/edit validation | [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md); [../product/ROADMAP.md](../product/ROADMAP.md) |
| ISSUE-20260808-001 | Issue | Virtualized DOM grid renders no visible cells after vertical scrolling in the core renderer. | Maintainer hands-on feedback; Chrome QA on `apps/core-demo/index.html` | High | Done | Core renderer | `packages/core/src/renderer/dom/virtual-dom-grid.ts`; `tests/browser/renderer-prototypes.spec.ts` |
| ISSUE-20260808-002 | Issue | Mouse-based editing is incomplete: click selects a cell, but double-click does not enter edit mode. | Maintainer hands-on feedback; Chrome QA on `apps/core-demo/index.html` | High | Done | Core renderer editing UX | `packages/core/src/renderer/dom/virtual-dom-grid.ts`; `tests/browser/renderer-prototypes.spec.ts` |
| ISSUE-20260808-003 | Issue | Type-to-edit is not supported after selecting a text or number cell. | Maintainer hands-on feedback; Chrome QA on `apps/core-demo/index.html` | Medium | Done | Core renderer editing UX | `packages/core/src/renderer/dom/virtual-dom-grid.ts`; `tests/browser/renderer-prototypes.spec.ts` |
| ISSUE-20260808-004 | Issue | Browser test runner fails when `127.0.0.1:4173` is already in use because the runner hard-codes the port. | Local browser-test verification | Medium | Done | Test tooling | `scripts/run-browser-tests.mjs` |
| ISSUE-20260811-001 | Issue | The renderer has no column-header row even though the Alpha 1 renderer outcome requires headers; `GridColumn.title` is unused and the first ordinary data column is exposed as `rowheader`. | Maintainer review and local browser QA | High | Done | Alpha 4 grid-shell closure | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md) |
| ISSUE-20260811-002 | Issue | The closed Alpha 2 customization direction names header classes, header styling callbacks, header/readonly/edit-focus tokens, and density presets that are absent from the implemented public surface. | Repository plan/API comparison | Medium | Done | Alpha 4 grid-shell closure | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md) |
| ISSUE-20260811-003 | Issue | Empty grids retain a dangling active-descendant model, while built-in editors and readonly cells do not provide all labels/states required by the accepted accessibility note. | Repository accessibility/API comparison | High | Done | Alpha 4 grid-shell closure | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md) |
| ISSUE-20260902-001 | Issue | Angular demo cell values cannot be edited reliably, and the built-in text editor is visibly smaller than the active cell instead of fitting its bounds. | Maintainer hands-on feedback and screenshot from Chrome QA on `apps/angular-demo/` | High | New | Core renderer editing UX | `packages/core/src/renderer/dom/virtual-dom-grid.ts`; `packages/core/src/renderer/dom/virtual-dom-grid-cell.ts`; `tests/browser/renderer-prototypes.spec.ts` |
| CR-20260811-001 | Change request | Research and implement a polished modern-enterprise light default theme with comfortable default density and compact/spacious alternatives. | Maintainer planning feedback and local browser QA | High | Done | Alpha 4 UX closure before Alpha 5 | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md); [../product/ROADMAP.md](../product/ROADMAP.md) |
| CR-20260811-002 | Change request | Add a row-number gutter, client status bar, and readonly pinned bottom/totals rows supplied by the host or derived with existing aggregate helpers; extend the status surface for future server states. | Maintainer planning feedback | High | In progress | Alpha 4 client foundation; Server 2.0 extension | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md); [../plans/active/0006-client-first-1.0-server-2.0-roadmap.md](../plans/active/0006-client-first-1.0-server-2.0-roadmap.md) |
| CR-20260903-001 | Change request | Add dropdown, local/async autocomplete, and lookup selection that can atomically map one selected record into multiple cells in the same row. | Maintainer request | High | Deferred | Future grid editing / lookup | Deferred change-request details below |

## Accepted Or Planned Changes

| ID | Decision | Target | Plan/Roadmap Link | Notes |
| --- | --- | --- | --- | --- |
| CR-20260808-001 | Track post-plan feedback separately, then promote accepted work into roadmap or active plans. | Project process | [../plans/active/0002-feedback-and-change-control.md](../plans/active/0002-feedback-and-change-control.md) | Prevents original alpha scope and later feedback from being mixed without traceability. |
| CR-20260808-002 | Accept customization and row transaction planning as a follow-up developer API direction, without implementing custom renderers/editors yet. | Developer API/customization | [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md); [../product/ROADMAP.md](../product/ROADMAP.md) | Keeps Tailwind/custom CSS, conditional styling, DTO mapping, and row save flow planned before public API hardening. |
| CR-20260808-003 | Accept optional spreadsheet-style clipboard paste as alpha.2 planning scope, gated by explicit developer opt-in and validation-before-commit behavior. | Clipboard/edit validation | [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md); [../product/ROADMAP.md](../product/ROADMAP.md) | Blank pasted cells should map to empty/null values only where column metadata allows it; invalid values must report row/column/cell location before any commit. |
| ISSUE-20260811-001 through ISSUE-20260811-003 | Correct the accepted header/customization/accessibility gaps during the Alpha 4 grid-shell closure. | Core renderer and Angular adapter | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md) | Treat missing accepted behavior as defects rather than relabeling it as new scope. |
| CR-20260811-001 | Accept a dependency-free modern-enterprise light default theme, comfortable by default with compact and spacious density presets, before Alpha 5 UI work begins. | Default visual system | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md); [../product/ROADMAP.md](../product/ROADMAP.md) | Keep host-owned CSS and per-grid tokens; do not add a runtime design-system dependency. |
| CR-20260811-002 | Accept row numbers, a client status bar, and host/aggregate-backed pinned bottom rows as the Alpha 4 foundation, then add server-aware state in Server 2.0. | Grid shell and summaries | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md); [../plans/active/0006-client-first-1.0-server-2.0-roadmap.md](../plans/active/0006-client-first-1.0-server-2.0-roadmap.md) | Pinned rows remain readonly by default and outside body row counts, shaping, history, and paste. |

## New Issue Details

### ISSUE-20260902-001: Cell editing and editor fit in the Angular demo

Status: New.

Observed on 2026-09-02 in Chrome at `apps/angular-demo/` with the 50,000-row demo.

#### Steps To Reproduce

1. Open the Angular demo.
2. Activate an editable text cell and enter edit mode.
3. Click inside the text editor and attempt to change the value.
4. Compare the editor bounds with the active cell bounds.

#### Actual Behavior

- The cell value cannot be edited reliably.
- The text editor is inset and visibly smaller than the cell.

#### Expected Behavior

- The editor retains focus, accepts text input, and commits the edited value through the existing cell-change flow.
- The editor fills the active cell without an unintended gap while preserving the cell border and focus indication.
- Keyboard entry and pointer-based editing remain supported.

#### Acceptance Criteria

- A text cell in the Angular demo can be edited and committed with the pointer and keyboard.
- Clicking inside an active editor does not move focus back to the grid or interrupt editing.
- The built-in editor's rendered outer bounds fit the active cell at the default density and after column resizing.
- Existing validation, Enter, Tab, Shift+Tab, and Escape behavior remains unchanged.
- Browser regression coverage verifies successful Angular cell editing, editor focus retention, and editor-to-cell sizing.

## Deferred Or Rejected Items

| ID | Status | Reason | Revisit Trigger |
| --- | --- | --- | --- |
| CR-20260903-001 | Deferred | Preserve the requested grid editing and lookup behavior for later planning without adding it to the current milestone. | A future grid-editing milestone is approved for lookup, autocomplete, and multi-cell mapped commits. |

### CR-20260903-001: Dropdown, autocomplete, and lookup mapping

Status: Deferred.

Requested on 2026-09-03 for a future grid-editing and lookup milestone. This request is recorded for later planning and does not change the current roadmap or implementation scope.

#### Requested Behavior

- Provide dropdown editors with typed options, including boolean choices such as `true` and `false`.
- Provide autocomplete editors backed by either local options or an asynchronous/API data source.
- Let each column require selection from the available options or allow free-text input.
- Keep a lookup option's stored value separate from its displayed label and retain the selected record as mapping input.
- Support declarative mapping from a lookup cell to multiple target columns in the same logical row. For example, selecting a record in `A2` can populate mapped values in `B2`, `C2`, and `Z2`.
- Validate the source and every mapped target before committing. If any value fails validation, return structured cell-level errors and leave all source and target cells unchanged.
- Commit a successful lookup selection as one atomic history entry while emitting the typed cell-change events for every changed cell. One undo or redo action must reverse or reapply the complete mapped change.
- Let each lookup column choose whether clearing the source also clears mapped targets or preserves them. The default is to clear all mapped targets atomically.
- Reject invalid lookup configurations, including unknown target columns, duplicate mappings, stable key targets, and readonly targets.
- Treat option labels and values returned by local or remote sources as untrusted data. Display labels as text and do not interpret them as HTML or executable content.

#### Public API Direction For Later Planning

- Define typed lookup and autocomplete editor options for local and asynchronous sources.
- Give asynchronous lookup requests the search query and an `AbortSignal`; expose loading and error states and ignore stale responses.
- Define a typed selected-record mapping from source fields to target column IDs.
- Return structured lookup commit results and validation errors through Core, with equivalent Angular inputs and outputs delegated to the same Core behavior.

#### Acceptance Criteria

- A dropdown configured with `true` and `false` commits a boolean value rather than a string.
- Strict autocomplete rejects a value outside its option set, while free-text mode accepts it.
- Asynchronous autocomplete reports loading and errors, supports cancellation, and cannot apply a stale response over a newer query.
- Selecting a lookup record in `A2` updates `A2`, `B2`, `C2`, and `Z2` together according to the configured mapping.
- If any mapped target fails validation, no affected cell changes and the result identifies each failing cell and message.
- A successful mapped selection produces one history entry, and one undo or redo action applies to the complete change set.
- Clearing a lookup follows the source column's configured clear policy; the default clears all mapped targets in the same atomic commit.
- Lookup behavior continues to work with keyboard navigation, virtualized rows, hidden target columns, and the Angular adapter.

#### Scope Boundary

- Mapping is limited to cells in the same logical row. Cross-row lookup updates are not part of this change request.
- This deferred request does not authorize source-code, test, roadmap, active-plan, or project-state changes until it is triaged into a future milestone.
