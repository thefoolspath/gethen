# Engine Bake-Off Harness

The Alpha 4 checkpoint contains TypeScript Worker and dependency-free Rust/WASM Worker candidates behind the same transferable columnar boundary. The browser suite verifies full-result parity for a mixed numeric/text/boolean fixture.

The A4-01 deterministic mixed-type fixture generator defines three 50-column profiles: `small` (10,000 rows), `fallback` (500,000 rows), and `primary` (1,000,000 rows). Each profile contains numeric, UTF-8 text, boolean, ISO-date, canonical-JSON, and nullable values with stable row IDs and column ordering. Run `node benchmarks/engine-bakeoff/validate-alpha4-mixed-type-fixtures.mjs` to allocate the `small` profile, verify repeatable seeded digests, and inspect all profile metadata. The normal validation does not allocate the 500,000-row or 1,000,000-row profiles.

The A4-02 canonical TypeScript parity oracle runs mixed filter/sort, group/aggregate, and null-ordering scenarios. Run `pnpm run build` followed by `node benchmarks/engine-bakeoff/validate-alpha4-parity-oracle.mjs` to verify repeatable full-result digests for the 10,000-row profile. The oracle supports compact count/aggregate/checksum output for the `fallback` and `primary` profiles, but normal validation records those definitions without allocating them; their end-to-end runs remain part of the later capacity gate.

The A4-04 Rust/WASM checkpoint performs relational and set filtering, normalized UTF-8 contains/starts-with filtering, and stable multi-sort over Rust-owned row masks and indices. TypeScript remains the accepted control layer and normalizes mixed comparison values into deterministic ranks before coarse-grained WASM calls.

The A4-05 checkpoint adds Rust-owned hierarchical group assignment, built-in count/sum/min/max/average aggregation, and expanded/collapsed viewport flatten tokens. TypeScript keeps deterministic mixed-type group-key normalization and hydrates public source/group row objects. Chromium verifies full TypeScript/Rust-WASM parity for the 10,000-row `group-aggregate` fixture (8,840 filtered source rows and 36 synthetic group rows).

Run `node benchmarks/engine-bakeoff/measure-worker-boundary.mjs`. It reports cold startup, buffer-copy cost, and warm median/p75/p95 round-trip timing for a 100,000-row numeric filter/aggregate kernel. Its output is diagnostic evidence, not an engine-selection result; the complete mixed-type 1M/500K workload, memory, bundle, cancellation, formula, and pivot gates remain open.

Run `node --max-old-space-size=2048 benchmarks/engine-bakeoff/measure-columnar-capacity.mjs` after building Core for the 1,000,000-row by 50-column numeric capacity diagnostic. It exercises bounded viewport hydration, but is not a substitute for the Worker and mixed-type gates.

Run `node benchmarks/engine-bakeoff/measure-alpha4-engine-selection.mjs --profile=small` for a bounded harness smoke run. The harness executes the same mixed-type filter/sort/group/aggregate workload in the TypeScript Worker and Rust/WASM Worker, checks deterministic result and progress parity, exercises cancellation, compares representative formula sum-product and pivot-style grouped-sum kernels, samples main-thread animation-frame responsiveness and retained browser heap, and reports candidate-specific asset sizes.

Use `--profile=fallback` for the accepted 500,000-row fallback gate or `--profile=primary` for the 1,000,000-row target. Only the fallback and primary profiles emit engine-selection evidence. The recorded decision rule selects Rust when the measured end-to-end difference is at most 10%; otherwise it selects the faster candidate. This harness launches headless Chromium and therefore requires the explicit approval described by the active Corporate Identity and theme-system plan before every run.
