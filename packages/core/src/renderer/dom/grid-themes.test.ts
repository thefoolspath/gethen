import { describe, expect, it } from "vitest";

import type { VirtualDomGridTheme } from "./grid-customization.js";
import { gethenDarkTheme, gethenLightTheme } from "./grid-themes.js";

const themeKeys = [
  "density",
  "background",
  "textColor",
  "gridLineColor",
  "headerBackground",
  "headerTextColor",
  "rowNumberBackground",
  "rowNumberTextColor",
  "pinnedRowBackground",
  "statusBackground",
  "statusTextColor",
  "activeCellBorder",
  "activeCellBackground",
  "selectionBackground",
  "readonlyTextColor",
  "invalidColor",
  "editorFocusColor",
  "cellPadding",
  "fontFamily",
  "fontSize",
  "headerHeight",
  "rowHeight",
  "rowNumberWidth",
  "statusHeight"
] as const satisfies readonly (keyof VirtualDomGridTheme)[];

describe("official Gethen grid themes", () => {
  it.each([
    ["light", gethenLightTheme],
    ["dark", gethenDarkTheme]
  ] as const)("provides a complete readonly %s preset", (_name, theme) => {
    expect(Object.keys(theme).sort()).toEqual([...themeKeys].sort());
    expect(Object.values(theme).every((value) => value !== undefined && value !== "")).toBe(true);
    expect(Object.isFrozen(theme)).toBe(true);
  });

  it("supports object-spread overrides without mutating the preset", () => {
    const customized: VirtualDomGridTheme = {
      ...gethenDarkTheme,
      activeCellBorder: "#ff5a5f"
    };

    expect(customized.activeCellBorder).toBe("#ff5a5f");
    expect(gethenDarkTheme.activeCellBorder).toBe("#18D98B");
  });

  it("keeps the accepted Emerald Light and Emerald Dark mappings", () => {
    expect(gethenLightTheme).toMatchObject({
      background: "#FFFFFF",
      textColor: "#102019",
      headerBackground: "#E8F5EF",
      selectionBackground: "#D8F5E8",
      activeCellBorder: "#087F5B",
      editorFocusColor: "#6848D8"
    });
    expect(gethenDarkTheme).toMatchObject({
      background: "#0D1512",
      textColor: "#F5F7F6",
      headerBackground: "#14201B",
      selectionBackground: "#12392B",
      activeCellBorder: "#18D98B",
      editorFocusColor: "#A7F3D0"
    });
  });

  it.each([
    ["light", gethenLightTheme],
    ["dark", gethenDarkTheme]
  ] as const)("meets the accepted contrast thresholds for the %s preset", (_name, theme) => {
    expect(contrast(theme.textColor!, theme.background!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.headerTextColor!, theme.headerBackground!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.statusTextColor!, theme.statusBackground!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.readonlyTextColor!, theme.background!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.invalidColor!, theme.background!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.activeCellBorder!, theme.activeCellBackground!)).toBeGreaterThanOrEqual(3);
    expect(contrast(theme.editorFocusColor!, theme.background!)).toBeGreaterThanOrEqual(3);
  });
});

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
