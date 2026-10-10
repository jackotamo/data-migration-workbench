import { z } from "zod";
import type { ProcessedDataset, ValidationIssue, ValidationRule, ValidationSummary } from "./types";
import { isMissing, normalizeDate } from "./transformations";

const base = { field: z.string().min(1), severity: z.enum(["error", "warning"]) };
export const validationRuleSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("required") }), z.object({ ...base, kind: z.literal("unique") }),
  z.object({ ...base, kind: z.literal("date") }), z.object({ ...base, kind: z.literal("numeric") }),
  z.object({ ...base, kind: z.literal("allowed"), values: z.array(z.string()).min(1) }),
  z.object({ ...base, kind: z.literal("maxLength"), limit: z.number().int().nonnegative().max(1_000_000) }),
]);
export function validateDataset(processed: ProcessedDataset, rules: readonly ValidationRule[], identifierField: string): { issues: ValidationIssue[]; summary: ValidationSummary } {
  const issues: ValidationIssue[] = [];
  const identifier = (rowIndex: number) => isMissing(processed.records[rowIndex][identifierField]) ? `Row ${rowIndex + 1}` : processed.records[rowIndex][identifierField]!;
  const add = (rowIndex: number, field: string, rule: ValidationIssue["rule"], severity: ValidationIssue["severity"], message: string) => issues.push({ rowIndex, recordIdentifier: identifier(rowIndex), field, rule, severity, message, originalValue: processed.originalRecords[rowIndex]?.[field] ?? null, transformedValue: processed.records[rowIndex][field] ?? null });
  for (const error of processed.transformationErrors) add(error.rowIndex, error.field, "transformation", "error", error.message);
  for (const rule of rules) {
    validationRuleSchema.parse(rule);
    const counts = new Map<string, number>();
    if (rule.kind === "unique") for (const row of processed.records) { const value = row[rule.field]; if (!isMissing(value)) counts.set(value!, (counts.get(value!) ?? 0) + 1); }
    processed.records.forEach((row, index) => {
      const value = row[rule.field] ?? null; const missing = isMissing(value); let message: string | null = null;
      switch (rule.kind) {
        case "required": if (missing) message = "A required value is missing."; break;
        case "unique": if (missing) message = "The unique identifier is missing."; else if ((counts.get(value!) ?? 0) > 1) message = "Duplicate identifier. Every occurrence is flagged."; break;
        case "date": if (!missing && normalizeDate(value!) === null) message = "Value is not a valid calendar date (YYYY-MM-DD or MM/DD/YYYY)."; break;
        case "allowed": if (!missing && !rule.values.includes(value!)) message = "Value is not in the configured allowed values."; break;
        case "maxLength": if (!missing && value!.length > rule.limit) message = `Value exceeds the maximum length of ${rule.limit}.`; break;
        case "numeric": if (!missing && (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value!) || !Number.isFinite(Number(value)))) message = "Value must be a finite decimal number without whitespace or separators."; break;
      }
      if (message) add(index, rule.field, rule.kind, rule.severity, message);
    });
  }
  const errors = new Set(issues.filter(issue => issue.severity === "error").map(issue => issue.rowIndex));
  const warnings = new Set(issues.filter(issue => issue.severity === "warning").map(issue => issue.rowIndex));
  const affected = new Set(issues.map(issue => issue.rowIndex));
  return { issues, summary: { totalRecords: processed.records.length, recordsWithErrors: errors.size, recordsWithWarnings: warnings.size, recordsWithoutIssues: processed.records.length - affected.size, errorCount: issues.filter(issue => issue.severity === "error").length, warningCount: issues.filter(issue => issue.severity === "warning").length } };
}
