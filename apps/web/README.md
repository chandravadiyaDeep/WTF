# NUMPA Web MVP — first slice

This is the first usable product slice: a single-page, browser-local CSV workspace for inspecting a dataset and reviewing safe, explicit cleanup. It follows the NUMPA dark workspace direction in the root `design.md` while keeping the data workflow evidence-first.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use `npm run lint` and `npm run build` before sharing changes.

## What works

- Load the bundled synthetic customer sample or choose/drop a CSV file.
- Parse quoted CSV cells, escaped quotes, embedded line breaks, and UTF-8 BOMs in the browser.
- Show row/column counts, inferred field types, missing cells, exact duplicate rows, completeness by column, quality observations, and a small row preview.
- Select whitespace trimming and exact duplicate removal, inspect the exact proposed row/cell effects, then explicitly apply to an in-memory working copy.
- Reset the working copy and export a prepared CSV. Export prefixes spreadsheet formula-like values to reduce formula injection risk.

## MVP boundaries

- CSV only; 10 MB maximum file size, 20,000 data rows, and 80 columns.
- The source file is read into this tab. There is no API upload, cloud fallback, local storage, telemetry, or third-party font request. Reloading the page clears the uploaded data.
- Type inference is heuristic. It is a profiling aid, not a schema contract.
- Cleaning changes only the in-memory working copy; the original data is retained for reset during the current page session.
- No authentication, database, workspace history, jobs, Excel/PDF parsing, PDF reports, ML readiness score, recommendations, model training, billing, or deployment configuration is implemented in this slice.

## Next implementation gates

Before cloud processing or production launch, review Plans 2–6 and complete Plan 7. Decide browser persistence and consent, API/database contracts, supported formats and resource limits, deletion/retention, auth/RLS, worker/job behavior, recovery targets, operational ownership, and model/readiness policy. Keep future engine behavior deterministic, versioned, and backed by evidence; never present this UI's profiling as ML readiness.
