"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { cleanDataset, Dataset, duplicateCount, encodeCsv, MAX_FILE_BYTES, parseCsv, profileDataset } from "@/lib/csv";

const sample: Dataset = {
  headers: ["customer_id", "age", "plan", "monthly_spend", "last_active"],
  rows: [
    ["C-1042", "28", "Pro", "49.00", "2026-10-22"], ["C-1043", "35", "Starter", "19.00", "2026-10-21"],
    ["C-1044", "", "Pro", "49.00", "2026-10-20"], ["C-1045", "42", "Team", "89.00", "2026-10-19"],
    ["C-1046", "31", "Starter", "19.00", "2026-10-18"], ["C-1047", "28", "Pro", "49.00", "2026-10-22"],
    ["C-1048", "53", "Team", "89.00", "2026-10-16"], ["C-1049", "24", "Starter ", "19.00", "2026-10-15"],
    ["C-1050", "39", "Pro", "", "2026-10-14"], ["C-1051", "33", "Team", "89.00", "2026-10-13"],
    ["C-1052", "47", "Starter", "19.00", "2026-10-12"], ["C-1053", "29", "Pro", "49.00", "2026-10-11"],
    ["C-1054", "36", "Team", "89.00", "2026-10-10"], ["C-1055", "", "Starter", "19.00", "2026-10-09"],
    ["C-1056", "44", "Pro", "49.00", "2026-10-08"], ["C-1057", "27", "Starter", "19.00", "2026-10-07"],
  ],
};

const icons: Record<string, string> = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  database: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Zm-8 3v5c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 11v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5",
  chart: "M4 19V5m0 14h16M7 15l4-4 3 2 6-7",
  wand: "m15 4 5 5M3 21l11-11m-5-3 1 1m6 4 1 1M8 3l1 2m-5 5 2 1",
  spark: "m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  upload: "M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4",
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
}

