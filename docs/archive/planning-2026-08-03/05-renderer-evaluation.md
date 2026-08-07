# Renderer Evaluation

## Recommendation

Use hybrid Canvas 2D plus DOM overlays for `0.0.0-alpha.1`, behind a pluggable renderer interface. Do not choose WebGL for alpha. Do not require OffscreenCanvas in alpha.

## Option Comparison

| Option | Strengths | Weaknesses | Alpha verdict |
| --- | --- | --- | --- |
| Canvas 2D + DOM overlay | Low DOM count, predictable drawing, good for dense cells, simple text/background/grid lines | Accessibility must be built separately, text measurement quirks, custom focus model | Choose for alpha |
| Virtualized DOM | Native accessibility, easier styling, simpler editors | Many cells still stress layout/style at high column counts, harder to guarantee no per-cell DOM at large scale | Keep as fallback/revisit path |
| Pluggable renderer | Preserves optionality, makes evidence-based replacement possible | Adds contract design work | Required |
| OffscreenCanvas | Can move draw work off main thread; transferable object and worker-capable per MDN | Browser support details vary, text/accessibility still not solved, coordination complexity | Prototype after alpha renderer works |
| WebGL | Can handle huge primitive batches | Text rendering complexity, bigger bundle/learning cost, accessibility unchanged | Defer unless Canvas cannot meet measured targets |

## Canvas Architecture

Canvas draws:

- visible cell backgrounds
- text
- grid lines
- header backgrounds
- active/selected cell visuals

DOM overlays provide:

- active editor input
- hidden or visually minimal accessibility grid representation
- tooltips
- focus target
- live region announcements
- future menus/dropdowns

## Accessibility Consequence

Canvas content is pixels, not semantic cells. Alpha must implement keyboard operation and a limited accessibility layer, but should not claim WCAG/ARIA compliance until tested with assistive technology. WAI-ARIA APG describes grid as a composite widget with managed focus, arrow navigation, row/cell roles, row/column counts, indexes, labels, selected state, and readonly state. Gethen must design around those semantics from day one.

## Revisit Conditions

Replace Canvas with DOM if:

- Canvas cannot meet screen-reader requirements without duplicating too much DOM.
- DOM virtualization meets target scroll and render budgets for 1,000,000 logical rows and 100 columns.
- Text rendering fidelity and browser zoom issues become unacceptable.

Adopt OffscreenCanvas if:

- main-thread Canvas drawing regularly exceeds frame budgets after data work is moved to Worker.
- browser compatibility for target users is acceptable.
- worker rendering does not complicate input/editor synchronization too much.

Adopt WebGL only if:

- Canvas 2D misses render budgets by a large margin on realistic datasets.
- text rendering strategy is solved.
- bundle size and maintenance cost are justified.
