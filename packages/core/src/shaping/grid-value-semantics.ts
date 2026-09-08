import type { CellValue } from "@thefoolspath/gethen-protocol";

import type { GridColumnarBuffer, GridColumnarColumn } from "../contracts/engine-contract.js";
import type { GridComparisonType } from "./grid-data-shaping.js";

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

export function resolveGridColumnarColumn(
  buffer: GridColumnarBuffer,
  columnId: string
): GridColumnarColumn {
  return buffer.columns.find((column) => column.columnId === columnId) ?? {
    columnId,
    storage: "float64",
    values: new Float64Array(buffer.rowCount),
    validity: new Uint8Array(buffer.rowCount)
  };
}

export function readGridColumnarValue(
  column: GridColumnarColumn,
  rowIndex: number
): CellValue {
  if (column.validity[rowIndex] === 0) return null;
  if (column.storage === "float64") return column.values[rowIndex]!;
  if (column.storage === "boolean") return column.values[rowIndex] === 1;
  return UTF8_DECODER.decode(
    column.bytes.subarray(column.offsets[rowIndex]!, column.offsets[rowIndex + 1]!)
  );
}

export function stableGridValueKey(value: CellValue, type: GridComparisonType): string {
  if (value === null) return "null";
  return `${type}:${type === "json" ? canonicalGridJson(String(value)) : String(value)}`;
}

export function rawGridValueKey(value: CellValue): string {
  return `${value === null ? "null" : typeof value}:${String(value)}`;
}

export function canonicalGridJson(value: string): string {
  try {
    return JSON.stringify(sortJson(JSON.parse(value)));
  } catch {
    return `!invalid:${value}`;
  }
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right, "en"))
        .map(([key, entry]) => [key, sortJson(entry)])
    );
  }
  return value;
}
