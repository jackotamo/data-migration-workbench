"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowRightLeft, Check, ChevronRight, CircleHelp, Database, FileCheck2, Files, GitBranch, LayoutDashboard, LockKeyhole, RotateCcw, ShieldCheck, Sparkles, Table2, WandSparkles } from "lucide-react";
import { Faq } from "./faq";
import { loadSampleDatasets } from "@/lib/sample-data";
import { profileDataset } from "@/lib/profiling";
import type { Dataset } from "@/lib/types";

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
  const [datasets, setDatasets] = useState<{ source: Dataset; target: Dataset } | null>(null);
  const [notice, setNotice] = useState("");
  const loadSample = () => { setDatasets(loadSampleDatasets()); setNotice("Fictional county sample loaded. Source and target previews are ready."); };
  const current = sections.find(section => section.name === active)!;
  return <div className="app-shell">
    <a href="#main" className="skip-link">Skip to workspace</a>
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><ArrowRightLeft size={22} /></span><div>Migration<span>WORKBENCH</span></div></div>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation">{sections.map(({ name, icon: Icon, milestone }) => <button key={name} onClick={() => setActive(name)} aria-current={active === name ? "page" : undefined} className={`nav-item ${active === name ? "active" : ""}`}><Icon size={18} /><span>{name}</span>{milestone > 1 && <span className="later-dot" title={`Available in milestone ${milestone}`} />}</button>)}</nav>
      <div className="sidebar-note"><LockKeyhole size={19} /><strong>Your data stays yours.</strong><p>Datasets stay in this browser session. No server storage.</p><span>LOCAL PROCESSING</span></div>
      <div className="sidebar-footer"><span className="avatar">JT</span><div>Jack Tam<span>Portfolio project</span></div><span className="version">v0.1</span></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div>Workspace <ChevronRight size={14} /><strong>{active}</strong></div><span><i /> Browser-local workspace</span></header>
      <main id="main" tabIndex={-1}>
        <div className="page-heading"><div><div className="eyebrow">DATA MIGRATION & VALIDATION</div><h1>{active === "Overview" ? "Migration overview" : active === "FAQ" ? "Frequently asked questions" : active}</h1><p>{active === "Overview" ? "A clear path from source data to migration confidence." : active === "Data Import" ? "Bring your source and target structures into one workspace." : active === "FAQ" ? "Straightforward answers about your data and the migration workflow." : "The next stage in your migration workflow."}</p></div><button className="primary" onClick={loadSample}><Sparkles size={16} /> Try Sample Migration</button></div>
        <div className="announcement" role="status"><span className="pill">MILESTONE 1</span><span>Foundation preview · Import inspection is ready. Processing stages are coming next.</span></div>
        {notice && <div className="notice" role="status"><Check size={16} />{notice}</div>}
        {active === "FAQ" ? <Faq /> : active === "Overview" ? <>
          <section className="hero"><div><span className="hero-kicker"><span /> BUILT FOR DATA INTEGRITY</span><h2>Map. Validate.<br /><em>Reconcile.</em></h2><p>Turn migration uncertainty into a transparent, repeatable workflow. Start with fictional county land records and inspect both sides of the move.</p><button className="hero-button" onClick={() => setActive("Data Import")}>Explore your datasets <ArrowRight size={17} /></button></div><div className="pipeline-visual" aria-label="Source to target workflow"><div className="data-node"><Database size={28} /><strong>Source</strong><span>{datasets ? `${datasets.source.records.length} records loaded` : "Awaiting dataset"}</span></div><div className="connector"><span /><ArrowRight size={18} /><small>MAP & VERIFY</small></div><div className="data-node target"><Table2 size={28} /><strong>Target</strong><span>{datasets ? `${datasets.target.records.length} records loaded` : "Awaiting dataset"}</span></div><div className="visual-caption"><LockKeyhole size={13} /> Private by design. Local by default.</div></div></section>
          <section aria-label="Migration metrics" className="metrics">{[
            ["Source records", datasets?.source.records.length.toLocaleString() ?? "—", "Rows in the source dataset", Database],
            ["Target records", datasets?.target.records.length.toLocaleString() ?? "—", "Rows in the target dataset", Files],
            ["Validated records", "—", "Validation has not run", ShieldCheck],
            ["Match rate", "—", "Reconciliation has not run", ArrowRightLeft],
          ].map(([label, value, description, Icon]) => { const MetricIcon = Icon as typeof Database; return <article className="metric" key={String(label)}><div><span>{String(label)}</span><MetricIcon size={18} /></div><strong>{String(value)}</strong><p>{String(description)}</p></article>; })}</section>
          <div className="overview-grid"><section className="panel"><div className="panel-heading"><div><h2>Your migration journey</h2><p>One workflow. Every decision visible.</p></div><span className="neutral-tag">6 stages</span></div><ol className="journey">{["Import", "Map", "Transform", "Validate", "Reconcile", "Report"].map((name, index) => <li key={name}><span className={index === 0 && datasets ? "step complete" : "step"}>{index === 0 && datasets ? <Check size={16} /> : String(index + 1).padStart(2, "0")}</span><div><strong>{name}</strong><p>{[datasets ? "Sample datasets loaded" : "Load source and target data", "Align fields between structures", "Standardize values consistently", "Check target requirements", "Compare records and differences", "Export findings for review"][index]}</p></div><span className="stage-status">{index === 0 ? datasets ? "Loaded" : "Ready" : "Upcoming"}</span></li>)}</ol></section>
          <section className="panel readiness"><div className="panel-heading"><div><h2>Migration readiness</h2><p>Evidence before confidence.</p></div><ShieldCheck size={21} /></div><div className="readiness-icon"><FileCheck2 size={32} /></div><h3>{datasets ? "Ready for field mapping" : "Start with your data"}</h3><p>{datasets ? "Both datasets are loaded. Validation and reconciliation are needed before readiness can be assessed." : "Load the sample migration to explore source and target records, fields, and missing values."}</p><dl><div><dt>Records with errors</dt><dd>Not assessed</dd></div><div><dt>Records with warnings</dt><dd>Not assessed</dd></div><div><dt>Reconciliation</dt><dd>Not run</dd></div></dl><button className="secondary" onClick={() => setActive("Data Import")}>Review data import <ArrowRight size={16} /></button></section></div>
        </> : active === "Data Import" ? <>
          <section className="import-actions panel"><div><h2>Choose your starting point</h2><p>Use fictional county land records to inspect a migration with intentional data problems.</p></div><div className="button-row"><button className="secondary" onClick={loadSample}><Database size={16} /> Load Sample Data</button><button className="text-button" disabled={!datasets} onClick={() => { setDatasets(null); setNotice("Datasets cleared from this session."); }}><RotateCcw size={15} /> Clear datasets</button></div></section>
          <div className="import-grid">{(["source", "target"] as const).map(side => <DatasetPanel key={side} side={side} dataset={datasets?.[side] ?? null} />)}</div>
          <section className="sample-note"><ShieldCheck size={21} /><div><h3>A realistic scenario, entirely fictional</h3><p>The sample includes missing values, duplicate identifiers, invalid dates, unknown document types, inconsistent capitalization, missing and unexpected target records, and field differences. These are scenario details, not validation results.</p><p>Planned value translations: WD → Warranty Deed · DT → Deed of Trust · QCD → Quitclaim Deed.</p></div></section>
        </> : <section className="panel future-stage"><current.icon size={38} /><span className="neutral-tag">MILESTONE {current.milestone}</span><h2>{active} is planned for the next release</h2><p>{active === "Field Mapping" ? "Field mapping will align source columns with target requirements and suggest deterministic matches." : active === "Transformations" ? "Configure trim, case conversion, strict date normalization, lookups, and defaults." : active === "Validation" ? "Check required fields, uniqueness, dates, allowed values, length, and numeric values." : active === "Reconciliation" ? "Select a unique key and inspect matches, differences, missing records, and ambiguous keys." : "Review processing summaries and download safe CSV exception and reconciliation reports."}</p><p>No processing results have been generated in this foundation release.</p><button className="secondary" onClick={() => setActive("Data Import")}>Return to data import <ArrowRight size={16} /></button></section>}
        <footer><span>Built by Jack Tam</span><span><LockKeyhole size={13} /> Files will be processed locally. No dataset uploads, storage, or analytics.</span></footer>
      </main>
    </div>
  </div>;
}

