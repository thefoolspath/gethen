import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(join(process.cwd(), "apps", "docs-site", "styles.css"), "utf8");

describe("documentation corporate identity", () => {
  it.each(["light", "dark"] as const)("defines a complete %s semantic palette with accessible contrast", (mode) => {
    const tokens = readTokens(mode);
    expect([...tokens.keys()].sort()).toEqual([
      "accent", "action-gradient", "border", "brand-gradient", "canvas", "code", "code-border", "code-muted",
      "code-raised", "code-text", "error", "focus", "highlight", "hover", "muted", "overlay", "preview-bg",
      "primary", "project-bg", "raised", "secondary", "selection", "shadow", "success", "surface", "text",
      "warning", "warning-bg"
    ]);

    for (const [foreground, background, threshold] of [
      ["text", "canvas", 4.5],
      ["text", "surface", 4.5],
      ["muted", "surface", 4.5],
      ["primary", "surface", 4.5],
      ["secondary", "surface", 4.5],
      ["accent", "surface", 4.5],
      ["error", "surface", 4.5],
      ["success", "surface", 4.5],
      ["warning", "warning-bg", 4.5],
      ["accent", "preview-bg", 4.5],
      ["muted", "project-bg", 4.5],
      ["text", "selection", 4.5],
      ["focus", "surface", 3]
    ] as const) {
      expect(contrast(tokens.get(foreground)!, tokens.get(background)!)).toBeGreaterThanOrEqual(threshold);
    }

    expect(tokens.get("brand-gradient")).toBe(
      "linear-gradient(100deg, #b8ffd9 0%, #28e59a 25%, #00bfa6 50%, #4b7bec 75%, #8b5cf6 100%)"
    );
    expect(tokens.get("canvas")).toBe(mode === "light" ? "#f4fbf7" : "#070b0a");
    expect(tokens.get("primary")).toBe(mode === "light" ? "#087f5b" : "#18d98b");
    expect(tokens.get("accent")).toBe(mode === "light" ? "#6848d8" : "#9b7cff");
    for (const stop of tokens.get("action-gradient")!.match(/#[\da-f]{6}/gu) ?? []) {
      expect(contrast("#ffffff", stop)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

function readTokens(mode: "light" | "dark"): Map<string, string> {
  const selector = mode === "light"
    ? /:root,\s*:root\[data-theme="light"\]\s*\{(?<body>[\s\S]*?)\n\}/u
    : /:root\[data-theme="dark"\]\s*\{(?<body>[\s\S]*?)\n\}/u;
  const body = selector.exec(stylesheet)?.groups?.["body"] ?? "";
  return new Map(
    [...body.matchAll(/--ci-([\w-]+):\s*([^;]+);/gu)].map((match) => [match[1]!, match[2]!.trim()])
  );
}

function contrast(foreground: string, background: string): number {
  const light = relativeLuminance(foreground);
  const dark = relativeLuminance(background);
  return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
}

function relativeLuminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/gu)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const [red = 0, green = 0, blue = 0] = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
