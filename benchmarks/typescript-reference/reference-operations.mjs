import os from "node:os";
import { performance } from "node:perf_hooks";

const rowCount = 100000;
const columnCount = 20;
const warmupIterations = 5;
const measuredIterations = 15;

function createRows() {
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const row = {
      id: `row-${rowIndex + 1}`,
    };

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      row[`c${columnIndex}`] =
        columnIndex % 4 === 0 ? rowIndex * (columnIndex + 1) : `R${rowIndex + 1} C${columnIndex + 1}`;
    }

    return row;
  });
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
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
    samplesMs: samplesMs.map((sample) => Number(sample.toFixed(4))),
  };
}

const rows = createRows();
const middleRowIndex = Math.floor(rowCount / 2);

const benchmarks = [
  measure("row_access_every_100th", () => {
    let checksum = 0;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 100) {
      checksum += rows[rowIndex].id.length;
    }

    return checksum;
  }),
  measure("cell_lookup_numeric_column", () => {
    let checksum = 0;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      checksum += rows[rowIndex].c4;
    }

    return checksum;
  }),
  measure("immutable_single_cell_update", () => {
    const nextRows = rows.slice();
    nextRows[middleRowIndex] = {
      ...nextRows[middleRowIndex],
      c1: "updated",
    };

    return nextRows[middleRowIndex].c1.length;
  }),
  measure("filter_numeric_threshold_count", () => {
    let count = 0;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      if (rows[rowIndex].c8 > 500000) {
        count += 1;
      }
    }

    return count;
  }),
  measure("sort_numeric_copy", () => {
    const sortedRows = rows.slice().sort((left, right) => right.c12 - left.c12);
    return sortedRows[0].c12;
  }),
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
    node: process.version,
  },
  dataset: {
    rowCount,
    columnCount,
    rowIdentityField: "id",
  },
  benchmarks,
  limitations: [
    "Plain Node JavaScript benchmark before TypeScript package tooling exists.",
    "Single process microbenchmark; browser and UI-thread behavior are not measured.",
    "A single run is not sufficient for architecture acceptance.",
  ],
};

console.log(JSON.stringify(report, null, 2));
