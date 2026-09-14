# Renderer Prototype

Dependency-free virtualized DOM prototype for the pre-alpha renderer research gate.

Run `pnpm demo`, then open `http://127.0.0.1:4173/apps/renderer-prototype/`.
The source is split across `index.html`, `styles.css`, and `src/prototype.ts`.
The prototype generates `100,000` logical rows by `50` logical columns, renders only the visible cells plus overscan, and reports basic render counters on screen.

This is research code, not production package code.
