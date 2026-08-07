# Data Model

Gethen should expose row-oriented APIs and use column-oriented internal storage in client compute mode.

## Public Shape

Developers pass ordinary row objects and stable column definitions:

```ts
interface GethenColumn<TRow> {
  id: string;
  field: keyof TRow;
  header: string;
  type: "text" | "number" | "boolean";
  width?: number;
  editable?: boolean;
}
```

The row key must be explicit:

```ts
createClientDataSource({ rows, rowKey: "id" });
```

## Internal Shape

Internally, normalize into column vectors:

- `rowIds`: stable external IDs.
- `sourceIndex`: original array position.
- `visibleIndex`: computed ordered list of source indexes after filters/sorts.
- per-column typed vectors.
- null bitmap per typed column.

## Row Identity

`rowId` identifies logical rows externally and in events. Source indexes identify internal storage positions. Visible indexes identify current viewport positions after filtering/sorting.

Never expose visible index as row identity.

## Updates

Cell update flow:

1. Editor emits proposed value.
2. Core validates read-only/type basics.
3. DataSource `updateCells` is called if present.
4. Client mode updates engine batch.
5. Server mode trusts server response and invalidates affected cache blocks.
6. `cellEditCommit` emits old and new values.

Insert/delete are deferred from alpha. The model should reserve engine operations for them but not expose public APIs.

## Nulls And Mixed Types

`undefined` normalizes to `null`. Typed columns keep null bitmaps. Mixed-type columns are allowed only as slow path during alpha and should not be advertised for performance.

Sort ordering must be deterministic:

```text
null < boolean < number < string
```

For typed columns, invalid values should produce diagnostics instead of silently changing column type.

## Memory Risks

Large strings can dominate memory because they are not transferable and may be duplicated during normalization. Benchmark repeated strings with dictionary encoding. Dispose datasets explicitly when rows are replaced or the grid is destroyed.
