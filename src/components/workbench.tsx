"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowRightLeft, Check, ChevronRight, CircleHelp, Database, FileCheck2, Files, GitBranch, LayoutDashboard, LockKeyhole, RotateCcw, ShieldCheck, Sparkles, Table2, WandSparkles } from "lucide-react";
import { Faq } from "./faq";
import { MappingPanel, TransformationPanel, ValidationPanel } from "./processing";
import { CSV_LIMITS, parseCsv } from "@/lib/csv";
import { unmappedRequiredFields } from "@/lib/mapping";
import { emptySession, replaceDataset, sampleSession } from "@/lib/session";
import { transformDataset } from "@/lib/transformations";
import { validateDataset } from "@/lib/validation";
import { profileDataset } from "@/lib/profiling";
import type { Dataset, FieldMapping, ValidationRule } from "@/lib/types";

const sections = [
  { name: "Overview", icon: LayoutDashboard, milestone: 1 },
  { name: "Data Import", icon: Database, milestone: 1 },
  { name: "Field Mapping", icon: GitBranch, milestone: 2 },
  { name: "Transformations", icon: WandSparkles, milestone: 2 },
  { name: "Validation", icon: ShieldCheck, milestone: 2 },
  { name: "Reconciliation", icon: ArrowRightLeft, milestone: 3 },
  { name: "Reports", icon: FileCheck2, milestone: 4 },
  { name: "FAQ", icon: CircleHelp, milestone: 1 },
] as const;
type Section = typeof sections[number]["name"];

