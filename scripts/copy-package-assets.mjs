import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const [, , sourceDirectory, outputDirectory, ...extensions] = process.argv;

if (!sourceDirectory || !outputDirectory || extensions.length === 0) {
  throw new Error("Usage: node scripts/copy-package-assets.mjs <src> <dist> <extension...>");
}

const sourceRoot = resolve(sourceDirectory);
const outputRoot = resolve(outputDirectory);

if (!existsSync(sourceRoot)) {
  throw new Error(`Source directory does not exist: ${sourceRoot}`);
}

mkdirSync(outputRoot, { recursive: true });

for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
  if (!entry.isFile()) {
    continue;
  }

  if (extensions.some((extension) => entry.name.endsWith(`.${extension}`))) {
    copyFileSync(join(sourceRoot, entry.name), join(outputRoot, entry.name));
  }
}
