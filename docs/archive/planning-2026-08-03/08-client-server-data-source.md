# Client And Server DataSource

The DataSource abstraction is the correctness boundary between grid UI and data ownership.

```ts
interface GridDataSource<TRow> {
  getRows(request: GetRowsRequest, signal: AbortSignal): Promise<GetRowsResult<TRow>>;
  updateCells?(changes: CellChange[], signal: AbortSignal): Promise<UpdateResult>;
}
```

## Client Mode

Client mode loads all provided rows into the compute engine. Sorting and filtering are local and operate against the complete provided dataset.

Responsibilities:

- normalize rows into engine batches.
- enforce stable row key.
- call worker-backed sort/filter.
- provide visible ranges.
- apply batch updates.
- reload/refresh full dataset.
- fall back to TypeScript engine if WASM fails.

## Server Mode

Server mode requests blocks from the application server using protocol requests. The server owns whole-dataset sorting and filtering.

The browser must never filter only loaded blocks and present the result as complete.

Responsibilities:

- request offset/limit blocks.
- include sort/filter in every request.
- cancel obsolete requests with `AbortController`.
- discard stale responses using monotonic request sequence numbers.
- expose loading/error/retry state.
- maintain bounded block cache.
- invalidate cache when query changes.
- invalidate or refresh affected blocks after update.

## Block Cache

Use fixed-size blocks, for example 100-500 rows by default, with configurable max cached blocks. Cache key:

```text
protocolVersion + range block + sort spec + filter spec + dataset version
```

Use LRU eviction. Keep in-flight request map per block. Coalesce duplicate requests. Retry should target failed blocks only.

## Cancellation

Each query generation has an `AbortController`. On sort/filter/refresh:

1. increment generation.
2. abort in-flight requests from older generation.
3. clear cache unless compatible.
4. issue visible block requests.
5. discard responses whose generation does not match current generation.

## Errors

DataSource errors should surface through `dataError` and render a retry affordance. Protocol errors should preserve `retryable`, `code`, and `message`.
