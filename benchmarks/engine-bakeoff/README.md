# Engine Bake-Off Harness

The Alpha 3 harness establishes a transferable columnar-buffer boundary and repeatable TypeScript Worker measurements. Alpha 4 must implement equivalent TypeScript Worker and Rust/WASM Worker candidates against the same schemas, fixtures, batching, and result semantics before selecting a production engine.

Run `node benchmarks/engine-bakeoff/measure-worker-boundary.mjs`. The output is diagnostic evidence, not an engine-selection result.
