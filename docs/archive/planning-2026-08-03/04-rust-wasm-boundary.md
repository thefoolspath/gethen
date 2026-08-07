# Rust/WASM Boundary

The boundary must be coarse-grained and benchmarked. The first implementation should use a Worker-hosted engine and avoid one call per cell.

## Engine Ownership

In client mode, the authoritative normalized dataset lives in the compute engine after load. TypeScript keeps the original user rows only if the user supplied them directly and the DataSource needs reload or fallback recovery. Visible rendering consumes row windows returned by the DataSource, not the raw full array.

In server mode, the browser does not own the full dataset. The server owns sort/filter truth for the entire result set.

## Boundary Format

Use a custom column batch format for client data loading:

```ts
interface EngineDatasetBatch {
  datasetId: string;
  schema: EngineColumnSchema[];
  rowIds: Array<string | number>;
  sourceStart: number;
  columns: Record<string, EngineColumnVector>;
  finalBatch: boolean;
}

type EngineColumnVector =
  | { kind: "string"; values: string[]; nulls?: Uint8Array }
  | { kind: "number"; values: Float64Array; nulls?: Uint8Array }
  | { kind: "boolean"; values: Uint8Array; nulls?: Uint8Array }
  | { kind: "mixed"; values: EngineCellValue[] };
```

Use transferable `ArrayBuffer` for numeric, boolean, row index, and null bitmap vectors. Use structured clone for strings in alpha because JS strings are not transferable and a UTF-8 string table adds complexity. Benchmark a UTF-8 dictionary representation for large repeated strings before adopting it.

## Value Encoding

- Strings: JavaScript strings at the TypeScript boundary; Rust stores UTF-8 `String` or interned string IDs if benchmarks justify.
- Nulls: explicit null bitmap per typed column; `undefined` input normalizes to `null`.
- Dates: not a first-class alpha editor type. If present in row data, normalize to ISO 8601 string or epoch milliseconds only when column type explicitly opts in later.
- Numbers: `Float64Array`; reject or normalize `NaN`/Infinity because protocol JSON cannot represent them safely.
- Booleans: `Uint8Array` with 0/1 plus null bitmap.
- Mixed values: allowed only through `mixed` fallback with deterministic type ordering; not optimized.
- Row IDs: string or safe integer only. Reject objects, symbols, bigint, and unstable computed IDs.

## Worker Message Protocol

```ts
type EngineRequest =
  | { id: string; type: "loadDataset"; payload: EngineDatasetBatch }
  | { id: string; type: "applyQuery"; payload: { sorts: SortSpec[]; filters: FilterSpec[] } }
  | { id: string; type: "updateCells"; payload: { changes: EngineCellChange[] } }
  | { id: string; type: "getVisibleRange"; payload: { offset: number; limit: number; columns?: string[] } }
  | { id: string; type: "cancel"; targetId: string }
  | { id: string; type: "disposeDataset"; datasetId: string };

type EngineResponse =
  | { id: string; type: "ok"; payload?: unknown; transfer?: Transferable[] }
  | { id: string; type: "error"; error: EngineError }
  | { id: string; type: "progress"; payload: { loadedRows?: number } };
```

## Errors

Return structured errors:

```ts
interface EngineError {
  code: "WASM_LOAD_FAILED" | "INVALID_SCHEMA" | "INVALID_VALUE" | "CANCELLED" | "ENGINE_PANIC" | "OUT_OF_MEMORY";
  message: string;
  retryable: boolean;
  details?: unknown;
}
```

## Allocation And Lifecycle

- Load in batches to avoid peak memory spikes.
- Reuse row index buffers where possible.
- Replace a dataset by loading a new `datasetId`, then atomically swapping when ready.
- Dispose old datasets explicitly.
- Terminate workers on grid destroy.
- Recover from worker failure by recreating the worker and reloading from the DataSource when possible.

## Evidence Required

Benchmark four modes on identical data:

1. TypeScript main thread
2. TypeScript Worker
3. Rust/WASM main thread
4. Rust/WASM Worker

Separate algorithm time, transfer time, serialization time, WASM initialization, and memory.
