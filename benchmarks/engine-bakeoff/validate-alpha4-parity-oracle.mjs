import assert from "node:assert/strict";

import { createAlpha4ParityOracle } from "./alpha4-parity-oracle.mjs";

const expectedSmallOracle = Object.freeze({
  digest: "87562706f902731d1d3ebc90ef10d35d50f564dcddb1be5df2262c2941249d21",
  scenarios: Object.freeze([
    Object.freeze({
      name: "mixed-filter-sort",
      digest: "483c5d6cd8f50cc587ad41851dae877974e318d1d92dc3bdeff52156560ea206",
      filteredRowCount: 898,
      totalViewRowCount: 898,
      returnedRowCount: 898
    }),
    Object.freeze({
      name: "group-aggregate",
      digest: "f83c981b07347c3b5c94a9889508de1f421ec0a8ed3270731bab3e6d16c5443e",
      filteredRowCount: 8_840,
      totalViewRowCount: 8_876,
      returnedRowCount: 8_876
    }),
    Object.freeze({
      name: "null-ordering",
      digest: "44836d8888b353b0ae747caae7bf90a9a5e991cd0bddc3e2c9b61dd0be25ea34",
      filteredRowCount: 380,
      totalViewRowCount: 380,
      returnedRowCount: 380
    })
  ])
});

const first = createAlpha4ParityOracle("small");
const second = createAlpha4ParityOracle("small");

assert.equal(first.mode, "full");
assert.equal(first.scenarios.length, 3);
assert.equal(first.digest, second.digest, "Canonical parity-oracle output must be repeatable.");
assert.equal(first.digest, expectedSmallOracle.digest, "Canonical parity-oracle digest changed unexpectedly.");
assert.deepEqual(
  first.scenarios.map(({ name, digest, summary }) => ({ name, digest, summary })),
  second.scenarios.map(({ name, digest, summary }) => ({ name, digest, summary }))
);
assert.deepEqual(
  first.scenarios.map(({ name, digest, summary }) => ({
    name,
    digest,
    filteredRowCount: summary.filteredRowCount,
    totalViewRowCount: summary.totalViewRowCount,
    returnedRowCount: summary.returnedRowCount
  })),
  expectedSmallOracle.scenarios
);
for (const scenario of first.scenarios) {
  assert.ok(scenario.result, `Small-profile scenario '${scenario.name}' must retain the full canonical result.`);
  assert.equal(scenario.result.sourceRowCount, 10_000);
  assert.ok(scenario.summary.returnedRowCount > 0, `Scenario '${scenario.name}' must return oracle rows.`);
}

const compactDefinitions = ["fallback", "primary"].map((profileName) => {
  const profile = profileName === "fallback"
    ? { name: profileName, rowCount: 500_000, columnCount: 50 }
    : { name: profileName, rowCount: 1_000_000, columnCount: 50 };
  return { profile, mode: "compact", scenario: "group-aggregate" };
});

console.log(JSON.stringify({
  status: "Alpha 4 A4-02 canonical parity oracle validated",
  allocatedProfile: first.profile,
  oracleDigest: first.digest,
  scenarios: first.scenarios.map(({ name, digest, summary }) => ({ name, digest, summary })),
  deferredCompactExecutions: compactDefinitions
}, null, 2));
