# DataSource

Last reviewed: 2026-08-04.

Status: Proposed.

## Proposed Interface

```ts
interface GridDataSource<TRow> {
  getRows(request: GetRowsRequest, signal: AbortSignal): Promise<GetRowsResult<TRow>>;
  updateCells?(changes: CellChange[], signal: AbortSignal): Promise<UpdateResult>;
}
```

## Client-Side Mode

Client mode owns the complete provided dataset. Sorting and filtering may be local only because the full dataset is available.

## Server-Side Mode

Server mode fetches ranges. Sorting and filtering of the entire result set belong to the server. The browser must not filter only cached rows and present them as a complete result.

Required server-mode behaviors before release:

- cancellation with `AbortSignal`
- stale-response protection
- loading state
- error state
- retry
- bounded block cache

Server-side DataSource is conditional for `alpha.1` if it threatens the first complete vertical slice.
