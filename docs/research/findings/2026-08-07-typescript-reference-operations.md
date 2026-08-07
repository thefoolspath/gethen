# TypeScript Reference Operations Preliminary Benchmark

Date: 2026-08-07.

Status: Preliminary single local run. This is not accepted architecture decision evidence by itself.

## Source

- Benchmark script: `../../../benchmarks/typescript-reference/reference-operations.mjs`
- Command: `node benchmarks/typescript-reference/reference-operations.mjs`

## Environment

- OS: Windows `10.0.26200`
- CPU: `12th Gen Intel(R) Core(TM) i5-12500H`
- Logical cores: `16`
- Memory: `16785268736` bytes
- Node: `v24.4.1`

## Dataset

- Rows: `100,000`
- Columns: `20`
- Row identity field: `id`

## Results

| Operation | Median | P75 | Min | Max |
| --- | ---: | ---: | ---: | ---: |
| row access every 100th row | `0.0434 ms` | `0.0495 ms` | `0.0412 ms` | `0.0644 ms` |
| cell lookup numeric column | `2.8668 ms` | `3.3447 ms` | `2.4276 ms` | `4.3821 ms` |
| immutable single-cell update | `0.2435 ms` | `0.2471 ms` | `0.2225 ms` | `0.3970 ms` |
| filter numeric threshold count | `4.6119 ms` | `5.0480 ms` | `3.6860 ms` | `6.6965 ms` |
| sort numeric copy | `6.2389 ms` | `6.5700 ms` | `3.8801 ms` | `7.4560 ms` |

## Limitations

- Plain Node JavaScript benchmark before TypeScript package tooling exists.
- Single process microbenchmark; browser and UI-thread behavior are not measured.
- Single local run; repeat runs are required before this can support an ADR.
