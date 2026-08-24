const DEFAULT_SEED = 0x47455448;

const PROFILE_DEFINITIONS = Object.freeze({
  small: Object.freeze({ name: "small", rowCount: 10_000, columnCount: 50 }),
  fallback: Object.freeze({ name: "fallback", rowCount: 500_000, columnCount: 50 }),
  primary: Object.freeze({ name: "primary", rowCount: 1_000_000, columnCount: 50 })
});

const COLUMN_FAMILIES = Object.freeze([
  Object.freeze({ prefix: "number", storage: "float64", count: 20 }),
  Object.freeze({ prefix: "text", storage: "utf8", count: 10 }),
  Object.freeze({ prefix: "boolean", storage: "boolean", count: 5 }),
  Object.freeze({ prefix: "date", storage: "utf8", count: 10 }),
  Object.freeze({ prefix: "json", storage: "utf8", count: 5 })
]);

const TEXT_VALUES = Object.freeze([
  "alpha",
  "bravo",
  "café",
  "delta team",
  "Gethen grid",
  "naïve",
  "กริด",
  "東京",
  "📊",
  "Zulu"
]);

const DATE_VALUES = Object.freeze(Array.from({ length: 64 }, (_, index) => {
  const year = 2020 + Math.floor(index / 24);
  const month = index % 12 + 1;
  const day = index * 7 % 28 + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}));

const JSON_VALUES = Object.freeze(Array.from({ length: 32 }, (_, index) => JSON.stringify({
  active: index % 2 === 0,
  code: `item-${String(index).padStart(2, "0")}`,
  rank: index
})));

const UTF8_DICTIONARIES = Object.freeze({
  text: encodeDictionary(TEXT_VALUES),
  date: encodeDictionary(DATE_VALUES),
  json: encodeDictionary(JSON_VALUES)
});

export function getAlpha4MixedTypeFixtureProfiles() {
  return PROFILE_DEFINITIONS;
}

export function getAlpha4MixedTypeFixtureSchema() {
  const columns = [];
  let columnIndex = 0;
  for (const family of COLUMN_FAMILIES) {
    for (let familyIndex = 0; familyIndex < family.count; familyIndex += 1) {
      columns.push(Object.freeze({
        columnId: `${family.prefix}-${String(familyIndex).padStart(2, "0")}`,
        storage: family.storage,
        semanticType: family.prefix,
        fixtureColumnIndex: columnIndex
      }));
      columnIndex += 1;
    }
  }
  return Object.freeze(columns);
}

export function createAlpha4MixedTypeFixture(profileName = "small", options = {}) {
  const profile = PROFILE_DEFINITIONS[profileName];
  if (!profile) {
    throw new Error(`Unknown Alpha 4 fixture profile '${profileName}'. Expected small, fallback, or primary.`);
  }
  const seed = normalizeSeed(options.seed ?? DEFAULT_SEED);
  const schema = getAlpha4MixedTypeFixtureSchema();
  const rowIds = Array.from(
    { length: profile.rowCount },
    (_, rowIndex) => `r${String(rowIndex).padStart(7, "0")}`
  );
  const columns = schema.map((column) => createColumn(column, profile.rowCount, seed));
  return {
    profile,
    seed,
    schema,
    data: {
      rowCount: profile.rowCount,
      rowIds,
      columns
    }
  };
}

function createColumn(column, rowCount, seed) {
  const validity = new Uint8Array(rowCount);
  if (column.storage === "float64") {
    const values = new Float64Array(rowCount);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const random = fixtureRandom(seed, column.fixtureColumnIndex, rowIndex, 0);
      validity[rowIndex] = isNullCell(random, rowIndex) ? 0 : 1;
      values[rowIndex] = validity[rowIndex] === 0
        ? 0
        : (random % 2_000_001 - 1_000_000) / 100;
    }
    return { columnId: column.columnId, storage: "float64", values, validity };
  }
  if (column.storage === "boolean") {
    const values = new Uint8Array(rowCount);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const random = fixtureRandom(seed, column.fixtureColumnIndex, rowIndex, 0);
      validity[rowIndex] = isNullCell(random, rowIndex) ? 0 : 1;
      values[rowIndex] = validity[rowIndex] === 0 ? 0 : random >>> 8 & 1;
    }
    return { columnId: column.columnId, storage: "boolean", values, validity };
  }
  return createUtf8Column(column, rowCount, seed, validity);
}

function createUtf8Column(column, rowCount, seed, validity) {
  const dictionary = UTF8_DICTIONARIES[column.semanticType];
  const offsets = new Uint32Array(rowCount + 1);
  const selectedIndexes = new Uint8Array(rowCount);
  let byteLength = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const random = fixtureRandom(seed, column.fixtureColumnIndex, rowIndex, 0);
    const valid = !isNullCell(random, rowIndex);
    validity[rowIndex] = valid ? 1 : 0;
    if (valid) {
      const selectedIndex = fixtureRandom(seed, column.fixtureColumnIndex, rowIndex, 1) % dictionary.length;
      selectedIndexes[rowIndex] = selectedIndex;
      byteLength += dictionary[selectedIndex].byteLength;
    }
    offsets[rowIndex + 1] = byteLength;
  }
  const bytes = new Uint8Array(byteLength);
  let byteOffset = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    if (validity[rowIndex] === 0) continue;
    const encoded = dictionary[selectedIndexes[rowIndex]];
    bytes.set(encoded, byteOffset);
    byteOffset += encoded.byteLength;
  }
  return { columnId: column.columnId, storage: "utf8", offsets, bytes, validity };
}

function encodeDictionary(values) {
  const encoder = new TextEncoder();
  return Object.freeze(values.map((value) => encoder.encode(value)));
}

function isNullCell(random, rowIndex) {
  return rowIndex === 0 || random % 23 === 0;
}

function normalizeSeed(seed) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new Error("Alpha 4 fixture seed must be an unsigned 32-bit integer.");
  }
  return seed >>> 0;
}

function fixtureRandom(seed, columnIndex, rowIndex, lane) {
  let value = seed
    ^ Math.imul(columnIndex + 1, 0x9e37_79b1)
    ^ Math.imul(rowIndex + 1, 0x85eb_ca6b)
    ^ Math.imul(lane + 1, 0xc2b2_ae35);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb_352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846c_a68b);
  value ^= value >>> 16;
  return value >>> 0;
}
