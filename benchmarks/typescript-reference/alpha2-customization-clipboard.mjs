import os from "node:os";
import { performance } from "node:perf_hooks";

import {
  prepareGridPaste,
  resolveGridClassNames
} from "../../packages/core/dist/index.js";

const rowCount = 1000;
const columnCount = 10;
const rows = Array.from({ length: rowCount }, (_, rowIndex) => ({
  id: `row-${rowIndex}`,
  cells: Object.fromEntries(
    Array.from({ length: columnCount }, (_, columnIndex) => [
      `c${columnIndex}`,
      columnIndex % 2 === 0 ? rowIndex * (columnIndex + 1) : `R${rowIndex} C${columnIndex}`
    ])
  )
}));
const columns = Array.from({ length: columnCount }, (_, columnIndex) => ({
  id: `c${columnIndex}`,
  title: `Column ${columnIndex}`,
  dataType: columnIndex % 2 === 0 ? "number" : "text",
  align: columnIndex % 2 === 0 ? "right" : "left"
}));
const visibleRows = rows.slice(0, 50);
const pasteText = Array.from({ length: 100 }, (_, rowIndex) =>
  Array.from({ length: columnCount }, (_, columnIndex) =>
    columnIndex % 2 === 0 ? String(rowIndex * (columnIndex + 1)) : `value-${rowIndex}-${columnIndex}`
  ).join("\t")
).join("\n");

function measure(name, operation) {
  for (let iteration = 0; iteration < 5; iteration += 1) {
    operation();
  }

  const samplesMs = [];

  for (let iteration = 0; iteration < 20; iteration += 1) {
    const started = performance.now();
    operation();
    samplesMs.push(performance.now() - started);
  }

  const ordered = [...samplesMs].sort((left, right) => left - right);
  return {
    name,
    warmupIterations: 5,
    measuredIterations: samplesMs.length,
    medianMs: percentile(ordered, 0.5),
    p75Ms: percentile(ordered, 0.75),
    minMs: round(ordered[0]),
    maxMs: round(ordered.at(-1)),
    samplesMs: samplesMs.map(round)
  };
}

function percentile(ordered, fraction) {
  return round(ordered[Math.floor((ordered.length - 1) * fraction)]);
}

function round(value) {
  return Number(value.toFixed(4));
}

const benchmarks = [
  measure("visible_cells_without_customization", () => {
    for (const row of visibleRows) {
      for (const column of columns) {
        String(row.cells[column.id] ?? "");
      }
    }
  }),
  measure("visible_cells_with_classes_and_formatters", () => {
    visibleRows.forEach((row, rowIndex) => {
      const rowClass = rowIndex % 2 === 0 ? "alternate-row" : undefined;

      columns.forEach((column) => {
        const value = row.cells[column.id];
        const cellClass = typeof value === "number" && value < 0 ? "negative" : undefined;
        resolveGridClassNames(column.align === "right" ? "tabular-nums" : undefined, rowClass, cellClass);
        typeof value === "number" ? value.toLocaleString("en-US") : String(value ?? "");
      });
    });
  }),
  measure("clipboard_prepare_100x10_default_parsing", () => {
    prepareGridPaste({
      text: pasteText,
      startRowIndex: 0,
      startColumnIndex: 0,
      rows,
      columns
    });
  }),
  measure("clipboard_prepare_100x10_with_validation", () => {
    prepareGridPaste({
      text: pasteText,
      startRowIndex: 0,
      startColumnIndex: 0,
      rows,
      columns,
      clipboard: {
        validatePasteCell: ({ value }) =>
          typeof value === "number" && value < 0
            ? { valid: false, message: "Must not be negative." }
            : { valid: true }
      }
    });
  })
];

console.log(JSON.stringify({
  status: "repeat-iteration local Alpha 2 baseline; not release decision evidence",
  generatedAt: new Date().toISOString(),
  environment: {
    platform: process.platform,
    release: os.release(),
    arch: process.arch,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCores: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    node: process.version
  },
  dataset: {
    rendererSimulation: { rowCount: visibleRows.length, columnCount },
    clipboard: { rowCount: 100, columnCount }
  },
  benchmarks,
  limitations: [
    "Measures JavaScript callback, formatting, parsing, and validation cost without DOM layout or paint.",
    "Single local process with repeated warm-up and measured iterations.",
    "Browser traces remain required before accepting renderer performance claims."
  ]
}, null, 2));
