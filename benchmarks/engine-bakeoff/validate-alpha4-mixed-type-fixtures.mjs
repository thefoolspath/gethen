import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  createAlpha4MixedTypeFixture,
  getAlpha4MixedTypeFixtureProfiles
} from "./alpha4-mixed-type-fixtures.mjs";

const profiles = getAlpha4MixedTypeFixtureProfiles();
assert.deepEqual(
  Object.fromEntries(Object.entries(profiles).map(([name, profile]) => [name, [profile.rowCount, profile.columnCount]])),
  {
    small: [10_000, 50],
    fallback: [500_000, 50],
    primary: [1_000_000, 50]
  }
);

const first = createAlpha4MixedTypeFixture("small");
const second = createAlpha4MixedTypeFixture("small");
const differentSeed = createAlpha4MixedTypeFixture("small", { seed: first.seed + 1 });
const firstDigest = digestFixture(first);
const secondDigest = digestFixture(second);
const differentSeedDigest = digestFixture(differentSeed);

assert.equal(firstDigest, secondDigest, "The same seed must produce the same fixture digest.");
assert.notEqual(firstDigest, differentSeedDigest, "A different seed must change the fixture digest.");
assert.equal(first.data.rowIds[0], "r0000000");
assert.equal(first.data.rowIds.at(-1), "r0009999");
assert.equal(first.data.columns.length, 50);

const storageCounts = countBy(first.data.columns, (column) => column.storage);
assert.deepEqual(storageCounts, { float64: 20, utf8: 25, boolean: 5 });
const semanticCounts = countBy(first.schema, (column) => column.semanticType);
assert.deepEqual(semanticCounts, { number: 20, text: 10, boolean: 5, date: 10, json: 5 });
for (const column of first.data.columns) {
  assert.equal(column.validity.length, first.profile.rowCount);
  assert.ok(column.validity.includes(0), `Column '${column.columnId}' must contain null values.`);
  assert.ok(column.validity.includes(1), `Column '${column.columnId}' must contain non-null values.`);
}

console.log(JSON.stringify({
  status: "Alpha 4 A4-01 deterministic mixed-type fixtures validated",
  allocatedProfile: first.profile,
  availableProfiles: profiles,
  schema: {
    semanticCounts,
    nullDistribution: "row zero plus approximately one in 23 seeded cells per column"
  },
  repeatDigest: firstDigest,
  differentSeedDigest
}, null, 2));

function digestFixture(fixture) {
  const hash = createHash("sha256");
  hash.update(JSON.stringify({ profile: fixture.profile, seed: fixture.seed, schema: fixture.schema }));
  for (const rowId of fixture.data.rowIds) hash.update(rowId).update("\0");
  for (const column of fixture.data.columns) {
    hash.update(column.columnId).update("\0").update(column.storage).update("\0");
    updateTypedArray(hash, column.validity);
    if (column.storage === "utf8") {
      updateTypedArray(hash, column.offsets);
      updateTypedArray(hash, column.bytes);
    } else {
      updateTypedArray(hash, column.values);
    }
  }
  return hash.digest("hex");
}

function updateTypedArray(hash, values) {
  hash.update(Buffer.from(values.buffer, values.byteOffset, values.byteLength));
}

function countBy(values, selector) {
  const counts = {};
  for (const value of values) {
    const key = selector(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
