# Data Migration & Validation Workbench

An independent portfolio application built by Jack Tam to demonstrate transparent enterprise data migration. **Migration Workbench — Map. Validate. Reconcile.**

## Current release: Milestone 2

The existing responsive shell, navigation, dataset inspection, FAQ, and portfolio link are preserved. Implemented:

- Local source/target CSV import, parsing feedback, original-record previews, and empty-cell profiles.
- Deterministic mapping suggestions, editable assignments, required-field indicators, and transformed previews.
- Ordered trim, uppercase, lowercase, strict date normalization, exact lookups, and missing-value defaults.
- Configurable required, unique, date, allowed-value, maximum-length, and numeric validation rules with error/warning severity.
- Automatically current validation summaries and searchable/filterable exceptions, paginated at 50 issues per page.

Reconciliation and downloadable reports are explicitly unavailable. Match rate remains unassessed, and passing configured validation rules does not prove migration readiness.

## Stack and local setup

Next.js App Router, React, strict TypeScript, Tailwind CSS, Lucide React, Papa Parse, and Zod. Recharts is installed for the future reporting milestone. No database, authentication, analytics, or external AI services.

Requires Node.js 20.9 or newer (Node 24 recommended).

```sh
npm ci
npm run dev -- --port 3001
```

Open http://localhost:3001. Port 3001 avoids the portfolio site's local port 3000. The default `npm run dev` still uses port 3000. Refreshing clears all datasets and configuration.

## Architecture

- `src/app`: App Router entry points and responsive styles.
- `src/components/workbench.tsx`: session state, local file reads, navigation, import and overview screens.
- `src/components/processing.tsx`: mapping, transformation configuration, validation rules and exceptions UI.
- `src/components/faq.tsx`: workflow and privacy explanations.
- `src/lib/types.ts`: explicit datasets, mappings, transformations, validation issues, summaries, and future reconciliation contracts.
- `src/lib/csv.ts`: bounded Papa Parse parser with malformed-input checks.
- `src/lib/profiling.ts`: original-data empty-cell profiling.
- `src/lib/mapping.ts`: deterministic similarity, mapping checks, required-field detection.
- `src/lib/transformations.ts`: pure ordered transforms and source-to-target record projection.
- `src/lib/validation.ts`: Zod configuration validation and independent validation engine.
- `src/lib/sample-data.ts`, `sample-config.ts`: fictional records and editable county-specific presets, separate from generic engines.
- `src/lib/session.ts`: pure session transitions that replace datasets and reset dependent configuration atomically.
- `tests`: automated Node tests executed through tsx.

Core processing uses plain TypeScript values without React, network calls, storage, or DOM dependencies. A future server or worker adapter can reuse these modules. UI state uses React hooks; no global state dependency is needed.

Transformed records, original mapped-value snapshots, and transformation failures are derived with `useMemo`. Validation is recomputed when datasets, mappings, transformations, rules, or the display identifier change; old result state is never retained. Replacing either dataset resets saved mappings, transforms, rules, and identifier configuration. New mappings are suggested from the current columns. Failed imports retain previous data and results and clearly report the failure. Import generations prevent an older file read from replacing a newer selection or a freshly loaded sample.

## Workflow and processing semantics

Import → Map → Transform → Validate is implemented. Reconcile → Report remains planned.

Mappings have one row per detected target field, so duplicate target assignments cannot be created in the UI. Core guards reject duplicate target fields and unknown source fields. Suggestions normalize case/punctuation and use character bigram similarity with a 0.65 threshold plus a fixed county alias dictionary. Equal-score ties use source column order. Suggestions are deterministic; they do not infer business meaning. Source reuse across different targets is allowed.

Required fields come from configured required rules. Unmapped required fields are identified even if a default might populate them. Optional fields can remain unmapped. Defaults can be applied to unmapped fields, yielding constants; original mapped values remain null.

Transformations run in the displayed order. You can add, remove, and move them. Trim removes surrounding whitespace; case transformations are explicit. Default fills null, empty, or whitespace-only values and leaves `0` unchanged. Lookup keys and outputs are configurable text via a JSON object; edits take effect only after **Apply lookup**. Unsaved drafts are labeled. Lookup comparisons are exact and case-sensitive; unknown nonblank keys retain their current value and produce errors. No `eval` or dynamically executed user code is used.

Dates accept `YYYY-MM-DD` or explicitly US `M/D/YYYY` / `MM/DD/YYYY`, with years 0001–9999. Calendar days and leap years are checked without `Date.parse` or date rollover. Normalized output is `YYYY-MM-DD`, not a timezone-bearing timestamp. Invalid values stay visibly invalid and generate transformation errors; later transformations do not erase those errors. Blank dates are skipped unless required. Timestamps, locale-dependent formats, Excel serial dates, and day-first dates are unsupported.

Validation applies only to transformed **source** records. The selected record identifier controls exception labels, not uniqueness requirements: add a unique rule separately. Missing identifiers fall back to row labels. Every issue includes zero-based row index, record identifier, field, rule, severity, message, original value, and transformed value. Row indexes distinguish duplicate labels.

Unique rules flag every occurrence of a duplicate and missing identifiers. Comparisons are exact; whitespace and case are changed only through configured transformations. Required treats null, blank, and whitespace-only values as missing. Other rules skip missing values. Allowed values are exact and case-sensitive. Maximum length uses JavaScript string length (UTF-16 code units). Numeric validation accepts finite signed decimal values and rejects surrounding whitespace, commas, exponents, hexadecimal, NaN, and Infinity; apply trim first if needed. Date validation accepts the same calendar formats as date normalization.