export function Workbench() {
  const [active, setActive] = useState<Section>("Overview");
  const [session, setSession] = useState(emptySession);
  const { datasets, mappings, rules, identifierField } = session;
  const [notice, setNotice] = useState("");
  const setMappings = (mappings: FieldMapping[]) => setSession(previous => ({ ...previous, mappings }));
  const setRules = (rules: ValidationRule[]) => setSession(previous => ({ ...previous, rules }));
  const setIdentifierField = (identifierField: string) => setSession(previous => ({ ...previous, identifierField }));
  const [importStatus, setImportStatus] = useState({ source: "", target: "" });
  const [datasetRevision, setDatasetRevision] = useState(0);
  const importGeneration = useRef({ source: 0, target: 0 });
  const resetImport = () => { importGeneration.current.source++; importGeneration.current.target++; setImportStatus({ source: "", target: "" }); setDatasetRevision(previous => previous + 1); };
  const loadSample = () => { resetImport(); setSession(sampleSession()); setNotice("Fictional county sample loaded with suggested mappings, transformation rules, and validation requirements. Review each configuration."); };
  const clear = () => { resetImport(); setSession(emptySession()); setNotice("Datasets and processing configuration cleared from this session."); };
  const upload = async (side: "source" | "target", file: File) => {
    const generation = ++importGeneration.current[side];
    setImportStatus(previous => ({ ...previous, [side]: "Reading CSV locally…" }));
    try {
      if (file.size > CSV_LIMITS.bytes) throw new Error("CSV exceeds the 5 MB file limit.");
      const text = await file.text();
      if (generation !== importGeneration.current[side]) return;
      const dataset = parseCsv(text, file.name);
      setSession(previous => replaceDataset(previous, side, dataset));
      setDatasetRevision(previous => previous + 1);
      setNotice("Dataset replaced. Mappings and rules were reset; review suggested mappings and configure validation requirements.");
      setImportStatus(previous => ({ ...previous, [side]: `Loaded ${dataset.records.length.toLocaleString()} records and ${dataset.columns.length} columns from ${file.name}.` }));
    } catch (error) { if (generation === importGeneration.current[side]) setImportStatus(previous => ({ ...previous, [side]: `Import failed: ${error instanceof Error ? error.message : "Unable to read CSV."} Previous data was kept.` })); }
  };
  const effectiveMappings = mappings;
  const processed = useMemo(() => datasets ? transformDataset(datasets.source, effectiveMappings) : null, [datasets, effectiveMappings]);
  const validation = useMemo(() => processed ? validateDataset(processed, rules, identifierField) : null, [processed, rules, identifierField]);
  const missingRequired = unmappedRequiredFields(effectiveMappings, rules);
  const canProcess = !!datasets?.source.columns.length && !!datasets?.target.columns.length;
  const current = sections.find(section => section.name === active)!;
  return <div className="app-shell">
    <a href="#main" className="skip-link">Skip to workspace</a>
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><ArrowRightLeft size={22} /></span><div>Migration<span>WORKBENCH</span></div></div>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation">{sections.map(({ name, icon: Icon, milestone }) => <button key={name} onClick={() => setActive(name)} aria-current={active === name ? "page" : undefined} className={`nav-item ${active === name ? "active" : ""}`}><Icon size={18} /><span>{name}</span>{milestone > 2 && <span className="later-dot" title={`Available in milestone ${milestone}`} />}</button>)}</nav>
      <div className="sidebar-note"><LockKeyhole size={19} /><strong>Your data stays yours.</strong><p>Datasets stay in this browser session. No server storage.</p><span>LOCAL PROCESSING</span></div>
      <div className="sidebar-footer"><span className="avatar">JT</span><div>Jack Tam<span>Portfolio project</span></div><span className="version">v0.2</span></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div>Workspace <ChevronRight size={14} /><strong>{active}</strong></div><div className="topbar-actions"><span className="local-status"><i /> Browser-local workspace</span><a className="portfolio-link" href="https://jack-tam.com"><ArrowLeft size={14} aria-hidden="true" /> Back to portfolio</a></div></header>
      <main id="main" tabIndex={-1}>
        <div className="page-heading"><div><div className="eyebrow">DATA MIGRATION & VALIDATION</div><h1>{active === "Overview" ? "Migration overview" : active === "FAQ" ? "Frequently asked questions" : active}</h1><p>{active === "Overview" ? "A clear path from source data to migration confidence." : active === "Data Import" ? "Bring your source and target structures into one workspace." : active === "FAQ" ? "Straightforward answers about your data and the migration workflow." : "The next stage in your migration workflow."}</p></div><button className="primary" onClick={loadSample}><Sparkles size={16} /> Try Sample Migration</button></div>
        <div className="announcement" role="status"><span className="pill">MILESTONE 2</span><span>Import, mapping, transformations, and validation are ready. Reconciliation and reports are coming next.</span></div>
        {notice && <div className="notice" role="status"><Check size={16} />{notice}</div>}
        {active === "FAQ" ? <Faq /> : active === "Field Mapping" || active === "Transformations" || active === "Validation" ? !canProcess || !datasets ? <section className="panel future-stage"><Database size={38} /><h2>Load source and target data first</h2><p>Try Sample Migration or import both CSV datasets to configure and validate a migration.</p><button className="secondary" onClick={() => setActive("Data Import")}>Go to data import <ArrowRight size={16} /></button></section> : active === "Field Mapping" ? <MappingPanel source={datasets.source} target={datasets.target} mappings={effectiveMappings} rules={rules} onChange={setMappings} /> : active === "Transformations" ? <TransformationPanel key={datasetRevision} source={datasets.source} mappings={effectiveMappings} onChange={setMappings} /> : <ValidationPanel key={datasetRevision} target={datasets.target} rules={rules} onRulesChange={setRules} identifierField={identifierField} onIdentifierChange={setIdentifierField} issues={validation!.issues} summary={validation!.summary} /> : active === "Overview" ? <>
          <section className="hero"><div><span className="hero-kicker"><span /> BUILT FOR DATA INTEGRITY</span><h2>Map. Validate.<br /><em>Reconcile.</em></h2><p>Turn migration uncertainty into a transparent, repeatable workflow. Start with fictional county land records and inspect both sides of the move.</p><button className="hero-button" onClick={() => setActive("Data Import")}>Explore your datasets <ArrowRight size={17} /></button></div><div className="pipeline-visual" aria-label="Source to target workflow"><div className="data-node"><Database size={28} /><strong>Source</strong><span>{datasets?.source.columns.length ? `${datasets.source.records.length} records loaded` : "Awaiting dataset"}</span></div><div className="connector"><span /><ArrowRight size={18} /><small>MAP & VERIFY</small></div><div className="data-node target"><Table2 size={28} /><strong>Target</strong><span>{datasets?.target.columns.length ? `${datasets.target.records.length} records loaded` : "Awaiting dataset"}</span></div><div className="visual-caption"><LockKeyhole size={13} /> Private by design. Local by default.</div></div></section>
          <section aria-label="Migration metrics" className="metrics">{[
            ["Source records", datasets?.source.columns.length ? datasets.source.records.length.toLocaleString() : "—", "Rows in the source dataset", Database],
            ["Target records", datasets?.target.columns.length ? datasets.target.records.length.toLocaleString() : "—", "Rows in the target dataset", Files],
            ["Records checked", canProcess && rules.length ? validation!.summary.totalRecords.toLocaleString() : "—", canProcess && rules.length ? "Checked against current rules" : "Configure validation rules", ShieldCheck],
            ["Match rate", "—", "Reconciliation has not run", ArrowRightLeft],
          ].map(([label, value, description, Icon]) => { const MetricIcon = Icon as typeof Database; return <article className="metric" key={String(label)}><div><span>{String(label)}</span><MetricIcon size={18} /></div><strong>{String(value)}</strong><p>{String(description)}</p></article>; })}</section>
          <div className="overview-grid"><section className="panel"><div className="panel-heading"><div><h2>Your migration journey</h2><p>One workflow. Every decision visible.</p></div><span className="neutral-tag">6 stages</span></div><ol className="journey">{["Import", "Map", "Transform", "Validate", "Reconcile", "Report"].map((name, index) => <li key={name}><span className={index === 0 && canProcess ? "step complete" : "step"}>{index === 0 && canProcess ? <Check size={16} /> : String(index + 1).padStart(2, "0")}</span><div><strong>{name}</strong><p>{[canProcess ? "Source and target datasets loaded" : "Load source and target data", "Align fields between structures", "Standardize values consistently", "Check target requirements", "Compare records and differences", "Export findings for review"][index]}</p></div><span className="stage-status">{index === 0 ? canProcess ? "Loaded" : "Ready" : index < 4 ? canProcess ? "Available" : "Load data" : "Upcoming"}</span></li>)}</ol></section>
          <section className="panel readiness"><div className="panel-heading"><div><h2>Migration readiness</h2><p>Evidence before confidence.</p></div><ShieldCheck size={21} /></div><div className="readiness-icon"><FileCheck2 size={32} /></div><h3>{!canProcess ? "Load both datasets" : !rules.length ? "Configure validation rules" : validation!.summary.recordsWithErrors ? "Resolve validation errors" : missingRequired.length ? "Review required mappings" : "Review validation coverage"}</h3><p>{canProcess ? "Validation reflects the current configuration. Review rule coverage and warnings; reconciliation is still required before migration readiness can be assessed." : "Load the sample migration or import source and target CSV files to begin."}</p><dl><div><dt>Records with errors</dt><dd>{canProcess && rules.length ? validation!.summary.recordsWithErrors : "Not assessed"}</dd></div><div><dt>Records with warnings</dt><dd>{canProcess && rules.length ? validation!.summary.recordsWithWarnings : "Not assessed"}</dd></div><div><dt>Reconciliation</dt><dd>Not run</dd></div></dl><button className="secondary" onClick={() => setActive(canProcess ? "Validation" : "Data Import")}>{canProcess ? "Review validation" : "Review data import"} <ArrowRight size={16} /></button></section></div>
        </> : active === "Data Import" ? <>
          <section className="import-actions panel"><div><h2>Choose your starting point</h2><p>Use fictional county land records or import your own source and target CSV files.</p></div><div className="button-row"><button className="secondary" onClick={loadSample}><Database size={16} /> Load Sample Data</button><button className="text-button" disabled={!datasets} onClick={clear}><RotateCcw size={15} /> Clear datasets</button></div></section>
          <div className="import-grid">{(["source", "target"] as const).map(side => <DatasetPanel key={side} side={side} dataset={datasets?.[side]?.columns.length ? datasets[side] : null} onUpload={file => void upload(side, file)} status={importStatus[side]} />)}</div>
          <section className="sample-note"><ShieldCheck size={21} /><div><h3>A realistic scenario, entirely fictional</h3><p>The sample includes missing values, duplicate identifiers, invalid dates, unknown document types, inconsistent capitalization, missing and unexpected target records, and field differences. Review validation results in the Validation section; comparisons against target records are not yet available.</p><p>Sample lookup translations: WD → Warranty Deed · DT → Deed of Trust · QCD → Quitclaim Deed.</p><div className="sample-download-area"><a className="secondary sample-download" href="/samples/county-source.csv" download="county-source.csv"><ArrowDownToLine size={16} aria-hidden="true" />Download source sample CSV</a><p>10 fictional source records, exactly as loaded by Try Sample Migration, before transformations. Use the file to check the validation findings yourself. App row numbers exclude the CSV header.</p></div></div></section>
        </> : <section className="panel future-stage"><current.icon size={38} /><span className="neutral-tag">MILESTONE {current.milestone}</span><h2>{active} is planned for a later release</h2><p>{active === "Reconciliation" ? "Select a unique key and inspect matches, differences, missing records, and ambiguous keys." : "Review processing summaries and download safe CSV exception and reconciliation reports."}</p><p>Reconciliation and downloadable reports are not available in Milestone 2.</p><button className="secondary" onClick={() => setActive("Data Import")}>Return to data import <ArrowRight size={16} /></button></section>}
        <footer><span>Built by Jack Tam</span><span><LockKeyhole size={13} /> Files are processed locally. No dataset uploads to servers, storage, or analytics.</span></footer>
      </main>
    </div>
  </div>;
}

