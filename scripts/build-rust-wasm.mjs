import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const result = spawnSync("cargo", [
  "build",
  "--manifest-path",
  "crates/gethen-engine/Cargo.toml",
  "--lib",
  "--release",
  "--target",
  "wasm32-unknown-unknown"
], { cwd: root, stdio: "inherit", shell: false });

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const source = resolve(root, "crates/gethen-engine/target/wasm32-unknown-unknown/release/gethen_engine.wasm");
const destination = resolve(
  root,
  "packages/core/dist/engine/rust-wasm-worker/gethen_engine.wasm"
);
mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
