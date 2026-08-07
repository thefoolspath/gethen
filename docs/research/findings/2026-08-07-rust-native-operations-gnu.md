# Rust Native Operations Preliminary Benchmark

Date: 2026-08-07.

Status: Preliminary single local run using the GNU Rust toolchain. This is not accepted architecture decision evidence by itself.

## Source

- Benchmark crate: `../../../crates/gethen-engine/`
- Check command: `cargo +stable-x86_64-pc-windows-gnu check --manifest-path crates/gethen-engine/Cargo.toml`
- Run command: `cargo +stable-x86_64-pc-windows-gnu run --manifest-path crates/gethen-engine/Cargo.toml --release`

## Environment

- Host OS: Windows
- Rust toolchain: `stable-x86_64-pc-windows-gnu`
- Dataset: `100,000` rows by `20` logical columns
- Dependencies: none

## Results

| Operation | Median | P75 | Min | Max |
| --- | ---: | ---: | ---: | ---: |
| row access every 100th row | `0.0004 ms` | `0.0004 ms` | `0.0003 ms` | `0.0131 ms` |
| numeric cell lookup | `0.1331 ms` | `0.1520 ms` | `0.1006 ms` | `0.3435 ms` |
| clone single row update | `0.0001 ms` | `0.0001 ms` | `0.0000 ms` | `0.0002 ms` |
| filter numeric threshold count | `0.0953 ms` | `0.1245 ms` | `0.0888 ms` | `0.1598 ms` |
| sort numeric reference copy | `0.4725 ms` | `0.4851 ms` | `0.4180 ms` | `0.7621 ms` |

## MSVC Target Note

The default `stable-x86_64-pc-windows-msvc` release run still fails locally during linking:

```text
LINK : fatal error LNK1104: cannot open file 'msvcrt.lib'
```

The GNU run is valid native Rust execution, but it is not a replacement for future Windows MSVC release validation if MSVC is intended as a supported development target.

## Limitations

- Single local run; repeat runs are required before this can support an ADR.
- Native Rust only; browser, WASM, Worker, transfer, serialization, startup, and retained memory costs are not measured.
- Rust benchmark operations are representative, not yet parity-tested against a production TypeScript engine.
