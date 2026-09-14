# Canvas Renderer Prototype

Dependency-free Canvas 2D prototype for the pre-alpha renderer research gate.

Run `pnpm demo`, then open `http://127.0.0.1:4173/apps/renderer-canvas-prototype/`.
The source is split across `index.html`, `styles.css`, and `src/prototype.ts`.
The prototype uses the same logical dataset and fixed cell dimensions as `../renderer-prototype/`, but draws visible cells to one `<canvas>` instead of mounting one DOM element per visible cell.

This is research code, not production package code. It exists only to compare renderer tradeoffs before accepting an architecture decision.
