# Protocol V1

Use JSON Schema 2020-12 as the protocol source of truth. Generate TypeScript types from schemas and verify generation in CI to prevent drift.

The protocol version is independent from npm, crates.io, and NuGet versions.

## Query Request

```json
{
  "protocolVersion": "1",
  "range": { "offset": 0, "limit": 100 },
  "sort": [{ "field": "sku", "direction": "asc" }],
  "filters": [{ "field": "quantity", "operator": "greaterThan", "value": 0 }]
}
```

## Query Response

```json
{
  "protocolVersion": "1",
  "rows": [],
  "totalRows": 300000
}
```

## Initial Types

```ts
interface GetRowsRequest {
  protocolVersion: "1";
  range: { offset: number; limit: number };
  sort?: SortSpec[];
  filters?: FilterSpec[];
}

interface SortSpec {
  field: string;
  direction: "asc" | "desc";
}

interface FilterSpec {
  field: string;
  operator: "equals" | "contains" | "greaterThan" | "lessThan";
  value: string | number | boolean | null;
}

interface GetRowsResult<TRow> {
  protocolVersion: "1";
  rows: TRow[];
  totalRows: number;
}

interface UpdateCellsRequest {
  protocolVersion: "1";
  changes: CellChange[];
}

interface ProtocolError {
  code: string;
  message: string;
  retryable: boolean;
  field?: string;
  details?: unknown;
}
```

## Security Rules

- No arbitrary expressions.
- No function bodies.
- No unrestricted operators.
- Server must allowlist fields.
- Server must bound `limit`, filter count, sort count, and value sizes.
- Protocol errors must not leak sensitive backend details.

## Extension Strategy

Reserve an optional `extensions` object only for namespaced, documented capabilities:

```json
{
  "extensions": {
    "com.example.feature": {}
  }
}
```

Do not add grouping, aggregation, cursor, formula, pivot, or batch-edit fields until their semantics are defined.

## Generated Type Drift

CI should:

1. Validate schema files.
2. Generate TypeScript types into a deterministic output.
3. Run type tests against examples.
4. Fail if generated files differ from committed files.
5. Validate JSON examples against schemas.
