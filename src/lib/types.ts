export type DataRecord = Readonly<Record<string, string>>;
export interface Dataset { name: string; origin: "sample" | "upload"; columns: readonly string[]; records: readonly DataRecord[] }
export interface ColumnProfile { name: string; emptyCount: number }
export type Transformation = { kind: "trim" | "uppercase" | "lowercase" | "date" } | { kind: "lookup"; values: Readonly<Record<string, string>> } | { kind: "default"; value: string };
export interface FieldMapping { sourceField: string | null; targetField: string; transformations: readonly Transformation[] }
export type ValidationRule = { field: string; kind: "required" | "unique" | "date" | "numeric"; severity: "error" | "warning" } | { field: string; kind: "allowed"; values: readonly string[]; severity: "error" | "warning" } | { field: string; kind: "maxLength"; limit: number; severity: "error" | "warning" };
export interface ValidationIssue { recordIdentifier: string; field: string; rule: ValidationRule["kind"]; severity: "error" | "warning"; message: string; originalValue: string | null; transformedValue: string | null }
export interface FieldDifference { field: string; sourceValue: string | null; targetValue: string | null }
export interface ReconciliationResult { key: string | null; status: "matched" | "mismatched" | "missingInTarget" | "unexpectedInTarget" | "invalidOrAmbiguousKey"; differences: readonly FieldDifference[] }
