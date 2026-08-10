import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("node", ["benchmarks/typescript-reference/reference-operations.mjs"]);
run("node", ["benchmarks/typescript-reference/core-engine-operations.mjs"]);
run("node", ["benchmarks/typescript-reference/alpha2-customization-clipboard.mjs"]);
run("node", ["benchmarks/renderer-prototype/measure-renderers.mjs"]);
run("node", ["benchmarks/renderer-prototype/measure-alpha2-customization.mjs"]);
run("node", ["benchmarks/renderer-prototype/measure-alpha2-frame-trace.mjs"]);

const cargoArgs =
  process.platform === "win32"
    ? [
        "+stable-x86_64-pc-windows-gnu",
        "run",
        "--manifest-path",
        "crates/gethen-engine/Cargo.toml",
        "--release"
      ]
    : ["run", "--manifest-path", "crates/gethen-engine/Cargo.toml", "--release"];

run("cargo", cargoArgs);
