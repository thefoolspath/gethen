# DataSource

Last reviewed: 2026-08-12.

Status: Initial client-side DataSource implemented.

## Proposed Interface

```ts
interface GridDataSource<TRow> {
  getRows(request: GetRowsRequest, signal: AbortSignal): Promise<GetRowsResult<TRow>>;
  updateCells?(changes: CellChange[], signal: AbortSignal): Promise<UpdateResult>;
}
```

## Client-Side Mode

Client mode owns the complete provided dataset. Sorting and filtering may be local only because the full dataset is available.

## Deferred Server-Side 2.0 Mode

Server mode fetches ranges. Sorting and filtering of the entire result set belong to the server. The browser must not filter only cached rows and present them as a complete result.

Required server-mode behaviors will be specified in the dedicated 2.0 plan and include at least:

- cancellation with `AbortSignal`
- stale-response protection
- loading state
- error state
- retry
- bounded block cache

Initial implementation: `packages/core/src/data/client-data-source.ts` provides client-side row ID extraction, range retrieval, and stale-safe cell updates. Client-side execution is the only runtime scope through 1.0. Server DataSource, its wire protocol, cache semantics, and backend integration move to 2.0.

Client-side range/paging, sort, filter, group, aggregate, formula, pivot, update, and row-transaction intent must use transport-neutral descriptors or typed ASTs where those features exist. This preserves a future server execution boundary without freezing the server transport during 1.0.
