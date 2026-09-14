import { describe, expect, it } from "vitest";

import { parseTabularClipboardText, prepareGridPaste } from "./grid-clipboard.js";
import type { GridColumnView } from "../renderer/dom/grid-customization.js";

const columns: readonly GridColumnView[] = [
  { id: "name", title: "Name", dataType: "text" },
  { id: "score", title: "Score", dataType: "number", nullable: true },
  { id: "active", title: "Active", dataType: "boolean" }
];
const rows = [
  { id: "row-1", cells: { name: "Ada", score: 1, active: true } },
  { id: "row-2", cells: { name: "Grace", score: 2, active: false } }
];

describe("grid clipboard", () => {
  it("parses tabs, mixed newlines, and trailing blank cells", () => {
    expect(parseTabularClipboardText("Ada\t1\t\r\nGrace\t2\tfalse\n")).toEqual([
      ["Ada", "1", ""],
      ["Grace", "2", "false"]
    ]);
  });

  it("prepares typed all-or-nothing changes", () => {
    const result = prepareGridPaste({
      text: "Lovelace\t42\tfalse\nHopper\t\ttrue",
      startRowIndex: 0,
      startColumnIndex: 0,
      rows,
      columns
    });

    expect(result.committed).toBe(true);
    expect(result.changes.map((change) => change.newValue)).toEqual([
      "Lovelace",
      42,
      false,
      "Hopper",
      null,
      true
    ]);
  });

  it("rejects every change when one pasted cell is invalid", () => {
    const result = prepareGridPaste({
      text: "Lovelace\tnot-a-number",
      startRowIndex: 0,
      startColumnIndex: 0,
      rows,
      columns
    });

    expect(result.committed).toBe(false);
    expect(result.changes).toEqual([]);
    expect(result.errors).toEqual([
      expect.objectContaining({
        rowId: "row-1",
        columnId: "score",
        rawValue: "not-a-number",
        message: "The pasted value is not a valid number."
      })
    ]);
  });

  it("rejects a blank required cell while allowing nullable blanks", () => {
    const result = prepareGridPaste({
      text: "\t",
      startRowIndex: 0,
      startColumnIndex: 0,
      rows,
      columns
    });

    expect(result.committed).toBe(false);
    expect(result.changes).toEqual([]);
    expect(result.errors).toEqual([
      expect.objectContaining({
        rowOffset: 0,
        columnOffset: 0,
        columnId: "name",
        rawValue: "",
        message: "A blank value is not allowed for this column."
      })
    ]);
  });

  it("keeps formula-looking clipboard input as inert text", () => {
    const result = prepareGridPaste({
      text: "=1+1",
      startRowIndex: 0,
      startColumnIndex: 0,
      rows,
      columns
    });

    expect(result.changes[0]?.newValue).toBe("=1+1");
  });

  it("supports developer parsing and validation callbacks", () => {
    const result = prepareGridPaste({
      text: "YES",
      startRowIndex: 0,
      startColumnIndex: 2,
      rows,
      columns,
      clipboard: {
        parsePasteCell: ({ rawValue }) => ({ value: rawValue === "YES" }),
        validatePasteCell: ({ value }) =>
          value === true ? { valid: true } : { valid: false, message: "Must be enabled." }
      }
    });

    expect(result.committed).toBe(true);
    expect(result.changes[0]?.newValue).toBe(true);
  });
});