function DatasetPanel({ side, dataset }: { side: "source" | "target"; dataset: Dataset | null }) {
  const profiles = dataset ? profileDataset(dataset) : [];
  const emptyCount = profiles.reduce((sum, column) => sum + column.emptyCount, 0);
  return <section className="panel dataset-panel"><div className="panel-heading"><div className="dataset-title"><span className={`dataset-icon ${side}`}><Database size={21} /></span><div><h2>{side === "source" ? "Source dataset" : "Target dataset"}</h2><p>{side === "source" ? "The records you are migrating" : "The records you are comparing against"}</p></div></div></div>
    <div className="upload-unavailable"><ArrowDownToLine size={22} /><strong>CSV upload · Milestone 2</strong><p>Uploads will be enabled with the CSV parser.<br />Planned limits: 5 MB, 10,000 rows, 100 columns per file.</p></div>
    {dataset ? <><div className="file-info"><Files size={17} /><strong>{dataset.name}</strong><span className="success-tag">Sample loaded</span></div><div className="dataset-stats"><div><strong>{dataset.records.length}</strong><span>Records</span></div><div><strong>{dataset.columns.length}</strong><span>Columns</span></div><div><strong>{emptyCount}</strong><span>Empty cells</span></div></div><h3 className="small-heading">DETECTED COLUMNS <span>Empty values per field</span></h3><div className="column-chips">{profiles.map(column => <span key={column.name}>{column.name}<b className={column.emptyCount ? "has-empty" : ""}>{column.emptyCount}</b></span>)}</div><div className="preview-heading"><h3>Record preview</h3><span>First {Math.min(5, dataset.records.length)} of {dataset.records.length} rows</span></div><div className="table-scroll" tabIndex={0} role="region" aria-label={`${side} record preview`}><table><thead><tr><th scope="col">#</th>{dataset.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{dataset.records.slice(0, 5).map((record, index) => <tr key={index}><td>{index + 1}</td>{dataset.columns.map(column => <td key={column}>{record[column]?.trim() ? <span className="raw-value">{record[column]}</span> : <span className="empty-value">Empty</span>}</td>)}</tr>)}</tbody></table></div><p className="preview-note">Original values are preserved. Empty means blank or whitespace only.</p></> : <div className="empty-dataset"><Table2 size={28} /><h3>No {side} data loaded</h3><p>Load Sample Data to view records and column profiles.</p></div>}
  </section>;
}
