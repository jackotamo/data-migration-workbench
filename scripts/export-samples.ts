import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import { parseCsv } from "../src/lib/csv";
import { loadSampleDatasets } from "../src/lib/sample-data";

const samples = loadSampleDatasets();
const directory = resolve("public/samples");
mkdirSync(directory, { recursive: true });

for (const dataset of [samples.source, samples.target]) {
  const csv = Papa.unparse({ fields: [...dataset.columns], data: dataset.records.map(record => dataset.columns.map(column => record[column] ?? "")) }, { quotes: true, newline: "\r\n", escapeFormulae: true });
  const parsed = parseCsv(csv, dataset.name);
  assert.deepEqual(parsed.columns, dataset.columns);
  assert.deepEqual(parsed.records, dataset.records);
  writeFileSync(resolve(directory, dataset.name), csv + "\r\n", "utf8");
  process.stdout.write(`Verified ${dataset.name}: ${dataset.records.length} records, ${dataset.columns.length} columns.\n`);
}
