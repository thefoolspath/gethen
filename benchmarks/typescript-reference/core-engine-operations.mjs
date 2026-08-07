import os from "node:os";
import { performance } from "node:perf_hooks";

import { createClientGridEngine } from "../../packages/core/dist/index.js";

const rowCount = 100000;
const columnCount = 20;
const warmupIterations = 5;
const measuredIterations = 15;

const columns = Array.from({ length: columnCount }, (_, columnIndex) => ({
  id: `c${columnIndex}`,
  title: `Column ${columnIndex + 1}`,
  dataType: columnIndex % 4 === 0 ? "number" : "text"
}));

const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
  const cells = {};

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    cells[`c${columnIndex}`] =
      columnIndex % 4 === 0 ? rowIndex * (columnIndex + 1) : `R${rowIndex + 1} C${columnIndex + 1}`;
  }

  return {
    id: `row-${rowIndex + 1}`,
    cells
  };
});

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function timeOperation(operation) {
  const started = performance.now();
  const result = operation();
  const elapsedMs = performance.now() - started;

  if (result === Number.MIN_SAFE_INTEGER) {
    throw new Error("Unexpected benchmark sentinel.");
  }

  return elapsedMs;
}

function measure(name, operation) {
  for (let iteration = 0; iteration < warmupIterations; iteration += 1) {
    operation();
  }

  const samplesMs = [];

  for (let iteration = 0; iteration < measuredIterations; iteration += 1) {
    samplesMs.push(timeOperation(operation));
  }

  return {
    name,
    warmupIterations,
    measuredIterations,
    medianMs: Number(median(samplesMs).toFixed(4)),
    p75Ms: Number(percentile(samplesMs, 75).toFixed(4)),
    minMs: Number(Math.min(...samplesMs).toFixed(4)),
    maxMs: Number(Math.max(...samplesMs).toFixed(4)),
    samplesMs: samplesMs.map((sample) => Number(sample.toFixed(4)))
  };
}

const engine = createClientGridEngine({ columns, rows });

const benchmarks = [
  measure("core_get_row_every_100th", () => {
    let checksum = 0;

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 100) {
      checksum += engine.getRow(rowIndex).id.length;
    }

    return checksum;
  }),
  measure("core_get_cell_numeric_column", () => {
    let checksum = 0;

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      checksum += engine.getCell(`row-${rowIndex + 1}`, "c4");
    }

    return checksum;
  }),
  measure("core_selection_update", () => {
    let checksum = 0;

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1000) {
      const selection = engine.selectCell(`row-${rowIndex + 1}`, "c1");
      checksum += selection.rowId.length;
    }

    return checksum;
  }),
  measure("core_edit_commit", () => {
    const rowId = "row-50001";
    const oldValue = engine.getCell(rowId, "c1");
    engine.startEdit(rowId, "c1");
    engine.updateDraftValue(`${oldValue} updated`);
    const change = engine.commitEdit();

    if (change) {
      engine.applyCellUpdate({
        rowId,
        columnId: "c1",
        oldValue: change.newValue,
        newValue: oldValue
      });
    }

    return change?.newValue.toString().length ?? 0;
  })
];

const report = {
  status: "single local run; not accepted decision evidence",
  generatedAt: new Date().toISOString(),
  environment: {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    node: process.version
  },
  dataset: {
    rowCount,
    columnCount,
    rowIdentityField: "id"
  },
  benchmarks,
  limitations: [
    "Uses the built TypeScript core package before renderer/DataSource integration exists.",
    "Single process microbenchmark; browser and UI-thread behavior are not measured.",
    "A single run is not sufficient for architecture acceptance."
  ]
};

console.log(JSON.stringify(report, null, 2));
