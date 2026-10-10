import type { DataRecord, Dataset, FieldMapping, ProcessedDataset, Transformation } from "./types";

export function isMissing(value: string | null | undefined): boolean { return value == null || value.trim() === ""; }

/** Only calendar dates: YYYY-MM-DD or explicit US MM/DD/YYYY. No Date.parse rollover. */
export function normalizeDate(value: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!iso && !us) return null;
  const year = Number(iso ? iso[1] : us![3]); const month = Number(iso ? iso[2] : us![1]); const day = Number(iso ? iso[3] : us![2]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function transformValue(original: string | null | undefined, transformations: readonly Transformation[]): { value: string | null; errors: string[] } {
  let value = original ?? null; const errors: string[] = [];
  for (const transformation of transformations) {
    switch (transformation.kind) {
      case "trim": value = value?.trim() ?? null; break;
      case "uppercase": value = value?.toUpperCase() ?? null; break;
      case "lowercase": value = value?.toLowerCase() ?? null; break;
      case "default": if (isMissing(value)) value = transformation.value; break;
      case "lookup":
        if (!isMissing(value)) {
          if (Object.hasOwn(transformation.values, value!)) value = transformation.values[value!];
          else errors.push("No lookup translation exists for this value. The value was preserved.");
        }
        break;
      case "date":
        if (!isMissing(value)) { const normalized = normalizeDate(value!); if (normalized === null) errors.push("Invalid date. Use YYYY-MM-DD or MM/DD/YYYY with a valid calendar day. The value was preserved."); else value = normalized; }
        break;
    }
  }
  return { value, errors };
}
export function transformDataset(source: Dataset, mappings: readonly FieldMapping[]): ProcessedDataset {
  const originalRecords: DataRecord[] = []; const transformationErrors: ProcessedDataset["transformationErrors"][number][] = [];
  const targets = mappings.map(mapping => mapping.targetField);
  if (new Set(targets).size !== targets.length) throw new Error("Duplicate target assignments are not allowed.");
  if (mappings.some(mapping => mapping.sourceField !== null && !source.columns.includes(mapping.sourceField))) throw new Error("A mapping references an unknown source field.");
  const records = source.records.map((record, rowIndex) => {
    const originals: [string, string | null][] = []; const values: [string, string | null][] = [];
    for (const mapping of mappings) {
      const original = mapping.sourceField === null ? null : record[mapping.sourceField] ?? null;
      originals.push([mapping.targetField, original]);
      const result = transformValue(original, mapping.transformations);
      values.push([mapping.targetField, result.value]);
      for (const message of result.errors) transformationErrors.push({ rowIndex, field: mapping.targetField, message });
    }
    originalRecords.push(Object.fromEntries(originals)); return Object.fromEntries(values);
  });
  return { records, originalRecords, transformationErrors };
}
