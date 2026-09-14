import type { VirtualDomGridTheme } from "./grid-customization.js";

const interfaceFont = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const sharedTheme = {
  density: "comfortable",
  cellPadding: "7px 10px",
  fontFamily: interfaceFont,
  fontSize: "13px",
  headerHeight: "38px",
  rowHeight: "34px",
  rowNumberWidth: "48px",
  statusHeight: "32px"
} as const satisfies Partial<VirtualDomGridTheme>;

export const gethenLightTheme: Readonly<VirtualDomGridTheme> = Object.freeze({
  ...sharedTheme,
  background: "#FFFFFF",
  textColor: "#102019",
  gridLineColor: "#C6DDD2",
  headerBackground: "#E8F5EF",
  headerTextColor: "#102019",
  rowNumberBackground: "#E8F5EF",
  rowNumberTextColor: "#52665D",
  pinnedRowBackground: "#D8F5E8",
  statusBackground: "#E8F5EF",
  statusTextColor: "#52665D",
  activeCellBorder: "#087F5B",
  activeCellBackground: "#D8F5E8",
  selectionBackground: "#D8F5E8",
  readonlyTextColor: "#52665D",
  invalidColor: "#B42318",
  editorFocusColor: "#6848D8"
});

export const gethenDarkTheme: Readonly<VirtualDomGridTheme> = Object.freeze({
  ...sharedTheme,
  background: "#0D1512",
  textColor: "#F5F7F6",
  gridLineColor: "#2A4037",
  headerBackground: "#14201B",
  headerTextColor: "#F5F7F6",
  rowNumberBackground: "#14201B",
  rowNumberTextColor: "#8D9994",
  pinnedRowBackground: "#12392B",
  statusBackground: "#14201B",
  statusTextColor: "#8D9994",
  activeCellBorder: "#18D98B",
  activeCellBackground: "#12392B",
  selectionBackground: "#12392B",
  readonlyTextColor: "#8D9994",
  invalidColor: "#FF8090",
  editorFocusColor: "#A7F3D0"
});
