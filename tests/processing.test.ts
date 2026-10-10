import assert from "node:assert/strict";
import test from "node:test";
import { CSV_LIMITS, parseCsv } from "../src/lib/csv";
import { checkMappings, columnSimilarity, suggestMappings, unmappedRequiredFields } from "../src/lib/mapping";
import { sampleMappings, sampleRules } from "../src/lib/sample-config";
import { loadSampleDatasets } from "../src/lib/sample-data";
import { emptySession, replaceDataset, sampleSession } from "../src/lib/session";
import { normalizeDate, transformDataset, transformValue } from "../src/lib/transformations";
import { validateDataset, validationRuleSchema } from "../src/lib/validation";
import type { DataRecord, Dataset, FieldMapping, ValidationRule } from "../src/lib/types";

const dataset = (records: DataRecord[], columns = ["id", "value"]): Dataset => ({ name: "test.csv", origin: "upload", columns, records });
const mapping: FieldMapping[] = [
  { sourceField: "id", targetField: "id", transformations: [{ kind: "trim" }] },
  { sourceField: "value", targetField: "value", transformations: [] },
];
const runValidation = (records: DataRecord[], rules: ValidationRule[]) => validateDataset(transformDataset(dataset(records), mapping), rules, "id");

test("CSV parses quoted commas, escaped quotes, BOM, CRLF, and multiline cells without trimming values", () => {
  const parsed = parseCsv('\uFEFFid,value\r\n1," a,b "\r\n2,"a ""quote""\nnext line"');
  assert.deepEqual(parsed.columns, ["id", "value"]);
  assert.deepEqual(parsed.records, [{ id: "1", value: " a,b " }, { id: "2", value: 'a "quote"\nnext line' }]);
});
test("CSV accepts a single column and preserves leading-zero identifiers", () => {
  assert.deepEqual(parseCsv("id\n001\n002").records, [{ id: "001" }, { id: "002" }]);
});
test("CSV preserves explicit empty-cell records so missing values can be validated", () => {
  assert.deepEqual(parseCsv("id,value\n,\n1,a\n").records, [{ id: "", value: "" }, { id: "1", value: "a" }]);
});
test("CSV rejects malformed quotes, unequal rows, blank headers, duplicates, empty files, and header-only input", () => {
  for (const input of ['id,value\n1,"unterminated', "id,value\n1", "id,value\n1,a,extra", "id,\n1,a", "id,ID\n1,a", "", "id,value\n"]) assert.throws(() => parseCsv(input), Error, input);
});
test("CSV accepts the row limit and rejects excess rows, columns, and bytes", () => {
  const rows = Array.from({ length: CSV_LIMITS.rows }, (_, index) => `${index},ok`).join("\n");
  assert.equal(parseCsv(`id,value\n${rows}`).records.length, CSV_LIMITS.rows);
  assert.throws(() => parseCsv(`id,value\n${rows}\n10001,ok`), /10,000/);
  assert.throws(() => parseCsv(`${Array.from({ length: 101 }, (_, i) => `f${i}`).join(",")}\n${Array(101).fill("v").join(",")}`), /100-column/);
  assert.throws(() => parseCsv(`id\n${"x".repeat(CSV_LIMITS.bytes)}`), /5 MB/);
  assert.throws(() => parseCsv(`${"x".repeat(201)}\na`), /200 characters/);
});
test("CSV dangerous object-property headers are treated as data, not prototype mutation", () => {
  const record = parseCsv("__proto__,constructor\ntext,value").records[0];
  assert.ok(Object.hasOwn(record, "__proto__"));
  assert.equal(record.__proto__, "text");
  assert.equal(record.constructor, "value");
});
test("mapping suggestions normalize names, use known aliases, and leave unrelated fields unmapped", () => {
  const result = suggestMappings(["InstrumentNum", "Grantor", "Legal_Description", "Unrelated"], ["DocumentNumber", "GrantorName", "LegalDescription", "Balance"]);
  assert.deepEqual(result.map(item => item.sourceField), ["InstrumentNum", "Grantor", "Legal_Description", null]);
  assert.equal(columnSimilarity("Legal_Description", "legalDescription"), 1);
  assert.equal(columnSimilarity("", ""), 0);
  assert.deepEqual(result, suggestMappings(["InstrumentNum", "Grantor", "Legal_Description", "Unrelated"], ["DocumentNumber", "GrantorName", "LegalDescription", "Balance"]));
});
test("mapping similarity chooses a stable winner for equally similar names", () => {
  const result = suggestMappings(["Account Name", "account_name"], ["accountName"]);
  assert.equal(result[0].sourceField, "Account Name");
  assert.ok(columnSimilarity("DocumentNumbers", "DocumentNumber") > .65);
});
test("mapping checks catch duplicate targets and unknown source/target fields", () => {
  const source = dataset([]); const target = dataset([]);
  assert.deepEqual(checkMappings(source, target, mapping), []);
  const bad = [...mapping, { sourceField: "missing", targetField: "id", transformations: [] }, { sourceField: null, targetField: "unknown", transformations: [] }] satisfies FieldMapping[];
  const errors = checkMappings(source, target, bad);
  assert.equal(errors.length, 3);
  assert.throws(() => transformDataset(source, bad), /Duplicate/);
  assert.throws(() => transformDataset(source, [{ sourceField: "missing", targetField: "id", transformations: [] }]), /unknown source/);
});
test("required target fields are identified even when source is unmapped", () => {
  const rules: ValidationRule[] = [{ field: "value", kind: "required", severity: "error" }];
  const unmapped = [{ sourceField: null, targetField: "value", transformations: [] }] satisfies FieldMapping[];
  assert.deepEqual(unmappedRequiredFields(unmapped, rules), ["value"]);
  const processed = transformDataset(dataset([{ id: "1", value: "original" }]), unmapped);
  const result = validateDataset(processed, rules, "id");
  assert.equal(result.issues[0].rule, "required");
  assert.equal(result.issues[0].originalValue, null);
});
test("trim, uppercase, and lowercase preserve nulls and apply deterministically", () => {
  assert.equal(transformValue(" Ada ", [{ kind: "trim" }, { kind: "uppercase" }]).value, "ADA");
  assert.equal(transformValue("ADA", [{ kind: "lowercase" }]).value, "ada");
  assert.equal(transformValue(null, [{ kind: "trim" }, { kind: "uppercase" }]).value, null);
  assert.equal(transformValue(undefined, []).value, null);
});
test("defaults fill null, empty, or whitespace-only values without replacing zero", () => {
  for (const value of [null, "", " \t "]) assert.equal(transformValue(value, [{ kind: "default", value: "fallback" }]).value, "fallback");
  assert.equal(transformValue("0", [{ kind: "default", value: "fallback" }]).value, "0");
});
test("lookup transformations are exact and flag unknown codes without losing original values", () => {
  const lookup = { kind: "lookup", values: { WD: "Warranty Deed", "": "should not replace blank" } } as const;
  assert.equal(transformValue("WD", [lookup]).value, "Warranty Deed");
  assert.equal(transformValue("wd", [lookup]).value, "wd");
  assert.equal(transformValue("wd", [lookup]).errors.length, 1);
  assert.deepEqual(transformValue(null, [lookup]), { value: null, errors: [] });
  assert.equal(transformValue("", [lookup]).value, "");
});
test("lookup does not accidentally translate inherited object properties", () => {
  const result = transformValue("toString", [{ kind: "lookup", values: { WD: "Warranty Deed" } }]);
  assert.equal(result.value, "toString"); assert.equal(result.errors.length, 1);
});
test("transformation ordering affects lookup and default behavior", () => {
  const lookup = { kind: "lookup", values: { WD: "Warranty Deed" } } as const;
  assert.equal(transformValue(" wd ", [{ kind: "trim" }, { kind: "uppercase" }, lookup]).value, "Warranty Deed");
  assert.equal(transformValue(" wd ", [lookup, { kind: "trim" }, { kind: "uppercase" }]).errors.length, 1);
  assert.equal(transformValue(null, [{ kind: "default", value: "wd" }, { kind: "uppercase" }]).value, "WD");
  assert.equal(transformValue(null, [{ kind: "uppercase" }, { kind: "default", value: "wd" }]).value, "wd");
});
test("date normalization accepts valid leap days and US calendar dates", () => {
  assert.equal(normalizeDate(" 1/8/2025 "), "2025-01-08");
  assert.equal(normalizeDate("2024-02-29"), "2024-02-29");
  assert.equal(normalizeDate("2000-02-29"), "2000-02-29");
  assert.equal(normalizeDate("0001-01-01"), "0001-01-01");
});
test("invalid dates never roll over and remain visibly invalid", () => {
  for (const value of ["02/30/2025", "2025-02-29", "1900-02-29", "2025-04-31", "2025-13-01", "2025-00-10", "0000-01-01", "2025-01-00", "not a date", "2025-1-1", "2025-01-01T00:00:00Z", "31/12/2025"]) {
    assert.equal(normalizeDate(value), null, value);
    const result = transformValue(value, [{ kind: "date" }]);
    assert.equal(result.value, value); assert.equal(result.errors.length, 1);
  }
  assert.deepEqual(transformValue("", [{ kind: "date" }]), { value: "", errors: [] });
});
test("transformed records and original snapshots are independent of source records", () => {
  const source = dataset([Object.freeze({ id: " 01 ", value: " wd " })]);
  const saved = JSON.stringify(source);
  const processed = transformDataset(source, [{ sourceField: "value", targetField: "DocumentType", transformations: [{ kind: "trim" }, { kind: "uppercase" }] }]);
  assert.equal(processed.records[0].DocumentType, "WD");
  assert.equal(processed.originalRecords[0].DocumentType, " wd ");
  assert.equal(JSON.stringify(source), saved);
  assert.notEqual(processed.records[0], source.records[0]);
});
test("required validation handles null, blank, whitespace, and nonempty zero", () => {
  const result = runValidation([{ id: "1", value: null }, { id: "2", value: "" }, { id: "3", value: " " }, { id: "4", value: "0" }], [{ field: "value", kind: "required", severity: "error" }]);
  assert.equal(result.issues.length, 3); assert.equal(result.summary.recordsWithoutIssues, 1);
});
test("all duplicate identifiers are flagged with distinct row indexes and transformed values", () => {
  const result = runValidation([{ id: " 01 ", value: "a" }, { id: "01", value: "b" }, { id: "", value: "c" }, { id: null, value: "d" }], [{ field: "id", kind: "unique", severity: "error" }]);
  assert.equal(result.issues.length, 4); assert.equal(result.summary.recordsWithErrors, 4);
  assert.deepEqual(result.issues.map(issue => issue.rowIndex), [0, 1, 2, 3]);
  assert.equal(result.issues[0].originalValue, " 01 "); assert.equal(result.issues[0].transformedValue, "01");
  assert.equal(result.issues[2].recordIdentifier, "Row 3");
});
test("unique comparisons are exact, with no implicit case folding", () => {
  assert.equal(runValidation([{ id: "A", value: "" }, { id: "a", value: "" }], [{ field: "id", kind: "unique", severity: "error" }]).issues.length, 0);
});
test("allowed values and maximum lengths are configurable with independent severity", () => {
  const result = runValidation([{ id: "1", value: "WD" }, { id: "2", value: "wd" }, { id: "3", value: "" }], [{ field: "value", kind: "allowed", values: ["WD"], severity: "error" }, { field: "value", kind: "maxLength", limit: 1, severity: "warning" }]);
  assert.equal(result.summary.errorCount, 1); assert.equal(result.summary.warningCount, 2);
  assert.equal(result.summary.recordsWithWarnings, 2); assert.equal(result.summary.recordsWithoutIssues, 1);
});
test("numeric validation rejects nonfinite and formatted values but allows signed decimals", () => {
  const values = ["0", "-1.25", "+2", ".5", "NaN", "Infinity", "1,000", " 2 ", "0x10", "1e3", ""];
  const result = runValidation(values.map((value, index) => ({ id: String(index), value })), [{ field: "value", kind: "numeric", severity: "error" }]);
  assert.equal(result.issues.length, 6);
});
test("date validation flags invalid transformed dates and skips optional blank values", () => {
  const result = runValidation([{ id: "1", value: "02/30/2025" }, { id: "2", value: "2024-02-29" }, { id: "3", value: "" }], [{ field: "value", kind: "date", severity: "error" }]);
  assert.equal(result.issues.length, 1); assert.equal(result.issues[0].recordIdentifier, "1");
});
test("transformation failures become structured validation errors even without a date rule", () => {
  const processed = transformDataset(dataset([{ id: "1", value: "02/30/2025" }]), [{ ...mapping[0] }, { ...mapping[1], transformations: [{ kind: "date" }] }]);
  const result = validateDataset(processed, [], "id");
  assert.deepEqual(result.issues[0], { rowIndex: 0, recordIdentifier: "1", field: "value", rule: "transformation", severity: "error", message: "Invalid date. Use YYYY-MM-DD or MM/DD/YYYY with a valid calendar day. The value was preserved.", originalValue: "02/30/2025", transformedValue: "02/30/2025" });
});
test("summaries count records separately from issues and permit both severities on a record", () => {
  const result = runValidation([{ id: "1", value: "abc" }, { id: "2", value: "2" }], [{ field: "value", kind: "numeric", severity: "error" }, { field: "value", kind: "allowed", values: ["2"], severity: "error" }, { field: "value", kind: "maxLength", limit: 2, severity: "warning" }]);
  assert.deepEqual(result.summary, { totalRecords: 2, recordsWithErrors: 1, recordsWithWarnings: 1, recordsWithoutIssues: 1, errorCount: 2, warningCount: 1 });
});
test("empty datasets return zero summary values and no exceptions", () => {
  const result = runValidation([], [{ field: "value", kind: "required", severity: "error" }]);
  assert.deepEqual(result.summary, { totalRecords: 0, recordsWithErrors: 0, recordsWithWarnings: 0, recordsWithoutIssues: 0, errorCount: 0, warningCount: 0 });
  assert.deepEqual(result.issues, []);
});
test("malformed rule configuration is rejected by Zod", () => {
  assert.equal(validationRuleSchema.safeParse({ field: "value", kind: "maxLength", limit: -1, severity: "error" }).success, false);
  assert.equal(validationRuleSchema.safeParse({ field: "value", kind: "allowed", values: [], severity: "error" }).success, false);
  assert.equal(validationRuleSchema.safeParse({ field: "value", kind: "required", severity: "unknown" }).success, false);
});
test("sample processing produces results from actual records and keeps originals unchanged", () => {
  const { source, target } = loadSampleDatasets(); const before = JSON.stringify(source);
  const mappings = sampleMappings(source, target);
  assert.deepEqual(checkMappings(source, target, mappings), []);
  const result = validateDataset(transformDataset(source, mappings), sampleRules(), "DocumentNumber");
  assert.equal(result.summary.totalRecords, source.records.length);
  assert.equal(result.summary.recordsWithErrors, 5);
  assert.equal(result.summary.errorCount, 9);
  assert.equal(result.summary.recordsWithWarnings, 0);
  assert.equal(result.summary.recordsWithoutIssues, 5);
  assert.equal(JSON.stringify(source), before);
});
test("reprocessing changed configuration replaces prior results", () => {
  const source = dataset([{ id: "1", value: " x " }]);
  const rule: ValidationRule[] = [{ field: "value", kind: "allowed", values: ["X"], severity: "error" }];
  const old = validateDataset(transformDataset(source, mapping), rule, "id");
  const next = validateDataset(transformDataset(source, [{ ...mapping[0] }, { ...mapping[1], transformations: [{ kind: "trim" }, { kind: "uppercase" }] }]), rule, "id");
  assert.equal(old.issues.length, 1); assert.equal(next.issues.length, 0); assert.equal(source.records[0].value, " x ");
});
test("dataset replacement atomically resets dependent configuration and preserves the other dataset", () => {
  const previous = sampleSession(); const snapshot = JSON.stringify(previous);
  const uploaded = parseCsv("id,value\n1,a");
  const next = replaceDataset(previous, "source", uploaded);
  assert.equal(next.datasets!.source, uploaded);
  assert.equal(next.datasets!.target, previous.datasets!.target);
  assert.deepEqual(next.rules, []); assert.equal(next.identifierField, "");
  assert.ok(next.mappings.every(item => item.transformations.length === 0));
  assert.ok(next.mappings.every(item => item.sourceField === null));
  assert.equal(JSON.stringify(previous), snapshot);
});
test("either dataset can be imported first and completed without inheriting stale sample rules", () => {
  const uploaded = parseCsv("id,value\n1,a");
  const targetFirst = replaceDataset(emptySession(), "target", uploaded);
  assert.equal(targetFirst.datasets!.source.records.length, 0);
  assert.ok(targetFirst.mappings.every(item => item.sourceField === null));
  const complete = replaceDataset(targetFirst, "source", uploaded);
  assert.deepEqual(complete.mappings.map(item => item.sourceField), ["id", "value"]);
  assert.deepEqual(complete.rules, []);
  assert.equal(emptySession().datasets, null);
});
test("the processing pipeline validates 10,000 records without losing rows", () => {
  const records = Array.from({ length: CSV_LIMITS.rows }, (_, index) => ({ id: String(index).padStart(5, "0"), value: index % 2 ? "WD" : "DT" }));
  const processed = transformDataset(dataset(records), [mapping[0], { ...mapping[1], transformations: [{ kind: "lookup", values: { WD: "Warranty Deed", DT: "Deed of Trust" } }] }]);
  const result = validateDataset(processed, [{ field: "id", kind: "unique", severity: "error" }, { field: "value", kind: "required", severity: "error" }, { field: "value", kind: "allowed", values: ["Warranty Deed", "Deed of Trust"], severity: "error" }], "id");
  assert.equal(result.summary.totalRecords, CSV_LIMITS.rows);
  assert.equal(result.summary.recordsWithoutIssues, CSV_LIMITS.rows);
  assert.equal(result.issues.length, 0);
});
