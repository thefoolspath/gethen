# Rust Native Benchmark Blocked

Date: 2026-08-07.

Status: Default MSVC release execution is blocked by local linker configuration. A separate GNU target run now exists in `2026-08-07-rust-native-operations-gnu.md`.

## Source

- Crate: `../../../crates/gethen-engine/`
- Check command: `cargo check --manifest-path crates/gethen-engine/Cargo.toml`
- Run command attempted: `cargo run --manifest-path crates/gethen-engine/Cargo.toml --release`

## Result

`cargo check` completed successfully for the dependency-free Rust benchmark crate.

`cargo run --manifest-path crates/gethen-engine/Cargo.toml --release` failed during linking:

```text
LINK : fatal error LNK1104: cannot open file 'msvcrt.lib'
```

## Interpretation

The Rust source currently type-checks with the default MSVC toolchain, but the MSVC release benchmark cannot be executed on this machine until the C runtime/library path issue is resolved. No MSVC Rust performance comparison should be inferred from this scaffold.

## Next Action

Fix the local Rust/MSVC linker environment or run the benchmark on a machine with a working `x86_64-pc-windows-msvc` linker setup. After that, rerun the MSVC release benchmark and record the measured output.
