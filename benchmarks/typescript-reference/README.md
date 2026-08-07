# TypeScript Reference Operations Benchmark

Status: initial dependency-free Node benchmark.

This benchmark approximates the TypeScript reference engine operations before package tooling exists. The script is plain JavaScript so it can run with Node without adding dependencies, but it keeps the data shapes and operations close to the planned TypeScript baseline.

## Command

```powershell
node benchmarks/typescript-reference/reference-operations.mjs
```

## Operations

- row access by stable index
- cell lookup by column key
- immutable single-cell update
- representative filter count
- representative numeric sort copy

## Dataset

- Rows: `100,000`
- Columns: `20`
- Row identity field: `id`

## Result Handling

Copy the emitted JSON into a dated report once benchmark results are ready to become decision evidence. Do not treat a single run as accepted evidence; use multiple runs and compare variability.
