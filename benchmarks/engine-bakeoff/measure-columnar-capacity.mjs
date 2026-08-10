import { performance } from "node:perf_hooks";

import { executeGridEngineShapeRequest } from "../../packages/core/dist/grid-engine-contract.js";

const rowCount = 1_000_000;
const columnCount = 50;
const columns = Array.from({ length: columnCount }, (_, columnIndex) => {
  const values = new Float64Array(rowCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    values[rowIndex] = (rowIndex * (columnIndex + 3)) % 1_000_003;
  }
  return {
    columnId: `c${columnIndex}`,
    storage: "float64",
    values,
    validity: new Uint8Array(rowCount).fill(1)
  };
});
const data = {
  rowCount,
  rowIds: Array.from({ length: rowCount }, (_, index) => `r${index}`),
  columns
};
const started = performance.now();
const result = executeGridEngineShapeRequest({
  type: "shape",
  requestId: "capacity",
  data,
  definition: {
    filter: [{ columnId: "c0", operator: "greaterThan", value: 500_000, comparisonType: "number" }],
    sort: [{ columnId: "c1", direction: "desc", comparisonType: "number" }],
    group: [],
    aggregate: [],
    expandedGroupIds: "all",
    viewport: { start: 0, count: 100 }
  }
});

console.log(JSON.stringify({
  status: "Alpha 4 columnar capacity diagnostic; not full engine-selection evidence",
  dataset: { rowCount, columnCount, storage: "50 numeric columns with validity masks" },
  result: { filteredRowCount: result.filteredRowCount, viewportRowCount: result.rows.length },
  elapsedMs: performance.now() - started,
  memory: process.memoryUsage(),
  limitation: "Run inside the worker boundary and add the accepted mixed-type/group/formula/pivot fixture before selecting an engine."
}, null, 2));
