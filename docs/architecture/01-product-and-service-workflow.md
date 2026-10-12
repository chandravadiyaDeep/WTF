# NUMPA v2 — Product and Service Workflow

## Purpose and status

This document establishes Plan 1 at the product-workflow level. It describes the intended user journey and cross-cutting behavior without locking down implementation details, thresholds, schemas, or commercial values. Those remain open for the dependent plans and review.

## End-to-end workflow

### 1. Start a data project

The user begins a project or session and selects a file. The interface should communicate supported formats and any limits once those are decided. The user should be able to understand where processing will occur and what data will be retained.

### 2. Ingest and validate

The ingestion layer identifies the format and validates that the file can be read. It should return structured status and useful errors, including malformed content, unsupported features, ambiguous types, and partial extraction.

CSV, Excel, and JSON need format-aware parsing. PDF may require text or table extraction and should not be treated as a ready-made table by default. If extraction yields multiple candidate tables or uncertain structure, the product should expose that uncertainty for review.

### 3. Understand and analyze the dataset

NUMPA summarizes the dataset structure and relevant characteristics, then identifies issues that could affect downstream work. Analysis should be repeatable and its evidence available for later explanations. Sensitive values should not be unnecessarily copied into reports or logs.

### 4. Review data quality and preprocessing

The product detects issues and recommends appropriate cleaning or preprocessing. For every material transformation, show the issue, the proposed operation, the expected effect, and relevant evidence. Where practical, provide a preview and before/after comparison. Users retain control over meaning-changing operations; rejected or failed operations should not silently alter the source.

Applied operations and outcomes should form an auditable processing history. Recovery and versioning behavior must be designed in the storage and processing plans.

### 5. Explore visualizations

Generate visualizations appropriate to the observed data and the user's task. Charts should clarify patterns, quality issues, and transformation effects. Avoid presenting a chart as proof of a causal conclusion. Plot selection, rendering location, and accessibility behavior need design review.

### 6. Assess ML readiness

Calculate an explainable, task-specific readiness assessment. The result should cite factors and supporting evidence in plain language and distinguish blocking issues, cautions, and favorable signals. Scoring must be deterministic and auditable. Score dimensions, thresholds, and weighting are unresolved and must be documented before implementation.

### 7. Recommend candidate algorithms

Recommend four suitable candidates when enough information supports doing so. Explain why each candidate fits, what assumptions it makes, and any relevant limitations. If fewer than four candidates are appropriate or the data/task is unsupported, explain why instead of padding the list. Recommendations are not performance guarantees.

### 8. Train and evaluate supported candidates

Where supported and appropriate, train candidates using task-valid procedures. Validation must avoid data leakage; time-series evaluation must preserve temporal ordering where applicable. Select metrics that match the task and explain their meaning. Record configuration and outcomes sufficiently for reproducibility. Do not invent results when training fails, is skipped, or is not supported.

### 9. Compare and report

Present a comparison table, plain-language explanations, and downloadable reports. Reports should distinguish observed data, applied operations, recommendation rationale, evaluation protocol, and limitations. Privacy, retention, and export content require review.

## Cross-cutting service behavior

- **State and progress:** long-running work should expose understandable status and recoverable failure states.
- **Explainability:** each automated finding or action should link its rationale to evidence and relevant processing history.
- **Consent and reversibility:** material transformations should be previewable and recoverable; the source data should not be silently overwritten.
- **Task awareness:** classification, regression, forecasting, and clustering require distinct readiness logic, validation, recommendations, and metrics.
- **Privacy:** browser processing is preferred when practical; cloud processing needs authorization and clear data-flow and retention rules.
- **Cost awareness:** paid operations should use reviewed, configurable token costs and safe reservation/reconciliation.
- **Accessibility:** explanations and visuals should remain understandable to users with different levels of technical knowledge and access needs.
- **Failure handling:** partial success, extraction uncertainty, unsupported operations, and worker failures should be represented honestly.

## Actors and system boundaries

Expected actors are the end user and NUMPA services. Planned boundaries include the web client, API, identity and relational data service, file storage, browser/cloud processing engines, background workers, and billing ledger. External integrations such as Zapier are a future settings concern. Authentication, storage, worker, and integration boundaries are to be specified in the corresponding plans.

## Decisions intentionally left open

No final decisions are made here about project/session lifecycle, file limits, extraction libraries, processing thresholds, readiness scoring, algorithm ranking, model budgets, report format, data retention, or token pricing. These are inputs to Plans 2–7 and should be reviewed before implementation.
