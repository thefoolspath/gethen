import { describe, expect, it, vi } from "vitest";

import {
  createGridEditorStateMachine,
  parseBuiltInEditorValue,
  resolveBuiltInEditor
} from "./grid-editing.js";

describe("GridEditorStateMachine", () => {
  it("runs activate, edit, validate, commit, and inactive transitions", () => {
    const editor = createGridEditorStateMachine();
    const listener = vi.fn();
    editor.subscribe(listener);

    editor.activate({ rowId: "r1", columnId: "price", initialValue: 10 });
    editor.updateDraft(12);
    editor.beginValidation();
    editor.beginCommit();

    expect(editor.committed()).toEqual({ phase: "inactive", exitReason: "commit" });
    expect(listener.mock.calls.map(([snapshot]) => snapshot.phase)).toEqual([
      "activating",
      "editing",
      "editing",
      "validating",
      "committing",
      "committing",
      "inactive"
    ]);
  });

  it("keeps failed validation editable and supports cancellation", () => {
    const editor = createGridEditorStateMachine();
    editor.activate({ rowId: "r1", columnId: "price", initialValue: 10 });
    editor.beginValidation();

    expect(editor.validationFailed({ valid: false, message: "Too large", code: "max" })).toMatchObject({
      phase: "failed",
      error: { message: "Too large", code: "max" }
    });
    expect(editor.updateDraft(11)).toMatchObject({ phase: "editing", draftValue: 11 });
    editor.beginCancel();
    expect(editor.cancelled()).toEqual({ phase: "inactive", exitReason: "cancel" });
  });

  it("models scroll suspension and unmount without committing", () => {
    const editor = createGridEditorStateMachine();
    editor.activate({ rowId: "r1", columnId: "name", initialValue: "Ada" });
    expect(editor.suspendForScroll().phase).toBe("suspended");
    expect(editor.resumeAfterScroll().phase).toBe("editing");
    expect(editor.unmount()).toEqual({ phase: "disposed", exitReason: "unmount" });
  });

  it("rejects invalid transitions", () => {
    const editor = createGridEditorStateMachine();
    expect(() => editor.beginCommit()).toThrow(/Invalid editor transition/);
  });
});

describe("built-in editor semantics", () => {
  it("parses nullable, number, boolean, date, datetime, select, and JSON values", () => {
    expect(parseBuiltInEditorValue("", { kind: "text" }, true)).toEqual({ value: null });
    expect(parseBuiltInEditorValue("42.5", { kind: "number" }, false)).toEqual({ value: 42.5 });
    expect(parseBuiltInEditorValue(true, { kind: "boolean" }, false)).toEqual({ value: true });
    expect(parseBuiltInEditorValue("2026-08-10", { kind: "date" }, false)).toEqual({
      value: "2026-08-10"
    });
    expect(parseBuiltInEditorValue("2026-08-10T09:30", { kind: "datetime" }, false)).toEqual({
      value: "2026-08-10T09:30"
    });
    expect(parseBuiltInEditorValue("open", {
      kind: "select",
      options: [{ value: "open", label: "Open" }]
    }, false)).toEqual({ value: "open" });
    expect(parseBuiltInEditorValue('{"safe":true}', { kind: "json" }, false)).toEqual({
      value: '{"safe":true}'
    });
  });

  it("returns explainable failures without executing JSON", () => {
    expect(parseBuiltInEditorValue("Infinity", { kind: "number" }, false)).toHaveProperty("error");
    expect(parseBuiltInEditorValue("2026/08/10", { kind: "date" }, false)).toHaveProperty("error");
    expect(parseBuiltInEditorValue("{oops", { kind: "json" }, false)).toHaveProperty("error");
  });

  it("resolves defaults from protocol data types", () => {
    expect(resolveBuiltInEditor({ id: "n", title: "N", dataType: "number" })).toEqual({
      kind: "number"
    });
    expect(resolveBuiltInEditor({ id: "t", title: "T", dataType: "text" })).toEqual({
      kind: "text"
    });
  });
});
