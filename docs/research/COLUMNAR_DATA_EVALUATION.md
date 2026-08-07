# Columnar Data Evaluation

## Status

Draft

## Question

Should Gethen convert row-oriented public data into columnar or typed-array storage?

## Context

Web developers usually provide arrays of objects, while sort/filter/scan operations may benefit from typed or column-oriented storage.

## Evaluation Criteria

API ergonomics, memory use, mutation behavior, Worker transfer cost, sort/filter speed, string handling, null handling, and framework integration.

## Evidence

- MDN documents `ArrayBuffer` as transferable and typed arrays as serializable views over buffers.
- MDN documents structured clone support for arrays, plain objects, strings, numbers, booleans, `ArrayBuffer`, and typed arrays.
- MDN documents that transferable buffers detach from the sender, requiring explicit ownership handling.

## Experiments And Benchmarks

Required experiments:

- array-of-objects baseline.
- typed column vectors for number/boolean columns.
- string column clone cost.
- dictionary encoding for repeated strings.
- update batches and dataset disposal.

## Analysis

Row-oriented API should be preserved for developer experience. Internally, typed vectors are attractive for numeric/boolean data and Worker transfer, but strings and edits can dominate cost. Two authoritative mutable datasets must be avoided.

## Options

- Array of objects only: simplest, best baseline.
- TypeScript column vectors: useful for benchmarked local operations.
- Rust-owned columnar storage: conditional on Rust/WASM decision.
- Apache Arrow: defer; strong ecosystem but unnecessary complexity for alpha without interop evidence.

## Recommendation

Start with array-of-objects plus TypeScript reference access. Add typed/column vectors only where alpha benchmarks demonstrate benefit. Do not introduce Arrow in alpha.

## Limitations

No memory measurements exist yet.

## Open Questions

- What dataset shapes should define the first public performance claim?
- Should row updates mutate original rows or an internal model?

## References

- "ArrayBuffer", MDN Web Docs, accessed 2026-08-04, primary browser documentation, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
- "The structured clone algorithm", MDN Web Docs, accessed 2026-08-04, primary browser documentation, https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
- "Transferable objects", MDN Web Docs, accessed 2026-08-04, primary browser documentation, https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
