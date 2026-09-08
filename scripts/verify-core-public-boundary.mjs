import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicIndex = readFileSync(join(root, "packages", "core", "src", "index.ts"), "utf8");
const productionEngine = readFileSync(join(root, "packages", "core", "src", "engine", "grid-worker-engine.ts"), "utf8");
const manifest = JSON.parse(readFileSync(join(root, "packages", "core", "package.json"), "utf8"));
const forbiddenRootExports = [
  "RustWasmKernelExports",
  "RustWasmKernels",
  "loadRustWasmKernels",
  "RustWasmWorkerEngine",
  "createRustWasmWorkerEngine",
  "RustWasmWorkerRequest",
  "RustWasmWorkerResponse",
  "GridEngineWorkerRequest",
  "GridEngineWorkerResponse",
  "decodeGridColumnarBuffer",
  "executeGridEngineShapeRequest",
  "getGridColumnarTransferables",
  "TypeScriptWorkerGridEngine",
  "createTypeScriptWorkerGridEngine",
  "createRustWasmWorkerGridEngine"
];

for (const symbol of forbiddenRootExports) {
  if (new RegExp(`\\b${symbol}\\b`, "u").test(publicIndex)) {
    throw new Error(`Core public root leaks internal symbol: ${symbol}`);
  }
}

for (const supportedEntryPoint of ["GridWorkerEngine", "createGridWorkerEngine"]) {
  if (!new RegExp(`\\b${supportedEntryPoint}\\b`, "u").test(publicIndex)) {
    throw new Error(`Core public root is missing supported entry point: ${supportedEntryPoint}`);
  }
}

if (!/TypeScriptWorkerGridEngine/u.test(productionEngine) || /rust-wasm/u.test(productionEngine)) {
  throw new Error("The production Grid Worker factory must resolve only to the selected TypeScript Worker engine.");
}

if (JSON.stringify(Object.keys(manifest.exports ?? {})) !== JSON.stringify(["."])) {
  throw new Error("Core package exports must expose only the supported root entry point during Alpha.");
}

for (const requiredExclusion of [
  "!dist/engine/rust-wasm-worker/**",
  "!dist/engine/typescript-worker/typescript-kernel-worker.*"
]) {
  if (!manifest.files?.includes(requiredExclusion)) {
    throw new Error(`Core package files must exclude the non-production engine asset: ${requiredExclusion}`);
  }
}

console.log("Core public package boundary verified.");
