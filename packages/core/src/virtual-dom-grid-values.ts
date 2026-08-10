import type { CellValue, GridColumn } from "@thefoolspath/gethen-protocol";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function isTypeToEditKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing;
}

export function coerceValue(value: string | boolean, dataType: GridColumn["dataType"]): CellValue {
  if (dataType === "boolean") {
    return value === true;
  }

  if (dataType === "number") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  return String(value);
}
