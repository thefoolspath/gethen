export const protocolVersion = "v1" as const;

const columnIdSchema = {
  type: "string",
  minLength: 1
} as const;

const rowIdSchema = {
  type: "string",
  minLength: 1
} as const;

const cellValueSchema = {
  anyOf: [
    { type: "string" },
    { type: "number" },
    { type: "boolean" },
    { type: "null" }
  ]
} as const;

const sortRuleSchema = {
  type: "object",
  additionalProperties: false,
  required: ["columnId", "direction"],
  properties: {
    columnId: columnIdSchema,
    direction: {
      enum: ["asc", "desc"]
    }
  }
} as const;

const filterRuleSchema = {
  type: "object",
  additionalProperties: false,
  required: ["columnId", "operator", "value"],
  properties: {
    columnId: columnIdSchema,
    operator: {
      enum: ["equals", "contains", "greaterThan", "lessThan"]
    },
    value: cellValueSchema
  }
} as const;

const cellUpdateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["rowId", "columnId", "oldValue", "newValue"],
  properties: {
    rowId: rowIdSchema,
    columnId: columnIdSchema,
    oldValue: cellValueSchema,
    newValue: cellValueSchema
  }
} as const;

export const getRowsRequestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://gethen.dev/schemas/protocol/v1/get-rows-request.schema.json",
  title: "GetRowsRequest",
  type: "object",
  additionalProperties: false,
  required: ["protocolVersion", "startRow", "rowCount", "sort", "filter"],
  properties: {
    protocolVersion: {
      const: protocolVersion
    },
    startRow: {
      type: "integer",
      minimum: 0
    },
    rowCount: {
      type: "integer",
      minimum: 1,
      maximum: 1000
    },
    sort: {
      type: "array",
      items: sortRuleSchema
    },
    filter: {
      type: "array",
      items: filterRuleSchema
    }
  }
} as const;

export const getRowsResultSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://gethen.dev/schemas/protocol/v1/get-rows-result.schema.json",
  title: "GetRowsResult",
  type: "object",
  additionalProperties: false,
  required: ["protocolVersion", "rows", "totalRowCount"],
  properties: {
    protocolVersion: {
      const: protocolVersion
    },
    rows: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "cells"],
        additionalProperties: false,
        properties: {
          id: rowIdSchema,
          cells: {
            type: "object",
            additionalProperties: cellValueSchema
          }
        }
      }
    },
    totalRowCount: {
      type: "integer",
      minimum: 0
    }
  }
} as const;

export const cellUpdateRequestSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://gethen.dev/schemas/protocol/v1/cell-update-request.schema.json",
  title: "CellUpdateRequest",
  type: "object",
  additionalProperties: false,
  required: ["protocolVersion", "changes"],
  properties: {
    protocolVersion: {
      const: protocolVersion
    },
    changes: {
      type: "array",
      minItems: 1,
      items: cellUpdateSchema
    }
  }
} as const;

export const updateCellsResultSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://gethen.dev/schemas/protocol/v1/update-cells-result.schema.json",
  title: "UpdateCellsResult",
  type: "object",
  additionalProperties: false,
  required: ["protocolVersion", "accepted"],
  properties: {
    protocolVersion: {
      const: protocolVersion
    },
    accepted: {
      type: "boolean"
    },
    rejectedChanges: {
      type: "array",
      items: cellUpdateSchema
    }
  }
} as const;

export const protocolErrorSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://gethen.dev/schemas/protocol/v1/protocol-error.schema.json",
  title: "ProtocolError",
  type: "object",
  additionalProperties: false,
  required: ["protocolVersion", "code", "message"],
  properties: {
    protocolVersion: {
      const: protocolVersion
    },
    code: {
      type: "string",
      minLength: 1
    },
    message: {
      type: "string",
      minLength: 1
    },
    retryable: {
      type: "boolean"
    }
  }
} as const;
