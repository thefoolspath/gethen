import { describe, expect, it } from "vitest";

import { createClientDataSource } from "./client-data-source.js";

const rows = [
  { key: "a", name: "Ada", score: 41, active: true },
  { key: "b", name: "Grace", score: 39, active: false },
  { key: "c", name: "Katherine", score: 45, active: true }
];

describe("ClientDataSource", () => {
  it("extracts stable row IDs and retrieves ranges", async () => {
    const dataSource = createClientDataSource({
      rows,
      getRowId: (row) => String(row.key)
    });

    await expect(
      dataSource.getRows({
        protocolVersion: "v1",
        startRow: 1,
        rowCount: 2,
        sort: [],
        filter: []
      })
    ).resolves.toEqual({
      protocolVersion: "v1",
      totalRowCount: 3,
      rows: [
        {
          id: "b",
          cells: rows[1]
        },
        {
          id: "c",
          cells: rows[2]
        }
      ]
    });
  });

  it("applies cell updates and reflects them in later ranges", async () => {
    const dataSource = createClientDataSource({
      rows,
      getRowId: (row) => String(row.key)
    });

    await expect(
      dataSource.updateCells([
        {
          rowId: "a",
          columnId: "score",
          oldValue: 41,
          newValue: 42
        }
      ])
    ).resolves.toEqual({
      protocolVersion: "v1",
      accepted: true,
      rejectedChanges: []
    });

    const result = await dataSource.getRows({
      protocolVersion: "v1",
      startRow: 0,
      rowCount: 1,
      sort: [],
      filter: []
    });

    expect(result.rows[0]?.cells.score).toBe(42);
  });

  it("rejects stale cell updates without mutating the row", async () => {
    const dataSource = createClientDataSource({
      rows,
      getRowId: (row) => String(row.key)
    });

    await expect(
      dataSource.updateCells([
        {
          rowId: "a",
          columnId: "score",
          oldValue: 0,
          newValue: 42
        }
      ])
    ).resolves.toMatchObject({
      protocolVersion: "v1",
      accepted: false
    });

    const result = await dataSource.getRows({
      protocolVersion: "v1",
      startRow: 0,
      rowCount: 1,
      sort: [],
      filter: []
    });

    expect(result.rows[0]?.cells.score).toBe(41);
  });

  it("rejects duplicate row IDs", () => {
    expect(() =>
      createClientDataSource({
        rows,
        getRowId: () => "duplicate"
      })
    ).toThrow(/Duplicate rowId/);
  });
});
