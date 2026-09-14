import { createHash } from "node:crypto";

import { executeGridEngineShapeRequest } from "../../packages/core/dist/contracts/engine-contract.js";
import { createAlpha4MixedTypeFixture } from "./alpha4-mixed-type-fixtures.mjs";

export const ALPHA4_PARITY_SCENARIOS = Object.freeze([
  Object.freeze({
    name: "mixed-filter-sort",
    definition: Object.freeze({
      filter: Object.freeze([
        Object.freeze({ columnId: "number-00", operator: "greaterThan", value: -2_500, comparisonType: "number" }),
        Object.freeze({ columnId: "text-00", operator: "contains", value: "a", comparisonType: "text" }),
        Object.freeze({ columnId: "boolean-00", operator: "equals", value: true, comparisonType: "boolean" }),
        Object.freeze({ columnId: "date-00", operator: "greaterThanOrEqual", value: "2021-01-01", comparisonType: "date" }),
        Object.freeze({ columnId: "json-00", operator: "isNotNull", comparisonType: "json" })
      ]),
      sort: Object.freeze([
        Object.freeze({ columnId: "json-00", direction: "asc", comparisonType: "json", nulls: "last" }),
        Object.freeze({ columnId: "date-01", direction: "desc", comparisonType: "date", nulls: "last" }),
        Object.freeze({ columnId: "number-01", direction: "desc", comparisonType: "number", nulls: "last" })
      ]),
      group: Object.freeze([]),
      aggregate: Object.freeze([]),
      expandedGroupIds: "all"
    })
  }),
  Object.freeze({
    name: "group-aggregate",
    definition: Object.freeze({
      filter: Object.freeze([
        Object.freeze({ columnId: "number-02", operator: "greaterThan", value: -7_500, comparisonType: "number" })
      ]),
      sort: Object.freeze([
        Object.freeze({ columnId: "number-03", direction: "asc", comparisonType: "number", nulls: "last" })
      ]),
      group: Object.freeze([
        Object.freeze({ columnId: "boolean-01", comparisonType: "boolean" }),
        Object.freeze({ columnId: "text-02", comparisonType: "text" })
      ]),
      aggregate: Object.freeze([
        Object.freeze({ id: "rowCount", operation: "count" }),
        Object.freeze({ id: "valueCount", operation: "count", columnId: "number-04" }),
        Object.freeze({ id: "valueSum", operation: "sum", columnId: "number-04" }),
        Object.freeze({ id: "valueMin", operation: "min", columnId: "number-04" }),
        Object.freeze({ id: "valueMax", operation: "max", columnId: "number-04" }),
        Object.freeze({ id: "valueAverage", operation: "average", columnId: "number-04" })
      ]),
      expandedGroupIds: "all"
    })
  }),
  Object.freeze({
    name: "null-ordering",
    definition: Object.freeze({
      filter: Object.freeze([
        Object.freeze({ columnId: "number-05", operator: "isNull", comparisonType: "number" })
      ]),
      sort: Object.freeze([
        Object.freeze({ columnId: "date-05", direction: "asc", comparisonType: "date", nulls: "last" }),
        Object.freeze({ columnId: "json-03", direction: "desc", comparisonType: "json", nulls: "last" }),
        Object.freeze({ columnId: "number-06", direction: "desc", comparisonType: "number", nulls: "first" })
      ]),
      group: Object.freeze([]),
      aggregate: Object.freeze([]),
      expandedGroupIds: "all"
    })
  })
]);

export function createAlpha4ParityOracle(profileName = "small", options = {}) {
  const fixture = createAlpha4MixedTypeFixture(profileName, options);
  const mode = options.mode ?? (profileName === "small" ? "full" : "compact");
  if (mode !== "full" && mode !== "compact") {
    throw new Error("Alpha 4 parity oracle mode must be 'full' or 'compact'.");
  }
  const scenarios = ALPHA4_PARITY_SCENARIOS.map((scenario, scenarioIndex) => {
    const definition = mode === "compact" && scenario.name === "group-aggregate"
      ? { ...scenario.definition, expandedGroupIds: [], viewport: { start: 0, count: 100 } }
      : scenario.definition;
    if (mode === "compact" && scenario.name !== "group-aggregate") return undefined;
    const result = executeGridEngineShapeRequest({
      type: "shape",
      requestId: `oracle-${profileName}-${scenarioIndex + 1}`,
      data: fixture.data,
      definition
    });
    const summary = summarizeResult(result);
    return {
      name: scenario.name,
      definition,
      digest: digestJson(result),
      summary,
      ...(mode === "full" ? { result } : {})
    };
  }).filter(Boolean);
  return {
    profile: fixture.profile,
    seed: fixture.seed,
    mode,
    scenarios,
    digest: digestJson(scenarios.map(({ name, definition, digest, summary }) => ({
      name,
      definition,
      digest,
      summary
    })))
  };
}

function summarizeResult(result) {
  return {
    sourceRowCount: result.sourceRowCount,
    filteredRowCount: result.filteredRowCount,
    totalViewRowCount: result.totalViewRowCount,
    returnedRowCount: result.rows.length,
    sourceRows: result.rows.filter((row) => row.kind === "source").length,
    groupRows: result.rows.filter((row) => row.kind === "group").length,
    returnedRowsDigest: digestJson(result.rows.map((row) => row.kind === "group"
      ? {
          id: row.id,
          kind: row.kind,
          cells: row.cells,
          childCount: row.childCount,
          expanded: row.expanded,
          provenance: {
            ...row.provenance,
            sourceRowIds: undefined,
            sourceRowIdCount: row.provenance.sourceRowIds.length,
            sourceRowIdsDigest: digestStrings(row.provenance.sourceRowIds)
          }
        }
      : row))
  };
}

function digestJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function digestStrings(values) {
  const hash = createHash("sha256");
  for (const value of values) hash.update(value).update("\0");
  return hash.digest("hex");
}
