# Issue And Change Request Log

Last reviewed: 2026-08-11.

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
| CR-20260811-001 | Change request | Research and implement a polished modern-enterprise light default theme with comfortable default density and compact/spacious alternatives. | Maintainer planning feedback and local browser QA | High | Done | Alpha 4 UX closure before Alpha 5 | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md); [../product/ROADMAP.md](../product/ROADMAP.md) |
| CR-20260811-002 | Change request | Add a row-number gutter, client status bar, and readonly pinned bottom/totals rows supplied by the host or derived with existing aggregate helpers; extend the status surface for future server states. | Maintainer planning feedback | High | In progress | Alpha 4 client foundation; Server 2.0 extension | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md); [../plans/active/0006-client-first-1.0-server-2.0-roadmap.md](../plans/active/0006-client-first-1.0-server-2.0-roadmap.md) |

## Accepted Or Planned Changes

| ID | Decision | Target | Plan/Roadmap Link | Notes |
| --- | --- | --- | --- | --- |
| CR-20260808-001 | Track post-plan feedback separately, then promote accepted work into roadmap or active plans. | Project process | [../plans/active/0002-feedback-and-change-control.md](../plans/active/0002-feedback-and-change-control.md) | Prevents original alpha scope and later feedback from being mixed without traceability. |
| CR-20260808-002 | Accept customization and row transaction planning as a follow-up developer API direction, without implementing custom renderers/editors yet. | Developer API/customization | [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md); [../product/ROADMAP.md](../product/ROADMAP.md) | Keeps Tailwind/custom CSS, conditional styling, DTO mapping, and row save flow planned before public API hardening. |
| CR-20260808-003 | Accept optional spreadsheet-style clipboard paste as alpha.2 planning scope, gated by explicit developer opt-in and validation-before-commit behavior. | Clipboard/edit validation | [../plans/completed/0003-developer-customization-and-row-transactions.md](../plans/completed/0003-developer-customization-and-row-transactions.md); [../product/ROADMAP.md](../product/ROADMAP.md) | Blank pasted cells should map to empty/null values only where column metadata allows it; invalid values must report row/column/cell location before any commit. |
| ISSUE-20260811-001 through ISSUE-20260811-003 | Correct the accepted header/customization/accessibility gaps during the Alpha 4 grid-shell closure. | Core renderer and Angular adapter | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md) | Treat missing accepted behavior as defects rather than relabeling it as new scope. |
| CR-20260811-001 | Accept a dependency-free modern-enterprise light default theme, comfortable by default with compact and spacious density presets, before Alpha 5 UI work begins. | Default visual system | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md); [../product/ROADMAP.md](../product/ROADMAP.md) | Keep host-owned CSS and per-grid tokens; do not add a runtime design-system dependency. |
| CR-20260811-002 | Accept row numbers, a client status bar, and host/aggregate-backed pinned bottom rows as the Alpha 4 foundation, then add server-aware state in Server 2.0. | Grid shell and summaries | [../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md](../plans/active/0005-grid-shell-visual-ux-research-and-implementation.md); [../plans/active/0006-client-first-1.0-server-2.0-roadmap.md](../plans/active/0006-client-first-1.0-server-2.0-roadmap.md) | Pinned rows remain readonly by default and outside body row counts, shaping, history, and paste. |

## Deferred Or Rejected Items

| ID | Status | Reason | Revisit Trigger |
| --- | --- | --- | --- |
