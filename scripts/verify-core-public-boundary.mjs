import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicIndex = readFileSync(join(root, "packages", "core", "src", "index.ts"), "utf8");
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
  "getGridColumnarTransferables"
];

for (const symbol of forbiddenRootExports) {
  if (new RegExp(`\\b${symbol}\\b`, "u").test(publicIndex)) {
    throw new Error(`Core public root leaks internal symbol: ${symbol}`);
  }
}

for (const supportedEntryPoint of [
  "TypeScriptWorkerGridEngine",
  "createTypeScriptWorkerGridEngine",
  "createRustWasmWorkerGridEngine"
]) {
  if (!new RegExp(`\\b${supportedEntryPoint}\\b`, "u").test(publicIndex)) {
    throw new Error(`Core public root is missing supported entry point: ${supportedEntryPoint}`);
  }
}

if (JSON.stringify(Object.keys(manifest.exports ?? {})) !== JSON.stringify(["."])) {
  throw new Error("Core package exports must expose only the supported root entry point during Alpha.");
}

console.log("Core public package boundary verified.");
