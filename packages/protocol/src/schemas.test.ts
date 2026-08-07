import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import {
  cellUpdateRequestSchema,
  getRowsRequestSchema,
  getRowsResultSchema,
  protocolErrorSchema,
  updateCellsResultSchema
} from "./schemas.js";

const ajv = new Ajv2020({ allErrors: true });

describe("protocol schemas", () => {
  it("validates a get rows request", () => {
    const validate = ajv.compile(getRowsRequestSchema);

    expect(
      validate({
        protocolVersion: "v1",
        startRow: 0,
        rowCount: 100,
        sort: [{ columnId: "name", direction: "asc" }],
        filter: [{ columnId: "active", operator: "equals", value: true }]
      })
    ).toBe(true);
  });

  it("rejects unbounded get rows requests", () => {
    const validate = ajv.compile(getRowsRequestSchema);

    expect(
      validate({
        protocolVersion: "v1",
        startRow: 0,
        rowCount: 1001
      })
    ).toBe(false);
  });

  it("validates a get rows result", () => {
    const validate = ajv.compile(getRowsResultSchema);

    expect(
      validate({
        protocolVersion: "v1",
        totalRowCount: 1,
        rows: [
          {
            id: "row-1",
            cells: {
              name: "Ada",
              active: true,
              score: 42,
              notes: null
            }
          }
        ]
      })
    ).toBe(true);
  });

  it("validates a cell update request and result", () => {
    const validateRequest = ajv.compile(cellUpdateRequestSchema);
    const validateResult = ajv.compile(updateCellsResultSchema);

    const change = {
      rowId: "row-1",
      columnId: "score",
      oldValue: 41,
      newValue: 42
    };

    expect(validateRequest({ protocolVersion: "v1", changes: [change] })).toBe(true);
    expect(validateResult({ protocolVersion: "v1", accepted: true })).toBe(true);
  });

  it("validates structured protocol errors", () => {
    const validate = ajv.compile(protocolErrorSchema);

    expect(
      validate({
        protocolVersion: "v1",
        code: "PAGE_SIZE_TOO_LARGE",
        message: "Requested rowCount exceeds the configured page limit.",
        retryable: false
      })
    ).toBe(true);
  });
});
