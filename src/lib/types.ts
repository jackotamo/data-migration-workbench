export type DataRecord = Readonly<Record<string, string | null>>;
export interface Dataset { name: string; origin: "sample" | "upload"; columns: readonly string[]; records: readonly DataRecord[] }
export interface ColumnProfile { name: string; emptyCount: number }
export type Transformation = { kind: "trim" | "uppercase" | "lowercase" | "date" } | { kind: "lookup"; values: Readonly<Record<string, string>> } | { kind: "default"; value: string };
export interface FieldMapping { sourceField: string | null; targetField: string; transformations: readonly Transformation[] }
export type ValidationRule = { field: string; kind: "required" | "unique" | "date" | "numeric"; severity: "error" | "warning" } | { field: string; kind: "allowed"; values: readonly string[]; severity: "error" | "warning" } | { field: string; kind: "maxLength"; limit: number; severity: "error" | "warning" };
export interface ValidationIssue { rowIndex: number; recordIdentifier: string; field: string; rule: ValidationRule["kind"] | "transformation"; severity: "error" | "warning"; message: string; originalValue: string | null; transformedValue: string | null }
export interface TransformationError { rowIndex: number; field: string; message: string }
export interface ProcessedDataset { records: readonly DataRecord[]; originalRecords: readonly DataRecord[]; transformationErrors: readonly TransformationError[] }
export interface ValidationSummary { totalRecords: number; recordsWithErrors: number; recordsWithWarnings: number; recordsWithoutIssues: number; errorCount: number; warningCount: number }
export interface FieldDifference { field: string; sourceValue: string | null; targetValue: string | null }
export interface ReconciliationResult { key: string | null; status: "matched" | "mismatched" | "missingInTarget" | "unexpectedInTarget" | "invalidOrAmbiguousKey"; differences: readonly FieldDifference[] }
