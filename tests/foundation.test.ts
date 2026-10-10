import assert from "node:assert/strict";
import test from "node:test";
import { profileDataset } from "../src/lib/profiling";
import { loadSampleDatasets } from "../src/lib/sample-data";
test("profiling counts blank and whitespace cells without modifying values", () => {
  const dataset = { name: "test", origin: "sample" as const, columns: ["a", "b"], records: [{ a: " ", b: "0" }, { a: "", b: " value " }] };
  assert.deepEqual(profileDataset(dataset), [{ name: "a", emptyCount: 2 }, { name: "b", emptyCount: 0 }]);
  assert.equal(dataset.records[1].b, " value ");
});
test("empty datasets profile safely", () => {
  assert.deepEqual(profileDataset({ name: "empty", origin: "sample", columns: [], records: [] }), []);
  assert.deepEqual(profileDataset({ name: "headers", origin: "sample", columns: ["a"], records: [] }), [{ name: "a", emptyCount: 0 }]);
});
test("sample rows match their declared columns and preserve intentional problems", () => {
  const { source, target } = loadSampleDatasets();
  for (const dataset of [source, target]) for (const record of dataset.records) assert.deepEqual(Object.keys(record), dataset.columns);
  const keys = source.records.map(row => row.InstrumentNum);
  assert.ok(keys.includes(""));
  assert.ok(keys.filter(key => key === "2025-006").length > 1);
  assert.ok(source.records.some(row => row.RecordDt === "02/30/2025"));
  assert.ok(source.records.some(row => row.DocType === "XYZ"));
  assert.ok(!target.records.some(row => row.DocumentNumber === "2025-010"));
  assert.ok(target.records.some(row => row.DocumentNumber === "2025-099"));
});
test("loading sample data creates independent datasets", () => {
  const first = loadSampleDatasets(); const second = loadSampleDatasets();
  assert.notEqual(first.source.records[0], second.source.records[0]);
  assert.deepEqual(first, second);
});
