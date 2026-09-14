import type { CellChangeEvent } from "@thefoolspath/gethen-protocol";

export type GridHistoryKind = "cell-edit" | "row-transaction" | "paste";

export interface GridHistoryOptions {
  readonly maxEntries?: number;
  readonly maxRetainedBytes?: number;
}

export interface GridHistoryEntry<TChange = unknown> {
  readonly kind: GridHistoryKind;
  readonly changes: readonly TChange[];
  readonly retainedBytes?: number;
  readonly label?: string;
}

export interface GridHistoryEvent<TChange = unknown> {
  readonly direction: "record" | "undo" | "redo" | "clear" | "evict";
  readonly entry?: GridHistoryEntry<TChange>;
  readonly inverseChanges?: readonly TChange[];
  readonly undoCount: number;
  readonly redoCount: number;
  readonly retainedBytes: number;
}

export interface GridHistorySnapshot {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undoCount: number;
  readonly redoCount: number;
  readonly retainedBytes: number;
}

export type GridHistoryListener<TChange> = (event: GridHistoryEvent<TChange>) => void;

interface RetainedEntry<TChange> {
  readonly entry: GridHistoryEntry<TChange>;
  readonly bytes: number;
}

export class GridHistory<TChange = CellChangeEvent> {
  readonly #maxEntries: number;
  readonly #maxRetainedBytes: number;
  readonly #listeners = new Set<GridHistoryListener<TChange>>();
  readonly #undo: RetainedEntry<TChange>[] = [];
  readonly #redo: RetainedEntry<TChange>[] = [];
  #retainedBytes = 0;

  constructor(options: GridHistoryOptions = {}) {
    this.#maxEntries = requirePositiveInteger(options.maxEntries ?? 100, "maxEntries");
    this.#maxRetainedBytes = requirePositiveInteger(
      options.maxRetainedBytes ?? 4 * 1024 * 1024,
      "maxRetainedBytes"
    );
  }

  get snapshot(): GridHistorySnapshot {
    return {
      canUndo: this.#undo.length > 0,
      canRedo: this.#redo.length > 0,
      undoCount: this.#undo.length,
      redoCount: this.#redo.length,
      retainedBytes: this.#retainedBytes
    };
  }

  subscribe(listener: GridHistoryListener<TChange>): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  record(entry: GridHistoryEntry<TChange>): boolean {
    if (entry.changes.length === 0) {
      return false;
    }

    const bytes = entry.retainedBytes ?? estimateRetainedBytes(entry);
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      throw new Error("History retainedBytes must be a non-negative safe integer.");
    }

    this.clearStack(this.#redo);
    if (bytes > this.#maxRetainedBytes) {
      this.emit("evict", entry);
      return false;
    }

    this.#undo.push({ entry, bytes });
    this.#retainedBytes += bytes;
    this.evictToBounds();
    this.emit("record", entry);
    return true;
  }

  undo(invert: (change: TChange) => TChange): readonly TChange[] {
    const retained = this.#undo.pop();
    if (!retained) {
      return [];
    }

    const inverseChanges = [...retained.entry.changes].reverse().map(invert);
    this.#redo.push(retained);
    this.emit("undo", retained.entry, inverseChanges);
    return inverseChanges;
  }

  redo(): readonly TChange[] {
    const retained = this.#redo.pop();
    if (!retained) {
      return [];
    }

    this.#undo.push(retained);
    this.emit("redo", retained.entry, retained.entry.changes);
    return retained.entry.changes;
  }

  clear(): void {
    this.#undo.length = 0;
    this.#redo.length = 0;
    this.#retainedBytes = 0;
    this.emit("clear");
  }

  private evictToBounds(): void {
    while (this.#undo.length > this.#maxEntries || this.#retainedBytes > this.#maxRetainedBytes) {
      const evicted = this.#undo.shift();
      if (!evicted) {
        break;
      }
      this.#retainedBytes -= evicted.bytes;
      this.emit("evict", evicted.entry);
    }
  }

  private clearStack(stack: RetainedEntry<TChange>[]): void {
    for (const retained of stack) {
      this.#retainedBytes -= retained.bytes;
    }
    stack.length = 0;
  }

  private emit(
    direction: GridHistoryEvent<TChange>["direction"],
    entry?: GridHistoryEntry<TChange>,
    inverseChanges?: readonly TChange[]
  ): void {
    const event: GridHistoryEvent<TChange> = {
      direction,
      ...(entry ? { entry } : {}),
      ...(inverseChanges ? { inverseChanges } : {}),
      undoCount: this.#undo.length,
      redoCount: this.#redo.length,
      retainedBytes: this.#retainedBytes
    };
    for (const listener of this.#listeners) {
      listener(event);
    }
  }
}

export function createGridHistory<TChange = CellChangeEvent>(
  options?: GridHistoryOptions
): GridHistory<TChange> {
  return new GridHistory(options);
}

export function invertCellChange(change: CellChangeEvent): CellChangeEvent {
  return { ...change, oldValue: change.newValue, newValue: change.oldValue };
}

function estimateRetainedBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function requirePositiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer.`);
  }
  return value;
}
