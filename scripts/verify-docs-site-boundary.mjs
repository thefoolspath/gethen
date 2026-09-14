import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

const root = process.cwd();
const siteSource = join(root, "apps", "docs-site", "src");
const docsManifest = JSON.parse(readFileSync(join(root, "apps", "docs-site", "package.json"), "utf8"));
const sourceFiles = readdirSync(siteSource, { withFileTypes: true })
  .filter((entry) => entry.isFile() && extname(entry.name) === ".ts")
  .map((entry) => join(siteSource, entry.name));

const sourceTextByFile = new Map();

for (const file of sourceFiles) {
  const source = readFileSync(file, "utf8");
  sourceTextByFile.set(file, source);
  const privatePackageImport = /(?:from\s+|import\s*)["'][^"']*(?:packages\/[^/]+\/src|packages\\[^\\]+\\src)[^"']*["']/u;
  if (privatePackageImport.test(source)) {
    throw new Error(`Documentation site bypasses a public package boundary: ${file}`);
  }
}

for (const dependency of [
  "@angular/core",
  "@angular/platform-browser",
  "@thefoolspath/gethen-angular",
  "@thefoolspath/gethen-core",
  "@thefoolspath/gethen-protocol"
]) {
  if (!docsManifest.dependencies?.[dependency]) {
    throw new Error(`Documentation site is missing required public dependency: ${dependency}`);
  }
}

const combinedSource = [...sourceTextByFile.values()].join("\n");
for (const publicImport of [
  "@thefoolspath/gethen-angular",
  "@thefoolspath/gethen-core",
  "@thefoolspath/gethen-protocol"
]) {
  if (!combinedSource.includes(`"${publicImport}"`)) {
    throw new Error(`Documentation site does not import public package entry point: ${publicImport}`);
  }
}

for (const packagePath of ["packages/core/package.json", "packages/gethen-angular/package.json"]) {
  const manifest = JSON.parse(readFileSync(join(root, packagePath), "utf8"));
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  if (!files.includes("dist") || files.some((entry) => String(entry).includes("apps/docs-site"))) {
    throw new Error(`Documentation assets may leak into distributed package contents: ${packagePath}`);
  }
}

console.log("Documentation site package boundaries verified.");
