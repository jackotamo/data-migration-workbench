import Papa from "papaparse";
import type { Dataset } from "./types";

export const CSV_LIMITS = { bytes: 5 * 1024 * 1024, rows: 10_000, columns: 100 } as const;

export function parseCsv(text: string, name = "dataset.csv"): Dataset {
  if (new TextEncoder().encode(text).length > CSV_LIMITS.bytes) throw new Error("CSV exceeds the 5 MB file limit.");
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), { skipEmptyLines: true, preview: CSV_LIMITS.rows + 2 });
  const parseError = result.errors.find(error => error.code !== "UndetectableDelimiter");
  if (parseError) throw new Error(`Malformed CSV: ${parseError.message}`);
  const [header, ...rows] = result.data;
  if (!header?.length) throw new Error("CSV is empty. Include a header row and at least one record.");
  const columns = header.map(value => value.trim());
  if (columns.length > CSV_LIMITS.columns) throw new Error("CSV exceeds the 100-column limit.");
  if (columns.some(column => !column)) throw new Error("Every column must have a nonempty header.");
  if (columns.some(column => column.length > 200)) throw new Error("Column names must be 200 characters or fewer.");
  if (new Set(columns.map(column => column.toLowerCase())).size !== columns.length) throw new Error("Column names must be unique (ignoring case).");
  if (rows.length > CSV_LIMITS.rows || result.meta.truncated) throw new Error("CSV exceeds the 10,000-record limit.");
  if (!rows.length) throw new Error("CSV has headers but no records.");
  for (let index = 0; index < rows.length; index++) {
    if (rows[index].length !== columns.length) throw new Error(`Record ${index + 1} has ${rows[index].length} cells; expected ${columns.length}.`);
  }
  return { name, origin: "upload", columns, records: rows.map(row => Object.fromEntries(columns.map((column, index) => [column, row[index]]))) };
}
