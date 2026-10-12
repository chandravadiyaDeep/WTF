# NUMPA v2 — Product Brief

## Purpose

NUMPA is an explainable, largely automated data-to-ML platform for technical and non-technical users. It helps people understand a dataset, improve it with informed consent, assess whether it is suitable for a machine-learning task, and evaluate candidate models without hiding the evidence or limitations behind the results.

This brief records the product intent. It does not approve detailed schemas, pricing, thresholds, or processing behavior; those belong in the architecture plans and require review.

## Intended user journey

1. Upload a supported file and validate that it can be read.
2. Inspect dataset structure and receive an automated analysis.
3. Review data-quality findings and proposed cleaning or preprocessing.
4. Preview meaningful changes, compare before and after, and apply or reject them.
5. Explore visualizations relevant to the dataset and task.
6. Receive a task-specific, explainable ML-readiness assessment.
7. See four suitable candidate algorithms with reasons, assumptions, and limitations.
8. Train supported candidates where appropriate.
9. Compare valid, task-specific evaluation results and download reports.

The eventual task families are classification, regression, time-series forecasting, and clustering. Recommendations and metrics must depend on the selected task and data characteristics. NUMPA must not promise that a recommended algorithm will perform best or present fabricated results.

## Product principles

- **Automation:** reduce repetitive work and offer useful defaults.
- **Explainability:** describe what happened, why it happened, and what results mean in accessible language.
- **Visual evidence:** use appropriate plots and before/after comparisons to clarify findings and transformations.
- **Auditability:** retain meaningful decisions, applied operations, and outcomes.
- **Privacy:** process in the browser when practical; use authorized cloud processing when needed.
- **Reliability:** validate inputs, handle failures, and test important logic.
- **Task awareness:** tailor readiness checks, recommendation, validation, and metrics to the ML task.
- **Cost awareness:** make paid operations configurable and account for token reservation and reconciliation.
- **User control:** never silently apply a material meaning-changing transformation; provide previews, transparency, and recovery.

## File ingestion

The ingestion layer should support CSV, Excel, JSON, PDF, and other justified formats. Formats require distinct handling: PDF may need text or table extraction before structured analysis. File support, size limits, extraction behavior, and browser/cloud routing remain design decisions. Validation should communicate unsupported, malformed, ambiguous, and partially extracted content clearly.

## Intended technology direction

- Frontend: Next.js and TypeScript.
- API/backend: Python and FastAPI.
- Identity and relational application data: Supabase Auth and PostgreSQL.
- Storage: an abstraction for browser/local and cloud processing paths.
- Processing: browser and cloud engines with consistent operation contracts.
- Long-running workloads: background jobs and workers.
- Explainability: structured reasoning, evidence, visualizations, and processing history.
- Billing: configurable token costs, quantity-based purchases and volume discounts, an auditable token ledger, and safe reservation/reconciliation for long-running work.

These directions guide investigation; they are not finalized designs.

## Scope boundary

The current phase is architecture planning. The seven plans must be completed and reviewed before full application implementation. Initial repository documentation captures product intent and the planning sequence. No production code, database schema, pricing values, or processing thresholds are specified here.

## Success qualities

The planned product should let users understand the state of their data, see evidence for recommendations, control impactful transformations, know how model results were obtained, and recover or audit important processing steps. Specific measurable service-level and product targets remain to be defined in the relevant plans.
