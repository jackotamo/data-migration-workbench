# County sample: independent validation guide

These CSVs contain the exact fictional source and target records loaded by **Try Sample Migration**. Quoted cells preserve the source's intentional surrounding whitespace. The source has 10 records; the target has 8.

## Counting rows

App row numbers count records, excluding the CSV header. App row 4 is spreadsheet row 5; app row 8 is spreadsheet row 9.

## Mapping and transformations

| Source | Target | Transformations, in order |
| --- | --- | --- |
| InstrumentNum | DocumentNumber | Trim |
| DocType | DocumentType | Trim, uppercase, lookup |
| RecordDt | RecordingDate | Trim, normalize calendar date |
| Grantor | GrantorName | Trim |
| Grantee | GranteeName | Trim |
| Book | BookNumber | Trim |
| Page | PageNumber | Trim |
| LegalDescription | LegalDescription | Trim |

Lookups: WD → Warranty Deed; DT → Deed of Trust; QCD → Quitclaim Deed. Unknown codes are preserved and flagged. Dates accept YYYY-MM-DD or US MM/DD/YYYY. Invalid calendar days are preserved and flagged, not rolled into another month.

## Default validation rules

- Required (error): DocumentNumber, DocumentType, RecordingDate, GrantorName, GranteeName.
- Unique (error): DocumentNumber. Every duplicate occurrence is flagged; missing identifiers are also flagged.
- Valid date (error): RecordingDate.
- Allowed values (error): DocumentType must be Warranty Deed, Deed of Trust, or Quitclaim Deed.
- Maximum length (warning): LegalDescription, 80 characters.
- Numeric (warning): BookNumber and PageNumber. Blank optional values are skipped.
- Failed transformations also create error issues, independently of validation rules.

## Expected exceptions

| App record row | Spreadsheet row | Identifier | Field | Rule | Reason |
| --- | --- | --- | --- | --- | --- |
| 4 | 5 | 2025-004 | RecordingDate | transformation | 02/30/2025 cannot be normalized: February has no day 30. |
| 4 | 5 | 2025-004 | RecordingDate | date | The preserved date is invalid. |
| 5 | 6 | 2025-005 | DocumentType | transformation | XYZ has no lookup translation. |
| 5 | 6 | 2025-005 | DocumentType | allowed | Preserved XYZ is not an allowed document type. |
| 6 | 7 | 2025-006 | GrantorName | required | Grantor is empty. |
| 6 | 7 | 2025-006 | DocumentNumber | unique | Same identifier as app row 7. |
| 7 | 8 | 2025-006 | DocumentNumber | unique | Same identifier as app row 6. |
| 8 | 9 | Missing (Row 8 label) | DocumentNumber | required | InstrumentNum is empty. |
| 8 | 9 | Missing (Row 8 label) | DocumentNumber | unique | The unique identifier is missing. |

Expected totals: **10 records checked, 5 records with errors, 9 error issues, 0 warning issues, and 5 records without issues**. Records without validation issues are app rows 1, 2, 3, 9, and 10. Uppercase names on row 3 and whitespace/case differences on row 9 are not errors under the default validation rules.

The empty Book value on app row 8 is optional, so the numeric rule does not flag it. Name capitalization is not restricted by a default rule.

## Target comparison is separate

Milestone 2 validates transformed source records; it does not compare target records yet. You can manually spot target differences, including the page number for 2025-002, name capitalization for 2025-003, the missing 2025-010, and unexpected 2025-099. These do not contribute to the current validation totals.

## How to reproduce

Open the two CSVs alongside the app and choose **Try Sample Migration** to restore the exact mappings, transforms, and rules listed above. Uploading either CSV yourself intentionally resets configuration; to reproduce the same results after uploading, configure the transformations and rules in this guide.

For a spreadsheet review, import columns as text to avoid automatic date or identifier conversion. Do not save over the original files while inspecting them.
