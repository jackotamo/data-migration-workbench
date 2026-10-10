import type { ColumnProfile, Dataset } from "./types";
export function profileDataset(dataset: Dataset): ColumnProfile[] {
  return dataset.columns.map(name => ({ name, emptyCount: dataset.records.reduce((count, row) => count + ((row[name] ?? "").trim() === "" ? 1 : 0), 0) }));
}
