# Documentation And Demo Site

Last reviewed: 2026-09-01.

Status: Phase 1 Alpha documentation playground implemented and locally verified; Phase 2 and Phase 3 remain milestone-owned future work.

## Goal

Build a Gethen documentation and interactive-demo site with persistent sidebar navigation, similar in purpose to the AG Grid and Angular Material documentation sites. Start with a small development-facing documentation playground, grow it with each release milestone, and defer a polished public marketing site until the client API approaches Beta stability.

The site is part of product verification, not only promotion. It must help maintainers and users learn the public API, exercise completed features in a browser, observe emitted events, and detect packaging or integration regressions.

## Timing Decision

- Start the documentation/demo MVP during the alpha period rather than waiting for every planned feature.
- Document only implemented behavior. Label incomplete Alpha 4 surfaces as experimental and do not present Formula, Pivot, Server DataSource, or other roadmap work as available.
- Keep the initial effort bounded so it does not replace the remaining Alpha 4 engine-selection work.
- Add or update examples as part of the definition of done for later Alpha milestones.
- Defer the full marketing experience, SEO work, versioned documentation, hosted playground, and public launch polish until Beta preparation.

## Design References

- [AG Grid](https://www.ag-grid.com/) separates product demos, documentation, and API material while placing live grid behavior close to the feature explanation.
- [Angular Material](https://material.angular.dev/) organizes component material around overview, API, styling, and examples.

These references inform information architecture only. Gethen must use its own visual identity, content, code, and implementation.

## Initial Site Structure

Use a persistent, keyboard-accessible sidebar and stable URLs for the following initial navigation:

```text
Getting Started
├─ Introduction
├─ Installation
├─ Basic Grid
└─ Angular Setup

Core Features
├─ Virtualization
├─ Selection
├─ Cell Editing
├─ Clipboard
├─ Column Layout
├─ Frozen Panes
└─ Undo / Redo

Customization
├─ Themes
├─ Cell Formatting
├─ Conditional Styling
├─ Custom Renderers
└─ Custom Editors

Data Operations
├─ Client DataSource
├─ Sorting
├─ Filtering
├─ Grouping
└─ Aggregation

Examples
├─ Large Client Dataset
├─ Editable Grid
├─ Readonly Preview
└─ Enterprise-Style Grid

Project
├─ Roadmap
├─ Changelog
└─ Known Limitations
```

`Readonly Preview` must be labelled as a preview until the Alpha 5 read-only interaction boundary is implemented and verified.

## Page Contract

Each feature page should provide, where applicable:

1. A short explanation of the user-visible behavior.
2. A live, resettable example.
3. Minimal copyable source code using the public package API.
4. The relevant options, methods, events, and types.
5. Known limitations and the feature's current stability label.
6. An optional event log for selection, editing, paste, layout, progress, or cancellation behavior.

Examples must import built workspace packages such as `@thefoolspath/gethen-core` and `@thefoolspath/gethen-angular`. They must not bypass the package boundary by importing private source files directly. This makes the site exercise the same package surface expected of consumers.

## Implementation Boundaries

- Create the site as a workspace application under `apps/`; choose the final directory name during implementation and record it in `docs/project/PROJECT_STATE.md`.
- Reuse or extract existing `apps/core-demo/` and `apps/angular-demo/` scenarios where practical rather than maintaining duplicate example logic.
- Preserve the framework-neutral Core boundary. The site may demonstrate Angular, but Core documentation and examples must remain usable without Angular.
- Prefer the existing toolchain and repository-local static server. Any new runtime dependency requires the normal license review and explicit documentation.
- Keep example data deterministic so browser checks and screenshots are reproducible.
- Do not add a CMS, server backend, authentication system, analytics integration, or external publishing workflow to the MVP.
- Do not publish packages or deploy the site without a separately approved release or hosting action.

## Work

### Phase 1 - Alpha Documentation Playground

- [x] Confirm the `apps/docs-site/` application name, clean `/docs/<route>` scheme, and standalone Angular implementation approach.
- [x] Scaffold the workspace application with responsive shell, accessible sidebar, main content region, and not-found state.
- [x] Add Getting Started pages for framework-neutral Core and Angular.
- [x] Add live examples for completed Alpha 1 through Alpha 3 behavior.
- [x] Add implemented Alpha 4 grid-shell and data-shaping examples, with experimental labels where the production engine decision remains open.
- [x] Add copyable code, reset controls, event logs, limitations, and stability labels.
- [x] Reuse shared deterministic demo fixtures instead of copying large row datasets into each page.
- [x] Update root demo-serving behavior and add the documented `pnpm run docs` command.
- [x] Add the application to workspace build and check commands.
- [x] Add browser smoke and interaction coverage for the site.
- [x] Update `docs/project/PROJECT_STATE.md` with implemented structure and verified commands.

### Phase 2 - Milestone-Owned Examples

- [ ] Alpha 5 adds read-only Grid Table, header sorting/filtering, and column-reordering examples when those behaviors are implemented.
- [ ] Alpha 6 adds Formula Engine syntax, dependency, recalculation, and error examples.
- [ ] Alpha 7 adds Pivot and field-builder examples, including cardinality limitations.
- [ ] Beta hardening reviews every example against the frozen public API and removes obsolete experimental labels.

### Phase 3 - Public Documentation Site

- [ ] Establish Gethen-specific visual identity and a polished landing page.
- [ ] Add documentation search, API reference generation, version selection, migration guides, dark mode, responsive navigation, SEO metadata, and social previews as separately scoped work.
- [ ] Decide hosting, custom domain, deployment checks, analytics/privacy boundaries, and release ownership in a dedicated publishing plan.

## Test And Quality Gates

The documentation site is part of the browser verification surface. At minimum, automated coverage must verify:

- Every registered route loads without an uncaught error or missing asset.
- Sidebar keyboard navigation and current-page state work at desktop and narrow viewport sizes.
- Each live grid mounts from the built Angular adapter package and renders visible cells.
- The virtualization example remains populated after deep vertical and horizontal scrolling.
- Editing, selection, clipboard, layout, frozen-pane, undo/redo, and data-shaping examples perform their advertised primary interaction.
- Reset returns an example to deterministic initial state.
- Stability labels and known limitations are present for experimental or incomplete surfaces.
- The site does not materially inflate the distributed Core or Angular package contents.

Manual visual review should cover at least one desktop and one narrow viewport. Accessibility evidence must continue to distinguish automated checks from the deferred manual NVDA/Chrome release gate.

## Definition Of Done For The MVP

- The site is buildable and locally browsable through documented commands.
- The persistent sidebar reaches every initial page through stable URLs.
- Completed Alpha 1 through Alpha 3 capabilities have accurate live examples and copyable public-API code.
- Implemented Alpha 4 examples are truthful about experimental and incomplete boundaries.
- Relevant unit, package, and browser checks pass.
- No unimplemented feature is represented as production-ready.
- No unreviewed runtime dependency, package publication, or deployment is introduced.