export default function Home() {
  const [dataset, setDataset] = useState<Dataset>(sample);
  const [original, setOriginal] = useState<Dataset>(sample);
  const [filename, setFilename] = useState("customer-retention-sample.csv");
  const [isSample, setIsSample] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [preview, setPreview] = useState<Dataset | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const profile = useMemo(() => profileDataset(dataset), [dataset]);
  const missingCount = profile.reduce((total, column) => total + column.missing, 0);
  const duplicates = duplicateCount(dataset.rows);
  const completeness = dataset.rows.length * dataset.headers.length ? Math.round(100 * (1 - missingCount / (dataset.rows.length * dataset.headers.length))) : 100;
  const proposed = preview;
  const removedCount = proposed ? dataset.rows.length - proposed.rows.length : 0;
  const trimmedCount = proposed && trimWhitespace ? dataset.rows.reduce((total, row) => total + row.filter((value) => value !== value.trim()).length, 0) : 0;

  async function loadFile(file?: File) {
    if (!file) return;
    setError("");
    setNotice("");
    setPreview(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("For this first MVP, upload a CSV file. Excel and PDF import are not enabled yet.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("This MVP supports CSV files up to 10 MB. Your file was not opened.");
      return;
    }
    try {
      const parsed = parseCsv(await file.text());
      setDataset(parsed);
      setOriginal(parsed);
      setFilename(file.name);
      setIsSample(false);
      setNotice("CSV analyzed in this browser. The file was not uploaded.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read this CSV file.");
    }
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    void loadFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void loadFile(event.dataTransfer.files[0]);
  }

  function exportCsv() {
    const blob = new Blob(["\uFEFF", encodeCsv(dataset)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename.replace(/\.csv$/i, "")}-prepared.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function applyPreview() {
    if (!preview) return;
    setDataset(preview);
    setPreview(null);
    setNotice("Changes applied to the in-memory working copy. Your original file remains unchanged.");
  }

  function resetDataset() {
    setDataset(original);
    setPreview(null);
    setNotice("Working copy restored to the original dataset.");
  }

  const chartValues = profile.map((column) => Math.round(100 * (dataset.rows.length - column.missing) / Math.max(1, dataset.rows.length)));

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="NUMPA home"><span className="brand-mark"><Icon name="spark" size={19} /></span><span>NUMPA<span className="brand-dot">.</span><small>DATA WORKSPACE</small></span></a>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Workspace navigation">
          <a className="nav-item active" href="#overview"><Icon name="grid" /><span>Overview</span></a>
          <a className="nav-item" href="#dataset"><Icon name="database" /><span>Dataset</span><span className="nav-count">01</span></a>
          <a className="nav-item" href="#analysis"><Icon name="chart" /><span>Analysis</span></a>
          <a className="nav-item" href="#cleaning"><Icon name="wand" /><span>Cleaning</span><span className="nav-dot" /></a>
          <a className="nav-item disabled" href="#readiness" aria-disabled="true" title="Planned for a later MVP slice"><Icon name="spark" /><span>ML readiness</span><span className="soon">SOON</span></a>
        </nav>
        <div className="sidebar-bottom"><div className="local-card"><span className="local-icon"><Icon name="lock" size={16} /></span><div><strong>Local processing</strong><p>Your file stays in this browser.</p></div><span className="green-pulse" /></div><div className="profile-chip"><div className="avatar">N</div><div><strong>NUMPA workspace</strong><small>Private session</small></div><span className="more">•••</span></div></div>
      </aside>

      <section className="main-column">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="top-actions"><div className="privacy-pill"><span className="green-pulse" /> Browser-only session</div><button className="icon-button" aria-label="Help" title="Help">?</button><div className="avatar small-avatar">N</div></div></header>

        <div className="content" id="overview">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR DATA, UNDERSTOOD</div><h1>Good data starts with <span>clarity.</span></h1><p className="page-subtitle">A clear view of what’s inside your dataset — before you make a single change.</p></div><button className="button primary" onClick={() => inputRef.current?.click()}><Icon name="upload" /> Upload dataset</button></div>

          {error && <div className="message error-message" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError("")}>×</button></div>}
          {notice && <div className="message success-message" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></div>}

          <div className={`upload-strip ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
            <div className="upload-symbol"><Icon name="upload" size={19} /></div><div className="upload-copy"><strong>Bring your own dataset</strong><span>Drop a CSV here or <button className="text-button" onClick={() => inputRef.current?.click()}>browse files</button> <span className="format-note">· CSV up to 10 MB</span></span></div>
            <div className="upload-right"><span className="secure-label"><Icon name="lock" size={13} /> Stays on your device</span><span className="format-badge">.CSV</span></div><input ref={inputRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={onInput} aria-label="Choose a CSV file" />
          </div>

          <section className="dataset-bar" id="dataset"><div className="file-badge">CSV</div><div className="dataset-meta"><div className="dataset-name">{filename} {isSample && <span className="sample-badge">SAMPLE DATA</span>}</div><div className="dataset-details">{dataset.rows.length.toLocaleString()} rows <span>·</span> {dataset.headers.length} columns <span>·</span> <span className="status-ready"><i /> Profile ready</span></div></div><div className="dataset-actions"><button className="button subtle" onClick={resetDataset} disabled={dataset === original}>Reset</button><button className="button outline" onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button></div></section>

          <div className="section-heading"><div><div className="eyebrow">AT A GLANCE</div><h2>Your dataset, summarized</h2></div><span className="updated-label"><span className="green-pulse" /> Analysis runs locally</span></div>

          <div className="metric-grid">
            <article className="metric-card"><div className="metric-top"><span className="metric-icon indigo"><Icon name="database" size={17} /></span><span className="metric-caption">DATA VOLUME</span></div><strong className="metric-value">{dataset.rows.length.toLocaleString()}<small> rows</small></strong><span className="metric-foot">Across {dataset.headers.length} fields</span><div className="metric-visual mini-bars" aria-hidden="true">{[32, 44, 38, 58, 47, 66, 53, 72, 61, 78, 66, 88].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon orange"><Icon name="spark" size={17} /></span><span className="metric-caption">MISSING VALUES</span></div><strong className="metric-value">{missingCount}<small> cells</small></strong><span className={`metric-foot ${missingCount ? "attention-text" : ""}`}>{missingCount ? `${dataset.headers.length ? Math.round(missingCount / (dataset.rows.length * dataset.headers.length) * 100) : 0}% of the dataset needs a look` : "No gaps found"}</span><div className="metric-visual missing-track"><i style={{ width: `${Math.max(2, Math.min(100, missingCount / Math.max(1, dataset.rows.length * dataset.headers.length) * 100))}%` }} /></div></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon green"><Icon name="chart" size={17} /></span><span className="metric-caption">DATA COMPLETENESS</span></div><strong className="metric-value">{completeness}<small>%</small></strong><span className="metric-foot">Based on non-empty cells</span><div className="metric-visual completeness-ring" style={{ background: `conic-gradient(#57b970 ${completeness}%, #27272d 0)` }}><span>{completeness}</span></div></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon violet"><Icon name="wand" size={17} /></span><span className="metric-caption">EXACT DUPLICATES</span></div><strong className="metric-value">{duplicates}<small> rows</small></strong><span className="metric-foot">Same values across every field</span><div className="metric-visual duplicate-dots" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} className={index < Math.min(duplicates, 4) ? "filled" : ""} />)}</div></article>
          </div>

          <div className="dashboard-grid" id="analysis">
            <section className="panel quality-panel"><div className="panel-heading"><div><div className="eyebrow">FIELD HEALTH</div><h2>Completeness by column</h2></div><button className="more-button" aria-label="Field health details">•••</button></div><p className="panel-description">A quick scan of non-empty values in each field.</p><div className="quality-chart" role="img" aria-label={`Column completeness: ${profile.map((column, index) => `${column.name} ${chartValues[index]} percent`).join(", ")}`}><div className="chart-y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-main"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><div className="bar-list">{profile.map((column, index) => <div className="bar-column" key={column.name}><div className="bar-track"><div className={`bar-fill ${chartValues[index] < 90 ? "bar-warning" : ""}`} style={{ height: `${chartValues[index]}%` }}><span>{chartValues[index]}%</span></div></div><span className="bar-label" title={column.name}>{column.name}</span></div>)}</div></div></div><div className="legend"><span><i className="legend-green" /> Complete</span><span><i className="legend-orange" /> Needs attention</span></div></section>

            <section className="panel insight-panel"><div className="panel-heading"><div><div className="eyebrow">WHAT WE FOUND</div><h2>Worth a closer look</h2></div><span className="insight-count">{missingCount + duplicates}</span></div><p className="panel-description">Evidence-backed signals to help you decide what comes next.</p><div className="insight-list">
              {missingCount > 0 && <div className="insight-item"><span className="insight-mark amber"><Icon name="spark" size={15} /></span><div><strong>Some values are missing</strong><p>{missingCount} empty cells across {profile.filter((column) => column.missing).length} field{profile.filter((column) => column.missing).length === 1 ? "" : "s"}. Review before training a model.</p></div><span className="severity">REVIEW</span></div>}
              {duplicates > 0 && <div className="insight-item"><span className="insight-mark violet"><Icon name="wand" size={15} /></span><div><strong>Repeated rows detected</strong><p>{duplicates} exact duplicate row{duplicates === 1 ? "" : "s"} can be reviewed in the cleaning panel.</p></div><span className="severity">REVIEW</span></div>}
              {profile.some((column) => column.type === "text") && <div className="insight-item"><span className="insight-mark blue"><Icon name="database" size={15} /></span><div><strong>Mixed field types are expected</strong><p>NUMPA inferred types from observed values. Confirm your target and column meanings before ML analysis.</p></div><span className="severity neutral">NOTE</span></div>}
              {!missingCount && !duplicates && <div className="empty-insight"><span className="empty-check">✓</span><strong>No immediate data quality issues</strong><p>That’s a healthy start. It doesn’t guarantee the dataset is ready for a particular ML task.</p></div>}
            </div><a className="panel-link" href="#cleaning">Review cleaning suggestions <span>→</span></a></section>
          </div>

          <section className="panel table-panel"><div className="panel-heading"><div><div className="eyebrow">DATA PREVIEW</div><h2>A look at your rows</h2></div><span className="table-range">Showing {Math.min(8, dataset.rows.length)} of {dataset.rows.length.toLocaleString()} rows</span></div><div className="table-wrap"><table><thead><tr><th className="row-number">#</th>{dataset.headers.map((header, index) => <th key={`${header}-${index}`}><span>{header}</span><small>{profile[index].type}</small></th>)}</tr></thead><tbody>{dataset.rows.slice(0, 8).map((row, rowIndex) => <tr key={rowIndex}><td className="row-number">{String(rowIndex + 1).padStart(2, "0")}</td>{dataset.headers.map((header, colIndex) => <td key={`${header}-${colIndex}`} className={!row[colIndex]?.trim() ? "missing-cell" : ""}>{row[colIndex]?.trim() || <span className="missing-tag">Missing</span>}</td>)}</tr>)}</tbody></table></div><div className="table-foot"><span><i className="table-dot" /> Missing value</span><span>Field types are inferred from this file’s values.</span></div></section>

          <section className="cleaning-section" id="cleaning"><div className="cleaning-intro"><div><div className="eyebrow">YOUR CALL, ALWAYS</div><h2>Prepare your data</h2><p>Review the effect first. NUMPA never changes your source file.</p></div><span className="review-first"><Icon name="lock" size={15} /> Preview before applying</span></div>
            <div className="cleaning-card"><div className="clean-option"><label className="check-control"><input type="checkbox" checked={trimWhitespace} onChange={(event) => setTrimWhitespace(event.target.checked)} /><span className="custom-check">✓</span></label><div className="clean-option-icon orange"><Icon name="wand" size={17} /></div><div className="clean-option-copy"><strong>Trim extra spaces</strong><p>Remove whitespace around text values without changing what they say.</p></div><span className="suggested">SUGGESTED</span></div>
              <div className="clean-option"><label className="check-control"><input type="checkbox" checked={removeDuplicates} onChange={(event) => setRemoveDuplicates(event.target.checked)} /><span className="custom-check">✓</span></label><div className="clean-option-icon violet"><Icon name="database" size={17} /></div><div className="clean-option-copy"><strong>Remove exact duplicate rows</strong><p>Keep the first instance when every cell in a row is identical.</p></div><span className="suggested">{duplicates ? `${duplicates} FOUND` : "NO DUPLICATES"}</span></div>
              {preview && <div className="preview-result"><div><strong>Preview ready</strong><p>{removedCount} duplicate rows removed · {trimmedCount} text values trimmed. The source remains unchanged.</p></div><button className="button subtle" onClick={() => setPreview(null)}>Cancel</button><button className="button primary" onClick={applyPreview}>Apply to working copy</button></div>}
              <div className="cleaning-footer"><span>Changes affect only this browser session.</span><button className="button outline" onClick={() => { const next = cleanDataset(dataset, trimWhitespace, removeDuplicates); setPreview(next); setNotice(""); }}>{preview ? "Refresh preview" : "Preview selected changes"}<span>→</span></button></div>
            </div>
          </section>

          <footer className="page-footer"><div className="footer-lock"><Icon name="lock" size={14} /> Your data stays private</div><span>This MVP profiles CSV data in this tab only. Readiness scoring and model training are not available yet.</span><button onClick={() => { setDataset(sample); setOriginal(sample); setFilename("customer-retention-sample.csv"); setIsSample(true); setPreview(null); setError(""); setNotice("Sample data loaded in this browser."); }}>Load sample data</button></footer>
        </div>
      </section>
    </main>
  );
}
