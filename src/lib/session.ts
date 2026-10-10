import { suggestMappings } from "./mapping";
import { sampleMappings, sampleRules } from "./sample-config";
import { loadSampleDatasets } from "./sample-data";
import type { Dataset, FieldMapping, ValidationRule } from "./types";

export interface MigrationSession {
  datasets: { source: Dataset; target: Dataset } | null;
  mappings: FieldMapping[];
  rules: ValidationRule[];
  identifierField: string;
}

export function emptySession(): MigrationSession {
  return { datasets: null, mappings: [], rules: [], identifierField: "" };
}

export function sampleSession(): MigrationSession {
  const datasets = loadSampleDatasets();
  return { datasets, mappings: sampleMappings(datasets.source, datasets.target), rules: sampleRules(), identifierField: "DocumentNumber" };
}

/** Replace data and dependent configuration together; never carry rules between schemas. */
export function replaceDataset(previous: MigrationSession, side: "source" | "target", dataset: Dataset): MigrationSession {
  const empty: Dataset = { name: "No dataset loaded", origin: "upload", columns: [], records: [] };
  const datasets = { source: previous.datasets?.source ?? empty, target: previous.datasets?.target ?? empty, [side]: dataset };
  return { datasets, mappings: suggestMappings(datasets.source.columns, datasets.target.columns), rules: [], identifierField: "" };
}
