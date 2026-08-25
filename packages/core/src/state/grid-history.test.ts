import { describe, expect, it, vi } from "vitest";

import { createGridHistory, invertCellChange } from "./grid-history.js";

const change = {
  rowId: "r1",
  columnId: "name",
  oldValue: "Ada",
  newValue: "Grace"
} as const;

describe("GridHistory", () => {
  it("creates inverse cell events for undo and original events for redo", () => {
    const history = createGridHistory();
    history.record({ kind: "cell-edit", changes: [change] });

    expect(history.undo(invertCellChange)).toEqual([{
      rowId: "r1",
      columnId: "name",
      oldValue: "Grace",
      newValue: "Ada"
    }]);
    expect(history.redo()).toEqual([change]);
    expect(history.snapshot).toMatchObject({ canUndo: true, canRedo: false });
  });

  it("bounds retained entries by count", () => {
    const history = createGridHistory({ maxEntries: 2, maxRetainedBytes: 10_000 });
    history.record({ kind: "cell-edit", changes: [{ ...change, newValue: "1" }] });
    history.record({ kind: "cell-edit", changes: [{ ...change, newValue: "2" }] });
    history.record({ kind: "cell-edit", changes: [{ ...change, newValue: "3" }] });

    expect(history.snapshot.undoCount).toBe(2);
    expect(history.undo(invertCellChange)[0]).toMatchObject({ oldValue: "3" });
    expect(history.undo(invertCellChange)[0]).toMatchObject({ oldValue: "2" });
    expect(history.undo(invertCellChange)).toEqual([]);
  });

  it("rejects an entry larger than the byte budget", () => {
    const history = createGridHistory({ maxEntries: 10, maxRetainedBytes: 20 });
    const listener = vi.fn();
    history.subscribe(listener);

    expect(history.record({ kind: "paste", changes: [change] })).toBe(false);
    expect(history.snapshot.retainedBytes).toBe(0);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ direction: "evict" }));
  });

  it("clears redo when a new event is recorded", () => {
    const history = createGridHistory();
    history.record({ kind: "cell-edit", changes: [change] });
    history.undo(invertCellChange);
    history.record({ kind: "paste", changes: [{ ...change, newValue: "Katherine" }] });
    expect(history.snapshot.canRedo).toBe(false);
  });
});
