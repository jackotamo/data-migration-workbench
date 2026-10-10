import type { Dataset, FieldMapping, ValidationRule } from "./types";

const aliases: Readonly<Record<string, string>> = { instrumentnum: "documentnumber", doctype: "documenttype", recorddt: "recordingdate", grantor: "grantorname", grantee: "granteename", book: "booknumber", page: "pagenumber" };
function normalize(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]/g, ""); }
export function columnSimilarity(source: string, target: string): number {
  const left = normalize(source); const right = normalize(target);
  if (!left || !right) return 0;
  if (left === right || aliases[left] === right || aliases[right] === left) return 1;
  if (left.length < 2 || right.length < 2) return 0;
  const remaining = new Map<string, number>(); let common = 0;
  for (let index = 0; index < right.length - 1; index++) { const gram = right.slice(index, index + 2); remaining.set(gram, (remaining.get(gram) ?? 0) + 1); }
  for (let index = 0; index < left.length - 1; index++) { const gram = left.slice(index, index + 2); const count = remaining.get(gram) ?? 0; if (count > 0) { common++; remaining.set(gram, count - 1); } }
  return (2 * common) / (left.length + right.length - 2);
}
export function suggestMappings(sourceColumns: readonly string[], targetColumns: readonly string[]): FieldMapping[] {
  return targetColumns.map(targetField => {
    const best = sourceColumns.map((sourceField, index) => ({ sourceField, index, score: columnSimilarity(sourceField, targetField) })).sort((a, b) => b.score - a.score || a.index - b.index)[0];
    return { targetField, sourceField: best && best.score >= .65 ? best.sourceField : null, transformations: [] };
  });
}
export function checkMappings(source: Dataset, target: Dataset, mappings: readonly FieldMapping[]): string[] {
  const errors: string[] = []; const targets = new Set<string>();
  for (const mapping of mappings) {
    if (targets.has(mapping.targetField)) errors.push(`Duplicate target assignment: ${mapping.targetField}.`);
    targets.add(mapping.targetField);
    if (!target.columns.includes(mapping.targetField)) errors.push(`Unknown target field: ${mapping.targetField}.`);
    if (mapping.sourceField !== null && !source.columns.includes(mapping.sourceField)) errors.push(`Unknown source field: ${mapping.sourceField}.`);
  }
  return errors;
}
export function unmappedRequiredFields(mappings: readonly FieldMapping[], rules: readonly ValidationRule[]): string[] {
  return [...new Set(rules.filter(rule => rule.kind === "required").map(rule => rule.field))].filter(field => !mappings.some(mapping => mapping.targetField === field && mapping.sourceField !== null));
}
