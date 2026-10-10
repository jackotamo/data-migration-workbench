# Data Migration & Validation Workbench

An independent portfolio application built by Jack Tam to demonstrate transparent enterprise data migration. Working title: **Migration Workbench — Map. Validate. Reconcile.**

## Current release: Milestone 1

Implemented: responsive application shell, all section navigation, overview, load/clear fictional samples, source/target record previews, detected columns, empty-value profiling, and an accessible FAQ covering the workflow, privacy, metrics, and release limitations. Counts are derived from in-memory datasets. Validation, error/warning totals, match rate, and readiness remain explicitly unassessed until their engines exist.

CSV uploads are deliberately unavailable in this milestone: the CSV parser belongs to Milestone 2. Later section pages explain their scope and release milestone; they do not run processing or fabricate results.

## Stack and setup

Next.js App Router, React, strict TypeScript, Tailwind CSS, Lucide React. Papa Parse, Zod, and Recharts are installed for the scheduled processing and reporting milestones; they are not yet used. No database, authentication, analytics, or external AI services.

Requires Node.js 20.9 or newer (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Click **Try Sample Migration**, then **Data Import** to inspect both datasets. Clear datasets to review the empty state. Navigation preserves loaded samples for the current page session; refreshing clears them.

## Architecture

- `src/app`: App Router entry points, metadata, and responsive styles.
- `src/components/workbench.tsx`: client-side shell and session state using React; dataset previews render text safely.
- `src/lib/types.ts`: explicit dataset, mapping, transformation, validation, and reconciliation contracts.
- `src/lib/sample-data.ts`: independent fictional source/target dataset factories and document type lookup.
- `src/lib/profiling.ts`: pure industry-independent empty-value profiling.
- `tests`: executable foundation tests using Node's test runner and tsx.

Business functions use plain typed values without React, browser storage, or network dependencies. Future processing modules can run behind a server adapter without rewriting their algorithms. No processing engines or fabricated implementation stubs are included in this release.

## Workflow and sample

Import → Map → Transform → Validate → Reconcile → Report.

Samples contain entirely fictional land records and people. Problems intentionally include blanks, duplicate identifiers, invalid dates, unknown types, case/whitespace inconsistency, missing and unexpected target records, and a page-number discrepancy. Lookup vocabulary: WD → Warranty Deed, DT → Deed of Trust, QCD → Quitclaim Deed.

Empty cells are blank or whitespace-only values. Previews preserve original values and show the first five records; no normalization or validation has run. Sample loading replaces both datasets. No dependent results exist yet; subsequent milestones must invalidate results when data or configuration changes.

## Privacy and limits

Datasets remain in React memory for the current browser session. No upload requests, record logging, persistence, or analytics are implemented. Future CSV imports will process locally with planned limits of 5 MB, 10,000 rows, and 100 columns per file. CSV exports and their spreadsheet formula injection protection are planned for Milestone 4.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Foundation tests cover empty datasets, whitespace profiling, untouched original values, sample shape and intended anomalies, and independent sample loads. Parser, mapping, transformation, validation, reconciliation, and report tests will be added alongside those features. Accessibility includes semantic navigation, skip link, visible focus, status announcements, scrollable tables, and reduced motion support. Full browser accessibility, responsive, and performance verification remains scheduled for Milestone 5.

Dependency audit currently reports five high-severity findings in the development-only ESLint configuration chain (`braces` → `micromatch` → `fast-glob` → Next ESLint plugin/config). npm recommends a major downgrade, which is not applied. Review updated upstream fixes before deployment; these packages do not process user datasets.

## Deployment preparation

Compatible with an independent Vercel Next.js project: install with `npm ci`, build with `npm run build`, and use the default Next.js output settings. No environment variables are needed. For a local production review use `npm run build` then `npm start`.

Planned domain: `migration.jack-tam.com`. Deployment, domain setup, remote repository creation, and pushing code require Jack's approval; none are performed by this foundation implementation.

## Remaining milestones

2. CSV parser with strict malformed-input handling, mappings, transformations, and validation.
3. Key selection, reconciliation classifications, field differences, and ambiguity inspection.
4. Calculated processing dashboards, Recharts analytics, safe CSV exports, and usability refinements.
5. Broader automated tests, browser accessibility/responsive/performance review, and final deployment readiness.
