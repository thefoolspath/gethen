# Rust Native Benchmark Notes

Status: initial dependency-free Cargo benchmark.

## Command

```powershell
cargo run --manifest-path crates/gethen-engine/Cargo.toml --release
```

## Prototype

- Crate: `../../crates/gethen-engine/`
- Dataset shape: `100,000` logical rows by `20` logical columns
- Dependencies: none

## Operations

- row access by stable index
- numeric cell lookup
- clone single row and update one value
- representative filter count
- representative numeric sort over copied row references

## Current Result

The crate passes with the default MSVC toolchain:

```powershell
cargo check --manifest-path crates/gethen-engine/Cargo.toml
```

The native benchmark runs with the GNU Rust toolchain:

```powershell
cargo +stable-x86_64-pc-windows-gnu run --manifest-path crates/gethen-engine/Cargo.toml --release
```

The default MSVC release execution is blocked on this machine by linker configuration:

```text
LINK : fatal error LNK1104: cannot open file 'msvcrt.lib'
```

No accepted Rust benchmark result exists yet. The GNU run is preliminary single-run evidence only.
