import { suggestMappings } from "./mapping";
import { documentTypeLookup } from "./sample-data";
import type { Dataset, FieldMapping, ValidationRule } from "./types";
export function sampleMappings(source: Dataset, target: Dataset): FieldMapping[] {
  return suggestMappings(source.columns, target.columns).map(mapping => ({ ...mapping, transformations: mapping.targetField === "DocumentType" ? [{ kind: "trim" }, { kind: "uppercase" }, { kind: "lookup", values: documentTypeLookup }] : mapping.targetField === "RecordingDate" ? [{ kind: "trim" }, { kind: "date" }] : [{ kind: "trim" }] }));
}
export function sampleRules(): ValidationRule[] {
  return [
    ...["DocumentNumber", "DocumentType", "RecordingDate", "GrantorName", "GranteeName"].map(field => ({ field, kind: "required" as const, severity: "error" as const })),
    { field: "DocumentNumber", kind: "unique", severity: "error" },
    { field: "RecordingDate", kind: "date", severity: "error" },
    { field: "DocumentType", kind: "allowed", values: Object.values(documentTypeLookup), severity: "error" },
    { field: "LegalDescription", kind: "maxLength", limit: 80, severity: "warning" },
    { field: "BookNumber", kind: "numeric", severity: "warning" },
    { field: "PageNumber", kind: "numeric", severity: "warning" },
  ];
}
