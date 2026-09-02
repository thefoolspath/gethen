# Corporate Identity And Theme System

Last reviewed: 2026-09-01.

Status: Accepted design direction; implementation has not started.

## Goal

Establish a recognizable Gethen corporate identity across the documentation site and the default Grid theme system while preserving developer-owned customization. The documentation experience may borrow navigation density and developer-documentation patterns from [Aspire](https://aspire.dev/get-started/install-cli/), but Gethen must retain its own colors, meaning, copy, assets, and implementation.

The identity is grounded in the documented project-name concepts:

- Gethen as Winter: cool, restrained, high-contrast surfaces.
- One dataset, every perspective: cyan as the primary signal and violet as a secondary perspective accent.
- Get, then...: interfaces should reveal a clear progression from retrieval to exploration and understanding.

The existing `G` mark remains a temporary logo. Logo redesign, favicon variants, and social artwork are outside this plan.

## Accepted Visual Direction

Use the following semantic palette as the CI baseline:

| Semantic role | Frost Light | Winter Night |
| --- | --- | --- |
| Canvas | `#F7FAFC` | `#0D121B` |
| Surface | `#FFFFFF` | `#151C28` |
| Raised surface | `#EEF3F7` | `#1D2634` |
| Border | `#D6E1E7` | `#314052` |
| Primary text | `#17212B` | `#EDF4F7` |
| Muted text | `#586B78` | `#A7B7C2` |
| Aurora accent | `#087785` | `#62D6E3` |
| Perspective accent | `#6848D8` | `#A797F2` |
| Selection | `#DCEFF2` | `#163A46` |
| Focus | `#6848D8` | `#F2C66D` |
| Error | `#B42318` | `#FF8090` |

Usage rules:

- Aurora cyan is the primary brand color for links, primary actions, active navigation, active cells, and progress.
- Perspective violet is secondary and should identify alternate views, supporting emphasis, or selected metadata without becoming the dominant page background.
- Gold is reserved for focus and attention in Winter Night; it is not a general decorative accent.
- Neutral surfaces must remain cool and blue-based rather than Aspire-like purple-black surfaces.
- Stability, success, warning, error, readonly, and disabled states must not rely on color alone.
- All included text and interactive states must meet WCAG 2.2 AA contrast.

Use the existing dependency-free system sans-serif stack for interface text and the existing system monospace stack for code. Do not add a hosted font, font package, or runtime design-system dependency in this work.

## Documentation Site Work

- Convert `apps/docs-site/styles.css` from repeated literal colors to semantic CI tokens with complete Frost Light and Winter Night mappings.
- Apply the resolved mode through `data-theme="light|dark"` and the CSS `color-scheme` property.
- On first visit, follow `prefers-color-scheme`. After an explicit user toggle, persist `light` or `dark` in local storage and prefer that value on later visits.
- Continue following operating-system theme changes only while the user has no stored preference.
- Prevent an avoidable incorrect-theme flash during initial loading without introducing inline application logic or an external dependency.
- Add an accessible top-bar theme toggle with an explicit accessible name and visible focus state.
- Restyle the top bar, sidebar, page headers, workbench, inspector, code panels, API tokens, stability badges, buttons, links, empty states, and focus states with the shared CI tokens.
- Expand the desktop shell to a left navigation, main content, and sticky `On this page` column. Hide the right column at narrower widths and preserve the existing mobile navigation overlay.
- Give Overview, live example or guide content, relevant API, and known limitations stable section anchors used by the right-side table of contents.
- Add a dependency-free route search dialog opened by the top bar or `Ctrl/Cmd+K`. Search route title, group, and summary; support Arrow keys, Enter, Escape, an empty state, and focus restoration.
- Route selection must reuse the existing clean-path navigation and focus the main content after navigation.
- Keep deterministic fixtures, public-package imports, truthful stability labels, and all existing live-example behavior unchanged.
- Pass stable CSS-variable references to embedded grids so switching the documentation theme does not remount a grid or discard selection, editing, history, layout, or event-log state.

## Grid Theme API

Add the following readonly exports to `@thefoolspath/gethen-core` and expose them through the existing public root entry point:

```ts
export const gethenLightTheme: Readonly<VirtualDomGridTheme>;
export const gethenDarkTheme: Readonly<VirtualDomGridTheme>;
```

The presets must provide complete CI values for existing visual theme fields and may select the existing comfortable density. They must not introduce a theme manager or operating-system listener into Core.

Developer customization remains layered:

```ts
const theme: VirtualDomGridTheme = {
  ...gethenDarkTheme,
  activeCellBorder: "#ff5a5f"
};
```

- Existing partial `VirtualDomGridTheme` objects remain valid.
- Existing `--gethen-*` CSS custom-property overrides remain valid and scoped to the host container.
- Angular continues accepting the resolved object through its existing `theme` input; no `mode` input is added.
- A grid mounted without `theme` keeps its current light appearance and behavior exactly. The new CI presets are explicit opt-in choices, avoiding an unrequested visual change for existing applications.
- The Themes documentation page must demonstrate the light preset, dark preset, object-spread overrides, and direct CSS-variable overrides.

## Corporate Identity Documentation

Create a concise product-facing CI guide that records:

- Project-name rationale and the Winter, perspective, and progression concepts.
- Primitive and semantic color roles for both modes.
- Typography, spacing, corner radius, border, and elevation guidance.
- Interactive states for hover, active, focus, selection, readonly, disabled, warning, and error.
- Documentation-shell and Grid examples.
- Developer override examples and accessibility constraints.
- A clear statement that literary inspiration does not authorize copying novel artwork, maps, typography, characters, or publisher assets.

Update `docs/product/CUSTOMIZATION.md`, the documentation-site plan, the grid-shell visual plan, and `docs/project/PROJECT_STATE.md` whenever the implementation changes public theme behavior or verified status.

## Research And Tool Boundary

- Prefer repository source inspection, read-only web fetch, and static color/contrast calculation for CI research and verification.
- Browser, Chrome, Computer Use, headed browser automation, and headless browser rendering require explicit user approval before every use, even when the user supplied the URL and the action would be read-only.
- Supplying a URL is source context, not permission to control or launch a browser.
- User-provided screenshots may be analyzed without controlling a browser.
- Repository browser tests, including headless Playwright commands, also require a new explicit approval immediately before they are run. A general implementation or verification request does not count as that approval.

## Test And Quality Gates

Automated verification must cover:

- Public light and dark preset exports and their complete token mappings.
- Object-spread overrides and continued CSS-variable override behavior.
- Unchanged no-theme Grid defaults.
- WCAG 2.2 AA contrast for primary text, muted text, links, controls, selection, focus, error, readonly, and disabled states in both modes.
- System theme selection, persisted preference precedence, theme-toggle persistence, and reload behavior.
- Documentation shell and embedded Grid changing together without replacing the mounted Grid element.
- `Ctrl/Cmd+K` search, keyboard result navigation, route selection, empty state, Escape, and focus restoration.
- Right-side table-of-contents anchors, current navigation state, and narrow-viewport navigation.
- All existing documentation routes and live examples remaining functional.

Manual visual review, when explicitly authorized, should cover 1440 x 900 and 390 x 844 in both modes, including selection, editing, readonly, invalid, code-panel, and navigation states.

Run the repository's verified checks after implementation:

```text
pnpm run check
pnpm run build
pnpm run test
pnpm run test:browser
pnpm run bench
```

## Out Of Scope

- A replacement logo or wordmark.
- Favicon, social-preview, marketing illustration, or novel-derived visual assets.
- Package publication, hosting, deployment, analytics, or external release work.
- A new theme package or runtime styling dependency.
- Full-text documentation indexing, remote search, or a CMS.
- Automatic system-theme behavior inside the framework-neutral Grid engine.

## Definition Of Done

- Frost Light and Winter Night are implemented from one documented semantic system.
- The documentation site has accessible theme switching, route search, hierarchical navigation, and an `On this page` column.
- Official light and dark Grid presets are public, typed, documented, and developer-overridable.
- Existing unthemed grids retain their current default appearance.
- CI contrast and interaction tests pass, existing checks remain green, and no unrelated behavior changes are included.
- Repository state and relevant plans accurately distinguish implemented work from the accepted design direction.