Transformation failures are always error issues, even without a corresponding validation rule. Record error/warning counts are distinct from issue counts: a row may have multiple issues and both severities. Without-issues counts rows with neither. Overview validation metrics remain unassessed until both datasets and at least one rule exist. Rule coverage and target reconciliation still require review before a migration decision.

## Sample scenario

All names and land records are entirely fictional. Sample loading provides source/target data, suggested mappings, trim transforms, date normalization, document-type lookups, and editable validation rules. Presets are loaded only by **Try Sample Migration** / **Load Sample Data**; arbitrary CSV uploads do not inherit county rules.

Problems include blank identifiers and grantors, duplicate document numbers, invalid dates, unknown document types, whitespace/case inconsistency, missing/unexpected target records, and a page-number difference. The last three comparison problems require future reconciliation. Lookups: WD → Warranty Deed, DT → Deed of Trust, QCD → Quitclaim Deed.

Under the default sample configuration, 10 source records are checked; 5 have errors, 5 have no issues, and 9 error issues are generated. These are calculated results, asserted by tests, not hardcoded dashboard values. No warning issues occur under the default rules; lower the LegalDescription length limit or change a rule's severity to explore warnings.

## Manual verification

1. **Import:** try the sample, inspect both previews, and upload CSVs with a header row. Quoted commas, escaped quotes, multiline values, BOM, and CRLF are supported. Try a missing closing quote or inconsistent row width to see a clear error with prior data preserved.
2. **Mapping:** open Field Mapping. Change the source selection for a target, leave a required field unmapped, and see the warning and live preview. Use Suggest mappings to restore suggestions while retaining current transforms. No target can be assigned twice because each target has one row.
3. **Transforms:** choose DocumentType and inspect trim → uppercase → lookup. Move lookup above uppercase to see order-related errors. Edit JSON translations and click Apply lookup. Choose RecordingDate to see `02/30/2025` preserved and flagged. Add a default to an unmapped optional field; type a value and inspect the preview. Import preview values remain unchanged.
4. **Validation:** inspect default sample exceptions. Choose DocumentNumber as the display identifier. Search `2025-006` to see both duplicate rows; filter by field and severity. Edit the LegalDescription maximum length to `10` with warning severity. Add/edit/remove any of the six rule types and observe immediate summary updates.
5. **Current results:** change a mapping or transformation, revisit Validation and Overview, and confirm the recalculated values. Replace a dataset and confirm rules reset; clear or refresh to remove the session.
6. **Responsive/accessibility:** check mobile navigation and form wrapping, horizontally scroll large tables, and use Tab/Enter/Space with labeled native controls. The portfolio link remains available on all screens.

## Privacy and processing limits

CSV files are read through the browser File API and processed in memory. Records are never uploaded, persisted in browser storage, or included in analytics/logs. React safely renders user text. Object-property-like CSV headers and lookup keys are treated as data. No CSV exports exist yet; formula injection protection will accompany exports in Milestone 4.

Limits per file: 5 MB, 10,000 records, 100 columns. Headers must be nonempty, at most 200 characters, and unique ignoring case, and each record must match header width. Header-only and empty CSVs are rejected; pure engines still handle empty datasets. Empty physical lines are skipped, but explicit empty-cell records (such as `,`) are retained for validation. Column names are trimmed, cell values are preserved. Delimiter detection is supported by Papa Parse; a single column defaults to comma parsing.

Processing is synchronous after the bounded local read, so large imports or many configured rules can briefly occupy the main thread. Web Worker processing, full accessibility auditing, and broader performance testing are future work. No live-system writes, reconciliation, exports, or storage are included.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Tests cover parsing and limits, malformed/empty inputs, deterministic and incorrect mappings, required/unmapped fields, null and empty values, transformation ordering, exact lookups, leap-day and invalid-date behavior, nonmutation, duplicate identifiers, all validation rule kinds, structured errors, summary counting, and recalculation.

Milestone 2 verification: lint, strict type checking, all 37 automated tests, and production build passed. Browser checks exercised sample totals, mapping changes, exception search, lookup configuration, invalid dates, defaults, rule editing, CSV uploads, failed-import retention, and configuration resets. Transformation, validation, and import layouts were checked at a 390px viewport. The 10,000-record processing test verifies correctness at the row limit, not a cross-device performance guarantee. A full accessibility audit remains future work.

The prior dependency audit reported five high-severity findings in development-only ESLint dependencies (`braces` → `micromatch` → `fast-glob` → Next ESLint plugin/config). npm recommended a major downgrade, which was not applied. Review upstream updates before deployment; these packages do not process user datasets.

## Deployment preparation

Compatible with an independent Vercel Next.js project. Install with `npm ci`, build with `npm run build`, and use default Next.js output settings. No environment variables are required. For a local production review use `npm run build` then `npm start -- --port 3001`.

Public repository: https://github.com/jackotamo/data-migration-workbench. Planned domain: `migration.jack-tam.com`. Deploying, configuring the domain, or pushing further changes requires approval. Milestone 2 does not deploy or push.

## Remaining milestones

3. Key selection, reconciliation classifications, field differences, and ambiguity inspection.
4. Processing charts, safe CSV exports, and reporting refinements.
5. Broader browser accessibility, responsive and performance review, and final deployment readiness.
