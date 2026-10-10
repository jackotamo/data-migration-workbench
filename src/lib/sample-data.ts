import type { Dataset } from "./types";
export const documentTypeLookup = { WD: "Warranty Deed", DT: "Deed of Trust", QCD: "Quitclaim Deed" } as const;
const sourceColumns = ["InstrumentNum", "DocType", "RecordDt", "Grantor", "Grantee", "Book", "Page", "LegalDescription"];
const targetColumns = ["DocumentNumber", "DocumentType", "RecordingDate", "GrantorName", "GranteeName", "BookNumber", "PageNumber", "LegalDescription"];
const sourceRows = [
  ["2025-001", "WD", "01/08/2025", " Mara Bellwood ", "Ellis Fernbrook", "142", "18", "Lot 4, Willow Reach"],
  ["2025-002", "DT", "01/09/2025", "Tobin Ashmere", "Cedar Vale Lending", "142", "22", "Lot 7, Cedar Vale"],
  ["2025-003", "QCD", "2025-01-10", "NORA GLENWICK", "Ivo Reedmere", "142", "31", "Tract B, Reed Hollow"],
  ["2025-004", "WD", "02/30/2025", "Elara Mossford", "Finn Aldercrest", "143", "5", "Lot 2, Moss Grove"],
  ["2025-005", "XYZ", "01/12/2025", "Lena Brookhollow", "Oren Hazelbank", "143", "9", "Lot 9, Hazel Bend"],
  ["2025-006", "WD", "01/13/2025", "", "Pia Thornvale", "143", "12", "Lot 3, Thorn Vale"],
  ["2025-006", "DT", "01/14/2025", "Soren Elmwick", "Arden Birchwell", "143", "14", "Lot 6, Birch Meadow"],
  ["", "WD", "01/15/2025", "Milo Woodmere", "Tessa Oakfen", "", "19", "Tract C, Oak Fen"],
  ["2025-009", " wd ", "01/16/2025", " ada Wrenfield ", "Noel Pinehaven", "144", "2", "Lot 1, Pine Haven"],
  ["2025-010", "QCD", "01/17/2025", "Rhea Cloverden", "Emil Foxgrove", "144", "8", "Lot 8, Fox Grove"]
];
const targetRows = [
  ["2025-001", "Warranty Deed", "2025-01-08", "Mara Bellwood", "Ellis Fernbrook", "142", "18", "Lot 4, Willow Reach"],
  ["2025-002", "Deed of Trust", "2025-01-09", "Tobin Ashmere", "Cedar Vale Lending", "142", "23", "Lot 7, Cedar Vale"],
  ["2025-003", "Quitclaim Deed", "2025-01-10", "Nora Glenwick", "Ivo Reedmere", "142", "31", "Tract B, Reed Hollow"],
  ["2025-004", "Warranty Deed", "2025-02-28", "Elara Mossford", "Finn Aldercrest", "143", "5", "Lot 2, Moss Grove"],
  ["2025-005", "Warranty Deed", "2025-01-12", "Lena Brookhollow", "Oren Hazelbank", "143", "9", "Lot 9, Hazel Bend"],
  ["2025-006", "Warranty Deed", "2025-01-13", "Luca Mistvale", "Pia Thornvale", "143", "12", "Lot 3, Thorn Vale"],
  ["2025-009", "Warranty Deed", "2025-01-16", "Ada Wrenfield", "Noel Pinehaven", "144", "2", "Lot 1, Pine Haven"],
  ["2025-099", "Warranty Deed", "2025-01-18", "Cora Rivermist", "Otis Meadowfern", "144", "11", "Lot 5, River Mist"]
];
function createDataset(name: string, columns: string[], rows: string[][]): Dataset {
  return { name, origin: "sample", columns: [...columns], records: rows.map(row => Object.fromEntries(columns.map((column, index) => [column, row[index]]))) };
}
export function loadSampleDatasets(): { source: Dataset; target: Dataset } {
  return { source: createDataset("county-source.csv", sourceColumns, sourceRows), target: createDataset("county-target.csv", targetColumns, targetRows) };
}
