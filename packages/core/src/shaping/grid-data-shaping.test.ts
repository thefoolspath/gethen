import { describe, expect, it } from "vitest";

import {
  aggregateGridRows,
  compareGridValues,
  shapeGridData,
  stableMultiSort
} from "./grid-data-shaping.js";
import type { GridRow } from "./client-grid-engine.js";

const rows: readonly GridRow[] = [
  { id: "r1", cells: { team: "B", score: 10, name: "Ada", active: true, note: null } },
  { id: "r2", cells: { team: "A", score: 20, name: "Grace", active: false, note: "x" } },
  { id: "r3", cells: { team: "A", score: 20, name: "Linus", active: true, note: null } },
  { id: "r4", cells: { team: "B", score: 5, name: "Margaret", active: false, note: "y" } }
];

describe("grid data shaping", () => {
  it("runs filter then stable multi-sort then viewport", () => {
    const result = shapeGridData({
      rows,
      filter: [{ columnId: "score", operator: "greaterThan", value: 5, comparisonType: "number" }],
      sort: [
        { columnId: "score", direction: "desc", comparisonType: "number" },
        { columnId: "team", direction: "asc" }
      ],
      viewport: { start: 1, count: 2 }
    });
    expect(result).toMatchObject({ sourceRowCount: 4, filteredRowCount: 3, totalViewRowCount: 3 });
    expect(result.rows.map((row) => row.id)).toEqual(["r3", "r1"]);
    expect(result.rows.every((row) => row.kind === "source" && !row.readonly)).toBe(true);
  });

  it("preserves source order when sort keys compare equally", () => {
    expect(stableMultiSort(rows, [{ columnId: "score", direction: "desc", comparisonType: "number" }])
      .map((row) => row.id)).toEqual(["r2", "r3", "r1", "r4"]);
  });

  it("keeps null placement independent from direction", () => {
    expect(stableMultiSort(rows, [{ columnId: "note", direction: "desc", nulls: "last" }])
      .map((row) => row.id)).toEqual(["r4", "r2", "r1", "r3"]);
  });

  it("creates readonly typed group rows with stable identity and provenance", () => {
    const first = shapeGridData({
      rows,
      group: [{ columnId: "team" }],
      aggregate: [
        { id: "rowCount", operation: "count" },
        { id: "scoreSum", operation: "sum", columnId: "score" },
        { id: "scoreAverage", operation: "average", columnId: "score" }
      ]
    });
    const second = shapeGridData({ rows, group: [{ columnId: "team" }] });
    const group = first.rows[0];
    expect(group).toMatchObject({
      kind: "group",
      readonly: true,
      expanded: true,
      childCount: 2,
      cells: { team: "B", rowCount: 2, scoreSum: 15, scoreAverage: 7.5 },
      provenance: { level: 0, columnId: "team", sourceRowIds: ["r1", "r4"] }
    });
    expect(group?.id).toBe(second.rows[0]?.id);
  });

  it("collapses groups and applies viewport after flattening", () => {
    const expanded = shapeGridData({ rows, group: [{ columnId: "team" }] });
    const firstGroupId = expanded.rows[0]!.id;
    const collapsed = shapeGridData({
      rows,
      group: [{ columnId: "team" }],
      expandedGroupIds: new Set([firstGroupId]),
      viewport: { start: 0, count: 4 }
    });
    expect(collapsed.totalViewRowCount).toBe(4);
    expect(collapsed.rows.map((row) => row.kind)).toEqual(["group", "source", "source", "group"]);
  });

  it("supports deterministic client-only custom reducers", () => {
    expect(aggregateGridRows(rows, [{
      id: "activeNames",
      operation: "custom",
      reducer: ({ rows: groupRows }) => groupRows
        .filter((row) => row.cells.active)
        .map((row) => row.cells.name)
        .join("|")
    }])).toEqual({ activeNames: "Ada|Linus" });
  });

  it("defines date, JSON, boolean, malformed numeric, and null comparison behavior", () => {
    expect(compareGridValues("2026-01-01", "2025-01-01", "date")).toBeGreaterThan(0);
    expect(compareGridValues('{"b":1,"a":2}', '{"a":2,"b":1}', "json")).toBe(0);
    expect(compareGridValues(false, true, "boolean")).toBeLessThan(0);
    expect(compareGridValues("bad", 2, "number")).toBeGreaterThan(0);
    expect(compareGridValues(null, "value", "text", "first")).toBeLessThan(0);
  });

  it("rejects malformed descriptors", () => {
    expect(() => shapeGridData({
      rows,
      filter: [{ columnId: "team", operator: "in", value: "A" }]
    })).toThrow(/requires an array/);
    expect(() => shapeGridData({
      rows,
      aggregate: [
        { id: "duplicate", operation: "count" },
        { id: "duplicate", operation: "count" }
      ]
    })).toThrow(/unique/);
  });
});