function DatasetPanel({ side, dataset, onUpload, status }: { side: "source" | "target"; dataset: Dataset | null; onUpload: (file: File) => void; status: string }) {
  const profiles = dataset ? profileDataset(dataset) : [];
  const emptyCount = profiles.reduce((sum, column) => sum + column.emptyCount, 0);
  return <section className="panel dataset-panel"><div className="panel-heading"><div className="dataset-title"><span className={`dataset-icon ${side}`}><Database size={21} /></span><div><h2>{side === "source" ? "Source dataset" : "Target dataset"}</h2><p>{side === "source" ? "The records you are migrating" : "The records you are comparing against"}</p></div></div></div>
    <div className="upload-unavailable"><ArrowDownToLine size={22} /><label className="field-label">Upload {side} CSV<input type="file" accept=".csv,text/csv" onChange={event => { const file = event.target.files?.[0]; if (file) onUpload(file); event.target.value = ""; }} /></label><p>Processed locally · 5 MB, 10,000 rows, 100 columns per file.<br />Replacing a dataset resets mappings and validation rules.</p>{status && <p role={status.startsWith("Import failed") ? "alert" : "status"} className={status.startsWith("Import failed") ? "inline-error" : ""}>{status}</p>}</div>
    {dataset ? <><div className="file-info"><Files size={17} /><strong>{dataset.name}</strong><span className="success-tag">{dataset.origin === "sample" ? "Sample loaded" : "CSV loaded"}</span></div><div className="dataset-stats"><div><strong>{dataset.records.length}</strong><span>Records</span></div><div><strong>{dataset.columns.length}</strong><span>Columns</span></div><div><strong>{emptyCount}</strong><span>Empty cells</span></div></div><h3 className="small-heading">DETECTED COLUMNS <span>Empty values per field</span></h3><div className="column-chips">{profiles.map(column => <span key={column.name}>{column.name}<b className={column.emptyCount ? "has-empty" : ""}>{column.emptyCount}</b></span>)}</div><div className="preview-heading"><h3>Record preview</h3><span>First {Math.min(5, dataset.records.length)} of {dataset.records.length} rows</span></div><div className="table-scroll" tabIndex={0} role="region" aria-label={`${side} record preview`}><table><thead><tr><th scope="col">#</th>{dataset.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{dataset.records.slice(0, 5).map((record, index) => <tr key={index}><td>{index + 1}</td>{dataset.columns.map(column => <td key={column}>{record[column]?.trim() ? <span className="raw-value">{record[column]}</span> : <span className="empty-value">Empty</span>}</td>)}</tr>)}</tbody></table></div><p className="preview-note">Original values are preserved. Empty means blank or whitespace only.</p></> : <div className="empty-dataset"><Table2 size={28} /><h3>No {side} data loaded</h3><p>Upload a CSV or load Sample Data to view records and column profiles.</p></div>}
  </section>;
}
