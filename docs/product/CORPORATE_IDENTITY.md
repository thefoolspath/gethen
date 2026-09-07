# Gethen Corporate Identity

Last reviewed: 2026-09-07.

Status: Implemented locally for the documentation shell and explicit Grid theme presets. The temporary `G` mark remains in use; logo replacement and public marketing assets are separate work.

Visual reference: [Emerald Intelligence Brand Style Guide](assets/emerald-intelligence-brand-style-guide.png). This repository copy is reference material, not a runtime documentation-site asset.

## Identity

Gethen's interface direction is **Calm. Modern. Intelligent.** It connects four product ideas:

- **Calm:** restrained surfaces, clear hierarchy, and generous space keep dense data approachable.
- **Modern:** crisp geometry, responsive layouts, and focused motion support a contemporary developer tool without decorative noise.
- **Intelligent:** emerald is the core signal, while teal, blue, and violet express the different perspectives that can emerge from one dataset.
- **Get, then...:** navigation and interaction should lead clearly from retrieval to exploration and understanding.

The Emerald Intelligence reference establishes visual direction only. Gethen does not reuse the reference artwork, third-party product names, or reference advertising copy. Literary inspiration likewise does not authorize copying novel artwork, maps, typography, characters, publisher assets, or other protected expression.

## Color System

The canonical brand primitives are Emerald `#18D98B`, Deep Emerald `#087F5B`, Teal `#18C7C8`, Mint `#A7F3D0`, and Soft Violet `#9B7CFF`. The decorative spectrum is `#B8FFD9` at 0%, `#28E59A` at 25%, `#00BFA6` at 50%, `#4B7BEC` at 75%, and `#8B5CF6` at 100%.

Semantic UI roles use accessible values rather than forcing a bright primitive into text:

| Role | Emerald Light | Emerald Dark | Use |
| --- | --- | --- | --- |
| Canvas | `#F4FBF7` | `#070B0A` | Page background |
| Surface | `#FFFFFF` | `#0D1512` | Cards, dialogs, Grid body |
| Raised surface | `#E8F5EF` | `#14201B` | Headers, inspectors, secondary panels |
| Border | `#C6DDD2` | `#2A4037` | Dividers and component outlines |
| Primary text | `#102019` | `#F5F7F6` | Main copy and labels |
| Muted text | `#52665D` | `#8D9994` | Supporting copy and readonly values |
| Primary action | `#087F5B` | `#18D98B` | Links, progress, active navigation, active cells |
| Secondary signal | `#087E7F` | `#18C7C8` | Supporting data emphasis |
| Perspective accent | `#6848D8` | `#9B7CFF` | Alternate views and Preview metadata |
| Selection | `#D8F5E8` | `#12392B` | Selected navigation, cells, and ranges |
| Focus | `#6848D8` | `#A7F3D0` | Keyboard focus |
| Error | `#B42318` | `#FF8090` | Invalid and failed states |

Gradients are focused accents. They may appear on the temporary brand mark, primary calls to action, the introduction hero, and selected feature cards. Tables, navigation content, documentation copy, and Grid work surfaces remain flat and readable. Where a gradient carries text, it uses darker accessible stops; the full bright spectrum is decorative only.

## Typography And Shape

- Interface text uses the dependency-free system sans-serif stack already shipped by the project.
- Code and API tokens use the system monospace stack.
- Comfortable Grid density uses 34 px rows, 38 px headers, 48 px row numbers, and a 32 px status bar.
- Compact interactive controls use 6–8 px corners; cards and workbenches use 10–14 px corners.
- Borders remain one pixel. Elevation and glow are reserved for dialogs, primary workbenches, and focused brand moments.

## Interactive States

- Hover uses a raised emerald-tinted surface and never supplies the only indication of action.
- Active navigation and Grid selection use the selection surface plus an emerald border or marker.
- Focus uses a visible three-pixel violet or mint outline.
- Readonly and disabled states use muted text plus semantic labels or native disabled/readonly behavior.
- Warning and error states include readable copy and must not rely on background color alone.

All included text and component states target WCAG 2.2 AA contrast. Automated contrast checks cover both documentation modes and both public Grid presets. Manual NVDA/Chrome validation remains required before Beta/1.0.

## Documentation Shell

The documentation site uses semantic `--ci-*` tokens with complete Emerald Light and Emerald Dark mappings. Desktop uses one collapsible left sidebar: group icons and labels occupy the same navigation surface when expanded, and the same sidebar becomes icon-only through one collapse control. Mobile uses that sidebar as a drawer. The shell also provides main content, a desktop `On this page` column, and a local route-search dialog opened from the top bar or `Ctrl/Cmd+K`.

The first visit follows the operating-system color scheme. An explicit theme selection is stored locally and takes precedence on later visits. The Grid receives a resolved preset object; Core does not own operating-system theme detection.

## Grid Presets And Overrides

The Core package exports explicit, readonly presets:

```ts
import {
  gethenDarkTheme,
  gethenLightTheme,
  mountVirtualDomGrid
} from "@thefoolspath/gethen-core";

mountVirtualDomGrid(host, {
  columns,
  rows,
  theme: gethenLightTheme
});

const brandedDarkTheme = {
  ...gethenDarkTheme,
  activeCellBorder: "#ff5a5f"
};
```

Existing partial `VirtualDomGridTheme` objects and host-scoped `--gethen-*` CSS properties remain supported. A Grid mounted without `theme` retains the pre-existing light defaults; the official presets are opt-in. Angular continues to accept the resolved object through its existing `theme` input and does not add a mode input.
